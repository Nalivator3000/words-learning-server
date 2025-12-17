// TTS Diagnostic Endpoint
// Add this endpoint to server-postgresql.js after the TTS endpoint

// TTS Health Check Endpoint
app.get('/api/tts/health', async (req, res) => {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        server: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        },
        tts: {
            clientInitialized: !!ttsClient,
            credentialsConfigured: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
            cacheDirectory: AUDIO_CACHE_DIR,
            cacheDirectoryExists: fs.existsSync(AUDIO_CACHE_DIR)
        },
        cache: {
            location: AUDIO_CACHE_DIR,
            exists: fs.existsSync(AUDIO_CACHE_DIR),
            cachedFiles: 0,
            totalSizeBytes: 0
        }
    };

    // Count cached files
    if (fs.existsSync(AUDIO_CACHE_DIR)) {
        try {
            const files = fs.readdirSync(AUDIO_CACHE_DIR);
            diagnostics.cache.cachedFiles = files.length;
            diagnostics.cache.totalSizeBytes = files.reduce((total, file) => {
                const filePath = path.join(AUDIO_CACHE_DIR, file);
                const stats = fs.statSync(filePath);
                return total + stats.size;
            }, 0);
            diagnostics.cache.totalSizeMB = (diagnostics.cache.totalSizeBytes / (1024 * 1024)).toFixed(2);
        } catch (err) {
            diagnostics.cache.error = err.message;
        }
    }

    // Test TTS if client is initialized
    if (ttsClient) {
        try {
            const testText = 'Test';
            const testLang = 'en-US';
            const testRequest = {
                input: { text: testText },
                voice: { languageCode: testLang },
                audioConfig: { audioEncoding: 'MP3' }
            };

            const testStart = Date.now();
            const [testResponse] = await ttsClient.synthesizeSpeech(testRequest);
            const testEnd = Date.now();

            diagnostics.tts.testSuccess = true;
            diagnostics.tts.testResponseTime = `${testEnd - testStart}ms`;
            diagnostics.tts.testAudioSize = testResponse.audioContent.length;
        } catch (err) {
            diagnostics.tts.testSuccess = false;
            diagnostics.tts.testError = {
                name: err.name,
                message: err.message,
                code: err.code
            };
        }
    }

    logger.info('[TTS-Health] Health check requested');
    logger.info('[TTS-Health] Status:', JSON.stringify(diagnostics, null, 2));

    res.json(diagnostics);
});

// TTS Test Endpoint - for quick manual testing
app.get('/api/tts/test', async (req, res) => {
    const testText = req.query.text || 'Hello, this is a test';
    const testLang = req.query.lang || 'en-US';

    logger.info(`[TTS-Test] Testing TTS with text: "${testText}" (${testLang})`);

    try {
        if (!ttsClient) {
            return res.status(503).json({
                error: 'TTS client not initialized',
                configured: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
            });
        }

        const request = {
            input: { text: testText },
            voice: {
                languageCode: testLang,
                name: testLang === 'en-US' ? 'en-US-Neural2-F' : undefined
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9,
                pitch: 0.0
            }
        };

        const startTime = Date.now();
        const [response] = await ttsClient.synthesizeSpeech(request);
        const endTime = Date.now();

        logger.info(`[TTS-Test] Success! Generated ${response.audioContent.length} bytes in ${endTime - startTime}ms`);

        res.set('Content-Type', 'audio/mpeg');
        res.set('X-Test-Mode', 'true');
        res.set('X-Response-Time', `${endTime - startTime}ms`);
        res.set('X-Audio-Size', response.audioContent.length.toString());

        res.send(Buffer.from(response.audioContent, 'binary'));

    } catch (err) {
        logger.error('[TTS-Test] Test failed:', err);
        res.status(500).json({
            error: 'TTS test failed',
            details: {
                name: err.name,
                message: err.message,
                code: err.code,
                stack: err.stack
            }
        });
    }
});
