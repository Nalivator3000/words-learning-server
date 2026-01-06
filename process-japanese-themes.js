const fs = require('fs');

// Available themes
const THEMES = [
  'family', 'food', 'travel', 'home', 'health', 'work', 'education',
  'nature', 'weather', 'communication', 'culture', 'emotions',
  'sports', 'technology', 'time', 'numbers', 'colors', 'clothing', 'shopping'
];

// Theme keywords mapping
const KEYWORD_MAPPING = {
  'family': ['父', '母', '親', '子', '息子', '娘', '兄', '弟', '姉', '妹', '祖', '配偶', '夫', '妻', '族', '親戚'],
  'food': ['ご飯', 'パン', '肉', '魚', '野菜', '果物', '卵', 'チーズ', 'バター', '油', 'スープ', 'サラダ', 'ケーキ', 'デザート', '食', '飲', 'メニュー', 'レストラン', 'カフェ', '料理'],
  'travel': ['駅', '電車', '車', '飛行機', '船', 'バス', '空港', '道路', '地図', '旅', '訪問', '観光', 'パスポート', 'チケット', 'ホテル', '宿泊', '移動', 'ツアー'],
  'home': ['家', 'うち', '部屋', 'ドア', '窓', '床', '天井', '壁', '階段', 'トイレ', '台所', 'キッチン', 'ベッド', '椅子', 'テーブル', 'ソファ', '机', 'クローゼット', 'ランプ', '照明'],
  'health': ['医', '病院', '薬', '薬局', '病気', '風邪', '頭痛', 'インフル', '歯', '目', '耳', '鼻', '心臓', '肺', '血', 'けが', '怪我', '健康', '元気', '運動', 'ジム'],
  'work': ['会社', '仕事', '職', '上司', '同僚', 'オフィス', 'コンピュータ', 'パソコン', '会議', 'メール', 'プロジェクト', '給与', 'ボーナス', '銀行', '退職', '採用', 'インターン'],
  'education': ['学校', '大学', '図書館', '教室', '教科書', 'テキスト', 'ノート', 'ペン', '鉛筆', '消しゴム', '先生', '教授', '学生', '生徒', '授業', 'クラス', '勉強', '学習', 'テスト', '試験', '宿題'],
  'nature': ['木', '花', '草', '根', '葉', '枝', '幹', '森', '林', '公園', '山', '丘', '川', '湖', '海', '石', '土', '砂', '自然'],
  'weather': ['天気', '晴', '曇', '雨', '雪', '風', '嵐', '虹', '霧', '氷', '霜', '気温', '温度', '湿度', '季節', '春', '夏', '秋', '冬', '日の出'],
  'communication': ['話す', '聞く', '言う', 'メッセージ', '手紙', '郵便', 'メール', '質問', '答え', '議論', '意見', '提案', '感謝', '挨拶', 'さようなら', '電話', 'チャット'],
  'culture': ['芸術', '絵', '彫刻', '音楽', '楽器', 'ピアノ', 'ギター', 'ドラム', '歌う', '歌', '曲', 'ダンス', '演劇', '映画', 'フィルム', '博物館', 'ギャラリー', '歴史'],
  'emotions': ['happy', '幸せ', '楽しい', '喜び', 'sad', '悲しい', 'angry', '怒り', 'surprised', '驚き', 'scared', '怖い', 'worried', '心配', 'bored', 'tired', '疲れた', '愛'],
  'sports': ['サッカー', 'フットボール', 'バスケット', 'バレーボール', '野球', 'テニス', 'ゴルフ', '体操', 'ボクシング', '空手', '柔道', 'スイミング', 'サーフィン', 'スキー', 'スケート', '自転車', 'ジョギング', '走る'],
  'technology': ['コンピュータ', 'パソコン', 'スマートフォン', 'スマホ', '携帯', 'タブレット', 'キーボード', 'マウス', 'モニター', 'プリンター', 'カメラ', 'マイク', 'スピーカー', 'ソフトウェア', 'アプリ', 'インターネット', 'ウェブ', 'ブラウザ', 'データ', 'ファイル'],
  'time': ['時間', '時', '分', '秒', '時刻', '今', '過去', '未来', '昨日', '今日', '明日', '朝', '午前', '昼', '午後', '夜', '曜日', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜', '週', '月', '年', '季節'],
  'numbers': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '20', '30', '100', '1000', '数', '数字', '番号', 'ナンバー', 'ゼロ', 'ワン', 'ツー', 'スリー', 'カウント'],
  'colors': ['赤', 'あか', '青', 'あお', '黄色', 'きいろ', '緑', 'みどり', '白', 'しろ', '黒', 'くろ', 'グレー', '紫', 'むらさき', 'オレンジ', 'ピンク', 'ブラウン', '茶色', '灰色', 'ゴールド', 'シルバー'],
  'clothing': ['シャツ', 'Tシャツ', 'セーター', 'ジャケット', 'コート', 'パンツ', 'ズボン', 'スカート', 'ドレス', 'スーツ', 'ネクタイ', '靴下', 'くつした', '靴', 'くつ', 'ブーツ', 'スニーカー', 'スリッパ', 'サンダル', 'ハイヒール', '帽子', 'ぼうし', 'キャップ', 'スカーフ', 'マフラー', 'ベルト', 'バッグ'],
  'shopping': ['店', 'みせ', 'スーパー', 'マーケット', 'デパート', 'ショップ', 'モール', 'レジ', '商品', 'アイテム', '選ぶ', 'バッグ', 'ショッピング', 'カート', '価格', '値段', 'コスト', '割引', 'セール', '販売', 'バーゲン', 'クーポン', 'ギフト', 'レシート', '支払い']
};

function getThemeForWord(word) {
  // Direct match check
  for (const [theme, keywords] of Object.entries(KEYWORD_MAPPING)) {
    if (keywords.includes(word)) {
      return theme;
    }
  }

  // Check if word contains any keyword
  for (const [theme, keywords] of Object.entries(KEYWORD_MAPPING)) {
    for (const keyword of keywords) {
      if (word.includes(keyword)) {
        return theme;
      }
    }
  }

  // Hash-based distribution for remaining words
  const hash = word.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return THEMES[hash % THEMES.length];
}

// Process file
const inputPath = 'japanese-words-for-themes.txt';
const outputPath = 'themes-japanese-all.json';

console.log('Reading input file...');
const fileContent = fs.readFileSync(inputPath, 'utf-8');
const words = fileContent
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Processing ${words.length} words...`);

const result = [];
const themeCounts = {};
THEMES.forEach(t => themeCounts[t] = 0);

for (let i = 0; i < words.length; i++) {
  if (i % 1000 === 0 && i > 0) {
    console.log(`Processed: ${i}/${words.length}`);
  }

  const word = words[i];
  const theme = getThemeForWord(word);

  result.push({
    word: word,
    theme: theme
  });

  themeCounts[theme]++;
}

// Write output
console.log('Writing output file...');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

// Statistics
console.log('\n=== Theme Distribution ===');
const sorted = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);

for (const [theme, count] of sorted) {
  const pct = ((count / words.length) * 100).toFixed(2);
  console.log(`${theme.padEnd(15)}: ${count.toString().padStart(5)} (${pct}%)`);
}

const total = Object.values(themeCounts).reduce((a, b) => a + b, 0);
console.log(`\nTotal: ${total}/${words.length}`);
console.log(`Output file: ${outputPath}`);
