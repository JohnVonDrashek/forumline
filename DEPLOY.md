# Deployment Guide

## Quick Start (5 minutes)

### 1. Deploy PocketBase to Fly.io

```bash
# Install Fly CLI (if not installed)
curl -L https://fly.io/install.sh | sh

# Login to Fly.io (opens browser)
fly auth login

# Deploy PocketBase
cd pocketbase
fly launch --no-deploy
fly volumes create pb_data --size 1 --region sjc
fly deploy

# Note the URL (e.g., https://forum-chat-voice-pb.fly.dev)
```

### 2. Set Up PocketBase Admin

1. Open `https://YOUR-APP.fly.dev/_/`
2. Create admin account
3. Go to Settings > Import collections
4. Paste contents of `pb_schema.json`
5. Click Import

### 3. Seed Initial Data

```bash
# Update the URL in seed.js first
node pocketbase/seed.js
```

### 4. Update Frontend

```bash
# Create .env file
echo "VITE_POCKETBASE_URL=https://YOUR-APP.fly.dev" > .env

# Build and deploy
npm run build
npx gh-pages -d dist
```

## Alternative: PocketHost.io (Easiest)

1. Go to https://pockethost.io
2. Sign up and create instance
3. Import `pb_schema.json` in admin
4. Update frontend with your URL

## Alternative: Self-Host

Run PocketBase on any server:

```bash
# On your server
wget https://github.com/pocketbase/pocketbase/releases/download/v0.25.6/pocketbase_0.25.6_linux_amd64.zip
unzip pocketbase_0.25.6_linux_amd64.zip
./pocketbase serve --http=0.0.0.0:8080
```

## Local Development

```bash
# Terminal 1: Start PocketBase
npm run pb:serve

# Terminal 2: Start frontend
npm run dev
```

Visit http://127.0.0.1:8090/_/ to set up admin.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_POCKETBASE_URL` | PocketBase server URL | `http://127.0.0.1:8090` |

If not set, the app runs in demo mode with mock data.
