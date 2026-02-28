#!/bin/bash
# ============================================================
# deploy.sh - Gaurosa.it deploy script
# Run on Hostinger via SSH after git push
#
# Usage (from local machine via Python SSH):
#   bash /home/u341208956/domains/gaurosa.it/public_html/deploy.sh
#
# What it does:
#   1. git pull (updates out/ and api/ and .htaccess)
#   2. Copies .htaccess to root
#   3. Done - out/ is already the static site
# ============================================================

set -e
SITE_ROOT="/home/u341208956/domains/gaurosa.it/public_html"

echo "=== Gaurosa Deploy ==="
echo "$(date)"

cd "$SITE_ROOT"

# 1. Pull latest code (includes out/ build and api/ PHP files)
echo "→ git pull..."
git pull origin main

# 2. Copy .htaccess from repo to root (git tracks it)
echo "→ updating .htaccess..."
cp "$SITE_ROOT/.htaccess" "$SITE_ROOT/.htaccess" 2>/dev/null || true

echo "✓ Deploy completato!"
echo "  Site: https://gaurosa.it"
