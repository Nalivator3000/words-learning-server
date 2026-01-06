# Инструкция по применению тем из Batch 2

## Статус
- ✅ Все 6 файлов с темами созданы (Russian, Arabic, Italian, Portuguese, Turkish, Ukrainian)
- ✅ SQL файл сгенерирован (`apply-batch2-themes.sql`)
- ⏳ Осталось применить SQL к базе данных на Railway

## Варианты применения

### Вариант 1: Через Railway CLI (Рекомендуется)
```bash
# Войти в Railway
railway login

# Выполнить скрипт
railway run node apply-themes-batch2-safe.js
```

### Вариант 2: Через Railway Dashboard
1. Откройте https://railway.app/
2. Перейдите в ваш проект → Database
3. Откройте Query tab
4. Скопируйте содержимое файла `apply-batch2-themes.sql`
5. Вставьте в Query editor
6. Нажмите Execute

### Вариант 3: Через psql (если установлен)
```bash
psql "postgresql://postgres:hJnNfZyWMLLILSPMXPLxskZxVhDZsBev@junction.proxy.rlwy.net:26930/railway" -f apply-batch2-themes.sql
```

## Что сделает SQL
- Обновит ~1500+ слов темами
- Только если тема NULL или 'general' (не перезапишет существующие темы)
- Все в одной транзакции (BEGIN...COMMIT)

## Файлы
- `themes-russian-batch2.json` - 370 слов
- `themes-arabic-batch2.json` - 285 слов
- `themes-italian-batch2.json` - ~350 слов
- `themes-portuguese-batch2.json` - ~300 слов
- `themes-turkish-batch2.json` - ~380 слов
- `themes-ukrainian-batch2.json` - ~150 слов

## После выполнения
Запустите проверку:
```bash
railway run node check-all-languages-status.js
```
