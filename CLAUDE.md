# Forumline

## Testing

**Use Docker for backend testing**
When possible, make sure to spin up a docker container locally for testing. This allows for faster iteration and safer git commits.

**For testing in production**: 
Forumline: https://app.forumline.net 
Demo: https://demo.forumline.net

Use Playwright to interact with the production site.

## Deployment

Do NOT deploy npm packages manually. There are Github actions for that.

Do NOT link 

Both projects deploy via GitHub Actions on push to main. Do NOT deploy via `flyctl deploy` manually.

- **Forumline Demo** (demo.forumline.net): `.github/workflows/deploy-forum.yml` — triggers on `go-services/` or `packages/` changes
- **Forumline Central Services** (app.forumline.net): `.github/workflows/deploy-hub.yml` — triggers on `central-services/` or `packages/` changes

Both deploy to Fly.io using Docker. The `FLY_API_TOKEN` GitHub secret is required.

## Testing

Do NOT ignore bugs that you see even if they are unrelated to your changes. Jot them down and present them to the user at the conclusion of testing as potentional next steps to fix.

## Monorepo Structure

```
forum-demo/        — Forumline Demo web app (Vite + React)
central-services/  — Forumline Central Services (identity service)
go-services/       — Go API servers (forum + hub)
native-app/        — Tauri native app (desktop, iOS, Android)
packages/
  protocol/                  — @johnvondrashek/forumline-protocol (federation types)
  server-sdk/                — @johnvondrashek/forumline-server-sdk (protocol endpoint handlers)
  central-services-client/   — @johnvondrashek/forumline-central-services-client (headless hub API client)
  react/                     — @johnvondrashek/forumline-react (React providers, components, hooks)
```

npm workspaces are configured at root. Run `npm install` from root to link all packages.

**CRITICAL — Do NOT remove `forum-demo` from npm workspaces or try to change the workspace/hoisting configuration.**

### Package Details

- **@johnvondrashek/forumline-protocol** — Zero-dependency TypeScript types for the federation contract
- **@johnvondrashek/forumline-server-sdk** — Framework-agnostic handler factories (auth, notifications, unread) with `ForumlineServer` class
- **@johnvondrashek/forumline-central-services-client** — Headless HTTP client for cross-forum DMs (conversations, messages, profiles)
- **@johnvondrashek/forumline-react** — `ForumProvider`, `HubProvider`, `ForumRail`, `ForumWebview`, `useNativeNotifications`, `isTauri` utilities

## Fly.io

Both apps run as Docker containers on Fly.io with Go API servers (`go-services/cmd/forum/` and `go-services/cmd/hub/`).

- Dockerfiles at repo root: `Dockerfile.forum-demo`, `Dockerfile.go-hub`
- Fly config: `forum-demo/fly.toml`, `central-services/fly.toml`
- Local dev: `docker compose up --build` (Postgres + GoTrue) + `go run ./cmd/forum/` or `go run ./cmd/hub/` in `go-services/`

## Stack

- React 19 + Vite + TailwindCSS
- Go API server (Chi router) for forum data + auth proxy
- Fly Postgres (forum database)
- GoTrue (self-hosted auth on Fly.io)
- Cloudflare R2 (avatar/image storage)
- SSE realtime via Postgres LISTEN/NOTIFY
- LiveKit (voice rooms)
- Docker on Fly.io
