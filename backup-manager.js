class BackupManager {
    constructor() {
        this.backupKey = 'wordsLearningBackup';
        this.lastBackupKey = 'wordsLearningLastBackup';
        this.versionKey = 'wordsLearningVersion';
        this.currentVersion = '2025.01.09-20:15';
    }

    // Создать резервную копию всех данных
    async createBackup() {
        if (!window.database || !window.database.db) {
            console.warn('⚠️ Database not available for backup');
            return false;
        }

        try {
            console.log('💾 Creating backup...');
            
            // Получить все слова
            const words = await this.getAllWordsFromDB();
            
            // Получить прогресс пользователя
            const progress = await this.getAllProgressFromDB();
            
            // Получить настройки пользователя
            const userSettings = this.getUserSettings();
            
            const backupData = {
                version: this.currentVersion,
                timestamp: Date.now(),
                words: words,
                progress: progress,
                userSettings: userSettings,
                wordCount: words.length
            };

            // Сохранить в localStorage
            localStorage.setItem(this.backupKey, JSON.stringify(backupData));
            localStorage.setItem(this.lastBackupKey, Date.now().toString());
            
            console.log(`✅ Backup created: ${words.length} words saved`);
            return true;
        } catch (error) {
            console.error('❌ Backup creation failed:', error);
            return false;
        }
    }

    // Восстановить данные из резервной копии
    async restoreFromBackup() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (!backupData) {
                console.log('ℹ️ No backup found');
                return false;
            }

            const backup = JSON.parse(backupData);
            console.log(`🔄 Restoring backup from ${new Date(backup.timestamp).toLocaleString()}`);
            console.log(`📊 Backup contains ${backup.wordCount || 0} words`);

            if (!window.database || !window.database.db) {
                console.warn('⚠️ Database not available for restore');
                return false;
            }

            // Восстановить слова
            if (backup.words && backup.words.length > 0) {
                await this.restoreWords(backup.words);
            }

            // Восстановить прогресс
            if (backup.progress && backup.progress.length > 0) {
                await this.restoreProgress(backup.progress);
            }

            // Восстановить настройки пользователя
            if (backup.userSettings) {
                this.restoreUserSettings(backup.userSettings);
            }

            console.log(`✅ Restore completed: ${backup.words?.length || 0} words restored`);
            return true;
        } catch (error) {
            console.error('❌ Restore failed:', error);
            return false;
        }
    }

    // Проверить, нужно ли восстановление после обновления
    async checkForRestoreNeeded() {
        const lastVersion = localStorage.getItem(this.versionKey);
        const hasBackup = localStorage.getItem(this.backupKey);
        
        // Если это первый запуск или версия изменилась
        if (!lastVersion || lastVersion !== this.currentVersion) {
            localStorage.setItem(this.versionKey, this.currentVersion);
            
            if (hasBackup) {
                const wordsCount = await this.getCurrentWordsCount();
                
                // Если в базе нет слов, но есть резервная копия
                if (wordsCount === 0) {
                    console.log('🔍 No words found but backup exists - offering restore');
                    return true;
                }
            }
        }
        
        return false;
    }

    // Показать пользователю предложение восстановить данные
    async offerRestore() {
        const backupData = localStorage.getItem(this.backupKey);
        if (!backupData) return false;

        const backup = JSON.parse(backupData);
        const backupDate = new Date(backup.timestamp).toLocaleString('ru-RU');
        const wordCount = backup.wordCount || 0;

        const message = `🔄 Найдена резервная копия данных от ${backupDate}\n\n` +
                       `📝 Содержит: ${wordCount} слов\n\n` +
                       `Восстановить данные?`;

        if (confirm(message)) {
            const success = await this.restoreFromBackup();
            if (success) {
                alert(`✅ Данные восстановлены!\n\n📝 Восстановлено слов: ${wordCount}`);
                
                // Обновить интерфейс
                if (window.router && window.router.navigateTo) {
                    window.router.navigateTo('/');
                }
                return true;
            } else {
                alert('❌ Ошибка при восстановлении данных');
            }
        }
        return false;
    }

    // Автоматическое резервное копирование
    async autoBackup() {
        const lastBackup = localStorage.getItem(this.lastBackupKey);
        const now = Date.now();
        
        // Создавать резервную копию каждые 6 часов
        const backupInterval = 6 * 60 * 60 * 1000; // 6 часов
        
        if (!lastBackup || (now - parseInt(lastBackup)) > backupInterval) {
            const wordsCount = await this.getCurrentWordsCount();
            
            // Создавать резервную копию только если есть данные
            if (wordsCount > 0) {
                await this.createBackup();
            }
        }
    }

    // Вспомогательные методы
    async getAllWordsFromDB() {
        return new Promise((resolve, reject) => {
            const transaction = window.database.db.transaction(['words'], 'readonly');
            const store = transaction.objectStore('words');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllProgressFromDB() {
        return new Promise((resolve, reject) => {
            const transaction = window.database.db.transaction(['progress'], 'readonly');
            const store = transaction.objectStore('progress');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async restoreWords(words) {
        const transaction = window.database.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        
        // Сначала очистить существующие слова
        await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        });
        
        // Затем добавить слова из резервной копии
        for (const word of words) {
            store.put(word);
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async restoreProgress(progressData) {
        const transaction = window.database.db.transaction(['progress'], 'readwrite');
        const store = transaction.objectStore('progress');
        
        // Сначала очистить существующий прогресс
        await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        });
        
        // Затем добавить прогресс из резервной копии
        for (const progress of progressData) {
            store.put(progress);
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    getUserSettings() {
        return {
            uiLanguage: localStorage.getItem('uiLanguage') || 'ru',
            lessonSize: localStorage.getItem('lessonSize') || '10',
            currentLanguagePair: localStorage.getItem('currentLanguagePair'),
            languagePairs: localStorage.getItem('languagePairs')
        };
    }

    restoreUserSettings(settings) {
        if (settings.uiLanguage) localStorage.setItem('uiLanguage', settings.uiLanguage);
        if (settings.lessonSize) localStorage.setItem('lessonSize', settings.lessonSize);
        if (settings.currentLanguagePair) localStorage.setItem('currentLanguagePair', settings.currentLanguagePair);
        if (settings.languagePairs) localStorage.setItem('languagePairs', settings.languagePairs);
    }

    async getCurrentWordsCount() {
        try {
            if (!window.database || !window.database.db) return 0;
            
            return new Promise((resolve) => {
                const transaction = window.database.db.transaction(['words'], 'readonly');
                const store = transaction.objectStore('words');
                const request = store.count();
                
                request.onsuccess = () => resolve(request.result || 0);
                request.onerror = () => resolve(0);
            });
        } catch (error) {
            return 0;
        }
    }

    // Получить информацию о резервной копии
    getBackupInfo() {
        const backupData = localStorage.getItem(this.backupKey);
        const lastBackup = localStorage.getItem(this.lastBackupKey);
        
        if (!backupData || !lastBackup) return null;
        
        const backup = JSON.parse(backupData);
        return {
            timestamp: parseInt(lastBackup),
            wordCount: backup.wordCount || 0,
            version: backup.version,
            date: new Date(parseInt(lastBackup)).toLocaleString('ru-RU')
        };
    }

    // Очистить резервные копии
    clearBackups() {
        localStorage.removeItem(this.backupKey);
        localStorage.removeItem(this.lastBackupKey);
        console.log('🗑️ Backups cleared');
    }
}

// Создать глобальный экземпляр
window.backupManager = new BackupManager();

console.log('💾 Backup Manager loaded');
console.log('💡 Available functions:');
console.log('   backupManager.createBackup() - Create manual backup');
console.log('   backupManager.restoreFromBackup() - Restore from backup');
console.log('   backupManager.getBackupInfo() - Get backup information');
console.log('   backupManager.clearBackups() - Clear all backups');