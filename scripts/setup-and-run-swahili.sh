#!/bin/bash

echo "============================================"
echo "Swahili Translation Setup and Execution"
echo "============================================"
echo ""

echo "[1/3] Installing required dependency..."
echo ""
npm install @vitalets/google-translate-api --save

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependency"
    exit 1
fi

echo ""
echo "[2/3] Dependency installed successfully!"
echo ""

echo "[3/3] Starting Swahili translation..."
echo "This will translate ~10,515 German words to Swahili"
echo "Estimated time: 9-12 hours"
echo ""
echo "Press Ctrl+C to cancel, or press Enter to continue..."
read

node scripts/translate-all-to-swahili.js

echo ""
echo "============================================"
echo "Translation process completed!"
echo "Check the output above for results."
echo "============================================"
