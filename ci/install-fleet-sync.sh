#!/usr/bin/env bash
# Install the fleet sync on the Proxmox host from your laptop.
# Requires WireGuard VPN to be connected.
#
# Usage: ci/install-fleet-sync.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROXMOX_HOST="root@192.168.1.98"

echo "=== Uploading fleet sync to Proxmox host ==="

ssh "$PROXMOX_HOST" "mkdir -p /tmp/fleet-sync"
scp "$REPO_ROOT/deploy/proxmox/forumline-fleet-sync.sh" \
    "$REPO_ROOT/deploy/proxmox/forumline-fleet-sync.service" \
    "$REPO_ROOT/deploy/proxmox/forumline-fleet-sync.timer" \
    "$REPO_ROOT/deploy/proxmox/install.sh" \
    "$REPO_ROOT/deploy/compose/logs/daemon.json" \
    "$PROXMOX_HOST:/tmp/fleet-sync/"

echo "Running installer on Proxmox..."
ssh "$PROXMOX_HOST" "bash /tmp/fleet-sync/install.sh"
ssh "$PROXMOX_HOST" "rm -rf /tmp/fleet-sync"

echo "=== Done ==="
