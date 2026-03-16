#!/usr/bin/env bash
# One-time installer for the Forumline fleet sync on the Proxmox host.
# Run from your laptop over VPN:
#
#   ci/install-fleet-sync.sh
#
# Or directly on the Proxmox host:
#
#   bash deploy/proxmox/install.sh
#
# After this, any new LXC you start will automatically get:
#   - CI runner SSH key (for deploys)
#   - Docker syslog → VictoriaLogs config
#
# Nothing to remember. Nothing to configure per-container. It just works.

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
  ssh root@192.168.1.112 "cat ~/.ssh/id_ed25519.pub" > /etc/forumline/deploy-key.pub
fi

# Daemon.json — check same dir first (uploaded by ci/install-fleet-sync.sh),
# then fall back to repo relative path (running directly on Proxmox from repo)
if [ -f "$SCRIPT_DIR/daemon.json" ]; then
  cp "$SCRIPT_DIR/daemon.json" /etc/forumline/daemon.json
elif [ -f "$SCRIPT_DIR/../compose/logs/daemon.json" ]; then
  cp "$SCRIPT_DIR/../compose/logs/daemon.json" /etc/forumline/daemon.json
else
  echo "WARNING: daemon.json not found, syslog config won't be synced"
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
