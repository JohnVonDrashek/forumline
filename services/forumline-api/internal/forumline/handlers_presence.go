package forumline

import (
	"net/http"
	"strings"
	"sync"
	"time"

	shared "github.com/forumline/forumline/shared-go"
)

// PresenceTracker tracks which users are online via heartbeats.
// Users are considered online if they've sent a heartbeat within the TTL.
type PresenceTracker struct {
	mu       sync.RWMutex
	lastSeen map[string]time.Time // userID -> last heartbeat time
	ttl      time.Duration
}

// NewPresenceTracker creates a presence tracker with the given TTL.
func NewPresenceTracker(ttl time.Duration) *PresenceTracker {
	pt := &PresenceTracker{
		lastSeen: make(map[string]time.Time),
		ttl:      ttl,
	}
	// Periodic cleanup of stale entries
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			pt.cleanup()
		}
	}()
	return pt
}

func (pt *PresenceTracker) Touch(userID string) {
	pt.mu.Lock()
	pt.lastSeen[userID] = time.Now()
	pt.mu.Unlock()
}

func (pt *PresenceTracker) IsOnline(userID string) bool {
	pt.mu.RLock()
	t, ok := pt.lastSeen[userID]
	pt.mu.RUnlock()
	return ok && time.Since(t) < pt.ttl
}

func (pt *PresenceTracker) OnlineStatusBatch(userIDs []string) map[string]bool {
	pt.mu.RLock()
	defer pt.mu.RUnlock()
	now := time.Now()
	result := make(map[string]bool, len(userIDs))
	for _, id := range userIDs {
		t, ok := pt.lastSeen[id]
		result[id] = ok && now.Sub(t) < pt.ttl
	}
	return result
}

func (pt *PresenceTracker) cleanup() {
	pt.mu.Lock()
	defer pt.mu.Unlock()
	now := time.Now()
	for id, t := range pt.lastSeen {
		if now.Sub(t) >= pt.ttl {
			delete(pt.lastSeen, id)
		}
	}
}

// HandlePresenceHeartbeat records a heartbeat for the authenticated user.
func (h *Handlers) HandlePresenceHeartbeat(w http.ResponseWriter, r *http.Request) {
	userID := shared.UserIDFromContext(r.Context())
	h.Presence.Touch(userID)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// HandlePresenceStatus returns online status for a list of user IDs.
// Respects each user's online_status and show_online_status preferences:
//   - show_online_status=false → always report as offline
//   - online_status='offline' → always report as offline (appear offline)
//   - online_status='away' → always report as offline (manual away)
//   - online_status='online' → report actual heartbeat status (as-is)
func (h *Handlers) HandlePresenceStatus(w http.ResponseWriter, r *http.Request) {
	idsParam := r.URL.Query().Get("userIds")
	if idsParam == "" {
		writeJSON(w, http.StatusOK, map[string]bool{})
		return
	}

	userIDs := strings.Split(idsParam, ",")
	if len(userIDs) > 200 {
		userIDs = userIDs[:200]
	}

	// Get heartbeat-based status
	status := h.Presence.OnlineStatusBatch(userIDs)

	// Apply user preferences — query online_status and show_online_status
	rows, err := h.Pool.Query(r.Context(),
		`SELECT id::text, online_status, show_online_status
		 FROM forumline_profiles
		 WHERE id = ANY($1::uuid[])`, userIDs,
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var uid, onlineStatus string
			var showOnline bool
			if err := rows.Scan(&uid, &onlineStatus, &showOnline); err != nil {
				continue
			}
			if !showOnline || onlineStatus == "offline" || onlineStatus == "away" {
				status[uid] = false
			}
		}
	}

	writeJSON(w, http.StatusOK, status)
}
