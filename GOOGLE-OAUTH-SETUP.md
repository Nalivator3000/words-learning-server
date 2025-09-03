# 🔐 Google OAuth Setup Guide

## 📋 Prerequisites

1. Google account
2. Your Railway app URL (e.g., `https://words-learning-server-production.up.railway.app`)

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Console Project

1. **Go to**: https://console.cloud.google.com/
2. **Login** with your Google account
3. **Create New Project**:
   - Click "Select a project" → "New Project"
   - **Project name**: `Rememberizor`
   - Click **"Create"**
4. **Select your project** from the dropdown

### Step 2: Enable Google Identity Services

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Identity Services API"**
3. Click on it and press **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for public app)
3. Fill in **required fields**:

   **App Information:**
   - **App name**: `Rememberizor`
   - **User support email**: `nalivator3000@gmail.com`
   - **App logo**: (Optional - you can skip)

   **App domain** (Important!):
   - **Application home page**: `https://your-railway-app.railway.app`
   - **Application privacy policy URL**: `https://your-railway-app.railway.app`
   - **Application terms of service URL**: `https://your-railway-app.railway.app`

   **Authorized domains**:
   - `railway.app`
   - Your specific Railway domain (e.g., `words-learning-server-production.up.railway.app`)

   **Developer contact information**:
   - **Email addresses**: `nalivator3000@gmail.com`

4. Click **"Save and Continue"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. **Application type**: Select **"Web application"**
4. **Name**: `Rememberizor Web Client`
5. **Authorized JavaScript origins**:
   ```
   https://your-railway-app.railway.app
   http://localhost:3000
   http://127.0.0.1:3000
   ```
6. **Authorized redirect URIs**:
   ```
   https://your-railway-app.railway.app
   http://localhost:3000
   ```
7. Click **"Create"**

### Step 5: Get Your Client ID

1. After creating credentials, you'll see a popup with:
   - **Client ID**: `123456789-abcdefgh.apps.googleusercontent.com`
   - **Client Secret**: (Keep this secure!)
2. **Copy the Client ID** - you'll need it for the next step

## 🔧 Update Application Code

### Method 1: Direct Code Update (Recommended)

1. Open `public/oauth-config.js`
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your real Client ID:

```javascript
getGoogleClientId() {
    // Replace this with your real Google Client ID
    return '123456789-abcdefgh.apps.googleusercontent.com'; // 🔴 Your real Client ID here
}
```

### Method 2: Environment Variable (Advanced)

Add to your HTML head section:
```html
<script>
    window.GOOGLE_CLIENT_ID = '123456789-abcdefgh.apps.googleusercontent.com';
</script>
```

## ✅ Testing OAuth Setup

1. **Deploy your changes** to Railway
2. **Open your app** in browser
3. **Try "Login with Google"**
4. **Check browser console** for debug info:
   ```javascript
   // In browser console:
   console.log(oauthConfig.getDebugInfo());
   ```

Expected output when configured correctly:
```javascript
{
  clientId: "123456789-abcdefgh.apps.googleusercontent.com",
  configured: true,
  apiLoaded: true,
  domain: "your-app.railway.app",
  domainAuthorized: true,
  initialized: true
}
```

## 🛠 Troubleshooting

### Common Issues:

**1. "Error: redirect_uri_mismatch"**
- **Fix**: Add your exact Railway URL to "Authorized redirect URIs" in Google Console

**2. "Error: origin_mismatch"** 
- **Fix**: Add your domain to "Authorized JavaScript origins"

**3. OAuth popup blocked**
- **Fix**: Allow popups in browser settings

**4. "Invalid client ID"**
- **Fix**: Double-check Client ID is copied correctly

### Debug Commands:

```javascript
// Check configuration
oauthConfig.getDebugInfo()

// Test Google API loading
oauthConfig.loadGoogleAPI()

// Manual initialization
oauthConfig.initializeGoogleOAuth()
```

## 🔒 Security Notes

1. **Never commit Client Secret** to version control
2. **Client ID is safe** to include in frontend code
3. **Domain restrictions** are enforced by Google
4. **HTTPS required** in production

## 📝 Final Checklist

- [ ] Google Cloud project created
- [ ] Google Identity Services API enabled  
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Client ID added to application code
- [ ] Railway domain added to authorized domains
- [ ] Application deployed and tested

---

**Once completed, Google OAuth will work seamlessly with your Rememberizor app!** 🎉