# Как запустить миграцию Hindi POS

## Статус

✅ Код запушен в `develop` (commit 289f9c8)
⏳ Ожидается деплой на Railway (~2-3 минуты с момента пуша)

## Когда деплой завершится

Запустить миграцию можно **одной командой**:

```bash
curl -X POST https://words-learning-server-production.up.railway.app/api/migrate-hindi-pos
```

## Ожидаемый результат

Если миграция выполнится успешно:

```json
{
  "success": true,
  "message": "Migration completed successfully",
  "stats": {
    "total": "15000",        // общее количество слов
    "with_pos": "0",          // слов с POS (пока 0)
    "without_pos": "15000"    // слов без POS
  },
  "sample_data": [
    {
      "id": 1,
      "word": "अच्छा",
      "pos": null,
      "level": "A1",
      "theme": "general"
    },
    // ... еще 4 примера
  ]
}
```

Если колонка уже существует:

```json
{
  "success": true,
  "already_exists": true,
  "message": "Column pos already exists",
  "stats": {
    "total": "15000",
    "with_pos": "0",
    "without_pos": "15000"
  }
}
```

## Проверка деплоя

Чтобы проверить, задеплоился ли новый код:

```bash
curl -s https://words-learning-server-production.up.railway.app/ | grep -o "v[0-9]\+\.[0-9]\+\.[0-9]\+"
```

Должно вернуть: `v5.4.21` (или выше)

Если возвращает `v5.4.0` - деплой еще не завершен, подождите еще минуту.

## После миграции

После успешной миграции протестируйте Hindi word sets:

```bash
node test-hindi-word-sets-api.js
```

Должны увидеть:
```
✅ TEST PASSED: No Russian characters detected
```

## Если что-то пойдет не так

Если миграция вернет ошибку, проверьте логи Railway или напишите мне - я помогу разобраться.

## Удаление временного endpoint

После успешной миграции можно удалить endpoint `/api/migrate-hindi-pos` из `server-postgresql.js` (строки 17843-17941).
