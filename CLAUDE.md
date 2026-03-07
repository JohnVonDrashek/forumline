# Forumline

## Testing

**Use Docker for backend testing**
When possible, make sure to spin up a docker container locally for testing. This allows for faster iteration and safer git commits.

**For testing in production**:
Forumline: https://app.forumline.net
Demo: https://demo.forumline.net

Use Playwright to interact with the production site.

Run forum Playwright tests against production:
```bash
cd forum-vanilla && PLAYWRIGHT_BASE_URL=https://demo.forumline.net npx playwright test
```

Do NOT ignore bugs that you see even if they are unrelated to your changes. Jot them down and present them to the user at the conclusion of testing as potential next steps to fix.

## Deployment

Do NOT deploy npm packages manually. There are GitHub Actions for that.

Both projects deploy via GitHub Actions on push to main. Do NOT deploy manually.

- **Forumline Demo** (demo.forumline.net): `.github/workflows/deploy-forum.yml` — triggers on `go-services/` or `forum-vanilla/` changes
- **Forumline Central Services** (app.forumline.net): `.github/workflows/deploy-hub.yml` — triggers on `go-services/`, `central-services/`, or `packages/` changes

Both deploy via SSH through Cloudflare Tunnel to self-hosted Proxmox LXCs running Docker Compose. The `FORUM_SSH_KEY` GitHub secret is required.

## Monorepo Structure

```
forum-vanilla/     — Forumline Demo web app (Vite + vanilla JS)
central-services/  — Forumline Central Services / Hub (Vite + React)
go-services/       — Go API servers (forum + hub)
native-app/        — Tauri native app (desktop, iOS, Android)
packages/
  protocol/                  — @johnvondrashek/forumline-protocol (federation types)
  server-sdk/                — @johnvondrashek/forumline-server-sdk (protocol endpoint handlers)
  central-services-client/   — @johnvondrashek/forumline-central-services-client (headless hub API client)
  core/                      — @johnvondrashek/forumline-core (shared utilities)
```

npm workspaces are configured at root. Run `npm install` from root to link all packages.

### Package Details

- **@johnvondrashek/forumline-protocol** — Zero-dependency TypeScript types for the federation contract
- **@johnvondrashek/forumline-server-sdk** — Framework-agnostic handler factories (auth, notifications, unread) with `ForumlineServer` class
- **@johnvondrashek/forumline-central-services-client** — Headless HTTP client for cross-forum DMs (conversations, messages, profiles)
- **@johnvondrashek/forumline-core** — Shared utilities

## Infrastructure

Both apps are self-hosted on Proxmox LXCs with Docker Compose, exposed to the internet via Cloudflare Tunnel.

- **Forum LXC** (CT 100, `forum-prod`, 192.168.1.23): Postgres + GoTrue + Go forum server
- **Hub LXC** (CT 101, `hub-prod`, 192.168.1.99): Postgres + GoTrue + Go hub server
- Dockerfiles at repo root: `Dockerfile.go-forum`, `Dockerfile.go-hub`
- Local dev: `cd go-services && docker compose up -d` (Postgres + GoTrue) + `go run ./cmd/forum/` or `go run ./cmd/hub/`

## Stack

- Vanilla JS + Vite + TailwindCSS (forum frontend)
- React 19 + Vite + TailwindCSS (hub frontend)
- Go API server (Chi router) for forum data + auth proxy
- Self-hosted Postgres 17 (forum + hub databases)
- GoTrue v2.186.0 (self-hosted auth)
- Cloudflare R2 (avatar/image storage)
- SSE realtime via Postgres LISTEN/NOTIFY
- LiveKit (voice rooms)
- Cloudflare Tunnel + Docker Compose on Proxmox
