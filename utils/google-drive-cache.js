const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GoogleDriveCache {
    constructor() {
        this.drive = null;
        this.folderId = null;
        this.initialized = false;
        this.fileCache = new Map(); // Cache folder listing to reduce API calls
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
            const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS_JSON;
            const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

            if (!credentials || !folderId) {
                console.warn('⚠️ Google Drive cache not configured. Using local cache only.');
                console.warn('   Set GOOGLE_DRIVE_CREDENTIALS_JSON and GOOGLE_DRIVE_FOLDER_ID to enable.');
                return false;
            }

            const auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(credentials),
                scopes: ['https://www.googleapis.com/auth/drive.file'],
            });

            this.drive = google.drive({ version: 'v3', auth });
            this.folderId = folderId;

            // Test connection by listing folder
            await this.drive.files.list({
                q: `'${this.folderId}' in parents and trashed=false`,
                fields: 'files(id, name)',
                pageSize: 1,
            });

            console.log('✅ Google Drive cache initialized successfully');
            this.initialized = true;
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Google Drive cache:', error.message);
            console.warn('   Falling back to local cache only');
            return false;
        }
    }

    async getFile(cacheKey, lang) {
        if (!this.initialized) {
            return null;
        }

        try {
            const fileName = `${cacheKey}-${lang}.mp3`;

            // Check in-memory cache first
            if (this.fileCache.has(fileName)) {
                const fileId = this.fileCache.get(fileName);
                return await this._downloadFile(fileId);
            }

            // Search Google Drive
            const response = await this.drive.files.list({
                q: `name='${fileName}' and '${this.folderId}' in parents and trashed=false`,
                fields: 'files(id, name)',
                pageSize: 1,
            });

            if (response.data.files && response.data.files.length > 0) {
                const fileId = response.data.files[0].id;
                this.fileCache.set(fileName, fileId); // Cache for future requests
                return await this._downloadFile(fileId);
            }

            return null;

        } catch (error) {
            console.error('❌ Error fetching from Google Drive:', error.message);
            return null;
        }
    }

    async _downloadFile(fileId) {
        try {
            const response = await this.drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'arraybuffer' }
            );

            return Buffer.from(response.data);

        } catch (error) {
            console.error('❌ Error downloading from Google Drive:', error.message);
            return null;
        }
    }

    async uploadFile(cacheKey, lang, audioBuffer) {
        if (!this.initialized) {
            return false;
        }

        try {
            const fileName = `${cacheKey}-${lang}.mp3`;

            // Check if file already exists
            const existing = await this.drive.files.list({
                q: `name='${fileName}' and '${this.folderId}' in parents and trashed=false`,
                fields: 'files(id)',
                pageSize: 1,
            });

            if (existing.data.files && existing.data.files.length > 0) {
                console.log(`   📦 File already exists on Google Drive: ${fileName}`);
                return true;
            }

            // Upload new file
            const fileMetadata = {
                name: fileName,
                parents: [this.folderId],
            };

            const media = {
                mimeType: 'audio/mpeg',
                body: require('stream').Readable.from(audioBuffer),
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, name',
            });

            console.log(`   ☁️ Uploaded to Google Drive: ${fileName} (ID: ${response.data.id})`);
            this.fileCache.set(fileName, response.data.id);
            return true;

        } catch (error) {
            console.error('❌ Error uploading to Google Drive:', error.message);
            return false;
        }
    }

    async getCacheStats() {
        if (!this.initialized) {
            return { enabled: false };
        }

        try {
            const response = await this.drive.files.list({
                q: `'${this.folderId}' in parents and trashed=false`,
                fields: 'files(id, name, size)',
                pageSize: 1000,
            });

            const files = response.data.files || [];
            const totalSize = files.reduce((acc, file) => acc + parseInt(file.size || 0), 0);

            return {
                enabled: true,
                cached_items: files.length,
                total_size_bytes: totalSize,
                total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
            };

        } catch (error) {
            console.error('❌ Error getting Drive stats:', error.message);
            return { enabled: false, error: error.message };
        }
    }

    async clearCache() {
        if (!this.initialized) {
            return { success: false, error: 'Google Drive not initialized' };
        }

        try {
            const response = await this.drive.files.list({
                q: `'${this.folderId}' in parents and trashed=false`,
                fields: 'files(id, name)',
                pageSize: 1000,
            });

            const files = response.data.files || [];
            let deleted = 0;

            for (const file of files) {
                try {
                    await this.drive.files.delete({ fileId: file.id });
                    deleted++;
                } catch (err) {
                    console.error(`Failed to delete ${file.name}:`, err.message);
                }
            }

            this.fileCache.clear();

            return {
                success: true,
                deleted_items: deleted,
            };

        } catch (error) {
            console.error('❌ Error clearing Drive cache:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Singleton instance
const googleDriveCache = new GoogleDriveCache();

module.exports = googleDriveCache;
