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
        const loadVoices = () => {
            this.allVoices = this.synth.getVoices();

            console.log(`🔊 AudioManager: Found ${this.allVoices.length} total voices`);

            this.selectVoicesForLanguages(this.allVoices);

            // Populate UI if it exists
            if (window.app && window.app.populateVoiceSelectors) {
                window.app.populateVoiceSelectors(this.allVoices);
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

        // Bad voice names to filter out (low quality TTS)
        const badVoicePatterns = [
            /espeak/i,
            /festival/i,
            /pico/i,
            /flite/i,
            /android/i,  // Android default TTS is often low quality
            /samsung/i   // Samsung TTS is often robotic
        ];

        // Filter out known bad voices
        const goodVoices = languageVoices.filter(voice =>
            !badVoicePatterns.some(pattern => pattern.test(voice.name))
        );

        // CRITICAL: If no quality voices available, return null instead of using bad voices
        if (goodVoices.length === 0) {
            console.warn(`⚠️ No quality voices found for ${languagePrefix}. Only low-quality TTS available - skipping.`);
            return null;
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

        // Stop any current speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageCode;

        // Use appropriate voice for language
        const voice = this.voices[languageCode];
        if (voice) {
            utterance.voice = voice;
            console.log(`AudioManager: Using voice "${voice.name}" for ${languageCode}`);

            // Adjust settings based on voice type
            // Remote/cloud voices often need different settings than local voices
            if (voice.localService) {
                // Local voices - use user settings
                utterance.rate = this.voiceSettings.rate;
                utterance.pitch = this.voiceSettings.pitch;
                utterance.volume = this.voiceSettings.volume;
            } else {
                // Remote/cloud voices - slightly slower for better clarity
                utterance.rate = Math.max(0.75, this.voiceSettings.rate * 0.95);
                utterance.pitch = this.voiceSettings.pitch;
                utterance.volume = this.voiceSettings.volume;
            }
        } else {
            // No quality voice available - skip TTS completely
            console.warn(`❌ AudioManager: No quality voice available for ${languageCode}. Skipping TTS to avoid low-quality audio.`);
            console.warn(`❌ Available voices for this language were filtered out as low-quality (Android TTS, Samsung TTS, etc.)`);
            return; // Exit without speaking
        }
        
        // Add error handling
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
        };
        
        utterance.onend = () => {
            console.log('AudioManager: Speech finished');
        };
        
        this.synth.speak(utterance);
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
