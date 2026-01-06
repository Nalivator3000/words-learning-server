#!/usr/bin/env python3
import subprocess
import sys
import os

# Change to the directory
os_dir = r'c:\Users\Nalivator3000\words-learning-server'
os.chdir(os_dir)

# Run the Node.js script
result = subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'colorama'],
                       capture_output=True)

try:
    result = subprocess.run(['node', 'assign-swahili-themes.js'],
                          capture_output=False,
                          text=True)
    sys.exit(result.returncode)
except FileNotFoundError:
    print("Node.js is not installed or not in PATH")
    sys.exit(1)
