const fs = require('fs');
const path = require('path');

// Available themes
const THEMES = [
  'family', 'food', 'travel', 'home', 'health', 'work', 'education',
  'nature', 'weather', 'communication', 'culture', 'emotions',
  'sports', 'technology', 'time', 'numbers', 'colors', 'clothing', 'shopping'
];

// Enhanced Japanese word categorization dictionary with better coverage
const WORD_THEMES = {
  'family': {
    keywords: ['父', '母', '親', '子', '息子', '娘', '兄', '弟', '姉', '妹', '祖', '配偶', '夫', '妻', '族', '親戚', '家族', 'ファミリー'],
    weight: 1
  },
  'food': {
    keywords: ['ご飯', 'パン', '肉', '魚', '野菜', '果物', '卵', 'チーズ', 'バター', '油', 'スープ', 'サラダ', 'ケーキ', 'デザート', '食', '飲', 'メニュー', 'レストラン', 'カフェ', '料理', 'メシ'],
    weight: 1
  },
  'travel': {
    keywords: ['駅', '電車', '車', '飛行機', '船', 'バス', '空港', '道路', '地図', '旅', '訪問', '観光', 'パスポート', 'チケット', 'ホテル', '宿泊', '移動', 'ツアー', '道', '街'],
    weight: 1
  },
  'home': {
    keywords: ['家', 'うち', '部屋', 'ドア', '窓', '床', '天井', '壁', '階段', 'トイレ', '台所', 'キッチン', 'ベッド', '椅子', 'テーブル', 'ソファ', '机', 'クローゼット', 'ランプ', '照明'],
    weight: 1
  },
  'health': {
    keywords: ['医', '病院', '薬', '薬局', '病気', '風邪', '頭痛', 'インフル', '歯', '目', '耳', '鼻', '心臓', '肺', '血', 'けが', '怪我', '健康', '元気', '運動', 'ジム'],
    weight: 1
  },
  'work': {
    keywords: ['会社', '仕事', '職', '上司', '同僚', 'オフィス', 'コンピュータ', 'パソコン', '会議', 'メール', 'プロジェクト', '給与', 'ボーナス', '銀行', '退職', '採用', 'インターン'],
    weight: 1
  },
  'education': {
    keywords: ['学校', '大学', '図書館', '教室', '教科書', 'テキスト', 'ノート', 'ペン', '鉛筆', '消しゴム', '先生', '教授', '学生', '生徒', '授業', 'クラス', '勉強', '学習', 'テスト', '試験', '宿題'],
    weight: 1
  },
  'nature': {
    keywords: ['木', '花', '草', '根', '葉', '枝', '幹', '森', '林', '公園', '山', '丘', '川', '湖', '海', '石', '土', '砂', '自然', 'バラ', 'チューリップ', 'ヒマワリ'],
    weight: 1
  },
  'weather': {
    keywords: ['天気', '晴', '曇', '雨', '雪', '風', '嵐', '虹', '霧', '氷', '霜', '気温', '温度', '湿度', '季節', '春', '夏', '秋', '冬', '日の出'],
    weight: 1
  },
  'communication': {
    keywords: ['話す', '聞く', '言う', 'メッセージ', '手紙', '郵便', 'メール', '質問', '答え', '議論', '意見', '提案', '感謝', '挨拶', 'さようなら', '電話', 'チャット', '会話'],
    weight: 1
  },
  'culture': {
    keywords: ['芸術', '絵', '彫刻', '音楽', '楽器', 'ピアノ', 'ギター', 'ドラム', '歌う', '歌', '曲', 'ダンス', '演劇', '映画', 'フィルム', '博物館', 'ギャラリー', '歴史', '神社', 'お寺'],
    weight: 1
  },
  'emotions': {
    keywords: ['happy', '幸せ', '楽しい', '喜び', 'sad', '悲しい', 'angry', '怒り', 'surprised', '驚き', 'scared', '怖い', 'worried', '心配', 'bored', 'つまらない', 'tired', '疲れた', '愛', '感情'],
    weight: 1
  },
  'sports': {
    keywords: ['サッカー', 'フットボール', 'バスケット', 'バレーボール', '野球', 'テニス', 'ゴルフ', '体操', 'ボクシング', '空手', '柔道', 'スイミング', 'サーフィン', 'スキー', 'スノーボード', 'スケート', 'サイクリング', '自転車', 'ジョギング', '走る'],
    weight: 1
  },
  'technology': {
    keywords: ['コンピュータ', 'パソコン', 'スマートフォン', 'スマホ', '携帯', 'タブレット', 'キーボード', 'マウス', 'モニター', 'プリンター', 'カメラ', 'マイク', 'スピーカー', 'ソフトウェア', 'アプリ', 'インターネット', 'ウェブ', 'ブラウザ', 'データ', 'ファイル'],
    weight: 1
  },
  'time': {
    keywords: ['時間', '時', '分', '秒', '時刻', '今', '過去', '未来', '昨日', '今日', '明日', '朝', '午前', '昼', '午後', '夜', 'midnight', '曜日', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜', '週', '月', '年', '季節'],
    weight: 1
  },
  'numbers': {
    keywords: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '20', '30', '100', '1000', '数', '数字', '番号', 'ナンバー', 'ゼロ', 'ワン', 'ツー', 'スリー', 'カウント', '+', '-', 'x', '÷'],
    weight: 1
  },
  'colors': {
    keywords: ['赤', 'あか', '青', 'あお', '黄色', 'きいろ', '緑', 'みどり', '白', 'しろ', '黒', 'くろ', 'グレー', '紫', 'むらさき', 'オレンジ', 'ピンク', 'ブラウン', '茶色', '灰色', 'ゴールド', 'シルバー', 'インディゴ', 'スカーレット'],
    weight: 1
  },
  'clothing': {
    keywords: ['シャツ', 'Tシャツ', 'セーター', 'ジャケット', 'コート', 'パンツ', 'ズボン', 'スカート', 'ドレス', 'スーツ', 'ネクタイ', '靴下', 'くつした', '靴', 'くつ', 'ブーツ', 'スニーカー', 'スリッパ', 'サンダル', 'ハイヒール', '帽子', 'ぼうし', 'キャップ', 'スカーフ', 'マフラー', 'ベルト', 'バッグ', '衣類', '衣服'],
    weight: 1
  },
  'shopping': {
    keywords: ['店', 'みせ', 'スーパー', 'マーケット', 'デパート', 'ショップ', 'モール', 'レジ', '商品', 'アイテム', '選ぶ', 'バッグ', 'ショッピング', 'カート', '価格', '値段', 'コスト', '割引', 'セール', '販売', 'バーゲン', 'クーポン', 'ギフト', 'レシート', 'チェックアウト', '返品', '支払い'],
    weight: 1
  }
};

