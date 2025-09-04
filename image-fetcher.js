class ImageFetcher {
    constructor() {
        this.imageCache = new Map();
        this.apiEndpoints = {
            // Unsplash API (требует API ключ, но можно использовать Source API)
            unsplash: 'https://source.unsplash.com/300x200/?',
            // Pexels API (альтернатива)
            pexels: 'https://api.pexels.com/v1/search',
            // Pixabay API (бесплатная альтернатива)
            pixabay: 'https://pixabay.com/api/'
        };
        
        this.fallbackImages = {
            'noun': 'https://source.unsplash.com/300x200/?object',
            'verb': 'https://source.unsplash.com/300x200/?action',
            'adjective': 'https://source.unsplash.com/300x200/?concept',
            'default': 'https://source.unsplash.com/300x200/?abstract'
        };
    }

    // Основной метод для получения изображения для слова
    async fetchImageForWord(word, translation, example) {
        try {
            // Очистка слова от артиклей и скобок
            const cleanWord = this.cleanWord(word);
            const cleanTranslation = this.cleanWord(translation);
            
            // Проверяем кэш
            const cacheKey = `${cleanWord}_${cleanTranslation}`;
            if (this.imageCache.has(cacheKey)) {
                return this.imageCache.get(cacheKey);
            }

            console.log(`🖼️ Fetching image for: "${cleanWord}" (${cleanTranslation})`);
            
            // Пытаемся получить изображение разными способами
            let imageUrl = await this.tryUnsplashSource(cleanWord, cleanTranslation);
            
            if (!imageUrl) {
                imageUrl = await this.tryPixabayAPI(cleanWord, cleanTranslation);
            }
            
            if (!imageUrl) {
                imageUrl = this.getFallbackImage(word);
            }

            // Кэшируем результат
            this.imageCache.set(cacheKey, imageUrl);
            
            // Сохраняем в локальное хранилище
            await this.saveImageToStorage(cacheKey, imageUrl);
            
            return imageUrl;
            
        } catch (error) {
            console.error('Error fetching image:', error);
            return this.getFallbackImage(word);
        }
    }

    // Очистка слова от артиклей, скобок и лишних символов
    cleanWord(word) {
        if (!word) return '';
        
        return word
            .replace(/^(der|die|das|the|a|an)\s+/i, '') // убираем артикли
            .replace(/\([^)]*\)/g, '') // убираем скобки
            .replace(/["""'']/g, '') // убираем кавычки
            .replace(/[^\w\sа-яё]/gi, '') // оставляем только буквы и пробелы
            .trim()
            .toLowerCase();
    }

    // Получение изображения через Unsplash Source API (бесплатно, без ключа)
    async tryUnsplashSource(word, translation) {
        try {
            // Пробуем английское слово или перевод
            const searchTerms = [word, translation].filter(term => term && term.length > 2);
            
            for (const term of searchTerms) {
                const url = `${this.apiEndpoints.unsplash}${encodeURIComponent(term)}`;
                
                // Проверяем, доступно ли изображение
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`✅ Found Unsplash image for: ${term}`);
                    return url;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('Unsplash API error:', error);
            return null;
        }
    }

    // Получение изображения через Pixabay API (требует бесплатный ключ)
    async tryPixabayAPI(word, translation) {
        try {
            // Здесь нужен API ключ Pixabay (бесплатный)
            const API_KEY = '44863301-8a72c4c16c38075094c965d67'; // Демо ключ
            const searchTerms = [word, translation].filter(term => term && term.length > 2);
            
            for (const term of searchTerms) {
                const url = `${this.apiEndpoints.pixabay}?key=${API_KEY}&q=${encodeURIComponent(term)}&image_type=photo&category=all&min_width=300&min_height=200&per_page=5&safesearch=true`;
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data.hits && data.hits.length > 0) {
                        const image = data.hits[0];
                        console.log(`✅ Found Pixabay image for: ${term}`);
                        return image.webformatURL || image.previewURL;
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.warn('Pixabay API error:', error);
            return null;
        }
    }

    // Определение типа слова для fallback изображения
    getWordType(word) {
        if (!word) return 'default';
        
        const cleanWord = word.toLowerCase();
        
        // Немецкие глаголы
        if (cleanWord.endsWith('en') || cleanWord.endsWith('ern') || cleanWord.endsWith('eln')) {
            return 'verb';
        }
        
        // Немецкие существительные с артиклями
        if (word.match(/^(der|die|das)\s+/i)) {
            return 'noun';
        }
        
        // Русские глаголы
        if (cleanWord.endsWith('ать') || cleanWord.endsWith('ить') || cleanWord.endsWith('еть') || cleanWord.endsWith('ть')) {
            return 'verb';
        }
        
        return 'noun'; // По умолчанию существительное
    }

    // Получение fallback изображения
    getFallbackImage(word) {
        const wordType = this.getWordType(word);
        console.log(`🔄 Using fallback image for: ${word} (${wordType})`);
        return this.fallbackImages[wordType] || this.fallbackImages.default;
    }

    // Сохранение изображения в локальное хранилище
    async saveImageToStorage(key, imageUrl) {
        try {
            const imageCache = JSON.parse(localStorage.getItem('wordImages') || '{}');
            imageCache[key] = {
                url: imageUrl,
                timestamp: Date.now(),
                expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 дней
            };
            localStorage.setItem('wordImages', JSON.stringify(imageCache));
        } catch (error) {
            console.warn('Failed to save image to storage:', error);
        }
    }

    // Загрузка изображения из локального хранилища
    loadImageFromStorage(key) {
        try {
            const imageCache = JSON.parse(localStorage.getItem('wordImages') || '{}');
            const cached = imageCache[key];
            
            if (cached && cached.expires > Date.now()) {
                return cached.url;
            } else if (cached) {
                // Удаляем устаревшую запись
                delete imageCache[key];
                localStorage.setItem('wordImages', JSON.stringify(imageCache));
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to load image from storage:', error);
            return null;
        }
    }

    // Массовая загрузка изображений для списка слов
    async fetchImagesForWords(words, progressCallback) {
        const results = [];
        const total = words.length;
        let processed = 0;

        console.log(`🚀 Starting bulk image fetch for ${total} words`);
        
        for (const word of words) {
            try {
                const imageUrl = await this.fetchImageForWord(word.word, word.translation, word.example);
                results.push({
                    ...word,
                    imageUrl: imageUrl
                });
                
                processed++;
                if (progressCallback) {
                    progressCallback(processed, total, word.word);
                }
                
                // Небольшая пауза между запросами, чтобы не перегружать API
                await this.sleep(200);
                
            } catch (error) {
                console.error(`Failed to fetch image for word: ${word.word}`, error);
                results.push({
                    ...word,
                    imageUrl: this.getFallbackImage(word.word)
                });
            }
        }

        console.log(`✅ Completed bulk image fetch: ${results.length} words processed`);
        return results;
    }

    // Вспомогательная функция для паузы
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Очистка кэша изображений
    clearImageCache() {
        this.imageCache.clear();
        localStorage.removeItem('wordImages');
        console.log('🗑️ Image cache cleared');
    }

    // Получение статистики кэша
    getCacheStats() {
        const localCache = JSON.parse(localStorage.getItem('wordImages') || '{}');
        return {
            memoryCache: this.imageCache.size,
            localStorage: Object.keys(localCache).length,
            totalSize: JSON.stringify(localCache).length
        };
    }

    // Предварительная загрузка изображений для улучшения производительности
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
}

// Экспорт для использования в других модулях
window.ImageFetcher = ImageFetcher;