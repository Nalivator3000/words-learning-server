const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Pre-loads audio for most popular words to utilize free TTS quota
 * Runs as a background job (e.g., end of month before quota resets)
 */
class AudioPreloader {
    constructor(db, ttsClient, googleDriveCache, audioDir) {
        this.db = db;
        this.ttsClient = ttsClient;
        this.googleDriveCache = googleDriveCache;
        this.audioDir = audioDir;
        this.logger = console;
    }

    /**
     * Get most popular words that don't have cached audio
     * @param {number} limit - Maximum number of words to fetch
     * @returns {Array} List of {word, language, usage_count}
     */
    async getMostPopularUncached(limit = 100) {
        try {
            const query = `
                WITH word_usage AS (
                    -- Count how many times each word was used in quizzes
                    SELECT
                        word_id,
                        COUNT(*) as usage_count
                    FROM quiz_history
                    WHERE created_at > NOW() - INTERVAL '30 days'
                    GROUP BY word_id
                ),
                popular_words AS (
                    -- Get top words with their details
                    SELECT
                        w.id,
                        w.word,
                        lp.from_lang as language,
                        wu.usage_count
                    FROM word_usage wu
                    JOIN user_word_progress uwp ON wu.word_id = uwp.id
                    JOIN words w ON uwp.word_id = w.id
                    JOIN language_pairs lp ON w.language_pair_id = lp.id
                    ORDER BY wu.usage_count DESC
                    LIMIT $1
                )
                SELECT * FROM popular_words
                ORDER BY usage_count DESC
            `;

            const result = await this.db.query(query, [limit * 2]); // Fetch 2x in case many are cached

            // Filter out words that already have cache
            const uncached = [];
            for (const row of result.rows) {
                const hasCache = await this.checkIfCached(row.word, row.language);
                if (!hasCache) {
                    uncached.push(row);
                }

                if (uncached.length >= limit) {
                    break;
                }
            }

            return uncached;
        } catch (error) {
            this.logger.error('Error fetching popular uncached words:', error);
            return [];
        }
    }

    /**
     * Check if audio is already cached (local or Google Drive)
     */
    async checkIfCached(text, langCode) {
        const lang = this.getLangCode(langCode);
        const cacheKey = crypto.createHash('md5').update(`${text}-${lang}`).digest('hex');
        const cacheFile = path.join(this.audioDir, `${cacheKey}.mp3`);

        // Check local cache
        if (fs.existsSync(cacheFile)) {
            return true;
        }

        // Check Google Drive cache
        if (this.googleDriveCache && this.googleDriveCache.initialized) {
            try {
                const driveAudio = await this.googleDriveCache.getFile(cacheKey, lang);
                if (driveAudio) {
                    // Save to local cache while we're at it
                    fs.writeFileSync(cacheFile, driveAudio, 'binary');
                    return true;
                }
            } catch (error) {
                // Drive check failed, continue
            }
        }

        return false;
    }

    /**
     * Convert short language code to full TTS code
     */
    getLangCode(shortCode) {
        const langMap = {
            'de': 'de-DE',
            'en': 'en-US',
            'ru': 'ru-RU',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'zh': 'zh-CN',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'ar': 'ar-XA',
            'pl': 'pl-PL',
            'tr': 'tr-TR',
            'ro': 'ro-RO',
            'uk': 'uk-UA',
            'sr': 'sr-RS',
            'sw': 'sw-KE',
            'hi': 'hi-IN'
        };

        return langMap[shortCode] || shortCode;
    }

    /**
     * Get voice map (same as in server-postgresql.js)
     */
    getVoiceMap() {
        return {
            'de-DE': 'de-DE-Neural2-C',
            'en-US': 'en-US-Neural2-F',
            'en-GB': 'en-GB-Neural2-F',
            'ru-RU': 'ru-RU-Wavenet-A',
            'es-ES': 'es-ES-Neural2-A',
            'fr-FR': 'fr-FR-Neural2-A',
            'it-IT': 'it-IT-Neural2-A',
            'pt-PT': 'pt-PT-Wavenet-A',
            'pt-BR': 'pt-BR-Neural2-A',
            'zh-CN': 'cmn-CN-Wavenet-A',
            'ja-JP': 'ja-JP-Neural2-B',
            'ko-KR': 'ko-KR-Neural2-A',
            'ar-XA': 'ar-XA-Wavenet-A',
            'pl-PL': 'pl-PL-Wavenet-A',
            'tr-TR': 'tr-TR-Wavenet-A',
            'ro-RO': 'ro-RO-Wavenet-A',
            'uk-UA': 'uk-UA-Wavenet-A',
        };
    }

