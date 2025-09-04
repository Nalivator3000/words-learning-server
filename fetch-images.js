// Скрипт для массовой загрузки изображений к словарю
class ImageBatchProcessor {
    constructor() {
        this.imageFetcher = new ImageFetcher();
        this.isProcessing = false;
        this.processedCount = 0;
        this.totalCount = 0;
    }

    // Главный метод для обработки всех слов в базе данных
    async processAllWords() {
        if (this.isProcessing) {
            console.log('⏳ Image processing already in progress...');
            return;
        }

        try {
            this.isProcessing = true;
            this.showProgressUI();

            console.log('🚀 Starting image batch processing...');
            
            // Получаем все слова из базы данных
            const words = await this.getAllWordsFromDatabase();
            console.log(`📚 Found ${words.length} words in database`);

            if (words.length === 0) {
                this.showMessage('Нет слов в базе данных для обработки');
                return;
            }

            this.totalCount = words.length;
            this.processedCount = 0;

            // Обрабатываем слова батчами для лучшей производительности
            const batchSize = 5;
            const batches = this.createBatches(words, batchSize);

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} words)`);
                
                await this.processBatch(batch);
                
                // Пауза между батчами
                await this.sleep(1000);
            }

            await this.saveImageDataToDatabase();
            this.showSuccessMessage();
            
        } catch (error) {
            console.error('❌ Error in batch processing:', error);
            this.showErrorMessage(error.message);
        } finally {
            this.isProcessing = false;
            this.hideProgressUI();
        }
    }

    // Получение всех слов из IndexedDB
    async getAllWordsFromDatabase() {
        return new Promise((resolve, reject) => {
            if (!window.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = db.transaction(['words'], 'readonly');
            const store = transaction.objectStore('words');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(new Error('Failed to fetch words from database'));
            };
        });
    }

    // Разделение слов на батчи
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    // Обработка одного батча слов
    async processBatch(words) {
        const promises = words.map(word => this.processWord(word));
        await Promise.allSettled(promises);
    }

    // Обработка одного слова
    async processWord(word) {
        try {
            // Проверяем, есть ли уже изображение
            if (word.imageUrl) {
                console.log(`⏩ Skipping ${word.word} (already has image)`);
                this.processedCount++;
                this.updateProgress();
                return;
            }

            // Получаем изображение
            const imageUrl = await this.imageFetcher.fetchImageForWord(
                word.word, 
                word.translation, 
                word.example
            );

            // Обновляем слово с новым URL изображения
            word.imageUrl = imageUrl;
            
            console.log(`✅ Processed: ${word.word} -> ${imageUrl}`);
            
            this.processedCount++;
            this.updateProgress();
            
        } catch (error) {
            console.error(`❌ Failed to process word: ${word.word}`, error);
            this.processedCount++;
            this.updateProgress();
        }
    }

    // Сохранение обновленных данных в базу
    async saveImageDataToDatabase() {
        console.log('💾 Saving updated word data to database...');
        
        const words = await this.getAllWordsFromDatabase();
        const transaction = db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        const promises = words.map(word => {
            return new Promise((resolve, reject) => {
                const request = store.put(word);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });

        await Promise.all(promises);
        console.log('✅ Database updated successfully');
    }

    // UI методы
    showProgressUI() {
        const progressHTML = `
            <div id="imageProcessingModal" style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    min-width: 400px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                ">
                    <h3 style="margin: 0 0 20px 0; color: #333;">🖼️ Загрузка изображений</h3>
                    <div id="progressBar" style="
                        width: 100%;
                        height: 20px;
                        background: #f0f0f0;
                        border-radius: 10px;
                        overflow: hidden;
                        margin: 20px 0;
                    ">
                        <div id="progressFill" style="
                            height: 100%;
                            background: linear-gradient(90deg, #4CAF50, #45a049);
                            width: 0%;
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <div id="progressText" style="color: #666; font-size: 14px;">
                        Подготовка...
                    </div>
                    <button id="cancelImageProcessing" style="
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: #ff4444;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Отменить</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', progressHTML);
        
        document.getElementById('cancelImageProcessing').addEventListener('click', () => {
            this.isProcessing = false;
            this.hideProgressUI();
        });
    }

    updateProgress() {
        const percentage = Math.round((this.processedCount / this.totalCount) * 100);
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `Обработано: ${this.processedCount} из ${this.totalCount} слов (${percentage}%)`;
        }
    }

    hideProgressUI() {
        const modal = document.getElementById('imageProcessingModal');
        if (modal) {
            modal.remove();
        }
    }

    showMessage(message) {
        alert(message);
    }

    showSuccessMessage() {
        this.showMessage(`✅ Успешно! Обработано ${this.processedCount} слов. Изображения загружены и сохранены в базе данных.`);
    }

    showErrorMessage(error) {
        this.showMessage(`❌ Ошибка при обработке изображений: ${error}`);
    }

    // Вспомогательная функция для паузы
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Метод для запуска из консоли разработчика
    async startProcessing() {
        console.log('🎯 Manual image processing started');
        await this.processAllWords();
    }

    // Статистика изображений
    async getImageStats() {
        const words = await this.getAllWordsFromDatabase();
        const withImages = words.filter(word => word.imageUrl).length;
        const withoutImages = words.length - withImages;
        
        const stats = {
            total: words.length,
            withImages,
            withoutImages,
            percentage: Math.round((withImages / words.length) * 100)
        };

        console.table(stats);
        return stats;
    }
}

// Глобальная переменная для доступа из консоли
window.imageBatchProcessor = new ImageBatchProcessor();

// Автоматический запуск при загрузке (опционально)
document.addEventListener('DOMContentLoaded', () => {
    console.log('🖼️ Image Batch Processor ready!');
    console.log('💡 Use imageBatchProcessor.startProcessing() to start');
    console.log('📊 Use imageBatchProcessor.getImageStats() for statistics');
});