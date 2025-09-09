// Database Check and Export Script
const { Pool } = require('pg');

// Database configuration - same as in server-postgres.js
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:QdUAWfXzBRYmEhIRVePOkmSFkKzWoMzQ@autorack.proxy.rlwy.net:41945/railway';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('railway') || DATABASE_URL.includes('postgres://') ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
    try {
        console.log('🔍 Checking database connection...');
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');
        
        // Check database info
        const dbInfo = await client.query('SELECT current_database(), current_user, version()');
        console.log('\n📊 Database Info:');
        console.log(`Database: ${dbInfo.rows[0].current_database}`);
        console.log(`User: ${dbInfo.rows[0].current_user}`);
        console.log(`Version: ${dbInfo.rows[0].version.split(',')[0]}`);
        
        // Check tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('\n📋 Tables:');
        if (tables.rows.length === 0) {
            console.log('❌ No tables found!');
            return;
        }
        
        for (const row of tables.rows) {
            console.log(`  - ${row.table_name}`);
        }
        
        // Check users table
        try {
            const users = await client.query('SELECT * FROM users ORDER BY id');
            console.log('\n👥 Users:');
            console.table(users.rows.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                created_at: user.created_at?.toISOString()?.split('T')[0]
            })));
        } catch (error) {
            console.log('❌ Error reading users:', error.message);
        }
        
        // Check words table
        try {
            const words = await client.query('SELECT COUNT(*) as total, user_id FROM words GROUP BY user_id');
            console.log('\n📚 Word counts by user:');
            console.table(words.rows);
            
            // Show sample words
            const sampleWords = await client.query(`
                SELECT w.id, w.word, w.translation, w.status, w.correct_count, w.incorrect_count, u.email 
                FROM words w 
                JOIN users u ON w.user_id = u.id 
                ORDER BY w.id 
                LIMIT 10
            `);
            
            if (sampleWords.rows.length > 0) {
                console.log('\n📝 Sample words:');
                console.table(sampleWords.rows);
            }
        } catch (error) {
            console.log('❌ Error reading words:', error.message);
        }
        
        // Export all data to CSV
        try {
            const allWords = await client.query(`
                SELECT 
                    w.id, w.word, w.example, w.translation, w.example_translation,
                    w.status, w.correct_count, w.incorrect_count,
                    w.date_added, w.last_studied, w.created_at, w.updated_at,
                    u.email as user_email, u.name as user_name
                FROM words w
                JOIN users u ON w.user_id = u.id
                ORDER BY w.id
            `);
            
            if (allWords.rows.length > 0) {
                console.log('\n💾 Exporting to CSV...');
                
                // Create CSV content
                const headers = Object.keys(allWords.rows[0]);
                const csvContent = [
                    headers.join(','),
                    ...allWords.rows.map(row => 
                        headers.map(header => {
                            const value = row[header];
                            if (value === null || value === undefined) return '';
                            if (typeof value === 'string' && value.includes(',')) {
                                return `"${value.replace(/"/g, '""')}"`;
                            }
                            return value;
                        }).join(',')
                    )
                ].join('\n');
                
                // Write CSV file
                const fs = require('fs');
                const csvPath = './database_export.csv';
                fs.writeFileSync(csvPath, csvContent);
                console.log(`✅ Database exported to: ${csvPath}`);
                console.log(`📊 Exported ${allWords.rows.length} words`);
            } else {
                console.log('❌ No words found to export');
            }
        } catch (error) {
            console.log('❌ Error exporting data:', error.message);
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n🔍 Checking server status...');
        
        // Check if server is responding
        try {
            const response = await fetch('https://words-learning-server-production.up.railway.app/api/health');
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Server is responding:', data);
            } else {
                console.log('❌ Server health check failed:', response.status);
            }
        } catch (fetchError) {
            console.log('❌ Server is not accessible:', fetchError.message);
        }
    } finally {
        await pool.end();
    }
}

checkDatabase().then(() => {
    console.log('\n✅ Database check completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});