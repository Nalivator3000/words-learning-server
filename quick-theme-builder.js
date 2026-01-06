#!/usr/bin/env node

const fs = require('fs');

const THEMES = [
  'family', 'food', 'travel', 'home', 'health', 'work', 'education',
  'nature', 'weather', 'communication', 'culture', 'emotions',
  'sports', 'technology', 'time', 'numbers', 'colors', 'clothing', 'shopping'
];

const KEYWORDS = {
  '父': 'family', '母': 'family', '親': 'family', '子': 'family', '兄': 'family',
  'ご飯': 'food', '肉': 'food', '魚': 'food', 'パン': 'food', 'チーズ': 'food',
  '駅': 'travel', '車': 'travel', '飛行機': 'travel', 'ホテル': 'travel',
  '家': 'home', '部屋': 'home', 'ベッド': 'home', 'テーブル': 'home',
  '医': 'health', '病院': 'health', '薬': 'health', '健康': 'health',
  '会社': 'work', '仕事': 'work', 'オフィス': 'work', '上司': 'work',
  '学校': 'education', '大学': 'education', '教室': 'education', 'テスト': 'education',
  '木': 'nature', '花': 'nature', '海': 'nature', '山': 'nature',
  '天気': 'weather', '雨': 'weather', '雪': 'weather', '晴': 'weather',
  '話す': 'communication', '聞く': 'communication', 'メール': 'communication',
  '音楽': 'culture', '映画': 'culture', '歌': 'culture', '芸術': 'culture',
  '幸せ': 'emotions', '悲しい': 'emotions', '怒り': 'emotions', '恐怖': 'emotions',
  'サッカー': 'sports', 'テニス': 'sports', 'スイミング': 'sports', '野球': 'sports',
  'コンピュータ': 'technology', 'スマホ': 'technology', 'ウェブ': 'technology',
  '時': 'time', '今日': 'time', '昨日': 'time', '年': 'time',
  '数': 'numbers', '1': 'numbers', '10': 'numbers', '100': 'numbers',
  '赤': 'colors', '青': 'colors', '緑': 'colors', '黒': 'colors',
  'シャツ': 'clothing', '靴': 'clothing', 'パンツ': 'clothing', '帽子': 'clothing',
  '店': 'shopping', 'カート': 'shopping', '価格': 'shopping', 'セール': 'shopping'
};

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getThemeForWord(word) {
  // Check direct keyword match
  if (KEYWORDS[word]) {
    return KEYWORDS[word];
  }

  // Check substring match
  for (const [key, theme] of Object.entries(KEYWORDS)) {
    if (word.includes(key)) {
      return theme;
    }
  }

  // Hash-based distribution
  const index = hashCode(word) % THEMES.length;
  return THEMES[index];
}

try {
  console.log('Reading input file...');
  const input = fs.readFileSync('japanese-words-for-themes.txt', 'utf-8');
  const words = input.split('\n').filter(w => w.trim());

  console.log(`Processing ${words.length} words...`);

  const result = [];
  const themeCount = {};
  THEMES.forEach(t => themeCount[t] = 0);

  let processed = 0;
  for (const word of words) {
    const theme = getThemeForWord(word);
    result.push({ word, theme });
    themeCount[theme]++;
    processed++;

    if (processed % 1000 === 0) {
      console.log(`Processed: ${processed}/${words.length}`);
    }
  }

  console.log('Writing output...');
  fs.writeFileSync('themes-japanese-all.json', JSON.stringify(result, null, 2));

  console.log('\n=== Theme Distribution ===');
  const sorted = Object.entries(themeCount).sort((a, b) => b[1] - a[1]);
  for (const [theme, count] of sorted) {
    const pct = ((count / words.length) * 100).toFixed(2);
    console.log(`${theme.padEnd(15)}: ${count.toString().padStart(5)} (${pct}%)`);
  }

  console.log(`\nSuccess! Created themes-japanese-all.json with ${result.length} entries`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
