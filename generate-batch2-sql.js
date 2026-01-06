const fs = require('fs').promises;
const path = require('path');

const languages = [
  { code: 'ru', file: 'themes-russian-batch2.json' },
  { code: 'ar', file: 'themes-arabic-batch2.json' },
  { code: 'it', file: 'themes-italian-batch2.json' },
  { code: 'pt', file: 'themes-portuguese-batch2.json' },
  { code: 'tr', file: 'themes-turkish-batch2.json' },
  { code: 'uk', file: 'themes-ukrainian-batch2.json' }
];

async function generateSQL() {
  let sql = `-- Apply themes from batch 2\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;
  sql += `BEGIN;\n\n`;

  for (const { code, file } of languages) {
    console.log(`Processing ${code}...`);

    const filePath = path.join(__dirname, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const themes = JSON.parse(fileContent);

    sql += `-- ${code.toUpperCase()} (${themes.length} words)\n`;

    for (const { word, theme } of themes) {
      // Escape single quotes in word
      const escapedWord = word.replace(/'/g, "''");

      sql += `UPDATE words SET theme = '${theme}' WHERE language = '${code}' AND word = '${escapedWord}' AND (theme IS NULL OR theme = 'general');\n`;
    }

    sql += `\n`;
  }

  sql += `COMMIT;\n`;

  await fs.writeFile('apply-batch2-themes.sql', sql);
  console.log('\n✅ SQL file generated: apply-batch2-themes.sql');
}

generateSQL().catch(console.error);
