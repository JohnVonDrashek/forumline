# Forumline Demo

A modern community platform combining threaded forums, real-time chat, and voice rooms — built with React, Supabase, and LiveKit.

**Live:** https://demo.forumline.net

## Why

Most forum software treats chat and voice as afterthoughts. Forumline Demo is a reference implementation of the [Forumline protocol](../packages/protocol/), showing how forums can federate identity and messaging across independent communities while keeping everything in one UI.

## Features

- **Forums** — Categories, threads, posts, search, bookmarks, pinning/locking
- **Real-time chat** — Persistent channels with live message delivery
- **Voice rooms** — WebRTC audio via LiveKit with screen sharing
- **Federation** — Cross-forum identity and DMs through Forumline Central Services
- **Profiles** — Custom avatars (upload or auto-generated DiceBear), bio, activity feed
- **Admin panel** — Forum stats and content management
- **Desktop app** — Tauri wrapper for macOS, Windows, Linux, iOS, Android (see `../native-app/`)

## Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, TypeScript, TailwindCSS 4 |
| Build | Vite 7 |
| Database & Auth | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Voice | LiveKit |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Hosting | Vercel (serverless functions + static) |
| Federation | `@johnvondrashek/forumline-*` packages |

## Setup

```bash
# From this directory
npm install

# Copy and fill in environment variables
cp .env.example .env.local
```

Required env vars in `.env.local`:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access (API routes) |
| `VITE_LIVEKIT_URL` | LiveKit server URL |
| `LIVEKIT_API_KEY` | LiveKit API key (API routes) |
| `LIVEKIT_API_SECRET` | LiveKit API secret (API routes) |
| `VITE_SITE_URL` | Production URL for auth redirects (optional, defaults to `window.location.origin`) |

For Forumline federation (optional):

| Variable | Purpose |
|----------|---------|
| `VITE_HUB_URL` | Forumline Central Services URL |
| `VITE_HUB_SUPABASE_URL` | Hub Supabase URL |
| `VITE_HUB_SUPABASE_ANON_KEY` | Hub Supabase anon key |
| `FORUMLINE_CLIENT_ID` | OAuth client ID from hub |
| `FORUMLINE_CLIENT_SECRET` | OAuth client secret from hub |
| `HUB_JWT_SECRET` | JWT secret for hub identity tokens |

## Development

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # TypeScript type checking
```

In dev mode, Vite aliases resolve `@johnvondrashek/forumline-*` packages to their source in `../packages/` for live editing without rebuilding.

## API Routes

Serverless functions in `api/` deployed as Vercel Functions:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Create account with username validation |
| `/api/livekit` | POST | Generate LiveKit room token |
| `/api/livekit` | GET | List active rooms and participants |
| `/api/forumline/auth` | GET | Initiate Forumline OAuth flow |
| `/api/forumline/auth/callback` | GET | Handle OAuth callback |
| `/api/forumline/notifications` | GET | Fetch user notifications |
| `/api/forumline/unread` | GET | Fetch unread counts |

## Deployment

Pushes to `main` trigger deployment via GitHub Actions (`.github/workflows/deploy-forum.yml`). Do not deploy via Vercel CLI or dashboard.

Production runs on Vercel with Node.js 20.x serverless functions.
