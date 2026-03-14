package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/forumline/forumline/services/forumline-api/store"
	"golang.org/x/crypto/bcrypt"
)

type WebhookHandler struct {
	Store *store.Store
}

func NewWebhookHandler(s *store.Store) *WebhookHandler {
	return &WebhookHandler{Store: s}
}

// HandleNotification handles POST /api/webhooks/notification.
// Forums call this to push notifications to forumline when they are created.
// Auth: client_id + client_secret in the request body (same OAuth credentials).
func (h *WebhookHandler) HandleNotification(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ClientID        string `json:"client_id"`
		ClientSecret    string `json:"client_secret"`
		ForumlineUserID string `json:"forumline_user_id"`
		Type            string `json:"type"`
		Title           string `json:"title"`
		Body            string `json:"body"`
		Link            string `json:"link"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid JSON"})
		return
	}

	forumDomain, err := h.authenticateClient(r, body.ClientID, body.ClientSecret)
	if err != nil {
		log.Printf("[webhook] auth failed: %v", err)
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if body.ForumlineUserID == "" || body.Type == "" || body.Title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "forumline_user_id, type, and title are required"})
		return
	}

	ctx := r.Context()

	exists, err := h.Store.UserExists(ctx, body.ForumlineUserID)
	if err != nil || !exists {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "User not found"})
		return
	}

	muted, _ := h.Store.IsNotificationsMutedByDomain(ctx, body.ForumlineUserID, forumDomain)
	if muted {
		writeJSON(w, http.StatusOK, map[string]string{"status": "muted"})
		return
	}

	forumName, err := h.Store.GetForumNameByDomain(ctx, forumDomain)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Forum not registered"})
		return
	}

	link := body.Link
	if link == "" {
		link = "/"
	}

	if err := h.Store.InsertNotification(ctx, body.ForumlineUserID, forumDomain, forumName, body.Type, body.Title, body.Body, link); err != nil {
		log.Printf("[webhook] failed to insert notification: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to store notification"})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok"})
}

// HandleNotificationBatch handles POST /api/webhooks/notifications (plural).
func (h *WebhookHandler) HandleNotificationBatch(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ClientID     string `json:"client_id"`
		ClientSecret string `json:"client_secret"`
		Items        []struct {
			ForumlineUserID string `json:"forumline_user_id"`
			Type            string `json:"type"`
			Title           string `json:"title"`
			Body            string `json:"body"`
			Link            string `json:"link"`
		} `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid JSON"})
		return
	}

	forumDomain, err := h.authenticateClient(r, body.ClientID, body.ClientSecret)
	if err != nil {
		log.Printf("[webhook] batch auth failed: %v", err)
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	ctx := r.Context()
	forumName, err := h.Store.GetForumNameByDomain(ctx, forumDomain)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Forum not registered"})
		return
	}

	inserted := 0
	for _, item := range body.Items {
		if item.ForumlineUserID == "" || item.Type == "" || item.Title == "" {
			continue
		}
		exists, err := h.Store.UserExists(ctx, item.ForumlineUserID)
		if err != nil || !exists {
			continue
		}
		muted, _ := h.Store.IsNotificationsMutedByDomain(ctx, item.ForumlineUserID, forumDomain)
		if muted {
			continue
		}
		link := item.Link
		if link == "" {
			link = "/"
		}
		if err := h.Store.InsertNotification(ctx, item.ForumlineUserID, forumDomain, forumName, item.Type, item.Title, item.Body, link); err != nil {
			log.Printf("[webhook] batch insert error: %v", err)
			continue
		}
		inserted++
	}

	writeJSON(w, http.StatusCreated, map[string]int{"inserted": inserted})
}

// authenticateClient validates OAuth client credentials and returns the forum domain.
func (h *WebhookHandler) authenticateClient(r *http.Request, clientID, clientSecret string) (string, error) {
	if clientID == "" || clientSecret == "" {
		return "", fmt.Errorf("client_id and client_secret required")
	}

	ctx := r.Context()
	client, err := h.Store.GetOAuthClientWithSecret(ctx, clientID)
	if err != nil || client == nil {
		return "", fmt.Errorf("unknown client_id: %s", clientID)
	}

	// Verify secret: bcrypt first, SHA-256 fallback (same as OAuth token endpoint)
	valid := bcrypt.CompareHashAndPassword([]byte(client.ClientSecretHash), []byte(clientSecret)) == nil
	if !valid {
		hash := sha256.Sum256([]byte(clientSecret))
		valid = client.ClientSecretHash == hex.EncodeToString(hash[:])
	}
	if !valid {
		return "", fmt.Errorf("invalid client_secret for client_id: %s", clientID)
	}

	// Look up forum domain from forum_id
	domain, err := h.Store.GetForumDomainByID(ctx, client.ForumID)
	if err != nil {
		return "", fmt.Errorf("forum not found for client: %s", clientID)
	}

	return domain, nil
}
