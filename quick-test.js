// Скрипт для быстрого создания тестовых данных разных статусов
// Выполните в консоли браузера (F12)

async function createTestData() {
    console.log('🔄 Создаем тестовые данные...');
    
    try {
        // Получаем все слова
        const words = await database.getAllWords();
        console.log(`Найдено слов: ${words.length}`);
        
        if (words.length < 6) {
            console.log('❌ Нужно минимум 6 слов. Импортируйте сначала test-words.csv');
            return;
        }
        
        // Делаем первые 2 слова изученными (learned)
        for (let i = 0; i < 2 && i < words.length; i++) {
            const word = words[i];
            word.status = 'learned';
            word.correctCount = 6;
            word.nextReview = null;
            word.lastStudied = new Date();
            
            const transaction = database.db.transaction(['words'], 'readwrite');
            const store = transaction.objectStore('words');
            await database.promisifyRequest(store.put(word));
            
            console.log(`✅ Слово "${word.word}" помечено как изученное`);
        }
        
        // Делаем следующие 2 слова в 7-дневном повторении
        for (let i = 2; i < 4 && i < words.length; i++) {
            const word = words[i];
            word.status = 'review_7';
            word.correctCount = 3;
            word.nextReview = new Date(Date.now() - 24 * 60 * 60 * 1000); // Вчера (просрочено)
            word.lastStudied = new Date();
            word.reviewAttempts = 0;
            
            const transaction = database.db.transaction(['words'], 'readwrite');
            const store = transaction.objectStore('words');
            await database.promisifyRequest(store.put(word));
            
            console.log(`🔄 Слово "${word.word}" в 7-дневном повторении`);
        }
        
        // Делаем следующие 2 слова в 30-дневном повторении
        for (let i = 4; i < 6 && i < words.length; i++) {
            const word = words[i];
            word.status = 'review_30';
            word.correctCount = 5;
            word.nextReview = new Date(Date.now() - 24 * 60 * 60 * 1000); // Вчера (просрочено)
            word.lastStudied = new Date();
            word.reviewAttempts = 0;
            
            const transaction = database.db.transaction(['words'], 'readwrite');
            const store = transaction.objectStore('words');
            await database.promisifyRequest(store.put(word));
            
            console.log(`📅 Слово "${word.word}" в 30-дневном повторении`);
        }
        
        console.log('🎉 Тестовые данные созданы!');
        console.log('📊 Обновите статистику - перейдите на главную страницу');
        
        // Обновляем статистику
        if (window.app && window.app.updateStats) {
            await window.app.updateStats();
            console.log('✅ Статистика обновлена');
        }
        
    } catch (error) {
        console.error('❌ Ошибка создания тестовых данных:', error);
    }
}

// Запускаем создание тестовых данных
createTestData();