# ТЕКУЩАЯ ЗАДАЧА: Offline поддержка для TTS

## КОНТЕКСТ
В предыдущей итерации мы создали TTS fallback систему с кешированием. Теперь нужно добавить полноценную offline поддержку - загрузку и хранение аудио файлов для часто используемых слов.

## ЦЕЛЬ
Реализовать систему предзагрузки и offline воспроизведения аудио для наиболее популярных слов.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Backend: Bulk TTS синтез для популярных слов
Создать endpoint для массового синтеза:

```
POST /api/tts/bulk-synthesize
Body: {
  words: [{ text: string, language: string }],
  userId: number
}

Response: {
  synthesized: number,
  cached: number,
  errors: number
}
```

### 2. Backend: Статистика популярных слов
Endpoint для определения топ-100 слов пользователя:

```
GET /api/words/popular/:userId?limit=100

Response: [
  { text: string, language: string, usage_count: number }
]
```

### 3. Frontend: Service Worker для offline кеша
Обновить `service-worker.js`:
- Кеширование audio responses
- Cache API для аудио файлов
- Fallback на cached audio при offline

### 4. Frontend: UI для управления offline кешем
Добавить в Settings:
- Кнопка "Загрузить топ-100 слов для offline"
- Прогресс-бар загрузки
- Показать размер offline кеша
- Кнопка очистки кеша

### 5. Автоматическая предзагрузка
- При добавлении новых слов автоматически синтезировать audio
- Сохранять в IndexedDB для offline доступа

## ВАЖНО
1. Обновить `PLAN.md`: заменить `[ ]` на `[>]` для задачи "Offline поддержка"
2. Использовать IndexedDB для хранения audio (больше объем чем localStorage)
3. Ограничить размер кеша (например, 50MB)

## ГОТОВО КОГДА
- [ ] Bulk synthesize endpoint работает
- [ ] Popular words endpoint реализован
- [ ] Service Worker обновлен
- [ ] UI для offline кеша добавлен
- [ ] PLAN.md обновлен ([>] статус)
- [ ] Код готов к коммиту
