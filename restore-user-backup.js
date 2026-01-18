// Скрипт для восстановления пользователя из бекапа
// Использование: node restore-user-backup.js <backup_id>

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const BACKUP_ID = process.argv[2];

if (!BACKUP_ID) {
    console.error('❌ Укажите ID бекапа: node restore-user-backup.js <backup_id>');
    console.log('\nДоступные бекапы:');
    db.query('SELECT id, original_user_id, backup_name, created_at, notes FROM user_backups ORDER BY created_at DESC')
        .then(result => {
            result.rows.forEach(row => {
                console.log(`  ID: ${row.id} | User: ${row.original_user_id} | ${row.backup_name} | ${row.created_at}`);
            });
            db.end();
        });
} else {
    restoreFromBackup(BACKUP_ID);
}

async function restoreFromBackup(backupId) {
    const client = await db.connect();

    try {
        // Получаем бекап
        const backupResult = await client.query('SELECT * FROM user_backups WHERE id = $1', [backupId]);
        if (backupResult.rows.length === 0) {
            throw new Error(`Бекап с ID ${backupId} не найден`);
        }

        const backup = backupResult.rows[0];
        const data = typeof backup.backup_data === 'string'
            ? JSON.parse(backup.backup_data)
            : backup.backup_data;
        const userId = backup.original_user_id;

        console.log(`\n🔄 Восстановление пользователя ${userId} из бекапа ${backup.backup_name}...\n`);
        console.log(`   Дата создания бекапа: ${backup.created_at}`);
        console.log(`   Примечание: ${backup.notes}\n`);

        await client.query('BEGIN');

        // 1. Удаляем текущие данные пользователя (каскадно)
        console.log('🗑️  Удаление текущих данных...');

        // Удаляем SRS данные для слов пользователя
        await client.query(`
            DELETE FROM word_srs_data WHERE word_id IN (SELECT id FROM words WHERE user_id = $1)
        `, [userId]);

        // Удаляем прогресс изучения для слов пользователя
        await client.query(`
            DELETE FROM word_learning_progress WHERE word_id IN (SELECT id FROM words WHERE user_id = $1)
        `, [userId]);

        // Удаляем слова
        await client.query('DELETE FROM words WHERE user_id = $1', [userId]);

        // Удаляем языковые пары
        await client.query('DELETE FROM language_pairs WHERE user_id = $1', [userId]);

        // Удаляем статистику
        await client.query('DELETE FROM user_stats WHERE user_id = $1', [userId]);

        // Удаляем профиль
        await client.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);

        // Удаляем достижения
        await client.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);

        // Удаляем бейджи
        await client.query('DELETE FROM user_badges WHERE user_id = $1', [userId]);

        // Удаляем историю XP
        await client.query('DELETE FROM xp_history WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM xp_log WHERE user_id = $1', [userId]);

        // Удаляем ежедневную активность
        await client.query('DELETE FROM daily_activity WHERE user_id = $1', [userId]);

        // Удаляем лигу
        await client.query('DELETE FROM user_leagues WHERE user_id = $1', [userId]);

        // Удаляем транзакции
        await client.query('DELETE FROM currency_transactions WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM coin_transactions WHERE user_id = $1', [userId]);

        // Удаляем покупки и инвентарь
        await client.query('DELETE FROM user_purchases WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM user_inventory WHERE user_id = $1', [userId]);

        // Удаляем настройки
        await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);

        // Удаляем профиль обучения
        await client.query('DELETE FROM user_learning_profile WHERE user_id = $1', [userId]);

        // Удаляем milestones
        await client.query('DELETE FROM user_milestones WHERE user_id = $1', [userId]);

        // Удаляем челленджи
        await client.query('DELETE FROM user_daily_challenges WHERE user_id = $1', [userId]);

        console.log('✓ Текущие данные удалены');

        // 2. Восстанавливаем данные из бекапа
        console.log('\n📥 Восстановление данных из бекапа...');

        // Обновляем основные данные пользователя
        if (data.users) {
            const u = data.users;
            await client.query(`
                UPDATE users SET
                    name = $2, email = $3, password = $4, provider = $5,
                    picture = $6, google_id = $7, apple_id = $8,
                    is_beta_tester = $9, username = $10, bio = $11,
                    avatar_url = $12, is_public = $13, country = $14, city = $15
                WHERE id = $1
            `, [userId, u.name, u.email, u.password, u.provider, u.picture,
                u.google_id, u.apple_id, u.is_beta_tester, u.username, u.bio,
                u.avatar_url, u.is_public, u.country, u.city]);
            console.log('✓ Пользователь обновлён');
        }

        // Восстанавливаем статистику
        if (data.user_stats) {
            const s = data.user_stats;
            await client.query(`
                INSERT INTO user_stats (user_id, total_xp, level, current_streak, longest_streak,
                    total_words_learned, total_quizzes_completed, coins, gems, coins_balance)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [userId, s.total_xp, s.level, s.current_streak, s.longest_streak,
                s.total_words_learned, s.total_quizzes_completed, s.coins, s.gems, s.coins_balance]);
            console.log('✓ Статистика восстановлена');
        }

        // Восстанавливаем профиль
        if (data.user_profiles) {
            const p = data.user_profiles;
            await client.query(`
                INSERT INTO user_profiles (user_id, showcase_achievements, favorite_languages,
                    study_goal, daily_goal_minutes, timezone, language_level, profile_views)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [userId, p.showcase_achievements, p.favorite_languages, p.study_goal,
                p.daily_goal_minutes, p.timezone, p.language_level, p.profile_views]);
            console.log('✓ Профиль восстановлен');
        }

        // Восстанавливаем языковые пары с маппингом старых ID на новые
        const langPairIdMap = {};
        if (data.language_pairs && data.language_pairs.length > 0) {
            for (const lp of data.language_pairs) {
                const result = await client.query(`
                    INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active, lesson_size)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `, [userId, lp.name, lp.from_lang, lp.to_lang, lp.is_active, lp.lesson_size]);
                langPairIdMap[lp.id] = result.rows[0].id;
            }
            console.log(`✓ Языковые пары восстановлены: ${data.language_pairs.length} шт.`);
        }

        // Восстанавливаем слова с маппингом ID
        const wordIdMap = {};
        if (data.words && data.words.length > 0) {
            for (const w of data.words) {
                const newLangPairId = langPairIdMap[w.language_pair_id] || w.language_pair_id;
                const result = await client.query(`
                    INSERT INTO words (user_id, language_pair_id, word, translation, example,
                        example_translation, status, correct_count, incorrect_count, last_reviewed)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id
                `, [userId, newLangPairId, w.word, w.translation, w.example,
                    w.example_translation, w.status, w.correct_count, w.incorrect_count, w.last_reviewed]);
                wordIdMap[w.id] = result.rows[0].id;
            }
            console.log(`✓ Слова восстановлены: ${data.words.length} шт.`);
        }

        // Восстанавливаем SRS данные
        if (data.word_srs_data && data.word_srs_data.length > 0) {
            for (const srs of data.word_srs_data) {
                const newWordId = wordIdMap[srs.word_id];
                if (newWordId) {
                    await client.query(`
                        INSERT INTO word_srs_data (word_id, ease_factor, interval_days, repetitions,
                            next_review, last_review, learning_step, graduating_interval)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [newWordId, srs.ease_factor, srs.interval_days, srs.repetitions,
                        srs.next_review, srs.last_review, srs.learning_step, srs.graduating_interval]);
                }
            }
            console.log(`✓ SRS данные восстановлены: ${data.word_srs_data.length} записей`);
        }

        // Восстанавливаем прогресс изучения
        if (data.word_learning_progress && data.word_learning_progress.length > 0) {
            for (const wlp of data.word_learning_progress) {
                const newWordId = wordIdMap[wlp.word_id];
                if (newWordId) {
                    await client.query(`
                        INSERT INTO word_learning_progress (word_id, phase, phase_progress,
                            total_correct, total_incorrect, last_phase_change)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [newWordId, wlp.phase, wlp.phase_progress, wlp.total_correct,
                        wlp.total_incorrect, wlp.last_phase_change]);
                }
            }
            console.log(`✓ Прогресс изучения восстановлен: ${data.word_learning_progress.length} записей`);
        }

        // Восстанавливаем достижения
        if (data.user_achievements && data.user_achievements.length > 0) {
            for (const a of data.user_achievements) {
                await client.query(`
                    INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, progress)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                `, [userId, a.achievement_id, a.unlocked_at, a.progress]);
            }
            console.log(`✓ Достижения восстановлены: ${data.user_achievements.length} шт.`);
        }

        // Восстанавливаем бейджи
        if (data.user_badges && data.user_badges.length > 0) {
            for (const b of data.user_badges) {
                await client.query(`
                    INSERT INTO user_badges (user_id, badge_id, earned_at)
                    VALUES ($1, $2, $3)
                    ON CONFLICT DO NOTHING
                `, [userId, b.badge_id, b.earned_at]);
            }
            console.log(`✓ Бейджи восстановлены: ${data.user_badges.length} шт.`);
        }

        // Восстанавливаем лигу
        if (data.user_leagues) {
            const l = data.user_leagues;
            await client.query(`
                INSERT INTO user_leagues (user_id, tier_id, weekly_xp, rank_position, joined_at)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, l.tier_id, l.weekly_xp, l.rank_position, l.joined_at]);
            console.log('✓ Лига восстановлена');
        }

        // Восстанавливаем настройки
        if (data.user_settings) {
            const s = data.user_settings;
            await client.query(`
                INSERT INTO user_settings (user_id, theme, sound_enabled, notifications_enabled)
                VALUES ($1, $2, $3, $4)
            `, [userId, s.theme, s.sound_enabled, s.notifications_enabled]);
            console.log('✓ Настройки восстановлены');
        }

        // Восстанавливаем профиль обучения
        if (data.user_learning_profile) {
            const p = data.user_learning_profile;
            await client.query(`
                INSERT INTO user_learning_profile (user_id, preferred_quiz_types, learning_speed,
                    best_time_of_day, average_session_duration)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, p.preferred_quiz_types, p.learning_speed,
                p.best_time_of_day, p.average_session_duration]);
            console.log('✓ Профиль обучения восстановлен');
        }

        await client.query('COMMIT');

        console.log(`\n✅ Пользователь ${userId} успешно восстановлен из бекапа!`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка при восстановлении:', error.message);
        throw error;
    } finally {
        client.release();
        await db.end();
    }
}
