const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// English vocabulary by CEFR level
// Based on Oxford 3000/5000, Cambridge English, and CEFR wordlists
const ENGLISH_VOCABULARY = {
  'A1': [
    // Personal Information & Greetings (50 words)
    'hello', 'hi', 'goodbye', 'bye', 'please', 'thank you', 'thanks', 'sorry', 'excuse me', 'yes',
    'no', 'okay', 'name', 'I', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'our', 'their', 'am', 'is', 'are', 'have',
    'has', 'do', 'does', 'can', 'good', 'bad', 'nice', 'fine', 'great', 'happy',
    'sad', 'big', 'small', 'old', 'new', 'young', 'man', 'woman', 'boy', 'girl',

    // Numbers & Time (40 words)
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
    'thirty', 'forty', 'fifty', 'hundred', 'thousand', 'first', 'second', 'third', 'last', 'time',
    'day', 'week', 'month', 'year', 'today', 'tomorrow', 'yesterday', 'now', 'morning', 'afternoon',

    // Family & People (30 words)
    'mother', 'father', 'parent', 'parents', 'mom', 'dad', 'sister', 'brother', 'son', 'daughter',
    'baby', 'child', 'children', 'family', 'friend', 'people', 'person', 'husband', 'wife', 'grandmother',
    'grandfather', 'aunt', 'uncle', 'cousin', 'teacher', 'student', 'doctor', 'nurse', 'driver', 'waiter',

    // Home & Objects (40 words)
    'house', 'home', 'room', 'door', 'window', 'table', 'chair', 'bed', 'bathroom', 'kitchen',
    'bedroom', 'living room', 'garden', 'car', 'bus', 'train', 'bicycle', 'phone', 'computer', 'television',
    'TV', 'book', 'pen', 'pencil', 'bag', 'key', 'money', 'watch', 'clock', 'picture',
    'photo', 'wall', 'floor', 'roof', 'stairs', 'lamp', 'sofa', 'mirror', 'towel', 'shower',

    // Food & Drink (50 words)
    'food', 'water', 'coffee', 'tea', 'juice', 'milk', 'bread', 'egg', 'meat', 'fish',
    'chicken', 'rice', 'pasta', 'pizza', 'sandwich', 'salad', 'soup', 'cheese', 'butter', 'sugar',
    'salt', 'fruit', 'apple', 'banana', 'orange', 'vegetable', 'potato', 'tomato', 'onion', 'carrot',
    'breakfast', 'lunch', 'dinner', 'restaurant', 'cafe', 'menu', 'eat', 'drink', 'hungry', 'thirsty',
    'delicious', 'tasty', 'hot', 'cold', 'sweet', 'fresh', 'cook', 'kitchen', 'plate', 'cup',

    // Colors & Adjectives (30 words)
    'color', 'white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'brown', 'pink',
    'purple', 'gray', 'light', 'dark', 'beautiful', 'ugly', 'clean', 'dirty', 'long', 'short',
    'tall', 'high', 'low', 'fast', 'slow', 'easy', 'difficult', 'hard', 'soft', 'strong',

    // Body & Health (30 words)
    'body', 'head', 'hair', 'face', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'neck',
    'arm', 'hand', 'finger', 'leg', 'foot', 'knee', 'back', 'stomach', 'heart', 'sick',
    'ill', 'pain', 'hurt', 'tired', 'hospital', 'medicine', 'feel', 'better', 'worse', 'healthy',

    // Actions & Verbs (60 words)
    'be', 'have', 'do', 'make', 'go', 'come', 'see', 'look', 'watch', 'listen',
    'hear', 'speak', 'say', 'tell', 'talk', 'ask', 'answer', 'read', 'write', 'work',
    'play', 'live', 'stay', 'sit', 'stand', 'walk', 'run', 'sleep', 'wake', 'get up',
    'open', 'close', 'start', 'stop', 'begin', 'end', 'finish', 'like', 'love', 'want',
    'need', 'know', 'think', 'understand', 'remember', 'forget', 'learn', 'teach', 'help', 'give',
    'take', 'bring', 'buy', 'sell', 'pay', 'cost', 'use', 'try', 'find', 'lose',

    // Places & Locations (40 words)
    'place', 'city', 'town', 'village', 'country', 'street', 'road', 'shop', 'store', 'supermarket',
    'bank', 'post office', 'hospital', 'school', 'university', 'library', 'museum', 'park', 'beach', 'sea',
    'mountain', 'river', 'lake', 'forest', 'farm', 'airport', 'station', 'hotel', 'church', 'office',
    'here', 'there', 'where', 'near', 'far', 'next to', 'in front of', 'behind', 'between', 'opposite',

    // Weather & Nature (20 words)
    'weather', 'sun', 'rain', 'snow', 'wind', 'cloud', 'sky', 'hot', 'warm', 'cool',
    'cold', 'sunny', 'rainy', 'snowy', 'windy', 'cloudy', 'tree', 'flower', 'grass', 'animal',

    // Other Common Words (60 words)
    'thing', 'something', 'nothing', 'everything', 'anyone', 'someone', 'everyone', 'no one', 'some', 'any',
    'all', 'many', 'much', 'few', 'little', 'more', 'less', 'most', 'very', 'too',
    'also', 'only', 'but', 'because', 'if', 'when', 'where', 'what', 'who', 'how',
    'why', 'which', 'this', 'that', 'these', 'those', 'here', 'there', 'now', 'then',
    'before', 'after', 'again', 'always', 'never', 'sometimes', 'often', 'usually', 'maybe', 'perhaps',
    'right', 'wrong', 'true', 'false', 'same', 'different', 'other', 'another', 'next', 'last'
  ]
};

// Add more levels (A2, B1, B2, C1, C2) with ~500-1000 words each
// Total target: 8000-10000 words to match German vocabulary

async function collectEnglishVocabulary() {
  const client = await pool.connect();

  try {
    console.log('📚 Collecting English vocabulary (A1-C2)...\n');

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const [level, words] of Object.entries(ENGLISH_VOCABULARY)) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📖 Processing level ${level} (${words.length} words)...`);
      console.log('='.repeat(70));

      let levelInserted = 0;
      let levelSkipped = 0;

      for (const word of words) {
        try {
          await client.query(`
            INSERT INTO source_words_english (word, level)
            VALUES ($1, $2)
            ON CONFLICT (word) DO NOTHING
          `, [word, level]);

          const check = await client.query(
            'SELECT id FROM source_words_english WHERE word = $1',
            [word]
          );

          if (check.rows.length > 0) {
            levelInserted++;
            totalInserted++;
          } else {
            levelSkipped++;
            totalSkipped++;
          }

          if (levelInserted % 50 === 0 && levelInserted > 0) {
            console.log(`   ✅ Progress: ${levelInserted}/${words.length} words`);
          }

        } catch (error) {
          console.error(`   ❌ Error inserting "${word}":`, error.message);
          levelSkipped++;
          totalSkipped++;
        }
      }

      console.log(`\n✅ ${level} complete: ${levelInserted} added, ${levelSkipped} skipped`);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('🎉 English vocabulary collection complete!');
    console.log(`📊 Total: ${totalInserted} words added, ${totalSkipped} skipped`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

collectEnglishVocabulary().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
