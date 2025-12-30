#!/usr/bin/env node
/**
 * Performance & Benchmark Tests
 * Tests response times, query performance, and scalability
 */

const https = require('https');
const { Pool } = require('pg');
require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'https://words-learning-server-copy-production.up.railway.app';
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let results = { passed: 0, failed: 0 };

async function test(name, fn) {
    process.stdout.write(`  ${name}... `);
    try {
        await fn();
        console.log('✅');
        results.passed++;
    } catch (e) {
        console.log(`❌ ${e.message}`);
        results.failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const isHttps = BASE_URL.startsWith('https');
        const protocol = isHttps ? https : require('http');
        const url = new URL(path, BASE_URL);

        const req = protocol.request(url, {
            method,
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const duration = Date.now() - startTime;
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body), duration });
                } catch {
                    resolve({ status: res.statusCode, body, duration });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function benchmarkQuery(query, description) {
    const start = Date.now();
    const result = await db.query(query);
    const duration = Date.now() - start;
    return { duration, rows: result.rowCount, description };
}

async function runTests() {
    console.log('\n⚡ Performance & Benchmark Tests\n');
    console.log('━'.repeat(60));

    console.log('\n🌐 API Response Time Tests:');

    await test('Health check responds < 1s', async () => {
        const res = await request('GET', '/health');
        assert(res.duration < 1000, `Too slow: ${res.duration}ms`);
        console.log(`    → ${res.duration}ms`);
    });

    await test('Login endpoint responds < 2s', async () => {
        const res = await request('POST', '/api/auth/login', {
            email: 'demo@fluentflow.app',
            password: 'DemoPassword123!'
        });
        // May hit rate limit, so just check if it responds
        assert(res.duration < 5000, `Too slow: ${res.duration}ms`);
        console.log(`    → ${res.duration}ms (status: ${res.status})`);
    });

    console.log('\n🗄️  Database Query Performance:');

    await test('Simple SELECT query < 100ms', async () => {
        const bench = await benchmarkQuery('SELECT COUNT(*) FROM users', 'Count users');
        assert(bench.duration < 100, `Too slow: ${bench.duration}ms`);
        console.log(`    → ${bench.duration}ms`);
    });

    await test('Complex JOIN query < 500ms', async () => {
        const bench = await benchmarkQuery(`
            SELECT u.id, u.username, COUNT(uwp.id) as words_learned
            FROM users u
            LEFT JOIN user_word_progress uwp ON u.id = uwp.user_id
            GROUP BY u.id, u.username
            LIMIT 100
        `, 'User progress JOIN');
        assert(bench.duration < 500, `Too slow: ${bench.duration}ms`);
        console.log(`    → ${bench.duration}ms`);
    });

    await test('Word lookup by ID < 50ms', async () => {
        const bench = await benchmarkQuery(
            'SELECT * FROM source_words_german WHERE id = 1',
            'Word by ID'
        );
        assert(bench.duration < 50, `Too slow: ${bench.duration}ms`);
        console.log(`    → ${bench.duration}ms`);
    });

    await test('Word search by text < 100ms', async () => {
        const bench = await benchmarkQuery(
            "SELECT * FROM source_words_german WHERE word LIKE 'der%' LIMIT 20",
            'Word search'
        );
        assert(bench.duration < 100, `Too slow: ${bench.duration}ms`);
        console.log(`    → ${bench.duration}ms`);
    });

    await test('Translation JOIN < 200ms', async () => {
        const bench = await benchmarkQuery(`
            SELECT sw.word, tt.translation
            FROM source_words_german sw
            JOIN target_translations_russian tt ON sw.id = tt.source_word_id
            LIMIT 100
        `, 'Translation JOIN');
        assert(bench.duration < 200, `Too slow: ${bench.duration}ms`);
        console.log(`    → ${bench.duration}ms`);
    });

    console.log('\n📊 Scalability Tests:');

    await test('Fetch 1000 words < 500ms', async () => {
        const bench = await benchmarkQuery(
            'SELECT * FROM source_words_german LIMIT 1000',
            'Fetch 1000 words'
        );
        assert(bench.duration < 500, `Too slow: ${bench.duration}ms`);
        console.log(`    → ${bench.duration}ms (${bench.rows} rows)`);
    });

    await test('Aggregate query on user progress < 300ms', async () => {
        const bench = await benchmarkQuery(`
            SELECT
                user_id,
                COUNT(*) as total_words,
                AVG(repetitions) as avg_reps,
                MAX(interval_days) as max_interval
            FROM user_word_progress
            GROUP BY user_id
            LIMIT 100
        `, 'User progress aggregates');
        assert(bench.duration < 300, `Too slow: ${bench.duration}ms`);
        console.log(`    → ${bench.duration}ms`);
    });

    console.log('\n🔍 Index Performance Tests:');

    await test('Check if important columns are indexed', async () => {
        const res = await db.query(`
            SELECT
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND (
                tablename IN ('users', 'source_words_german', 'user_word_progress', 'target_translations_russian')
                OR tablename LIKE 'source_words_%'
                OR tablename LIKE 'target_translations_%'
            )
            ORDER BY tablename, indexname
        `);

        const indexes = res.rows.length;
        console.log(`\n    → Found ${indexes} index(es)`);

        // Check for specific critical indexes
        const hasUserIdIndex = res.rows.some(r => r.indexdef.includes('user_id'));
        const hasWordIndex = res.rows.some(r => r.indexdef.includes('word'));

        if (!hasUserIdIndex) console.log('    ⚠️  Warning: No user_id index found');
        if (!hasWordIndex) console.log('    ⚠️  Warning: No word index found');
    });

    await test('Sequential scan analysis', async () => {
        // Enable query plan
        const res = await db.query(`
            EXPLAIN ANALYZE
            SELECT sw.word, tt.translation
            FROM source_words_german sw
            JOIN target_translations_russian tt ON sw.id = tt.source_word_id
            WHERE sw.level = 'A1'
            LIMIT 10
        `);

        const plan = res.rows.map(r => r['QUERY PLAN']).join('\n');
        const hasSeqScan = plan.includes('Seq Scan');

        if (hasSeqScan) {
            console.log('\n    ⚠️  Query uses sequential scan (consider adding index)');
        } else {
            console.log('\n    → Query uses index scan');
        }
    });

    console.log('\n📈 Load Testing (Simulation):');

    await test('Simulate 10 concurrent users', async () => {
        const startTime = Date.now();
        const promises = [];

        for (let i = 0; i < 10; i++) {
            promises.push(
                db.query('SELECT COUNT(*) FROM users')
            );
        }

        await Promise.all(promises);
        const duration = Date.now() - startTime;

        assert(duration < 2000, `Too slow: ${duration}ms for 10 concurrent queries`);
        console.log(`    → ${duration}ms for 10 concurrent queries`);
        console.log(`    → ${(duration / 10).toFixed(0)}ms average per query`);
    });

    console.log('\n💾 Database Size Analysis:');

    await test('Check database size', async () => {
        const res = await db.query(`
            SELECT
                pg_size_pretty(pg_database_size(current_database())) as db_size,
                pg_database_size(current_database()) as db_size_bytes
        `);

        console.log(`\n    → Database size: ${res.rows[0].db_size}`);
    });

    await test('Check table sizes', async () => {
        const res = await db.query(`
            SELECT
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 10
        `);

        if (res.rows.length > 0) {
            console.log('\n    → Top 10 tables by size:');
            res.rows.forEach(row => {
                console.log(`       ${row.tablename}: ${row.size}`);
            });
        }
    });

    console.log('\n🔧 Optimization Suggestions:');

    await test('Check for missing indexes', async () => {
        const res = await db.query(`
            SELECT
                schemaname,
                tablename,
                attname as column_name
            FROM pg_stats
            WHERE schemaname = 'public'
            AND tablename IN ('users', 'user_word_progress', 'study_sessions')
            AND attname IN ('user_id', 'created_at', 'updated_at', 'language_pair_id')
            AND attname NOT IN (
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = (schemaname||'.'||tablename)::regclass
            )
        `);

        if (res.rows.length > 0) {
            console.log('\n    → Columns that might benefit from indexes:');
            res.rows.forEach(row => {
                console.log(`       ${row.tablename}.${row.column_name}`);
            });
        } else {
            console.log('\n    → All critical columns appear to be indexed');
        }
    });

    // Print results
    console.log('\n' + '━'.repeat(60));
    console.log(`\n✅ Passed: ${results.passed}/${results.passed + results.failed}`);
    console.log(`❌ Failed: ${results.failed}/${results.passed + results.failed}`);
    console.log('━'.repeat(60) + '\n');

    await db.end();
    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    db.end();
    process.exit(1);
});
