const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function analyzeGaps() {
  const client = await pool.connect();
  try {
    console.log('📊 Current German Vocabulary Distribution:\n');

    const levels = await client.query(`
      SELECT level, COUNT(*) as count
      FROM source_words_german
      GROUP BY level
      ORDER BY
        CASE level
          WHEN 'beginner' THEN 0
          WHEN 'A1' THEN 1
          WHEN 'A2' THEN 2
          WHEN 'B1' THEN 3
          WHEN 'B2' THEN 4
          WHEN 'C1' THEN 5
          WHEN 'C2' THEN 6
          ELSE 99
        END
    `);

    const targets = {
      'A1': 800,
      'A2': 1000,
      'B1': 1200,
      'B2': 1800,
      'C1': 2500,
      'C2': 3500
    };

    let totalCurrent = 0;
    let totalNeeded = 0;

    console.log('Level | Current | Target | Needed | Progress');
    console.log('------|---------|--------|--------|----------');

    levels.rows.forEach(row => {
      const current = parseInt(row.count);
      const target = targets[row.level] || 0;
      const needed = Math.max(0, target - current);
      const progress = target > 0 ? Math.round((current / target) * 100) + '%' : 'N/A';

      totalCurrent += current;
      if (target > 0) totalNeeded += needed;

      console.log(`${row.level.padEnd(5)} | ${current.toString().padStart(7)} | ${target.toString().padStart(6)} | ${needed.toString().padStart(6)} | ${progress}`);
    });

    console.log('------|---------|--------|--------|----------');
    console.log(`TOTAL | ${totalCurrent.toString().padStart(7)} | ${(10800).toString().padStart(6)} | ${totalNeeded.toString().padStart(6)} | ${Math.round((totalCurrent / 10800) * 100)}%`);

    console.log(`\n📝 Summary:\n`);
    console.log(`   Current total: ${totalCurrent} words`);
    console.log(`   Target total: 10,800 words`);
    console.log(`   Still needed: ${totalNeeded} words`);
    console.log(`   Progress: ${Math.round((totalCurrent / 10800) * 100)}%`);

    // Show detailed gaps
    console.log('\n🎯 Gaps to fill:\n');
    Object.entries(targets).forEach(([level, target]) => {
      const row = levels.rows.find(r => r.level === level);
      const current = row ? parseInt(row.count) : 0;
      const needed = target - current;
      if (needed > 0) {
        console.log(`   ${level}: Need ${needed} more words (${current}/${target})`);
      }
    });

  } finally {
    client.release();
    await pool.end();
  }
}

analyzeGaps();
