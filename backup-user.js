// Скрипт для создания бекапа пользователя в БД
// Использование: node backup-user.js <user_id>

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const USER_ID = process.argv[2] || 5;

async function createBackupTables() {
    // Создаём таблицу для хранения метаданных бекапов
    await db.query(`
        CREATE TABLE IF NOT EXISTS user_backups (
            id SERIAL PRIMARY KEY,
            original_user_id INTEGER NOT NULL,
            backup_name VARCHAR(255),
            backup_data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
        )
    `);
    console.log('✓ Таблица user_backups создана/существует');
}

async function backupUser(userId) {
    console.log(`\n🔄 Создание бекапа пользователя ${userId}...\n`);

    const backupData = {};

    // 1. Основные данные пользователя
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
        throw new Error(`Пользователь с ID ${userId} не найден`);
    }
    backupData.users = userResult.rows[0];
    console.log(`✓ Пользователь: ${backupData.users.name} (${backupData.users.email})`);

    // 2. Статистика пользователя
    const statsResult = await db.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
    backupData.user_stats = statsResult.rows[0] || null;
    console.log(`✓ Статистика: ${statsResult.rows.length > 0 ? 'найдена' : 'отсутствует'}`);

    // 3. Профиль пользователя
    const profileResult = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    backupData.user_profiles = profileResult.rows[0] || null;
    console.log(`✓ Профиль: ${profileResult.rows.length > 0 ? 'найден' : 'отсутствует'}`);

    // 4. Языковые пары
    const langPairsResult = await db.query('SELECT * FROM language_pairs WHERE user_id = $1', [userId]);
    backupData.language_pairs = langPairsResult.rows;
    console.log(`✓ Языковые пары: ${langPairsResult.rows.length} шт.`);

    // 5. Слова пользователя
    const wordsResult = await db.query('SELECT * FROM words WHERE user_id = $1', [userId]);
    backupData.words = wordsResult.rows;
    console.log(`✓ Слова: ${wordsResult.rows.length} шт.`);

    // 6. SRS данные для слов
    const srsResult = await db.query(`
        SELECT wsd.* FROM word_srs_data wsd
        JOIN words w ON wsd.word_id = w.id
        WHERE w.user_id = $1
    `, [userId]);
    backupData.word_srs_data = srsResult.rows;
    console.log(`✓ SRS данные: ${srsResult.rows.length} записей`);

    // 7. Прогресс изучения слов
    const progressResult = await db.query(`
        SELECT wlp.* FROM word_learning_progress wlp
        JOIN words w ON wlp.word_id = w.id
        WHERE w.user_id = $1
    `, [userId]);
    backupData.word_learning_progress = progressResult.rows;
    console.log(`✓ Прогресс изучения: ${progressResult.rows.length} записей`);

    // 8. Достижения пользователя
    const achievementsResult = await db.query('SELECT * FROM user_achievements WHERE user_id = $1', [userId]);
    backupData.user_achievements = achievementsResult.rows;
    console.log(`✓ Достижения: ${achievementsResult.rows.length} шт.`);

    // 9. Бейджи пользователя
    const badgesResult = await db.query('SELECT * FROM user_badges WHERE user_id = $1', [userId]);
    backupData.user_badges = badgesResult.rows;
    console.log(`✓ Бейджи: ${badgesResult.rows.length} шт.`);

    // 10. История XP
    const xpHistoryResult = await db.query('SELECT * FROM xp_history WHERE user_id = $1', [userId]);
    backupData.xp_history = xpHistoryResult.rows;
    console.log(`✓ История XP: ${xpHistoryResult.rows.length} записей`);

    // 11. XP лог
    const xpLogResult = await db.query('SELECT * FROM xp_log WHERE user_id = $1', [userId]);
    backupData.xp_log = xpLogResult.rows;
    console.log(`✓ XP лог: ${xpLogResult.rows.length} записей`);

    // 12. Ежедневная активность
    const dailyActivityResult = await db.query('SELECT * FROM daily_activity WHERE user_id = $1', [userId]);
    backupData.daily_activity = dailyActivityResult.rows;
    console.log(`✓ Ежедневная активность: ${dailyActivityResult.rows.length} записей`);

    // 13. Данные о лиге
    const leagueResult = await db.query('SELECT * FROM user_leagues WHERE user_id = $1', [userId]);
    backupData.user_leagues = leagueResult.rows[0] || null;
    console.log(`✓ Лига: ${leagueResult.rows.length > 0 ? 'найдена' : 'отсутствует'}`);

    // 14. Транзакции валюты
    const currencyResult = await db.query('SELECT * FROM currency_transactions WHERE user_id = $1', [userId]);
    backupData.currency_transactions = currencyResult.rows;
    console.log(`✓ Транзакции валюты: ${currencyResult.rows.length} записей`);

    // 15. Транзакции монет
    const coinResult = await db.query('SELECT * FROM coin_transactions WHERE user_id = $1', [userId]);
    backupData.coin_transactions = coinResult.rows;
    console.log(`✓ Транзакции монет: ${coinResult.rows.length} записей`);

    // 16. Покупки пользователя
    const purchasesResult = await db.query('SELECT * FROM user_purchases WHERE user_id = $1', [userId]);
    backupData.user_purchases = purchasesResult.rows;
    console.log(`✓ Покупки: ${purchasesResult.rows.length} шт.`);

    // 17. Инвентарь
    const inventoryResult = await db.query('SELECT * FROM user_inventory WHERE user_id = $1', [userId]);
    backupData.user_inventory = inventoryResult.rows;
    console.log(`✓ Инвентарь: ${inventoryResult.rows.length} предметов`);

    // 18. Друзья
    const friendsResult = await db.query('SELECT * FROM friendships WHERE user_id = $1 OR friend_id = $1', [userId]);
    backupData.friendships = friendsResult.rows;
    console.log(`✓ Друзья: ${friendsResult.rows.length} записей`);

    // 19. Настройки пользователя
    const settingsResult = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    backupData.user_settings = settingsResult.rows[0] || null;
    console.log(`✓ Настройки: ${settingsResult.rows.length > 0 ? 'найдены' : 'отсутствуют'}`);

    // 20. Профиль обучения
    const learningProfileResult = await db.query('SELECT * FROM user_learning_profile WHERE user_id = $1', [userId]);
    backupData.user_learning_profile = learningProfileResult.rows[0] || null;
    console.log(`✓ Профиль обучения: ${learningProfileResult.rows.length > 0 ? 'найден' : 'отсутствует'}`);

    // 21. Milestone пользователя
    const milestonesResult = await db.query('SELECT * FROM user_milestones WHERE user_id = $1', [userId]);
    backupData.user_milestones = milestonesResult.rows;
    console.log(`✓ Milestones: ${milestonesResult.rows.length} записей`);

    // 22. Дуэли
    const duelsResult = await db.query('SELECT * FROM duels WHERE challenger_id = $1 OR opponent_id = $1', [userId]);
    backupData.duels = duelsResult.rows;
    console.log(`✓ Дуэли: ${duelsResult.rows.length} записей`);

    // 23. Участие в турнирах
    const tournamentsResult = await db.query('SELECT * FROM tournament_participants WHERE user_id = $1', [userId]);
    backupData.tournament_participants = tournamentsResult.rows;
    console.log(`✓ Участие в турнирах: ${tournamentsResult.rows.length} записей`);

    // 24. Ежедневные челленджи
    const challengesResult = await db.query('SELECT * FROM user_daily_challenges WHERE user_id = $1', [userId]);
    backupData.user_daily_challenges = challengesResult.rows;
    console.log(`✓ Ежедневные челленджи: ${challengesResult.rows.length} записей`);

    // Сохраняем бекап в БД
    const backupName = `backup_user_${userId}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const insertResult = await db.query(`
        INSERT INTO user_backups (original_user_id, backup_name, backup_data, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
    `, [userId, backupName, JSON.stringify(backupData), `Полный бекап пользователя ${userId}`]);

    console.log(`\n✅ Бекап создан успешно!`);
    console.log(`   ID бекапа: ${insertResult.rows[0].id}`);
    console.log(`   Имя: ${backupName}`);
    console.log(`   Создан: ${insertResult.rows[0].created_at}`);

    return insertResult.rows[0].id;
}

async function main() {
    try {
        await createBackupTables();
        const backupId = await backupUser(USER_ID);

        console.log(`\n📋 Для восстановления используйте:`);
        console.log(`   node restore-user-backup.js ${backupId}`);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

main();
