#!/bin/bash

# Theme Builder for Japanese Words
# This script generates themes for all 9,996 Japanese words

echo "Starting Japanese Theme Builder..."
echo ""
echo "Input file: japanese-words-for-themes.txt"
echo "Output file: themes-japanese-all.json"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Run the script
node quick-theme-builder.js

if [ $? -eq 0 ]; then
    echo ""
    echo "Success! themes-japanese-all.json has been created."

    # Verify the file
    if [ -f themes-japanese-all.json ]; then
        size=$(wc -c < themes-japanese-all.json)
        echo "File size: $size bytes"

        # Count entries
        count=$(jq 'length' themes-japanese-all.json 2>/dev/null || echo "Unable to count")
        echo "Total entries: $count"
    fi
else
    echo ""
    echo "Error: Failed to create themes-japanese-all.json"
    exit 1
fi
