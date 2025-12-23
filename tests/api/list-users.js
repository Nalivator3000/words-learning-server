#!/usr/bin/env node
/**
 * List all users from the database
 */

const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listUsers() {
    const client = await pool.connect();

    try {
        console.log('🔌 Connected to Railway PostgreSQL\n');

        const result = await client.query(`
            SELECT
                u.id,
                u.name,
                u.email,
                u.provider,
                u.createdat,
                COUNT(w.id) as word_count
            FROM users u
            LEFT JOIN words w ON u.id = w.user_id
            GROUP BY u.id, u.name, u.email, u.provider, u.createdat
            ORDER BY u.createdat DESC
        `);

        console.log('📊 ВСЕ ПОЛЬЗОВАТЕЛИ:\n');
        console.log('='.repeat(100));

        result.rows.forEach((user, i) => {
            console.log(`${i + 1}. ID: ${user.id}`);
            console.log(`   Имя: ${user.name || 'N/A'}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Provider: ${user.provider}`);
            console.log(`   Слов: ${user.word_count}`);
            console.log(`   Создан: ${user.createdat ? new Date(user.createdat).toLocaleString('ru-RU') : 'N/A'}`);
            console.log('');
        });

        console.log('='.repeat(100));
        console.log(`\nВсего пользователей: ${result.rows.length}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

listUsers().catch(console.error);