// Build reverse mapping for quick lookup
const wordToTheme = {};
Object.entries(WORD_THEMES).forEach(([theme, data]) => {
  data.keywords.forEach(keyword => {
    if (!wordToTheme[keyword]) {
      wordToTheme[keyword] = theme;
    }
  });
});

// Function to determine theme for a word
function getThemeForWord(word, index, totalWords) {
  // Direct match
  if (wordToTheme[word]) {
    return wordToTheme[word];
  }

  // Try to match keywords in word
  for (const [theme, data] of Object.entries(WORD_THEMES)) {
    for (const keyword of data.keywords) {
      if (word.includes(keyword)) {
        return theme;
      }
    }
  }

  // Distribute remaining words evenly by hash
  const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return THEMES[hash % THEMES.length];
}

// Main processing
const inputFile = 'japanese-words-for-themes.txt';
const outputFile = 'themes-japanese-all.json';

console.log('Reading file...');
const words = fs.readFileSync(inputFile, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Processing ${words.length} words...`);

const result = [];
const themeCounts = {};
THEMES.forEach(theme => themeCounts[theme] = 0);

words.forEach((word, index) => {
  if (index % 1000 === 0 && index > 0) {
    console.log(`Processed ${index}/${words.length} words...`);
  }

  const theme = getThemeForWord(word, index, words.length);
  result.push({
    word: word,
    theme: theme
  });
  themeCounts[theme]++;
});

// Write output
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');

console.log('\n=== Theme Distribution ===');
let total = 0;
Object.entries(themeCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([theme, count]) => {
    const percentage = ((count / words.length) * 100).toFixed(2);
    console.log(`${theme.padEnd(15)}: ${count.toString().padStart(5)} (${percentage}%)`);
    total += count;
  });

console.log(`\nTotal words: ${total}/${words.length}`);
console.log(`Output: ${outputFile}`);
