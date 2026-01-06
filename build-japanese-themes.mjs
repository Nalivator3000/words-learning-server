import fs from 'fs';

const THEMES = [
  'family', 'food', 'travel', 'home', 'health', 'work', 'education',
  'nature', 'weather', 'communication', 'culture', 'emotions',
  'sports', 'technology', 'time', 'numbers', 'colors', 'clothing', 'shopping'
];

const KEYWORD_MAP = {
  '父': 'family', '母': 'family', '親': 'family', '子': 'family', '息子': 'family',
  '娘': 'family', '兄': 'family', '弟': 'family', '姉': 'family', '妹': 'family',
  '祖': 'family', '配偶': 'family', '夫': 'family', '妻': 'family', '族': 'family',
  '親戚': 'family',
  'ご飯': 'food', 'パン': 'food', '肉': 'food', '魚': 'food', '野菜': 'food',
  '果物': 'food', '卵': 'food', 'チーズ': 'food', 'バター': 'food', '油': 'food',
  'スープ': 'food', 'サラダ': 'food', 'ケーキ': 'food', 'デザート': 'food',
  '食': 'food', '飲': 'food', 'メニュー': 'food', 'レストラン': 'food',
  'カフェ': 'food', '料理': 'food', 'メシ': 'food',
  '駅': 'travel', '電車': 'travel', '車': 'travel', '飛行機': 'travel',
  '船': 'travel', 'バス': 'travel', '空港': 'travel', '道路': 'travel',
  '地図': 'travel', '旅': 'travel', '訪問': 'travel', '観光': 'travel',
  'パスポート': 'travel', 'チケット': 'travel', 'ホテル': 'travel',
  '宿泊': 'travel', '移動': 'travel', 'ツアー': 'travel', '道': 'travel',
  '街': 'travel',
  '家': 'home', 'うち': 'home', '部屋': 'home', 'ドア': 'home', '窓': 'home',
  '床': 'home', '天井': 'home', '壁': 'home', '階段': 'home', 'トイレ': 'home',
  '台所': 'home', 'キッチン': 'home', 'ベッド': 'home', '椅子': 'home',
  'テーブル': 'home', 'ソファ': 'home', '机': 'home', 'クローゼット': 'home',
  'ランプ': 'home', '照明': 'home',
  '医': 'health', '病院': 'health', '薬': 'health', '薬局': 'health',
  '病気': 'health', '風邪': 'health', '頭痛': 'health', 'インフル': 'health',
  '歯': 'health', '目': 'health', '耳': 'health', '鼻': 'health',
  '心臓': 'health', '肺': 'health', '血': 'health', 'けが': 'health',
  '怪我': 'health', '健康': 'health', '元気': 'health', '運動': 'health',
  'ジム': 'health',
  '会社': 'work', '仕事': 'work', '職': 'work', '上司': 'work',
  '同僚': 'work', 'オフィス': 'work', 'コンピュータ': 'work',
  'パソコン': 'work', '会議': 'work', 'メール': 'work', 'プロジェクト': 'work',
  '給与': 'work', 'ボーナス': 'work', '銀行': 'work', '退職': 'work',
  '採用': 'work', 'インターン': 'work',
  '学校': 'education', '大学': 'education', '図書館': 'education',
  '教室': 'education', '教科書': 'education', 'テキスト': 'education',
  'ノート': 'education', 'ペン': 'education', '鉛筆': 'education',
  '消しゴム': 'education', '先生': 'education', '教授': 'education',
  '学生': 'education', '生徒': 'education', '授業': 'education',
  'クラス': 'education', '勉強': 'education', '学習': 'education',
  'テスト': 'education', '試験': 'education', '宿題': 'education',
  '木': 'nature', '花': 'nature', '草': 'nature', '根': 'nature',
  '葉': 'nature', '枝': 'nature', '幹': 'nature', '森': 'nature',
  '林': 'nature', '公園': 'nature', '山': 'nature', '丘': 'nature',
  '川': 'nature', '湖': 'nature', '海': 'nature', '石': 'nature',
  '土': 'nature', '砂': 'nature', '自然': 'nature',
  '天気': 'weather', '晴': 'weather', '曇': 'weather', '雨': 'weather',
  '雪': 'weather', '風': 'weather', '嵐': 'weather', '虹': 'weather',
  '霧': 'weather', '氷': 'weather', '霜': 'weather', '気温': 'weather',
  '温度': 'weather', '湿度': 'weather', '季節': 'weather', '春': 'weather',
  '夏': 'weather', '秋': 'weather', '冬': 'weather', '日の出': 'weather',
  '話す': 'communication', '聞く': 'communication', '言う': 'communication',
  'メッセージ': 'communication', '手紙': 'communication', '郵便': 'communication',
  'メール': 'communication', '質問': 'communication', '答え': 'communication',
  '議論': 'communication', '意見': 'communication', '提案': 'communication',
  '感謝': 'communication', '挨拶': 'communication', 'さようなら': 'communication',
  '電話': 'communication', 'チャット': 'communication', '会話': 'communication',
  '芸術': 'culture', '絵': 'culture', '彫刻': 'culture', '音楽': 'culture',
  '楽器': 'culture', 'ピアノ': 'culture', 'ギター': 'culture', 'ドラム': 'culture',
  '歌う': 'culture', '歌': 'culture', '曲': 'culture', 'ダンス': 'culture',
  '演劇': 'culture', '映画': 'culture', 'フィルム': 'culture', '博物館': 'culture',
  'ギャラリー': 'culture', '歴史': 'culture', '神社': 'culture', 'お寺': 'culture',
  '幸せ': 'emotions', '楽しい': 'emotions', '喜び': 'emotions', '悲しい': 'emotions',
  '怒り': 'emotions', '驚き': 'emotions', '怖い': 'emotions', '心配': 'emotions',
  'つまらない': 'emotions', '疲れた': 'emotions', '愛': 'emotions', '感情': 'emotions',
  'サッカー': 'sports', 'フットボール': 'sports', 'バスケット': 'sports',
  'バレーボール': 'sports', '野球': 'sports', 'テニス': 'sports', 'ゴルフ': 'sports',
  '体操': 'sports', 'ボクシング': 'sports', '空手': 'sports', '柔道': 'sports',
  'スイミング': 'sports', 'サーフィン': 'sports', 'スキー': 'sports',
  'スノーボード': 'sports', 'スケート': 'sports', 'サイクリング': 'sports',
  '自転車': 'sports', 'ジョギング': 'sports', '走る': 'sports',
  'コンピュータ': 'technology', 'スマートフォン': 'technology', 'スマホ': 'technology',
  '携帯': 'technology', 'タブレット': 'technology', 'キーボード': 'technology',
  'マウス': 'technology', 'モニター': 'technology', 'プリンター': 'technology',
  'カメラ': 'technology', 'マイク': 'technology', 'スピーカー': 'technology',
  'ソフトウェア': 'technology', 'アプリ': 'technology', 'インターネット': 'technology',
  'ウェブ': 'technology', 'ブラウザ': 'technology', 'データ': 'technology',
  'ファイル': 'technology',
  '時間': 'time', '時': 'time', '分': 'time', '秒': 'time', '時刻': 'time',
  '今': 'time', '過去': 'time', '未来': 'time', '昨日': 'time', '今日': 'time',
  '明日': 'time', '朝': 'time', '午前': 'time', '昼': 'time', '午後': 'time',
  '夜': 'time', '曜日': 'time', '月曜': 'time', '火曜': 'time', '水曜': 'time',
  '木曜': 'time', '金曜': 'time', '土曜': 'time', '日曜': 'time', '週': 'time',
  '月': 'time', '年': 'time', '季節': 'time',
  '0': 'numbers', '1': 'numbers', '2': 'numbers', '3': 'numbers', '4': 'numbers',
  '5': 'numbers', '6': 'numbers', '7': 'numbers', '8': 'numbers', '9': 'numbers',
  '10': 'numbers', '20': 'numbers', '30': 'numbers', '100': 'numbers',
  '1000': 'numbers', '数': 'numbers', '数字': 'numbers', '番号': 'numbers',
  'ナンバー': 'numbers', 'ゼロ': 'numbers', 'ワン': 'numbers', 'ツー': 'numbers',
  'スリー': 'numbers', 'カウント': 'numbers',
  '赤': 'colors', 'あか': 'colors', '青': 'colors', 'あお': 'colors',
  '黄色': 'colors', 'きいろ': 'colors', '緑': 'colors', 'みどり': 'colors',
  '白': 'colors', 'しろ': 'colors', '黒': 'colors', 'くろ': 'colors',
  'グレー': 'colors', '紫': 'colors', 'むらさき': 'colors', 'オレンジ': 'colors',
  'ピンク': 'colors', 'ブラウン': 'colors', '茶色': 'colors', '灰色': 'colors',
  'ゴールド': 'colors', 'シルバー': 'colors',
  'シャツ': 'clothing', 'Tシャツ': 'clothing', 'セーター': 'clothing',
  'ジャケット': 'clothing', 'コート': 'clothing', 'パンツ': 'clothing',
  'ズボン': 'clothing', 'スカート': 'clothing', 'ドレス': 'clothing',
  'スーツ': 'clothing', 'ネクタイ': 'clothing', '靴下': 'clothing',
  'くつした': 'clothing', '靴': 'clothing', 'くつ': 'clothing', 'ブーツ': 'clothing',
  'スニーカー': 'clothing', 'スリッパ': 'clothing', 'サンダル': 'clothing',
  'ハイヒール': 'clothing', '帽子': 'clothing', 'ぼうし': 'clothing',
  'キャップ': 'clothing', 'スカーフ': 'clothing', 'マフラー': 'clothing',
  'ベルト': 'clothing', 'バッグ': 'clothing',
  '店': 'shopping', 'みせ': 'shopping', 'スーパー': 'shopping',
  'マーケット': 'shopping', 'デパート': 'shopping', 'ショップ': 'shopping',
  'モール': 'shopping', 'レジ': 'shopping', '商品': 'shopping', 'アイテム': 'shopping',
  '選ぶ': 'shopping', 'ショッピング': 'shopping', 'カート': 'shopping',
  '価格': 'shopping', '値段': 'shopping', 'コスト': 'shopping', '割引': 'shopping',
  'セール': 'shopping', '販売': 'shopping', 'バーゲン': 'shopping', 'クーポン': 'shopping',
  'ギフト': 'shopping', 'レシート': 'shopping', 'チェックアウト': 'shopping',
  '返品': 'shopping', '支払い': 'shopping'
};

function getTheme(word) {
  // Direct keyword match
  for (const [key, theme] of Object.entries(KEYWORD_MAP)) {
    if (word === key) return theme;
  }

  // Substring match
  for (const [key, theme] of Object.entries(KEYWORD_MAP)) {
    if (word.includes(key)) return theme;
  }

  // Hash-based distribution
  const hash = word.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return THEMES[hash % THEMES.length];
}

const lines = fs.readFileSync('japanese-words-for-themes.txt', 'utf-8').split('\n');
const result = lines
  .map(w => w.trim())
  .filter(w => w.length > 0)
  .map(word => ({ word, theme: getTheme(word) }));

fs.writeFileSync('themes-japanese-all.json', JSON.stringify(result, null, 2));
console.log(`Processed ${result.length} words`);

// Statistics
const stats = {};
THEMES.forEach(t => stats[t] = 0);
result.forEach(r => stats[r.theme]++);
console.log('\nDistribution:');
Object.entries(stats).sort((a,b) => b[1]-a[1]).forEach(([t,c]) => {
  console.log(`${t.padEnd(15)}: ${c} (${((c/result.length)*100).toFixed(1)}%)`);
});
