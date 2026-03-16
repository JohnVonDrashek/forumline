#!/usr/bin/env bash
# Ensure the fleet sync timer is installed on the Proxmox host.
# Idempotent — exits in ~2s if already installed, installs if not.
# Called by the ensure-fleet-sync GitHub Actions workflow on every push.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROXMOX_HOST="root@192.168.1.98"

# Quick check: is the timer already active?
if ssh "$PROXMOX_HOST" "systemctl is-active forumline-fleet-sync.timer" &>/dev/null; then
  echo "Fleet sync already installed, checking for config updates..."

  scp -q "$REPO_ROOT/deploy/proxmox/forumline-fleet-sync.sh" "$PROXMOX_HOST:/etc/forumline/forumline-fleet-sync.sh"
  ssh "$PROXMOX_HOST" "chmod +x /etc/forumline/forumline-fleet-sync.sh"
  echo "Config updated. Fleet sync timer is running."
  exit 0
fi

echo "Fleet sync not installed. Installing now..."

# Upload the deploy key from this runner (no need for Proxmox to SSH back)
DEPLOY_KEY=$(cat ~/.ssh/id_ed25519.pub)
ssh "$PROXMOX_HOST" "mkdir -p /etc/forumline && echo '$DEPLOY_KEY' > /etc/forumline/deploy-key.pub"

# Upload everything to Proxmox
ssh "$PROXMOX_HOST" "mkdir -p /tmp/fleet-sync"
scp "$REPO_ROOT/deploy/proxmox/forumline-fleet-sync.sh" \
    "$REPO_ROOT/deploy/proxmox/forumline-fleet-sync.service" \
    "$REPO_ROOT/deploy/proxmox/forumline-fleet-sync.timer" \
    "$REPO_ROOT/deploy/proxmox/install.sh" \
    "$PROXMOX_HOST:/tmp/fleet-sync/"

# Run installer — deploy key already in place, so install.sh will skip fetching it
ssh "$PROXMOX_HOST" "bash /tmp/fleet-sync/install.sh && rm -rf /tmp/fleet-sync"

echo "Fleet sync installed."
