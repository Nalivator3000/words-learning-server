# ТЕКУЩАЯ ЗАДАЧА: Fallback стратегия для TTS

## КОНТЕКСТ
Сейчас приложение использует нативный Web Speech API браузера для озвучки слов. Проблема: не у всех пользователей есть качественные голоса для всех языков. Нужна fallback система, которая будет использовать облачные TTS API, если нативный голос недоступен или низкого качества.

## ЦЕЛЬ
Реализовать систему fallback для TTS с поддержкой нескольких облачных провайдеров.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Backend: API endpoint для TTS
Создать новый endpoint в `server-postgresql.js`:

```
POST /api/tts/synthesize
Body: {
  text: string,
  language: string, // 'de-DE', 'en-US', etc.
  provider?: string // 'google', 'azure', 'amazon', 'elevenlabs' (опционально)
}

Response: {
  audioUrl: string // URL для скачивания или base64
}
```

**Требования:**
- Поддержка минимум 2 провайдеров (например, Google Cloud TTS + Microsoft Azure)
- Выбор провайдера по приоритету (если не указан)
- Кеширование результатов (чтобы не запрашивать одно слово дважды)
- Error handling с fallback на другого провайдера

### 2. Frontend: Интеграция fallback логики
Обновить логику озвучки в `public/app.js` или `public/js/` (где находится TTS код):

```javascript
async function speakWord(text, language) {
  // 1. Попытка использовать Web Speech API
  const voices = window.speechSynthesis.getVoices();
  const bestVoice = selectBestVoice(language, voices);

  if (bestVoice && isGoodQuality(bestVoice)) {
    // Use native TTS
    return useNativeTTS(text, bestVoice);
  }

  // 2. Fallback на облачный TTS
  try {
    const response = await fetch('/api/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });

    const { audioUrl } = await response.json();
    // Play audio from URL
    return playAudioFromUrl(audioUrl);
  } catch (error) {
    console.error('TTS fallback failed:', error);
    // Show user-friendly error
  }
}
```

### 3. Конфигурация (environment variables)
Добавить в `.env` (или в config):
```
# Google Cloud TTS
GOOGLE_CLOUD_TTS_API_KEY=your_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project

# Azure Speech
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=westeurope

# Опционально: Amazon Polly, ElevenLabs
```

### 4. Кеширование
- Создать папку `cache/tts/` для хранения аудио файлов
- Формат кеша: `{language}_{text_hash}.mp3`
- Проверка кеша перед API запросом

### 5. UI индикация
- Показывать loader пока идет синтез
- Иконка-индикатор для облачного TTS (☁️ vs 📍 для локального)

## ВАЖНО
1. После выполнения обновить `PLAN.md`: заменить `[ ]` на `[>]` для этой задачи
2. Не коммитить API ключи в git
3. Добавить error handling для всех сетевых запросов
4. Тестировать с реальными данными

## ПРИОРИТЕТНЫЕ ПРОВАЙДЕРЫ
1. **Microsoft Azure Speech** (рекомендуется, есть бесплатный tier 500k chars/month)
2. **Google Cloud TTS** (высокое качество, платный)
3. Amazon Polly / ElevenLabs - опционально

## ГОТОВО КОГДА
- [ ] Backend endpoint работает
- [ ] Frontend интегрирован с fallback логикой
- [ ] Кеширование реализовано
- [ ] PLAN.md обновлен ([>] статус)
- [ ] Код готов к коммиту
