class AudioManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = {};
        this.customVoices = this.loadCustomVoices();
        this.voiceSettings = this.loadVoiceSettings();
        this.allVoices = [];
        this.initVoices();
    }

    loadCustomVoices() {
        try {
            const saved = localStorage.getItem('customVoiceSettings');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load custom voice settings:', error);
            return {};
        }
    }

    loadVoiceSettings() {
        try {
            const saved = localStorage.getItem('voiceSettings');
            return saved ? JSON.parse(saved) : { rate: 0.8, pitch: 1.0, volume: 1.0, autoPlay: true };
        } catch (error) {
            console.error('Failed to load voice settings:', error);
            return { rate: 0.8, pitch: 1.0, volume: 1.0, autoPlay: true };
        }
    }

    saveVoiceSettings() {
        try {
            localStorage.setItem('voiceSettings', JSON.stringify(this.voiceSettings));
            console.log('✅ Voice settings saved:', this.voiceSettings);
        } catch (error) {
            console.error('Failed to save voice settings:', error);
        }
    }

    setVoiceRate(rate) {
        this.voiceSettings.rate = parseFloat(rate);
        this.saveVoiceSettings();
    }

    setVoicePitch(pitch) {
        this.voiceSettings.pitch = parseFloat(pitch);
        this.saveVoiceSettings();
    }

    setVoiceVolume(volume) {
        this.voiceSettings.volume = parseFloat(volume);
        this.saveVoiceSettings();
    }

    setAutoPlay(enabled) {
        this.voiceSettings.autoPlay = Boolean(enabled);
        this.saveVoiceSettings();
        console.log('✅ Auto-play setting updated:', this.voiceSettings.autoPlay);
    }

    isAutoPlayEnabled() {
        return this.voiceSettings.autoPlay !== false; // Default to true if not set
    }

    saveCustomVoices() {
        try {
            localStorage.setItem('customVoiceSettings', JSON.stringify(this.customVoices));
            console.log('✅ Custom voice settings saved');
        } catch (error) {
            console.error('Failed to save custom voice settings:', error);
        }
    }

    setCustomVoice(langCode, voiceName) {
        if (voiceName === 'auto') {
            delete this.customVoices[langCode];
        } else {
            this.customVoices[langCode] = voiceName;
        }
        this.saveCustomVoices();

        // Re-select voices with new custom settings
        const allVoices = this.synth.getVoices();
        this.selectVoicesForLanguages(allVoices);

        console.log(`🎯 Custom voice set for ${langCode}: ${voiceName}`);
    }

    getCustomVoice(langCode) {
        return this.customVoices[langCode] || 'auto';
    }

    initVoices() {
        let isFirstLoad = true;

        const loadVoices = () => {
            this.allVoices = this.synth.getVoices();

            // Only log detailed info after voices are loaded (not on initial empty load)
            if (this.allVoices.length > 0) {
                console.log(`🔊 AudioManager: Found ${this.allVoices.length} total voices`);
                this.selectVoicesForLanguages(this.allVoices);

                // Populate UI if it exists
                if (window.app && window.app.populateVoiceSelectors) {
                    window.app.populateVoiceSelectors(this.allVoices);
                }
            } else if (isFirstLoad) {
                console.log(`🔊 AudioManager: Waiting for voices to load asynchronously...`);
                isFirstLoad = false;
            }
        };

        loadVoices();

        // Some browsers load voices asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    selectVoicesForLanguages(allVoices) {
        const languages = ['ru-RU', 'en-US', 'de-DE', 'es-ES', 'fr-FR', 'it-IT'];

        languages.forEach(langCode => {
            const customVoiceName = this.customVoices[langCode];

            if (customVoiceName) {
                // Use custom selected voice
                const customVoice = allVoices.find(v => v.name === customVoiceName);
                this.voices[langCode] = customVoice || this.selectBestVoice(allVoices, langCode.split('-')[0]);
                console.log(`✅ ${langCode}: ${this.voices[langCode]?.name} (custom)`);
            } else {
                // Use auto-selected best voice
                this.voices[langCode] = this.selectBestVoice(allVoices, langCode.split('-')[0]);
                if (this.voices[langCode]) {
                    console.log(`✅ ${langCode}: ${this.voices[langCode].name} (auto, local: ${this.voices[langCode].localService})`);
                } else {
                    console.warn(`⚠️ ${langCode}: No suitable voice found`);
                }
            }
        });
    }

    selectBestVoice(allVoices, languagePrefix) {
        // Filter voices for this language
        const languageVoices = allVoices.filter(v => v.lang.startsWith(languagePrefix));

        if (languageVoices.length === 0) {
            console.warn(`No voices found for language: ${languagePrefix}`);
            return null;
        }

        // HYBRID APPROACH: Whitelist quality engines + Block known bad voices
        const qualityVoicePatterns = [
            /google/i,      // Google TTS (best quality)
            /microsoft/i,   // Microsoft Azure TTS
            /apple/i,       // Apple Siri voices
            /amazon/i,      // Amazon Polly
            /nuance/i,      // Nuance (professional TTS)
        ];

        const badVoicePatterns = [
            /android/i,     // Android TTS (robotic)
            /samsung/i,     // Samsung TTS (robotic)
            /espeak/i,      // Espeak (very robotic)
            /pico/i,        // Pico TTS (old)
            /\btts\b/i,     // Generic TTS (usually bad)
            /speech.*synth/i,  // Generic speech synthesis
            /robot/i,       // Obviously robotic
            /male\s*\d+/i,  // Generic male1, male2, etc.
            /female\s*\d+/i, // Generic female1, female2, etc.
            /default/i,     // Default voice (usually bad)
        ];

        // First, try to find quality voices
        let goodVoices = languageVoices.filter(voice =>
            qualityVoicePatterns.some(pattern => pattern.test(voice.name))
        );

        console.log(`🔍 All available voices for ${languagePrefix}:`, languageVoices.map(v => v.name));
        console.log(`✅ Quality voices (whitelisted):`, goodVoices.map(v => v.name));

        // Detect if mobile device
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

        // If no premium voices found
        if (goodVoices.length === 0) {
            if (isMobile) {
                // MOBILE: No fallback - premium voices only or no audio
                console.warn(`❌ NO PREMIUM VOICES on mobile for ${languagePrefix}!`);
                console.warn(`❌ Mobile devices often have low-quality TTS. DISABLING audio.`);
                console.warn(`💡 Available voices:`, languageVoices.map(v => v.name));
                return null;
            } else {
                // DESKTOP: Allow fallback to browser voices (usually decent)
                console.warn(`⚠️ No premium voices found on desktop. Using browser default voices.`);
                goodVoices = languageVoices.filter(voice =>
                    !badVoicePatterns.some(pattern => pattern.test(voice.name))
                );
                console.log(`🔄 Fallback voices (desktop):`, goodVoices.map(v => v.name));

                if (goodVoices.length === 0) {
                    console.warn(`❌ NO ACCEPTABLE VOICES for ${languagePrefix}!`);
                    return null;
                }
            }
        }

        const voicesToConsider = goodVoices;

        // Quality score function
        const scoreVoice = (voice) => {
            let score = 0;

            // Priority 1: Quality TTS engines FIRST (most important for mobile)
            const qualityEngines = [
                { pattern: /google/i, score: 150 },      // Highest priority
                { pattern: /microsoft/i, score: 140 },
                { pattern: /apple/i, score: 135 },
                { pattern: /yandex/i, score: 130 },      // Good for Russian
                { pattern: /natural/i, score: 120 },
                { pattern: /premium/i, score: 120 },
                { pattern: /neural/i, score: 110 },
                { pattern: /wavenet/i, score: 110 },     // Google WaveNet
                { pattern: /enhanced/i, score: 100 },
                { pattern: /HD/i, score: 90 }
            ];

            let hasQualityEngine = false;
            qualityEngines.forEach(({ pattern, score: engineScore }) => {
                if (pattern.test(voice.name)) {
                    score += engineScore;
                    hasQualityEngine = true;
                }
            });

            // Priority 2: Prefer remote/cloud voices if they're quality engines
            // Mobile browsers often have better cloud voices than local ones
            if (!voice.localService && hasQualityEngine) {
                score += 50; // Bonus for remote quality voices
            }

            // Priority 3: Local voices get bonus only if they're quality engines
            if (voice.localService && hasQualityEngine) {
                score += 30; // Smaller bonus for local quality voices
            }

            // Priority 4: Exact language match (de-DE better than de-US)
            const exactMatch = {
                'ru': ['ru-RU', 'ru_RU'],
                'en': ['en-US', 'en-GB', 'en_US', 'en_GB'],
                'de': ['de-DE', 'de_DE'],
                'es': ['es-ES', 'es_ES'],
                'fr': ['fr-FR', 'fr_FR'],
                'it': ['it-IT', 'it_IT']
            };

            if (exactMatch[languagePrefix]?.some(lang => voice.lang.includes(lang))) {
                score += 50;
            }

            // Priority 5: Slight preference for voices with the language in the name
            if (new RegExp(languagePrefix, 'i').test(voice.name)) {
                score += 10;
            }

            // Female voices often sound more natural
            if (/female|woman|girl|frau|femme/i.test(voice.name)) {
                score += 5;
            }

            return score;
        };

        // Sort by score (highest first)
        const sortedVoices = voicesToConsider.sort((a, b) => scoreVoice(b) - scoreVoice(a));

        const bestVoice = sortedVoices[0];

        console.log(`🎯 Best voice for ${languagePrefix}: ${bestVoice.name} (score: ${scoreVoice(bestVoice)}, local: ${bestVoice.localService}, lang: ${bestVoice.lang})`);

        // Log top 3 voices for debugging
        if (sortedVoices.length > 1) {
            console.log(`   Alternatives:`);
            sortedVoices.slice(1, 4).forEach((v, i) => {
                console.log(`   ${i + 2}. ${v.name} (score: ${scoreVoice(v)}, local: ${v.localService})`);
            });
        }

        return bestVoice;
    }

    speak(text, languageCode = null) {
        if (!text.trim()) {
            console.log('AudioManager: Empty text, skipping TTS');
            return;
        }

        // Auto-detect language if not provided
        if (!languageCode) {
            const currentPair = userManager ? userManager.getCurrentLanguagePair() : null;
            if (currentPair && languageManager) {
                languageCode = languageManager.getAudioLanguageCode(text, currentPair);
            } else {
                languageCode = 'de-DE'; // Default fallback
            }
        }

        console.log(`🔊 AudioManager: Attempting to speak "${text}" in ${languageCode}`);

        // ALWAYS use Google TTS API for all devices (browser TTS disabled)
        console.log(`🌐 Using Google TTS API for high-quality speech`);
        this.speakWithGoogleTTS(text, languageCode);
    }

    // Google Cloud TTS API method (for all devices)
    async speakWithGoogleTTS(text, languageCode) {
        const logPrefix = `[TTS-Client]`;
        const timestamp = new Date().toISOString();

        try {
            console.log(`${logPrefix} 🌐 [${timestamp}] Starting TTS request`);
            console.log(`${logPrefix} 📝 Text: "${text}"`);
            console.log(`${logPrefix} 🌍 Language: ${languageCode}`);
            console.log(`${logPrefix} 🔧 Settings:`, {
                volume: this.voiceSettings.volume,
                rate: this.voiceSettings.rate,
                autoPlay: this.voiceSettings.autoPlay
            });

            const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${languageCode}`;
            console.log(`${logPrefix} 🔗 Request URL: ${url}`);
            console.log(`${logPrefix} 📡 Sending fetch request...`);

            const fetchStart = performance.now();
            const response = await fetch(url);
            const fetchEnd = performance.now();

            console.log(`${logPrefix} ⏱️ Fetch completed in ${(fetchEnd - fetchStart).toFixed(2)}ms`);
            console.log(`${logPrefix} 📊 Response status: ${response.status} ${response.statusText}`);

            const cacheStatus = response.headers.get('x-cache-status');
            const cacheEmoji = cacheStatus === 'HIT-LOCAL' ? '📦' :
                              cacheStatus === 'HIT-CLOUDINARY' ? '☁️' :
                              cacheStatus === 'MISS-GENERATED' ? '🔊' : '❓';

            console.log(`${logPrefix} ${cacheEmoji} CACHE STATUS: ${cacheStatus || 'UNKNOWN'}`);
            console.log(`${logPrefix} 📋 Response headers:`, {
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length'),
                cacheControl: response.headers.get('cache-control'),
                cacheStatus: cacheStatus
            });

            if (!response.ok) {
                console.error(`${logPrefix} ❌ Response not OK: ${response.status}`);
                let errorDetails;
                try {
                    errorDetails = await response.json();
                    console.error(`${logPrefix} ❌ Error details:`, errorDetails);
                } catch (parseErr) {
                    console.error(`${logPrefix} ❌ Failed to parse error response:`, parseErr);
                    errorDetails = { error: 'Unknown error', status: response.status };
                }
                console.warn(`${logPrefix} 💡 No audio will be played due to API error`);
                return;
            }

            console.log(`${logPrefix} 📦 Converting response to blob...`);
            const audioBlob = await response.blob();
            console.log(`${logPrefix} ✅ Blob created:`, {
                size: audioBlob.size,
                type: audioBlob.type
            });

            if (audioBlob.size === 0) {
                console.error(`${logPrefix} ❌ Empty audio blob received!`);
                return;
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            console.log(`${logPrefix} 🔗 Object URL created: ${audioUrl.substring(0, 50)}...`);

            // Play audio using HTML5 Audio
            console.log(`${logPrefix} 🎵 Creating Audio element...`);
            const audio = new Audio(audioUrl);
            audio.volume = this.voiceSettings.volume;
            audio.playbackRate = this.voiceSettings.rate;

            console.log(`${logPrefix} ⚙️ Audio element configured:`, {
                volume: audio.volume,
                playbackRate: audio.playbackRate,
                readyState: audio.readyState
            });

            // Add detailed event listeners
            audio.onloadstart = () => {
                console.log(`${logPrefix} 📥 Audio loading started`);
            };

            audio.onloadedmetadata = () => {
                console.log(`${logPrefix} 📊 Metadata loaded:`, {
                    duration: audio.duration,
                    networkState: audio.networkState,
                    readyState: audio.readyState
                });
            };

            audio.oncanplay = () => {
                console.log(`${logPrefix} ✅ Audio can play (buffered enough)`);
            };

            audio.onplay = () => {
                console.log(`${logPrefix} ▶️ Audio playback started`);
            };

            audio.onplaying = () => {
                console.log(`${logPrefix} 🔊 Audio is playing...`);
            };

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                console.log(`${logPrefix} ✅ Audio playback finished successfully`);
                console.log(`${logPrefix} 🧹 Object URL revoked`);
            };

            audio.onerror = (err) => {
                console.error(`${logPrefix} ❌ Audio playback error:`, {
                    error: err,
                    code: audio.error?.code,
                    message: audio.error?.message,
                    networkState: audio.networkState,
                    readyState: audio.readyState
                });
                URL.revokeObjectURL(audioUrl);
                console.log(`${logPrefix} 🧹 Object URL revoked after error`);
            };

            audio.onpause = () => {
                console.log(`${logPrefix} ⏸️ Audio paused`);
            };

            audio.onstalled = () => {
                console.warn(`${logPrefix} ⚠️ Audio download stalled`);
            };

            audio.onsuspend = () => {
                console.log(`${logPrefix} 💤 Audio download suspended`);
            };

            audio.onwaiting = () => {
                console.log(`${logPrefix} ⏳ Audio buffering...`);
            };

            console.log(`${logPrefix} 🚀 Calling audio.play()...`);
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log(`${logPrefix} ✅ Play promise resolved - playback started successfully`);
                    })
                    .catch((playError) => {
                        console.error(`${logPrefix} ❌ Play promise rejected:`, {
                            name: playError.name,
                            message: playError.message,
                            stack: playError.stack
                        });

                        // Provide specific error guidance
                        if (playError.name === 'NotAllowedError') {
                            console.error(`${logPrefix} 🚫 Autoplay blocked by browser. User interaction required.`);
                        } else if (playError.name === 'NotSupportedError') {
                            console.error(`${logPrefix} 🚫 Audio format not supported by browser`);
                        } else if (playError.name === 'AbortError') {
                            console.error(`${logPrefix} 🚫 Playback aborted before starting`);
                        }
                    });
            } else {
                console.warn(`${logPrefix} ⚠️ audio.play() returned undefined (older browser)`);
            }

        } catch (err) {
            console.error(`${logPrefix} ❌ Fatal error in TTS function:`, {
                name: err.name,
                message: err.message,
                stack: err.stack
            });
            console.error(`${logPrefix} 📍 Error occurred at:`, new Error().stack);
            console.warn(`${logPrefix} 💡 No audio will be played (API not configured or network error)`);
        }
    }

    stop() {
        this.synth.cancel();
    }
    
    // Check if TTS is available
    isAvailable() {
        return 'speechSynthesis' in window;
    }
    
    // Get available voices for debugging
    getAvailableVoices() {
        return this.synth.getVoices().map(voice => ({
            name: voice.name,
            lang: voice.lang,
            localService: voice.localService
        }));
    }

    // Diagnostic function to log all available voices and their quality assessment
    diagnoseVoices() {
        console.log('🔍 VOICE DIAGNOSTICS:');
        console.log('='.repeat(50));

        const allVoices = this.synth.getVoices();
        console.log(`Total voices available: ${allVoices.length}`);

        const badVoicePatterns = [
            /espeak/i,
            /festival/i,
            /pico/i,
            /flite/i,
            /android/i,
            /samsung/i
        ];

        const languages = ['ru', 'en', 'de', 'es', 'fr', 'it'];

        languages.forEach(lang => {
            console.log(`\n📋 ${lang.toUpperCase()} voices:`);
            const langVoices = allVoices.filter(v => v.lang.startsWith(lang));

            if (langVoices.length === 0) {
                console.log('  ❌ No voices found');
                return;
            }

            langVoices.forEach(voice => {
                const isBad = badVoicePatterns.some(pattern => pattern.test(voice.name));
                const status = isBad ? '❌ FILTERED' : '✅ ALLOWED';
                console.log(`  ${status} ${voice.name} (${voice.lang}) ${voice.localService ? '📍 Local' : '☁️ Cloud'}`);
            });
        });

        console.log('\n' + '='.repeat(50));
        console.log('Currently selected voices:');
        Object.keys(this.voices).forEach(langCode => {
            const voice = this.voices[langCode];
            if (voice) {
                console.log(`  ✅ ${langCode}: ${voice.name}`);
            } else {
                console.log(`  ❌ ${langCode}: No quality voice available`);
            }
        });
    }
}

// Global singleton instance (like i18n)
const audioManager = new AudioManager();

// Expose globally for use across the application
window.audioManager = audioManager;

console.log('🔊 AudioManager module loaded');
