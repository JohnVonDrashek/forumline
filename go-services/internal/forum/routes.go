package forum

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/johnvondrashek/forumline/go-services/internal/shared"
)

func NewRouter(pool *pgxpool.Pool, sseHub *shared.SSEHub, cfg *Config) *chi.Mux {
	r := chi.NewRouter()

	h := &Handlers{
		Pool:   pool,
		SSEHub: sseHub,
		Config: cfg,
	}

	// Rate limiters
	signupRL := shared.RateLimitMiddleware(shared.NewRateLimiter(5, time.Minute))

	// Channel follows (authenticated)
	r.Group(func(r chi.Router) {
		r.Use(shared.AuthMiddleware)
		r.Get("/api/channel-follows", h.HandleChannelFollows)
		r.Post("/api/channel-follows", h.HandleChannelFollows)
		r.Delete("/api/channel-follows", h.HandleChannelFollows)
	})

	// Notification preferences (authenticated)
	r.Group(func(r chi.Router) {
		r.Use(shared.AuthMiddleware)
		r.Get("/api/notification-preferences", h.HandleNotificationPreferences)
		r.Put("/api/notification-preferences", h.HandleNotificationPreferences)
	})

	// Auth
	r.With(signupRL).Post("/api/auth/signup", h.HandleSignup)

	// Forumline OAuth
	r.Get("/api/forumline/auth", h.HandleForumlineAuth)
	r.Post("/api/forumline/auth", h.HandleForumlineAuth)
	r.Get("/api/forumline/auth/callback", h.HandleForumlineCallback)
	r.Get("/api/forumline/auth/hub-token", h.HandleHubToken)
	r.Get("/api/forumline/auth/session", h.HandleForumlineSession)
	r.Delete("/api/forumline/auth/session", h.HandleForumlineSession)

	// Forumline notifications
	r.Get("/api/forumline/notifications", h.HandleNotifications)
	r.Post("/api/forumline/notifications/read", h.HandleNotificationRead)
	r.Get("/api/forumline/unread", h.HandleUnread)
	r.Get("/api/forumline/notifications/stream", h.HandleNotificationStream)

	// LiveKit
	r.Post("/api/livekit", h.HandleLiveKitToken)
	r.Get("/api/livekit", h.HandleLiveKitParticipants)

	// GoTrue reverse proxy — allows supabase-js to call /auth/v1/* same-origin
	if cfg.GoTrueURL != "" {
		target, _ := url.Parse(cfg.GoTrueURL)
		proxy := httputil.NewSingleHostReverseProxy(target)
		r.HandleFunc("/auth/v1/*", func(w http.ResponseWriter, r *http.Request) {
			r.URL.Path = r.URL.Path[len("/auth/v1"):]
			r.Host = target.Host
			proxy.ServeHTTP(w, r)
		})
	}

	return r
}
