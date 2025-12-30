#!/bin/bash
# Monitor all translations progress

while true; do
    clear
    echo "🌍 TRANSLATION PROGRESS MONITOR"
    echo "========================================"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    node scripts/checks/check-vocab-status.js

    echo ""
    echo "Latest log entries:"
    tail -10 logs/translate-all-final.log | grep -E "(✅|Starting|COMPLETED)"

    echo ""
    echo "Next update in 60 seconds..."
    sleep 60
done