    /**
     * Generate and cache audio for a word
     */
    async generateAndCache(text, langCode) {
        try {
            const lang = this.getLangCode(langCode);
            const cacheKey = crypto.createHash('md5').update(`${text}-${lang}`).digest('hex');
            const cacheFile = path.join(this.audioDir, `${cacheKey}.mp3`);
            const voiceMap = this.getVoiceMap();

            const request = {
                input: { text },
                voice: {
                    languageCode: lang,
                    name: voiceMap[lang] || undefined,
                    ssmlGender: 'FEMALE'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 0.9,
                    pitch: 0.0
                },
            };

            const [response] = await this.ttsClient.synthesizeSpeech(request);
            const audioBuffer = Buffer.from(response.audioContent, 'binary');

            // Save to local cache
            fs.writeFileSync(cacheFile, audioBuffer);
            this.logger.info(`✅ Generated: "${text}" (${lang})`);

            // Upload to Google Drive (async)
            if (this.googleDriveCache && this.googleDriveCache.initialized) {
                this.googleDriveCache.uploadFile(cacheKey, lang, audioBuffer)
                    .catch(err => this.logger.warn(`   ⚠️ Drive upload failed: ${err.message}`));
            }

            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to generate "${text}":`, error.message);
            return false;
        }
    }

    /**
     * Preload audio for popular words
     * @param {Object} options - { maxWords, dryRun }
     */
    async preload(options = {}) {
        const {
            maxWords = 500,
            dryRun = false
        } = options;

        this.logger.info('🚀 Starting audio preload job...');
        this.logger.info(`   Max words: ${maxWords}`);
        this.logger.info(`   Dry run: ${dryRun}`);

        if (!this.ttsClient) {
            this.logger.error('❌ TTS client not configured. Cannot preload.');
            return { success: false, error: 'TTS not configured' };
        }

        // Get popular uncached words
        const words = await this.getMostPopularUncached(maxWords);

        if (words.length === 0) {
            this.logger.info('✅ All popular words already cached!');
            return { success: true, generated: 0, cached: 0, total: 0 };
        }

        this.logger.info(`📊 Found ${words.length} popular uncached words`);

        if (dryRun) {
            this.logger.info('\n📋 Words that would be cached:');
            words.slice(0, 10).forEach((w, i) => {
                this.logger.info(`   ${i + 1}. "${w.word}" (${w.language}) - used ${w.usage_count} times`);
            });
            if (words.length > 10) {
                this.logger.info(`   ... and ${words.length - 10} more`);
            }
            return { success: true, dryRun: true, total: words.length };
        }

        // Generate audio
        let generated = 0;
        let failed = 0;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];

            this.logger.info(`\n[${i + 1}/${words.length}] Processing "${word.word}" (${word.language})`);

            const success = await this.generateAndCache(word.word, word.language);
            if (success) {
                generated++;
            } else {
                failed++;
            }

            // Rate limiting: 1 request per second to avoid quota issues
            if (i < words.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        this.logger.info(`\n✅ Preload complete!`);
        this.logger.info(`   Generated: ${generated}`);
        this.logger.info(`   Failed: ${failed}`);
        this.logger.info(`   Total: ${words.length}`);

        return {
            success: true,
            generated,
            failed,
            total: words.length
        };
    }

    /**
     * Get estimated TTS cost for pending words
     */
    async estimateCost(maxWords = 500) {
        const words = await this.getMostPopularUncached(maxWords);

        // Average word length: ~15 characters
        // Google TTS pricing: $4 per 1M characters (Neural2/Wavenet)
        const avgCharsPerWord = 15;
        const totalChars = words.length * avgCharsPerWord;
        const costPer1MChars = 4.0;
        const estimatedCost = (totalChars / 1000000) * costPer1MChars;

        return {
            words: words.length,
            estimatedChars: totalChars,
            estimatedCostUSD: estimatedCost.toFixed(4),
            message: `${words.length} words × ~${avgCharsPerWord} chars = ${totalChars} chars ≈ $${estimatedCost.toFixed(4)}`
        };
    }
}

module.exports = AudioPreloader;
