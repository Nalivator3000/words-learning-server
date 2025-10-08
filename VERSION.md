# Automatic Version Management

Система автоматического обновления версии приложения.

## Формат версии

```
v[MAJOR].[MINOR].[PATCH]-[FEATURE]-[COMMIT_HASH]
```

**Пример:** `v5.0.0-SERVER-AUTH-9c02b5a`

- `5.0.0` - версия из package.json
- `SERVER-AUTH` - тип фичи (извлекается из коммита)
- `9c02b5a` - короткий хеш коммита

## Типы фичи (автоматически)

Скрипт определяет тип по эмодзи в коммите:

| Эмодзи | Тип | Описание |
|--------|-----|----------|
| 🔐 | AUTH | Аутентификация/безопасность |
| 📌 | VERSION | Обновление версии |
| 🚀 | DEPLOY | Деплой/релиз |
| ✨ | FEATURE | Новая функция |
| 🐛 | FIX | Исправление бага |
| 🔧 | CONFIG | Конфигурация |
| 🎨 | UI | Изменения интерфейса |
| ♻️ | REFACTOR | Рефакторинг |
| ⚡ | PERF | Оптимизация |
| 🗄️ | DB | База данных |
| 📝 | DOCS | Документация |

## Использование

### Вариант 1: Ручное обновление

```bash
npm run version
```

### Вариант 2: Автоматически при коммите

```bash
# Windows Git Bash
./git-commit.sh "🔐 AUTH: Add JWT tokens"

# Или вручную:
npm run version
git add .
git commit -m "Your message"
git push
```

### Вариант 3: Claude автоматически

Claude будет автоматически:
1. Обновлять версию перед каждым коммитом
2. Добавлять изменения в index.html
3. Коммитить с правильным форматом
4. Пушить на GitHub

## Файлы

- `update-version.js` - основной скрипт обновления
- `git-commit.sh` - хелпер для коммитов (опционально)
- `package.json` - содержит npm скрипты
- `public/index.html` - отображает версию пользователю

## Где отображается версия

1. **В футере интерфейса** (правый нижний угол)
2. **В мета-теге HTML** (для кеширования)
3. **В логах Railway** (автоматически из коммита)

## Примеры коммитов

```bash
# Хорошо ✅
🔐 SERVER AUTH: PostgreSQL user authentication system
✨ FEATURE: Add word building game mode
🐛 FIX: Resolve scoring calculation issue

# Плохо ❌
Fixed bug
Update code
Changes
```

## Автоматизация в Claude

Claude всегда будет:

```javascript
// 1. Обновить версию
await bash('npm run version')

// 2. Закоммитить с эмодзи
await bash('git add . && git commit -m "🔐 AUTH: ..."')

// 3. Запушить
await bash('git push')
```

Версия автоматически обновится в интерфейсе!
