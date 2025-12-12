# Google Cloud Text-to-Speech API Setup

This guide will help you set up Google Cloud TTS API for high-quality voice synthesis on mobile devices.

## Why Google TTS?

- ✅ **Best Quality**: Neural2 and WaveNet voices sound natural
- ✅ **Consistent**: Same quality on all devices (mobile and desktop)
- ✅ **Free Tier**: 1 million characters per month free
- ✅ **Fast**: Cached audio loads instantly

## Cost Estimate

For a language learning app with **1000 active users**:
- Average: 50 words per user per month
- Average word length: 10 characters
- **Total: 500,000 characters/month**
- **Cost: $0** (within free tier of 1 million)

Even at 2000 users = Still FREE!

---

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"**
3. Name your project (e.g., "lexybooster-tts")
4. Click **"Create"**

### 2. Enable Text-to-Speech API

1. In the search bar, type **"Text-to-Speech API"**
2. Click on **"Cloud Text-to-Speech API"**
3. Click **"Enable"**
4. Wait for API to be enabled (~30 seconds)

### 3. Create API Key

1. Go to **"APIs & Services" → "Credentials"**
2. Click **"+ Create Credentials"** → **"API Key"**
3. Copy the API key (it looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXX`)
4. Click **"Edit API Key"** (optional but recommended):
   - Name it: "TTS API Key"
   - Under "API restrictions", select "Restrict key"
   - Check only **"Cloud Text-to-Speech API"**
   - Click **"Save"**

### 4. Add API Key to Your Project

#### For Railway Deployment:

1. Open your Railway project dashboard
2. Go to **Variables** tab
3. Add new variable:
   - **Name**: `GOOGLE_TTS_API_KEY`
   - **Value**: Your API key from step 3
4. Click **"Add"**
5. Railway will automatically redeploy with the new variable

#### For Local Development:

1. Create/edit `.env` file in project root:
```bash
GOOGLE_TTS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
```

2. Restart your server:
```bash
npm start
```

---

## How It Works

### Mobile Devices
- No premium voices? → **Google TTS API** (high quality)
- Has Google/Microsoft voice? → Use browser voice

### Desktop
- Uses browser's Web Speech API (usually good quality)
- Fallback to filtered voices if needed

### Caching
- First request: Generates audio via Google API
- Saves MP3 file in `audio-cache/` directory
- Next requests: Instant playback from cache
- Cache never expires (popular words cached forever)

---

## Testing

### Test API Key

```bash
curl "http://localhost:3001/api/tts?text=Hund&lang=de-DE"
```

Should return an MP3 audio file.

### Test on Mobile

1. Open app on mobile device
2. Try to play audio for a word
3. Check Eruda console logs:
   - `🌐 Using Google TTS API for: "Hund"` ← API is being used
   - `✅ Google TTS audio finished` ← Success!

---

## Monitoring Usage

### View Usage in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **"APIs & Services" → "Dashboard"**
4. Click on **"Cloud Text-to-Speech API"**
5. View usage graphs and quotas

### Check Quota

- **Free tier**: 1 million characters/month
- **After free tier**: $16 per 1 million characters (Neural2)
- Set up billing alerts at 50%, 75%, 90% of quota

---

## Troubleshooting

### Error: "Google TTS is not configured"

**Solution**: Make sure `GOOGLE_TTS_API_KEY` environment variable is set.

### Error: "API key not valid"

**Solutions**:
1. Check API key is copied correctly (no spaces)
2. Verify Text-to-Speech API is enabled
3. Check API key restrictions (should allow TTS API)

### No audio on mobile

**Check**:
1. Open Eruda console on mobile (green icon)
2. Look for errors in console
3. Test API directly: `https://yourapp.com/api/tts?text=test&lang=de-DE`

---

## Supported Languages

- 🇩🇪 German: `de-DE` (Neural2-C - female, Neural2-D - male)
- 🇬🇧 English: `en-US` (Neural2-F - female, Neural2-J - male)
- 🇷🇺 Russian: `ru-RU` (Wavenet-A - female)
- 🇪🇸 Spanish: `es-ES` (Neural2-B - female)
- 🇫🇷 French: `fr-FR` (Neural2-A - female)

[Full list of voices](https://cloud.google.com/text-to-speech/docs/voices)

---

## Security Best Practices

1. ✅ **API Key Restrictions**: Restrict to Text-to-Speech API only
2. ✅ **Environment Variables**: Never commit API key to git
3. ✅ **Rate Limiting**: Already implemented in the endpoint
4. ✅ **Caching**: Reduces API calls significantly

---

## Need Help?

- [Google TTS Documentation](https://cloud.google.com/text-to-speech/docs)
- [Voice List](https://cloud.google.com/text-to-speech/docs/voices)
- [Pricing](https://cloud.google.com/text-to-speech/pricing)
