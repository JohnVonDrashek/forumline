#!/usr/bin/env bash
# One-time installer for the Forumline fleet sync on the Proxmox host.
# Automatically installed/updated by the ensure-fleet-sync CI workflow.
# Can also be run directly on Proxmox: bash deploy/proxmox/install.sh
#
# After this, any new LXC you start will automatically get the CI
# runner's SSH deploy key. Nothing to configure per-container.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Installing Forumline Fleet Sync ==="

mkdir -p /etc/forumline

# Copy sync script
cp "$SCRIPT_DIR/forumline-fleet-sync.sh" /etc/forumline/forumline-fleet-sync.sh
chmod +x /etc/forumline/forumline-fleet-sync.sh

# Deploy key — grab from CI runner if not already present
if [ ! -f /etc/forumline/deploy-key.pub ]; then
  echo "Fetching deploy key from CI runner (192.168.1.112)..."
  ssh root@192.168.1.112 "cat /home/runner/.ssh/id_ed25519.pub" > /etc/forumline/deploy-key.pub
fi

# Install systemd units
cp "$SCRIPT_DIR/forumline-fleet-sync.service" /etc/systemd/system/
cp "$SCRIPT_DIR/forumline-fleet-sync.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now forumline-fleet-sync.timer

echo "Running first sync now..."
systemctl start forumline-fleet-sync.service
journalctl -u forumline-fleet-sync.service --no-pager -n 30

echo ""
echo "=== Fleet sync installed ==="
echo "Timer runs every 5 minutes. Check status: systemctl status forumline-fleet-sync.timer"
echo "Force a sync now:                         systemctl start forumline-fleet-sync.service"
echo "View logs:                                journalctl -u forumline-fleet-sync.service"
