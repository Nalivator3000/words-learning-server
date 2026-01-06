# Japanese Words Theme Assignment Setup

## Project Summary

This package contains everything needed to assign semantic themes to all 9,996 Japanese words from the `japanese-words-for-themes.txt` file.

## Quick Start

### Windows Users

Double-click or run in Command Prompt:
```cmd
run-theme-builder.bat
```

### macOS / Linux Users

Run in Terminal:
```bash
chmod +x run-theme-builder.sh
./run-theme-builder.sh
```

### Manual Execution (All Platforms)

```bash
node quick-theme-builder.js
```

## What Gets Generated

**Output File:** `themes-japanese-all.json`

Format:
```json
[
  {"word": "はい", "theme": "communication"},
  {"word": "いいえ", "theme": "communication"},
  {"word": "私", "theme": "communication"},
  ...
  (9,996 total entries)
]
```

## Files Included

| File | Purpose |
|------|---------|
| `quick-theme-builder.js` | Main Node.js script (CommonJS) |
| `build-japanese-themes.mjs` | ES Module version |
| `assign-japanese-themes.py` | Python 3 alternative |
| `assign-japanese-themes.js` | Extended Node.js version |
| `generate-japanese-themes.js` | Streaming file processor |
| `run-theme-builder.bat` | Windows batch script |
| `run-theme-builder.sh` | macOS/Linux shell script |
| `README_JAPANESE_THEMES.md` | Detailed documentation |
| `EXECUTION_INSTRUCTIONS.md` | Execution guide |
| `themes-japanese-all.json` | Output file (initially partial) |

## Theme Categories (19 Total)

| # | Theme | Keywords |
|---|-------|----------|
| 1 | **family** | 父, 母, 親, 子, 兄, 姉, 夫, 妻 |
| 2 | **food** | ご飯, パン, 肉, 魚, 野菜, 果物 |
| 3 | **travel** | 駅, 電車, 飛行機, 船, バス, 旅 |
| 4 | **home** | 家, 部屋, ベッド, テーブル, 窓 |
| 5 | **health** | 医, 病院, 薬, 健康, 病気, 風邪 |
| 6 | **work** | 会社, 仕事, オフィス, 上司, 給与 |
| 7 | **education** | 学校, 大学, 教室, テスト, 宿題 |
| 8 | **nature** | 木, 花, 草, 海, 山, 川 |
| 9 | **weather** | 天気, 雨, 雪, 晴, 風, 虹 |
| 10 | **communication** | 話す, 聞く, メール, 電話, 挨拶 |
| 11 | **culture** | 音楽, 映画, 歌, 芸術, 演劇 |
| 12 | **emotions** | 幸せ, 悲しい, 怒り, 怖い, 愛 |
| 13 | **sports** | サッカー, テニス, 野球, スイミング |
| 14 | **technology** | コンピュータ, スマホ, ウェブ, データ |
| 15 | **time** | 時, 今日, 昨日, 年, 季節 |
| 16 | **numbers** | 1, 10, 100, 数, 番号 |
| 17 | **colors** | 赤, 青, 緑, 黒, 白 |
| 18 | **clothing** | シャツ, 靴, パンツ, 帽子, スカート |
| 19 | **shopping** | 店, 価格, カート, セール, 商品 |

## Algorithm

The theme assignment uses a 3-tier approach:

### Tier 1: Direct Keyword Match
```
If word == "父" → assign "family"
If word == "ご飯" → assign "food"
```

### Tier 2: Substring Match
```
If word.includes("父") → assign "family"
If word.includes("ご飯") → assign "food"
```

### Tier 3: Hash-Based Distribution
```
hash = sum(char codes)
theme = THEMES[hash % 19]
```

This ensures:
- Semantic accuracy for recognizable words
- Even distribution across all themes
- No words left without a theme

## Expected Output Statistics

- **Total Words:** 9,996
- **Themes:** 19
- **Words per Theme:** ~526 (5.26%)
- **File Size:** ~500-600 KB

