// Enhanced TTS endpoint with comprehensive logging
// Replace the existing app.get('/api/tts', ...) in server-postgresql.js with this code

app.get('/api/tts', async (req, res) => {
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const logPrefix = `[TTS-Server][${requestId}]`;

    try {
        logger.info(`${logPrefix} 📥 Received TTS request`);
        logger.info(`${logPrefix} 🔍 Query params:`, req.query);
        logger.info(`${logPrefix} 🌐 Client IP: ${req.ip || req.connection.remoteAddress}`);
        logger.info(`${logPrefix} 📱 User-Agent: ${req.get('user-agent')}`);

        const { text, lang = 'de-DE' } = req.query;

        if (!text) {
            logger.warn(`${logPrefix} ⚠️ Missing text parameter`);
            return res.status(400).json({ error: 'Text parameter is required' });
        }

        logger.info(`${logPrefix} 📝 Text: "${text}"`);
        logger.info(`${logPrefix} 🌍 Language: ${lang}`);

        if (!ttsClient) {
            logger.error(`${logPrefix} ❌ TTS client not initialized!`);
            logger.error(`${logPrefix} 🔧 GOOGLE_APPLICATION_CREDENTIALS_JSON env var status: ${process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'SET' : 'NOT SET'}`);
            return res.status(503).json({
                error: 'Google TTS is not configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON in environment variables.',
                requestId: requestId
            });
        }

        logger.info(`${logPrefix} ✅ TTS client is initialized`);

        // Create cache filename based on text and language
        const cacheKey = crypto.createHash('md5').update(`${text}-${lang}`).digest('hex');
        const cacheFile = path.join(AUDIO_CACHE_DIR, `${cacheKey}.mp3`);

        logger.info(`${logPrefix} 🔑 Cache key: ${cacheKey}`);
        logger.info(`${logPrefix} 📁 Cache file: ${cacheFile}`);

        // Check if audio is already cached
        if (fs.existsSync(cacheFile)) {
            const stats = fs.statSync(cacheFile);
            logger.info(`${logPrefix} 📦 Cache HIT - Serving cached audio`);
            logger.info(`${logPrefix} 📊 File size: ${stats.size} bytes`);
            logger.info(`${logPrefix} 📅 Cached at: ${stats.mtime}`);

            res.set('Content-Type', 'audio/mpeg');
            res.set('Cache-Control', 'public, max-age=31536000');
            res.set('X-Cache-Status', 'HIT');
            res.set('X-Request-ID', requestId);

            return res.sendFile(cacheFile);
        }

        logger.info(`${logPrefix} 🔄 Cache MISS - Generating new audio`);

        // Voice selection
        const voiceName = lang === 'de-DE' ? 'de-DE-Neural2-C' :
                         lang === 'en-US' ? 'en-US-Neural2-F' :
                         lang === 'ru-RU' ? 'ru-RU-Wavenet-A' : undefined;

        logger.info(`${logPrefix} 🎤 Selected voice: ${voiceName || 'auto'}`);

        // Generate audio using Google Cloud TTS
        const request = {
            input: { text },
            voice: {
                languageCode: lang,
                name: voiceName
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9,
                pitch: 0.0
            },
        };

        logger.info(`${logPrefix} 📤 Sending request to Google TTS API...`);
        logger.info(`${logPrefix} 🔧 Request config:`, JSON.stringify(request, null, 2));

        const apiStart = Date.now();
        const [response] = await ttsClient.synthesizeSpeech(request);
        const apiEnd = Date.now();

        logger.info(`${logPrefix} ⏱️ Google TTS API response time: ${apiEnd - apiStart}ms`);
        logger.info(`${logPrefix} 📦 Audio content size: ${response.audioContent.length} bytes`);

        if (!response.audioContent || response.audioContent.length === 0) {
            logger.error(`${logPrefix} ❌ Empty audio content received from Google TTS!`);
            return res.status(500).json({
                error: 'Empty audio content received',
                requestId: requestId
            });
        }

        // Save to cache
        logger.info(`${logPrefix} 💾 Saving to cache...`);
        fs.writeFileSync(cacheFile, response.audioContent, 'binary');
        logger.info(`${logPrefix} ✅ Audio cached successfully: ${cacheKey}.mp3`);

        // Send audio
        res.set('Content-Type', 'audio/mpeg');
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('X-Cache-Status', 'MISS');
        res.set('X-Request-ID', requestId);
        res.set('X-Audio-Size', response.audioContent.length.toString());

        logger.info(`${logPrefix} 📤 Sending audio response to client`);
        res.send(Buffer.from(response.audioContent, 'binary'));
        logger.info(`${logPrefix} ✅ Request completed successfully`);

    } catch (err) {
        logger.error(`${logPrefix} ❌ TTS generation failed!`);
        logger.error(`${logPrefix} 📛 Error name: ${err.name}`);
        logger.error(`${logPrefix} 💬 Error message: ${err.message}`);
        logger.error(`${logPrefix} 📚 Error stack:`, err.stack);

        if (err.code) {
            logger.error(`${logPrefix} 🔢 Error code: ${err.code}`);
        }

        res.status(500).json({
            error: 'Failed to generate speech',
            details: err.message,
            code: err.code,
            requestId: requestId
        });
    }
});
