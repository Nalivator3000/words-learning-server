# Google Drive TTS Cache Setup

Эта система позволяет сохранять аудиофайлы TTS на Google Drive для экономии на Google Cloud TTS API.

## Преимущества

- **Экономия**: Каждое аудио генерируется только 1 раз, затем берётся из кэша
- **Постоянство**: Кэш не теряется при деплоях Railway (в отличие от локального кэша)
- **Бесплатно**: Используется ваш Google Drive тариф (2TB)
- **Быстро**: Локальный кэш → Google Drive → Генерация (в порядке приоритета)

## Как работает

1. **Запрос аудио** → Проверяем локальный кэш (быстро)
2. **Не найдено** → Проверяем Google Drive (дешевле генерации)
3. **Не найдено** → Генерируем через Google TTS API
4. **Сохраняем** → В локальный кэш + загружаем на Google Drive

## Настройка Google Drive API

### 1. Создайте проект в Google Cloud Console

1. Перейдите: https://console.cloud.google.com/
2. Выберите проект или создайте новый: `LexiBooster Audio Cache`

### 2. Включите Google Drive API

1. Перейдите: **APIs & Services** → **Library**
2. Найдите: `Google Drive API`
3. Нажмите: **Enable**

### 3. Создайте Service Account

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **Service Account**
3. Заполните:
   - Name: `lexybooster-tts-cache`
   - Role: `Basic` → `Editor`
4. **Create and Continue** → **Done**

### 4. Создайте ключ JSON

1. Нажмите на созданный service account
2. Вкладка **Keys** → **Add Key** → **Create new key**
3. Тип: **JSON**
4. Скачайте файл (например, `lexybooster-tts-cache-key.json`)

### 5. Создайте папку на Google Drive

1. Откройте: https://drive.google.com/
2. Создайте папку: `LexiBooster-TTS-Cache`
3. Правой кнопкой → **Share**
4. Добавьте email из service account JSON (`client_email`):
   - Формат: `xxx@xxx.iam.gserviceaccount.com`
   - Права: **Editor**
5. Скопируйте **ID папки** из URL:
   - URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

### 6. Настройте переменные окружения на Railway

1. Перейдите на Railway Dashboard: https://railway.app/
2. Выберите проект: `words-learning-server`
3. Вкладка: **Variables**
4. Добавьте 2 переменные:

```bash
GOOGLE_DRIVE_CREDENTIALS_JSON={"type":"service_account","project_id":"...весь JSON из файла..."}
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
```

**ВАЖНО**:
- `GOOGLE_DRIVE_CREDENTIALS_JSON` должен быть **одной строкой** (весь JSON без переносов)
- `GOOGLE_DRIVE_FOLDER_ID` - это ID папки из URL

### 7. Деплой

После добавления переменных Railway автоматически передеплоит приложение.

## Проверка работы

### Локально (если настроите .env)

```bash
# Установите переменные в .env
echo 'GOOGLE_DRIVE_CREDENTIALS_JSON={"type":"service_account",...}' >> .env
echo 'GOOGLE_DRIVE_FOLDER_ID=your_folder_id' >> .env

# Запустите сервер
npm start

# В логах увидите:
# ✅ Google Drive cache initialized successfully
```

### На production

```bash
# Проверьте статистику кэша
node clear-tts-cache.js https://words-learning-server-production.up.railway.app

# Очистите только локальный кэш (оставьте Drive нетронутым)
node clear-tts-cache.js https://words-learning-server-production.up.railway.app local

# Очистите оба кэша
node clear-tts-cache.js https://words-learning-server-production.up.railway.app all
```

## API Endpoints

### Статистика кэша

```bash
GET /api/tts/cache/stats

# Ответ:
{
  "local": {
    "cached_items": 0,
    "total_size_bytes": 0,
    "total_size_mb": "0.00"
  },
  "google_drive": {
    "enabled": true,
    "cached_items": 245,
    "total_size_mb": "12.34"
  }
}
```

### Очистка кэша

```bash
DELETE /api/tts/cache/clear?location=local   # Только локальный
DELETE /api/tts/cache/clear?location=drive   # Только Google Drive
DELETE /api/tts/cache/clear?location=all     # Оба
```

## Мониторинг расходов

### Google Cloud TTS API

- Цена: ~$4 за 1 млн символов
- После кэширования: практически $0

### Google Drive Storage

- Ваш тариф: 2TB (оплачен)
- 1000 аудиофайлов ≈ 50MB
- 20,000 аудиофайлов ≈ 1GB
- Ваш лимит: 2,000,000 файлов (~100GB)

## Логи для отладки

Сервер логирует:

```
🔍 Checking Google Drive cache for: "Hallo"
☁️ Serving from Google Drive cache: "Hallo"
   ☁️ Uploaded to Google Drive
```

или

```
🔊 Generating TTS for: "Hallo" (de-DE)
✅ Audio generated and cached locally: abc123.mp3 (voice: de-DE-Neural2-C)
   ☁️ Uploaded to Google Drive
```

## Troubleshooting

### "Google Drive cache not configured"

- Проверьте, что `GOOGLE_DRIVE_CREDENTIALS_JSON` и `GOOGLE_DRIVE_FOLDER_ID` добавлены в Railway Variables
- Убедитесь, что JSON корректен (используйте JSON validator)

### "Failed to initialize Google Drive cache"

- Проверьте, что service account имеет доступ к папке
- Email service account должен быть добавлен в "Share" папки с правами Editor

### Аудио не кэшируется на Drive

- Проверьте логи: должно быть "Uploaded to Google Drive"
- Проверьте папку на Google Drive - должны появляться файлы вида `abc123-de-DE.mp3`
