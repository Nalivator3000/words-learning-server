# Pixel Data Analysis Scripts

Скрипты для анализа CSV файлов с данными о транзакциях пользователей (pixel tracking data).

## Структура данных

CSV файлы содержат следующие ключевые поля:
- `EXTERNAL_USER_ID` - уникальный идентификатор пользователя
- `EVENT_TS` - timestamp события (формат: "2025-11-19 13:11:23 +0000 UTC")
- `TYPE` - тип события (deposit)
- `DEPOSIT_AMOUNT` - сумма депозита в исходной валюте
- `CURRENCY` - валюта депозита (например, INR)
- `CONVERTED_AMOUNT` - сумма в USD
- `COUNTRY`, `REGION`, `CITY` - географические данные
- и другие поля...

## Скрипты

### 1. Извлечение уникальных пользователей

**Файл:** `1-extract-unique-users.js`

**Назначение:** Извлекает список уникальных user ID из CSV файла.

**Использование:**
```bash
node 1-extract-unique-users.js <input-csv-file> [output-file]
```

**Примеры:**
```bash
# Сохранить в файл
node 1-extract-unique-users.js pixels-data.csv unique-users.txt

# Вывести в консоль
node 1-extract-unique-users.js pixels-data.csv
```

**Результат:**
- Список уникальных user ID (по одному на строку)
- Статистика: количество транзакций, уникальных пользователей, среднее количество транзакций на пользователя

---

### 2. Поиск транзакций по списку пользователей

**Файл:** `2-find-user-transactions.js`

**Назначение:** Находит все транзакции для указанного списка user ID.

**Использование:**
```bash
node 2-find-user-transactions.js <input-csv-file> <user-ids-file> [output-file]
```

**Формат user-ids-file:** Один user ID на строку

**Примеры:**
```bash
# Сохранить в CSV файл
node 2-find-user-transactions.js pixels-data.csv user-ids.txt user-transactions.csv

# Вывести в консоль
node 2-find-user-transactions.js pixels-data.csv user-ids.txt
```

**Результат:**
- CSV файл со всеми транзакциями найденных пользователей
- Статистика:
  - Количество найденных пользователей
  - Пользователи без транзакций
  - Общая сумма депозитов
  - Топ-10 пользователей по количеству транзакций

---

### 3. Поиск пользователей без ранних транзакций

**Файл:** `3-find-users-without-early-transactions.js`

**Назначение:** Находит пользователей, у которых первая транзакция произошла НЕ РАНЬШЕ указанной даты (т.е. первая транзакция в указанную дату или позже).

**Использование:**
```bash
node 3-find-users-without-early-transactions.js <input-csv-file> <cutoff-date> [output-file]
```

**Форматы даты:**
- `"2025-11-19 13:15:00"` - с точным временем
- `"2025-11-19"` - только дата

**Примеры:**
```bash
# Найти пользователей, чья первая транзакция была 19 ноября 2025 в 13:15 или позже
node 3-find-users-without-early-transactions.js pixels-data.csv "2025-11-19 13:15:00" users-after-date.txt

# Найти пользователей, чья первая транзакция была 19 ноября или позже
node 3-find-users-without-early-transactions.js pixels-data.csv "2025-11-19" users-after-date.txt
```

**Результат:**
- Файл с user ID и датой первой транзакции (разделены табуляцией)
- Статистика:
  - Количество пользователей с первой транзакцией до cutoff date
  - Количество пользователей с первой транзакцией после cutoff date
  - Процентное соотношение
  - Диапазон дат первых транзакций

---

## Типичные сценарии использования

### Сценарий 1: Базовый анализ файла
```bash
# 1. Получить список уникальных пользователей
node 1-extract-unique-users.js pixels-019abc80.csv all-users.txt

# 2. Посмотреть статистику
cat all-users.txt | wc -l
```

### Сценарий 2: Анализ конкретных пользователей
```bash
# 1. Создать файл с интересующими user ID
echo "f0abbc56-ea95-470a-bfbf-daceb6bf6526" > target-users.txt
echo "f546a187-4fee-44b8-9349-85d80263d717" >> target-users.txt

# 2. Найти их транзакции
node 2-find-user-transactions.js pixels-019abc80.csv target-users.txt transactions.csv

# 3. Проанализировать результат
cat transactions.csv
```

### Сценарий 3: Сегментация по времени регистрации
```bash
# Найти "новых" пользователей (зарегистрировались после 13:15)
node 3-find-users-without-early-transactions.js pixels-019abc80.csv "2025-11-19 13:15:00" new-users.txt

# Найти их транзакции
node 2-find-user-transactions.js pixels-019abc80.csv new-users.txt new-users-transactions.csv
```

### Сценарий 4: Объединение нескольких файлов
```bash
# 1. Извлечь уникальных пользователей из нескольких файлов
node 1-extract-unique-users.js pixels-file1.csv users1.txt
node 1-extract-unique-users.js pixels-file2.csv users2.txt

# 2. Объединить списки и удалить дубликаты
cat users1.txt users2.txt | sort -u > all-unique-users.txt

# 3. Найти транзакции во всех файлах
node 2-find-user-transactions.js pixels-file1.csv all-unique-users.txt trans1.csv
node 2-find-user-transactions.js pixels-file2.csv all-unique-users.txt trans2.csv
```

---

## Технические детали

### Парсинг CSV
Скрипты используют custom CSV parser, который корректно обрабатывает:
- Поля в кавычках
- Запятые внутри кавычек
- Пустые значения

### Парсинг дат
Формат: `"2025-11-19 13:11:23 +0000 UTC"`
- Поддерживаются часовые пояса
- Можно указывать только дату без времени

### Производительность
- Скрипты читают весь файл в память
- Для больших файлов (>1GB) может потребоваться увеличить лимит памяти Node.js:
```bash
node --max-old-space-size=4096 1-extract-unique-users.js large-file.csv
```

### Обработка ошибок
- Проверка существования файлов
- Валидация формата данных
- Информативные сообщения об ошибках

---

## Требования

- Node.js версии 12 или выше
- Только встроенные модули Node.js (fs, path)
- Нет внешних зависимостей

---

## Формат выходных файлов

### unique-users.txt
```
f0abbc56-ea95-470a-bfbf-daceb6bf6526
f546a187-4fee-44b8-9349-85d80263d717
bd70ce4b-b3fa-4b5d-8804-d1acc0152e71
...
```

### user-transactions.csv
```
ID,PIXEL_ID,ADVERTISER_ID,EXTERNAL_USER_ID,EVENT_TS,DEPOSIT_AMOUNT,...
019a9c3e-1930-72ad-9d0f-c82391cd2346,5,1,f0abbc56-ea95-470a-bfbf-daceb6bf6526,2025-11-19 13:11:23 +0000 UTC,1000,...
...
```

### users-after-date.txt
```
f0abbc56-ea95-470a-bfbf-daceb6bf6526	2025-11-19 13:15:30 +0000 UTC
bd70ce4b-b3fa-4b5d-8804-d1acc0152e71	2025-11-19 13:16:15 +0000 UTC
...
```
(формат: USER_ID<tab>FIRST_TRANSACTION_TIMESTAMP)
