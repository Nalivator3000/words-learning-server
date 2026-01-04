# Cloudinary TTS Cache - Быстрый старт

## За 5 минут

### 1. Регистрация (2 минуты)

Откройте: https://cloudinary.com/users/register_free

- Sign up with Google (быстрее всего)
- Или Email + Password

### 2. Получите ключи (1 минута)

После регистрации на Dashboard скопируйте:

```
Cloud name: ваше-имя-облака
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz1234
```

### 3. Добавьте в Railway (2 минуты)

Railway → words-learning-server → Variables → New Variable:

```env
CLOUDINARY_CLOUD_NAME=ваше-имя-облака
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz1234
CLOUDINARY_FOLDER=tts-audio
```

**Готово!** Railway автоматически задеплоит (~3-5 минут)

## Проверка работы

### 1. Проверьте API:

```bash
curl https://lexybooster.com/api/tts/cache/stats
```

Ожидаемый ответ:
```json
{
  "cloudinary": { "enabled": true }
}
```

### 2. Протестируйте озвучку:

1. Откройте https://lexybooster.com
2. Войдите → Запустите квиз
3. Нажмите 🔊 на несколько слов

### 3. Проверьте Cloudinary:

Откройте: https://cloudinary.com/console/media_library/folders/tts-audio

Должны появиться `.mp3` файлы!

## Что дальше?

- 📖 Полная документация: [CLOUDINARY_TTS_SETUP.md](CLOUDINARY_TTS_SETUP.md)
- 🎵 Админка для прелоадинга: https://lexybooster.com/admin-audio-preload.html
- 📊 Мониторинг квоты: https://cloudinary.com/console/usage

## Проблемы?

**"enabled": false** → Проверьте переменные в Railway, передеплойте

**Файлы не появляются** → Проверьте логи Railway на ошибки

**Invalid API key** → API Secret скопирован полностью? Без лишних пробелов?

---

Бесплатно: **25 GB хранилища** + **25 GB трафика/месяц** 🎉
