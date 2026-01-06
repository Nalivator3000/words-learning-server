const fs = require('fs');
const path = require('path');

const languages = [
  { code: 'ru', file: 'themes-russian-batch3.json' },
  { code: 'ar', file: 'themes-arabic-batch3.json' },
  { code: 'it', file: 'themes-italian-batch3.json' },
  { code: 'pt', file: 'themes-portuguese-batch3.json' },
  { code: 'tr', file: 'themes-turkish-batch3.json' },
  { code: 'uk', file: 'themes-ukrainian-batch3.json' }
];

function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

let sql = `-- Batch 3 Theme Updates
-- Generated: ${new Date().toISOString()}
-- This updates words that have NULL theme or 'general' theme

BEGIN;

`;

let totalStatements = 0;

for (const { code, file } of languages) {
  const filePath = path.join(__dirname, file);
  const themes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  sql += `\n-- ${code.toUpperCase()} - ${themes.length} words\n`;

  for (const { word, theme } of themes) {
    sql += `UPDATE words SET theme = '${escapeSQL(theme)}' WHERE language = '${code}' AND word = '${escapeSQL(word)}' AND (theme IS NULL OR theme = 'general');\n`;
    totalStatements++;
  }
}

sql += `\nCOMMIT;

-- Total statements: ${totalStatements}
`;

const outputPath = path.join(__dirname, 'apply-batch3-themes.sql');
fs.writeFileSync(outputPath, sql);

console.log(`✅ SQL file generated: ${outputPath}`);
console.log(`📊 Total UPDATE statements: ${totalStatements}`);
console.log(`\nTo apply this file:`);
console.log(`  railway run psql < apply-batch3-themes.sql`);
console.log(`  or`);
console.log(`  psql $DATABASE_URL < apply-batch3-themes.sql`);
