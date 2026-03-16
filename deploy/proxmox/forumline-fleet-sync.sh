#!/usr/bin/env bash
# Forumline Fleet Sync — runs on the Proxmox host via systemd timer.
# Scans all running LXCs and ensures they have:
#   1. The CI runner's SSH deploy key in authorized_keys
#   2. Docker syslog logging configured (daemon.json)
#   3. Docker installed
#
# Idempotent — safe to run every 5 minutes forever.
# New LXC? Just start it. This handles the rest.

set -euo pipefail

DEPLOY_KEY="/etc/forumline/deploy-key.pub"
DAEMON_JSON="/etc/forumline/daemon.json"
FLEET_DIR="/etc/forumline"

if [ ! -f "$DEPLOY_KEY" ]; then
  echo "ERROR: $DEPLOY_KEY not found. Run the installer first."
  exit 1
fi

PUBKEY=$(cat "$DEPLOY_KEY")

# Get all running LXC container IDs (skip the header line)
RUNNING_CTS=$(pct list 2>/dev/null | awk 'NR>1 && $2=="running" {print $1}')

if [ -z "$RUNNING_CTS" ]; then
  echo "No running LXCs found."
  exit 0
fi

for CTID in $RUNNING_CTS; do
  CT_NAME=$(pct list | awk -v id="$CTID" '$1==id {print $3}')

  # --- SSH deploy key ---
  HAS_KEY=$(pct exec "$CTID" -- grep -cF "$PUBKEY" /root/.ssh/authorized_keys 2>/dev/null || echo "0")
  if [ "$HAS_KEY" = "0" ]; then
    echo "[$CTID $CT_NAME] Injecting deploy key..."
    pct exec "$CTID" -- mkdir -p /root/.ssh
    pct exec "$CTID" -- chmod 700 /root/.ssh
    pct exec "$CTID" -- bash -c "echo '$PUBKEY' >> /root/.ssh/authorized_keys"
    pct exec "$CTID" -- chmod 600 /root/.ssh/authorized_keys
  fi

  # --- Docker ---
  HAS_DOCKER=$(pct exec "$CTID" -- which docker 2>/dev/null || echo "")
  if [ -z "$HAS_DOCKER" ]; then
    echo "[$CTID $CT_NAME] Docker not installed, skipping daemon.json"
    continue
  fi

  # --- Docker syslog config ---
  if [ -f "$DAEMON_JSON" ]; then
    CURRENT=$(pct exec "$CTID" -- cat /etc/docker/daemon.json 2>/dev/null || echo "")
    DESIRED=$(cat "$DAEMON_JSON")
    if [ "$CURRENT" != "$DESIRED" ]; then
      echo "[$CTID $CT_NAME] Updating daemon.json..."
      pct push "$CTID" "$DAEMON_JSON" /etc/docker/daemon.json
      pct exec "$CTID" -- systemctl restart docker
    fi
  fi
done
