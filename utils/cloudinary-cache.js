const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

class CloudinaryCache {
    constructor() {
        this.initialized = false;
        this.folder = '';
        this.initPromise = null;
    }

    async init() {
        // Prevent multiple simultaneous initializations
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._init();
        return this.initPromise;
    }

    async _init() {
        try {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.CLOUDINARY_API_KEY;
            const apiSecret = process.env.CLOUDINARY_API_SECRET;
            this.folder = process.env.CLOUDINARY_FOLDER || 'tts-audio';

            if (!cloudName || !apiKey || !apiSecret) {
                console.warn('⚠️ Cloudinary cache not configured. Using local cache only.');
                console.warn('   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to enable.');
                return false;
            }

            // Configure Cloudinary
            cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true,
            });

            // Test connection by getting account info
            await cloudinary.api.ping();

            console.log('✅ Cloudinary cache initialized successfully');
            console.log(`   Folder: ${this.folder}`);
            this.initialized = true;
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Cloudinary cache:', error.message);
            console.warn('   Falling back to local cache only');
            return false;
        }
    }

    async getFile(cacheKey, lang) {
        if (!this.initialized) {
            return null;
        }

        try {
            const publicId = `${this.folder}/${cacheKey}-${lang}`;

            // Download file from Cloudinary (raw resource type for audio files)
            const url = cloudinary.url(publicId, {
                resource_type: 'raw',
                type: 'upload',
            });

            // Fetch the file
            const response = await fetch(url);
            if (!response.ok) {
                return null; // File doesn't exist
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);

        } catch (error) {
            // File not found or other error
            return null;
        }
    }

    async uploadFile(cacheKey, lang, audioBuffer) {
        if (!this.initialized) {
            return false;
        }

        try {
            const publicId = `${this.folder}/${cacheKey}-${lang}`;

            // Check if file already exists
            try {
                await cloudinary.api.resource(publicId, {
                    resource_type: 'raw',
                });
                console.log(`   📦 File already exists on Cloudinary: ${publicId}`);
                return true;
            } catch (checkError) {
                // File doesn't exist, proceed with upload
            }

            // Upload to Cloudinary (raw resource type for audio files)
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'raw', // Use 'raw' for audio files
                        public_id: publicId,
                        overwrite: false,
                    },
                    (error, result) => {
                        if (error) {
                            console.error('❌ Error uploading to Cloudinary:', error.message);
                            reject(error);
                        } else {
                            console.log(`   ☁️ Uploaded to Cloudinary: ${publicId}.mp3`);
                            console.log(`      URL: ${result.secure_url}`);
                            resolve(true);
                        }
                    }
                );

                // Write buffer to stream
                uploadStream.end(audioBuffer);
            });

        } catch (error) {
            console.error('❌ Error uploading to Cloudinary:', error.message);
            return false;
        }
    }

    async getCacheStats() {
        if (!this.initialized) {
            return { enabled: false };
        }

        try {
            // Get folder info
            const result = await cloudinary.api.resources({
                type: 'upload',
                resource_type: 'raw',
                prefix: this.folder,
                max_results: 500,
            });

            const files = result.resources || [];
            const totalSize = files.reduce((acc, file) => acc + (file.bytes || 0), 0);

            return {
                enabled: true,
                cached_items: files.length,
                total_size_bytes: totalSize,
                total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
            };

        } catch (error) {
            console.error('❌ Error getting Cloudinary stats:', error.message);
            return { enabled: false, error: error.message };
        }
    }

    async clearCache() {
        if (!this.initialized) {
            return { success: false, error: 'Cloudinary not initialized' };
        }

        try {
            // Get all resources in folder
            const result = await cloudinary.api.resources({
                type: 'upload',
                resource_type: 'raw',
                prefix: this.folder,
                max_results: 500,
            });

            const files = result.resources || [];
            let deleted = 0;

            // Delete each file
            for (const file of files) {
                try {
                    await cloudinary.uploader.destroy(file.public_id, {
                        resource_type: 'raw',
                    });
                    deleted++;
                } catch (err) {
                    console.error(`Failed to delete ${file.public_id}:`, err.message);
                }
            }

            console.log(`✅ Deleted ${deleted} files from Cloudinary`);
            return { success: true, deleted };

        } catch (error) {
            console.error('❌ Error clearing Cloudinary cache:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Singleton instance
const cloudinaryCache = new CloudinaryCache();

module.exports = cloudinaryCache;
