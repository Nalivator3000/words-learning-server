# 🔐 Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: **LexyBooster**
4. Click "Create"

## Step 2: Enable Google+ API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click "Create"

### App Information:
- **App name**: LexyBooster
- **User support email**: your-email@example.com
- **App logo**: (optional, upload app icon)
- **Application home page**: https://your-domain.com (or http://localhost:3001 for dev)
- **Authorized domains**:
  - your-domain.com (production)
  - localhost (development)
- **Developer contact information**: your-email@example.com

4. Click "Save and Continue"

### Scopes:
1. Click "Add or Remove Scopes"
2. Add these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
3. Click "Update" → "Save and Continue"

### Test Users (for development):
1. Add your Gmail account as test user
2. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: **LexyBooster Web Client**

### Authorized JavaScript origins:
```
http://localhost:3001
https://your-domain.com
```

### Authorized redirect URIs:
```
http://localhost:3001/auth/google/callback
https://your-domain.com/auth/google/callback
```

5. Click "Create"
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret**

## Step 5: Add Credentials to .env

Add these lines to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

For production, update `GOOGLE_CALLBACK_URL`:
```env
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
```

## Step 6: Restart Server

After adding credentials to `.env`:
```bash
npm start
```

## Step 7: Test Google Login

1. Open http://localhost:3001
2. Click "Login"
3. Click "Войти через Google" (Login with Google)
4. Select your Google account
5. Grant permissions
6. You should be redirected back and logged in

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in Google Cloud Console exactly matches your callback URL
- Check for trailing slashes

### Error: "Access blocked: This app's request is invalid"
- Make sure you added your email as a test user in OAuth consent screen
- App must be in "Testing" mode until you publish it

### Error: "Client ID not found"
- Double-check your `GOOGLE_CLIENT_ID` in `.env`
- Restart the server after changing `.env`

## Publishing the App (Production)

Once you're ready for production:

1. Go to **OAuth consent screen**
2. Click "Publish App"
3. Submit for verification (required for >100 users)
4. Google will review your app (1-2 weeks)

## Security Best Practices

- ✅ Never commit `.env` file to git
- ✅ Use different credentials for dev and production
- ✅ Regularly rotate your client secret
- ✅ Limit scopes to only what you need
- ✅ Monitor OAuth usage in Google Cloud Console

---

**Setup complete!** Google OAuth should now be working. 🎉
