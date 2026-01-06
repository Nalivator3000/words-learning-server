# Экспорт немецких данных из приложения

Дата экспорта: **2 января 2026 г.**

## Сводная информация

### Немецкие слова
- **Всего слов в базе данных**: 8,368 слов
- **Слов с темами**: 8,368 (100%)
- **Слов с примерами**: 8,368 (100%)

### Наборы слов
- **Всего наборов**: 151 набор
- **Всего слов во всех наборах**: 150 слов

## Созданные файлы

### 1. `german-source-words.json`
**Размер**: ~2.6 МБ

Полный список всех 8,368 немецких слов в формате JSON. Каждое слово содержит:
- `id` - уникальный идентификатор
- `word` - немецкое слово
- `theme` - тема (например, "greetings", "food", "health")
- `level` - уровень сложности (beginner, A1, A2, B1, B2, C1, C2)
- `pos` - часть речи
- `gender` - род (для существительных)
- `example_de` - пример использования на немецком языке
- `metadata` - дополнительные метаданные
- `created_at`, `updated_at` - временные метки

### 2. `german-source-words.txt`
**Размер**: ~1.1 МБ

Тот же список слов в удобном текстовом формате для просмотра. Формат:
```
1. Hallo
   Тема: greetings
   Уровень: beginner
   Пример: Hallo! Wie geht es dir?
```

### 3. `german-word-sets.json`
**Размер**: ~75 КБ

Все 151 набор слов в формате JSON с полной информацией:
- Метаданные набора (название, описание, уровень, тема)
- Список слов в каждом наборе с их ID

### 4. `german-word-sets.txt`
**Размер**: ~61 КБ

Наборы слов в текстовом формате для удобного просмотра.

### 5. `german-translations.json`
**Размер**: ~292 байт

Переводы на другие языки (в текущей версии базы данных переводы хранятся в других таблицах).

### 6. `german-export-summary.json`
**Размер**: ~29 КБ

Сводная статистика экспорта в JSON формате.

## Структура наборов слов

### По уровням сложности:

#### Уровень A1 (начальный)
- German A1 - 1 набор (30 слов)
- German A1: Essential Vocabulary (части 1-10) - 10 наборов
- German A1: Food and Drinks - тематический набор
- German A1: People & Relationships - тематический набор
- German A1: Days, Months, Time - тематический набор
- И другие тематические наборы...

#### Уровень A2 (элементарный)
- German A2 - 1 набор (30 слов)
- German A2: Essential Vocabulary (части 1-6) - 6 наборов
- Тематические наборы: health, food, communication, work, education, travel

#### Уровень B1 (средний)
- German B1 - 1 набор (30 слов)
- German B1: Essential Vocabulary (части 1-5) - 5 наборов
- Тематические наборы: work, Soziale Beziehungen, Arbeit und Beruf, Money and Finance, Culture and Arts

#### Уровень B2 (выше среднего)
- German B2 - 1 набор (30 слов)
- German B2: Essential Vocabulary (части 1-3) - 3 набора
- Специализированные темы: communication, work, politics, health, science, culture, law, philosophy, economics, environment, psychology

#### Уровень C1 (продвинутый)
- German C1 - 1 набор
- German C1: Essential Vocabulary (части 1-2) - 2 набора
- Академические темы: education, culture, work, politics, economics, medicine, science, philosophy, psychology, sociology, law, environment

#### Уровень C2 (профессиональный)
- German C2 - 1 набор
- German C2: Essential Vocabulary (части 1-8) - 8 наборов
- Специализированные темы:
  - Cutting-Edge Technology & Innovation
  - Advanced Psychology & Human Behavior
  - Ethics & Moral Philosophy
  - Religion & Theology
  - Linguistic Theory & Communication Science
  - Musicology & Music Theory
  - Advanced Business & Management
  - Astronomy & Cosmology
  - Geography & Geopolitics
  - Film & Media Theory
  - Advanced Chemistry & Physics
  - Historical & Archaeological Terminology
  - Advanced Legal & Jurisprudence
  - Advanced Neuroscience & Cognitive Science
  - Advanced Cultural & Sociological Analysis

#### Общие наборы (без уровня)
- German - General
- German - Education
- German - Science
- German - Culture
- German - Politics
- German - Work
- German - Economics
- German - Law
- German - Philosophy
- German - Communication

## Примеры слов

### Базовые слова (beginner/A1):
- Hallo - Привет
- Danke - Спасибо
- Bitte - Пожалуйста
- Guten Morgen - Доброе утро
- Tschüss - Пока

### Слова с примерами:
**Hallo**
- Пример: "Hallo! Wie geht es dir?"
- Тема: greetings
- Уровень: beginner

**Danke**
- Пример: "Danke für deine Hilfe!"
- Тема: greetings
- Уровень: beginner

## Как использовать эти файлы

1. **Для просмотра**: Откройте `.txt` файлы в любом текстовом редакторе
2. **Для анализа**: Используйте `.json` файлы для программной обработки
3. **Для импорта**: JSON файлы можно импортировать в другие приложения или базы данных

## Техническая информация

- **База данных**: PostgreSQL
- **Таблица слов**: `source_words_german`
- **Таблица наборов**: `word_sets`
- **Таблица элементов наборов**: `word_set_items`
- **Дата экспорта**: 2026-01-02T21:56:48.994Z

## Замечания

⚠️ **Важно**: Большинство наборов слов (147 из 151) в настоящее время пустые (word_count = 0). Только 4 набора содержат слова:
- German A1: 30 слов
- German A2: 30 слов
- German B1: 30 слов
- German B2: 30 слов
- German beginner: 30 слов

Всего заполнено: 150 слов в наборах

Это может означать, что наборы созданы, но слова в них еще не добавлены, или требуется дополнительная настройка для их заполнения.
