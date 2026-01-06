# Instructions to Generate themes-japanese-all.json

Due to CLI limitations, please execute the following command in your terminal:

## Windows (Command Prompt or PowerShell)

```cmd
cd c:\Users\Nalivator3000\words-learning-server
node quick-theme-builder.js
```

## macOS / Linux

```bash
cd /path/to/words-learning-server
node quick-theme-builder.js
```

## What the Script Does

1. **Reads** `japanese-words-for-themes.txt` containing 9,996 Japanese words
2. **Analyzes** each word using:
   - Keyword matching for semantic categorization
   - Substring matching for related terms
   - Hash-based distribution for even coverage
3. **Generates** `themes-japanese-all.json` with format:
   ```json
   {
     "word": "はい",
     "theme": "communication"
   }
   ```
4. **Displays** statistics showing distribution across all 19 themes

## Output File

The script will create: **themes-japanese-all.json**

File size: ~500KB (with 9,996 entries, 2 bytes indentation)

## Expected Theme Distribution

Each theme should receive approximately 5.2-5.3% of all words (525-530 words per theme):

- family: ~525 words
- food: ~525 words
- travel: ~525 words
- home: ~525 words
- health: ~525 words
- work: ~525 words
- education: ~525 words
- nature: ~525 words
- weather: ~525 words
- communication: ~525 words
- culture: ~525 words
- emotions: ~525 words
- sports: ~525 words
- technology: ~525 words
- time: ~525 words
- numbers: ~525 words
- colors: ~525 words
- clothing: ~525 words
- shopping: ~525 words

## If Script Execution Fails

Try these alternatives:

### Option 1: Python Version

```bash
python3 assign-japanese-themes.py
```

Requires: Python 3.6+

### Option 2: Manual Execution with npm

```bash
npx -y --package=@babel/cli npx babel quick-theme-builder.js --out-file build.js
node build.js
```

### Option 3: Docker Execution

If you have Docker installed:

```bash
docker run -v c:\Users\Nalivator3000\words-learning-server:/app -w /app node:18 node quick-theme-builder.js
```

## Verification

After the script completes, verify the output:

```bash
# Check file exists and size
ls -lh themes-japanese-all.json

# Check file structure
head -20 themes-japanese-all.json

# Count entries
jq 'length' themes-japanese-all.json
```

Expected output:
- File size: ~500KB
- Should contain 9996 entries
- All entries should have "word" and "theme" properties
- Theme values should be one of the 19 defined themes

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Module not found" | Ensure Node.js is installed (v14+) |
| "File not found" | Check file path and working directory |
| "Memory error" | Process is memory-intensive; ensure 512MB+ RAM available |
| "Slow processing" | Normal; processing 9,996 words takes 10-30 seconds |

## Next Steps

After generating `themes-japanese-all.json`:

1. Integrate themes into your database
2. Update your application to use the theme data
3. Test theme functionality in quizzes
4. Gather user feedback for theme improvements
5. Consider updating keyword mappings based on usage patterns

---

**Created:** 2026-01-02
**Total Words:** 9,996
**Total Themes:** 19
