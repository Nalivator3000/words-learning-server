# Cache Busting Strategy

## Problem
After deploying updates, users would see old cached versions of JS/CSS files, requiring manual cache clearing (Ctrl+Shift+R).

## Solution
Implemented automatic cache busting using version-based query parameters and proper cache headers.

## How It Works

### 1. Version-Based URLs
All JavaScript files are loaded with a version query parameter:
```html
<script src="app.js?v=5.1.0"></script>
<script src="quiz.js?v=5.1.0"></script>
```

When you update the version, browsers will fetch new files automatically.

### 2. Cache Headers
Different files have different caching strategies:

- **HTML files** (`index.html`): `no-cache` (always check server for updates)
- **JS/CSS files**: `max-age=0, must-revalidate` with ETag (validate on every request)
- **Images/fonts**: `max-age=31536000, immutable` (cache for 1 year)

### 3. Automatic Version Injection
The server automatically:
- Reads `package.json` version
- Injects `?v=X.Y.Z` to all `<script>` tags
- Updates version comment in HTML
- Sets proper cache headers

## Usage

### Option 1: Auto-increment patch version (recommended)
```bash
npm run deploy
```
This will:
- Increment patch version (5.1.0 → 5.1.1)
- Stage package.json for commit
- Display new version

### Option 2: Manual version bump
```bash
# Patch (5.1.0 → 5.1.1)
npm run version:patch

# Minor (5.1.0 → 5.2.0)
npm run version:minor

# Major (5.1.0 → 6.0.0)
npm run version:major
```

### Option 3: Edit version manually
Edit `version` in [package.json](package.json#L3), then restart server.

## Deployment Workflow

1. Make code changes
2. Run `npm run deploy` to bump version
3. Commit changes:
   ```bash
   git add .
   git commit -m "Feature: Added new functionality"
   git push
   ```
4. Restart server (version will be auto-loaded from package.json)
5. Users will automatically get the new version on next page load

## Verification

Check version is injected:
```bash
curl http://localhost:3001/ | grep "Version:"
# Output: <!-- Version: v5.1.0 - 2025-11-11T19:46:43.524Z -->

curl http://localhost:3001/ | grep "app.js"
# Output: <script src="app.js?v=5.1.0"></script>
```

Check cache headers:
```bash
curl -I http://localhost:3001/
# Cache-Control: no-cache, no-store, must-revalidate

curl -I http://localhost:3001/app.js
# Cache-Control: public, max-age=0, must-revalidate
# ETag: 5.1.0
```

## Benefits

- No more manual cache clearing
- Users automatically get updates
- Long-term caching for static assets (images, fonts)
- Reduced server load
- Better user experience

## Technical Details

**Server implementation:** [server-postgresql.js:123-171](server-postgresql.js#L123-L171)

**Key files:**
- `server-postgresql.js` - Version injection and cache headers
- `package.json` - Version storage
- `public/index.html` - Target HTML file

**Middleware flow:**
1. Request comes for `/`
2. Server reads `public/index.html`
3. Injects version into HTML comment
4. Replaces all `<script src="X.js"` with `<script src="X.js?v=VERSION"`
5. Sets `Cache-Control: no-cache` headers
6. Sends modified HTML

**Static files flow:**
1. Request comes for `/app.js?v=5.1.0`
2. Cache middleware checks file extension
3. Sets appropriate `Cache-Control` and `ETag` headers
4. Serves file from `public/` directory
