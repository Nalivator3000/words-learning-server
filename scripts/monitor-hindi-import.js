require('dotenv').config();
const { Client } = require('pg');

async function monitorProgress() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('📊 Hindi Import Progress Monitor\n');
  console.log('Target: 10,000 words\n');
  console.log('='.repeat(60));

  const result = await client.query('SELECT COUNT(*) FROM source_words_hindi');
  const total = parseInt(result.rows[0].count);
  const percentage = (total / 10000 * 100).toFixed(1);

  console.log(`\nTotal words: ${total.toLocaleString()} / 10,000 (${percentage}%)`);

  const byLevel = await client.query(`
    SELECT level, COUNT(*) as count
    FROM source_words_hindi
    GROUP BY level
    ORDER BY
      CASE level
        WHEN 'A1' THEN 1
        WHEN 'A2' THEN 2
        WHEN 'B1' THEN 3
        WHEN 'B2' THEN 4
        WHEN 'C1' THEN 5
        WHEN 'C2' THEN 6
      END
  `);

  console.log('\nBy level:');
  const targets = { A1: 1000, A2: 1000, B1: 1500, B2: 2000, C1: 2500, C2: 2000 };

  byLevel.rows.forEach(row => {
    const target = targets[row.level];
    const pct = (row.count / target * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(pct / 2)) + '░'.repeat(50 - Math.floor(pct / 2));
    console.log(`  ${row.level}: ${row.count.toString().padStart(4)} / ${target.toString().padStart(4)} [${bar}] ${pct}%`);
  });

  console.log('\n' + '='.repeat(60));

  if (total >= 9900) {
    console.log('\n✅ Import nearly complete!');
  } else {
    const remaining = 10000 - total;
    const eta = Math.ceil(remaining / 350); // ~350 words/min
    console.log(`\n⏱️  Estimated time remaining: ~${eta} minutes`);
  }

  await client.end();
}

monitorProgress().catch(console.error);
