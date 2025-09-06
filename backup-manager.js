class BackupManager {
    constructor() {
        this.backupKey = 'wordsLearningBackup';
        this.lastBackupKey = 'wordsLearningLastBackup';
        this.versionKey = 'wordsLearningVersion';
        // Use a stable version that doesn't change with each build
        this.currentVersion = 'v2.0-stable';
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
            console.log('📋 Backup data:', backup);

            if (!window.database || !window.database.db) {
                console.warn('⚠️ Database not available for restore');
                return false;
            }

            // Восстановить слова
            if (backup.words && backup.words.length > 0) {
                console.log(`📝 Restoring ${backup.words.length} words...`);
                await this.restoreWords(backup.words);
                console.log('✅ Words restored');
            } else {
                console.log('⚠️ No words in backup to restore');
            }

            // Восстановить прогресс
            if (backup.progress && backup.progress.length > 0) {
                console.log(`📈 Restoring ${backup.progress.length} progress entries...`);
                await this.restoreProgress(backup.progress);
                console.log('✅ Progress restored');
            } else {
                console.log('ℹ️ No progress data in backup to restore');
            }

            // Восстановить настройки пользователя
            if (backup.userSettings) {
                console.log('⚙️ Restoring user settings...');
                this.restoreUserSettings(backup.userSettings);
                console.log('✅ Settings restored');
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
        const hasBackup = localStorage.getItem(this.backupKey);
        
        // Всегда проверяем, есть ли слова в базе
        const wordsCount = await this.getCurrentWordsCount();
        
        // Если в базе нет слов, но есть резервная копия - предлагаем восстановление
        if (wordsCount === 0 && hasBackup) {
            console.log('🔍 No words found but backup exists - offering restore');
            console.log(`📊 Current words in DB: ${wordsCount}`);
            return true;
        }
        
        // Если есть и слова, и резервная копия, сравниваем количество
        if (wordsCount > 0 && hasBackup) {
            try {
                const backup = JSON.parse(hasBackup);
                const backupWordCount = backup.wordCount || 0;
                
                // Если в резервной копии значительно больше слов, предлагаем восстановление
                if (backupWordCount > wordsCount + 10) {
                    console.log('🔍 Backup has significantly more words - offering restore');
                    console.log(`📊 Current: ${wordsCount}, Backup: ${backupWordCount}`);
                    return true;
                }
            } catch (error) {
                console.warn('⚠️ Error parsing backup data:', error);
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

    // Аварийное восстановление - восстанавливать автоматически без подтверждения  
    async emergencyRestore() {
        const backupData = localStorage.getItem(this.backupKey);
        if (!backupData) {
            console.log('ℹ️ No backup available for emergency restore');
            return false;
        }

        const backup = JSON.parse(backupData);
        const wordCount = backup.wordCount || 0;
        
        console.log(`🚨 EMERGENCY RESTORE: Restoring ${wordCount} words automatically`);
        
        const success = await this.restoreFromBackup();
        if (success) {
            console.log('✅ Emergency restore successful');
            
            // Показать пользователю уведомление
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <h4 style="margin: 0 0 5px 0;">🔄 Данные восстановлены автоматически!</h4>
                    <p style="margin: 0; font-size: 14px;">Восстановлено ${wordCount} слов из резервной копии</p>
                    <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 5px; right: 8px; background: none; border: none; color: white; cursor: pointer;">✕</button>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Автоматически скрыть через 10 секунд
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 10000);
            
            // Обновить интерфейс
            if (window.router && window.router.navigateTo) {
                setTimeout(() => window.router.navigateTo('/'), 1000);
            }
            
            return true;
        } else {
            console.error('❌ Emergency restore failed');
            return false;
        }
    }

    // Автоматическое резервное копирование
    async autoBackup() {
        const lastBackup = localStorage.getItem(this.lastBackupKey);
        const now = Date.now();
        
        // Создавать резервную копию каждые 10 минут (более частые бэкапы)
        const backupInterval = 10 * 60 * 1000; // 10 минут
        
        if (!lastBackup || (now - parseInt(lastBackup)) > backupInterval) {
            const wordsCount = await this.getCurrentWordsCount();
            
            // Создавать резервную копию только если есть данные
            if (wordsCount > 0) {
                console.log(`🔄 Creating automatic backup (${wordsCount} words)`);
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
        // Сначала очистить существующие слова
        await new Promise((resolve, reject) => {
            const clearTransaction = window.database.db.transaction(['words'], 'readwrite');
            const clearStore = clearTransaction.objectStore('words');
            const clearRequest = clearStore.clear();
            
            clearTransaction.oncomplete = () => resolve();
            clearTransaction.onerror = () => reject(clearTransaction.error);
        });
        
        // Затем добавить слова из резервной копии
        return new Promise((resolve, reject) => {
            const addTransaction = window.database.db.transaction(['words'], 'readwrite');
            const addStore = addTransaction.objectStore('words');
            
            for (const word of words) {
                addStore.put(word);
            }
            
            addTransaction.oncomplete = () => resolve();
            addTransaction.onerror = () => reject(addTransaction.error);
        });
    }

    async restoreProgress(progressData) {
        // Сначала очистить существующий прогресс
        await new Promise((resolve, reject) => {
            const clearTransaction = window.database.db.transaction(['progress'], 'readwrite');
            const clearStore = clearTransaction.objectStore('progress');
            const clearRequest = clearStore.clear();
            
            clearTransaction.oncomplete = () => resolve();
            clearTransaction.onerror = () => reject(clearTransaction.error);
        });
        
        // Затем добавить прогресс из резервной копии
        return new Promise((resolve, reject) => {
            const addTransaction = window.database.db.transaction(['progress'], 'readwrite');
            const addStore = addTransaction.objectStore('progress');
            
            for (const progress of progressData) {
                addStore.put(progress);
            }
            
            addTransaction.oncomplete = () => resolve();
            addTransaction.onerror = () => reject(addTransaction.error);
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