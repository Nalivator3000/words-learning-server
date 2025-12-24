#!/bin/bash
# Monitor translation progress every 5 minutes

LOG_FILE="translation-progress.log"

echo "🔍 Translation Progress Monitor Started at $(date)" | tee -a $LOG_FILE
echo "=================================================" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$TIMESTAMP] Checking translation progress..." | tee -a $LOG_FILE

    # Check database for translation counts
    node scripts/checks/check-vocab-status.js 2>&1 | tee -a $LOG_FILE

    echo "" | tee -a $LOG_FILE
    echo "=================================================" | tee -a $LOG_FILE
    echo "Next check in 5 minutes..." | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE

    # Wait 5 minutes
    sleep 300
done