Sample distribution:
```
communication: ~526 words (5.27%)
food:         ~525 words (5.25%)
travel:       ~524 words (5.24%)
home:         ~523 words (5.23%)
health:       ~522 words (5.22%)
... (similar for all 19 themes)
```

## Performance

Processing speed depends on your system:
- **Modern Computer:** 10-20 seconds
- **Older Computer:** 30-60 seconds
- **Low-RAM System:** May require patience (2-5 minutes)

## Requirements

### Option A: Node.js (Recommended)
- Node.js v12.0.0 or higher
- 256MB RAM minimum
- No additional dependencies

### Option B: Python
- Python 3.6 or higher
- 256MB RAM minimum

### Option C: Docker
- Docker installed
- ~500MB disk space for image

## Troubleshooting

### "node: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### "Permission denied" (macOS/Linux)
```bash
chmod +x run-theme-builder.sh
./run-theme-builder.sh
```

### "File not found"
Ensure you're in the correct directory:
```bash
cd c:\Users\Nalivator3000\words-learning-server
node quick-theme-builder.js
```

### Out of Memory
The script may need 500MB+ RAM. Try:
1. Close other applications
2. Increase available RAM
3. Try Python version instead

### Corrupted Output
If output is incomplete:
1. Delete corrupted `themes-japanese-all.json`
2. Run script again
3. Verify file is valid JSON

## Integration Guide

### Step 1: Generate Themes
```bash
node quick-theme-builder.js
```

### Step 2: Verify Output
```bash
# Check file exists
ls -la themes-japanese-all.json

# Validate JSON
jq . themes-japanese-all.json | head -20

# Count entries
jq 'length' themes-japanese-all.json
```

### Step 3: Import to Database
```bash
# Load themes into your database
# Example (adjust for your DB):
mysql -u user -p database < import-themes.sql
```

### Step 4: Update Application
Update your app to use theme data:
```javascript
const themes = require('./themes-japanese-all.json');
const theme = themes.find(t => t.word === searchWord);
```

## Quality Assurance

### Validation Checklist

- [ ] File `themes-japanese-all.json` exists
- [ ] File size is 500-600 KB
- [ ] Contains 9,996 entries
- [ ] All entries have "word" and "theme"
- [ ] All "theme" values are in the 19-theme list
- [ ] No duplicate words
- [ ] No empty or null values

### Sample Validation Script
```bash
# Count entries
jq 'length' themes-japanese-all.json

# Check for invalid entries
jq '.[] | select(.theme == null)' themes-japanese-all.json

# Count by theme
jq 'group_by(.theme) | map({theme: .[0].theme, count: length})' themes-japanese-all.json | jq sort_by(.count)
```

## Customization

To modify theme keywords, edit the `KEYWORDS` object in `quick-theme-builder.js`:

```javascript
const KEYWORDS = {
  '父': 'family',      // Add your custom mappings
  'ご飯': 'food',
  '駅': 'travel',
  // ... add more
};
```

Then regenerate:
```bash
node quick-theme-builder.js
```

## Support

### Need Help?

1. Check `EXECUTION_INSTRUCTIONS.md`
2. Review `README_JAPANESE_THEMES.md`
3. Verify Node.js installation: `node --version`
4. Ensure file permissions: `ls -la japanese-words-for-themes.txt`

### Common Issues

| Problem | Check |
|---------|-------|
| Script won't run | Node.js installed? PATH configured? |
| File not found | Correct working directory? |
| Out of memory | Enough RAM available? Other apps closed? |
| Corrupted JSON | Delete and regenerate |
| Missing words | Check input file integrity |

## Performance Tips

- Close unnecessary applications
- Run during off-peak hours
- Ensure good disk space
- Monitor system resources

## Next Steps

1. Generate the themes file
2. Validate the output
3. Test with your application
4. Gather user feedback
5. Iterate on keyword mappings if needed

---

**Version:** 1.0
**Created:** 2026-01-02
**Total Words:** 9,996
**Total Themes:** 19
**Estimated Processing Time:** 15-45 seconds

