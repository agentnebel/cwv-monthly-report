#!/bin/bash
# Update CrUX data for all manufacturers
# Run this monthly via cron: 0 9 1 * * /data/.openclaw/workspace/cwv-monthly-report/update_crux.sh

cd "$(dirname "$0")"

# Load API key from environment file (if exists)
if [ -f /data/.openclaw/workspace/.env ]; then
    export $(cat /data/.openclaw/workspace/.env | grep -v '^#' | xargs)
fi

if [ -z "$CRUX_API_KEY" ]; then
    echo "Error: CRUX_API_KEY not set"
    echo "Please add CRUX_API_KEY=your_key to /data/.openclaw/workspace/.env"
    exit 1
fi

echo "Starting CrUX update at $(date)"
node fetch_all.js

if [ $? -eq 0 ]; then
    echo "Update completed successfully at $(date)"
else
    echo "Update failed at $(date)"
    exit 1
fi
