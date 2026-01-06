/**
 * Simple restore script - runs populate-extended-vocabularies for each language
 * then forces addition of new words
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const languages = ['italian', 'portuguese', 'russian', 'arabic', 'turkish', 'ukrainian'];

async function restoreAll() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          ВОССТАНОВЛЕНИЕ СЛОВАРЕЙ                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  for (const lang of languages) {
    console.log(`\n🔧 Восстанавливаю ${lang}...`);

    try {
      const { stdout, stderr } = await execAsync(`node populate-vocabularies.js ${lang}`);
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error(`❌ Ошибка при восстановлении ${lang}:`, error.message);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ Готово!\n');
}

restoreAll();
