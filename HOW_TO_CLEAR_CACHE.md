# 🔄 Как очистить кеш браузера после обновления

## Проблема

После деплоя v5.4.14 браузер может показывать старые данные из кеша.

**Признаки:**
- API возвращает правильные данные (German word sets для test.de.es)
- Но в UI показываются старые данные
- Версия в футере правильная (5.4.14), но контент старый

---

## ✅ Решение: Очистить кеш

### Вариант 1: Hard Refresh (Быстрый)

**Chrome/Edge:**
- Windows: `Ctrl + Shift + R` или `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**
- Windows: `Ctrl + Shift + R` или `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Safari:**
- Mac: `Cmd + Option + R`

---

### Вариант 2: Очистить весь кеш (Полный)

#### Chrome/Edge

1. Откройте DevTools: `F12` или `Ctrl + Shift + I`
2. Правый клик на кнопке Refresh (⟳)
3. Выберите "Empty Cache and Hard Reload"

**ИЛИ:**

1. `Ctrl + Shift + Delete`
2. Выберите "Cached images and files"
3. Time range: "Last hour" (или "All time")
4. Нажмите "Clear data"

#### Firefox

1. `Ctrl + Shift + Delete`
2. Выберите "Cache"
3. Time range: "Last hour"
4. Нажмите "Clear Now"

#### Safari

1. `Cmd + ,` (Settings)
2. Advanced → Show Develop menu
3. Develop → Empty Caches

---

### Вариант 3: Private/Incognito режим

Откройте в приватном режиме для тестирования:

**Chrome/Edge:** `Ctrl + Shift + N`
**Firefox:** `Ctrl + Shift + P`
**Safari:** `Cmd + Shift + N`

---

## 🧪 Проверка что кеш очищен

### 1. Откройте DevTools Console

Press `F12` → Console tab

### 2. Проверьте что API возвращает German

```javascript
fetch('https://lexybooster.com/api/word-sets?languagePair=de-es')
  .then(r => r.json())
  .then(sets => {
    console.log('First set:', sets[0].title);
    console.log('Language:', sets[0].source_language);
  });
```

**Ожидаемый результат:**
```
First set: German A1: Essential Vocabulary 1
Language: german
```

### 3. Проверьте Network tab

1. Откройте DevTools → Network tab
2. Обновите страницу (`F5`)
3. Найдите запрос к `/api/word-sets?languagePair=de-es`
4. Кликните на него → Preview
5. Убедитесь что `source_language: "german"`

---

## ⚙️ Отключить кеш в DevTools (для разработки)

1. Откройте DevTools (`F12`)
2. Settings (⚙️) → Preferences
3. ✅ Включите "Disable cache (while DevTools is open)"
4. Теперь при открытом DevTools кеш всегда отключен

---

## 📋 Чек-лист проверки

После очистки кеша проверьте:

- [ ] Войдите как `test.de.es@lexibooster.test` / `test123`
- [ ] Откройте Word Lists
- [ ] Убедитесь что показываются **German** word sets
- [ ] Первый набор: "German A1: Essential Vocabulary 1" ✅
- [ ] НЕ "Spanish A1: ..." ❌

---

## 🐛 Если проблема осталась

Если после очистки кеша всё еще видите испанские слова:

1. Откройте Console (F12)
2. Посмотрите на логи:
   ```
   📋 [WORD-SETS] languagePair=de-es → showing german word sets
   ✅ [WORD-SETS] Word sets loaded: (134) [...]
   ```

3. Убедитесь что нет ошибок JavaScript

4. Проверьте Network tab - какой URL запрашивается

5. Сделайте скриншот Console и отправьте для анализа

---

**Обновлено:** 2026-01-06
**Версия:** v5.4.14
