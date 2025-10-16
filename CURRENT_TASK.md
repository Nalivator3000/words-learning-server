# ТЕКУЩАЯ ЗАДАЧА: Дизайн-система на основе Tailwind CSS / UnoCSS

## КОНТЕКСТ
Проект использует множество кастомных CSS переменных и inline стилей. Для улучшения поддерживаемости, скорости разработки и единообразия дизайна нужно перейти на modern utility-first CSS framework.

## ЦЕЛЬ
Интегрировать Tailwind CSS или UnoCSS для замены текущих CSS переменных на единую дизайн-систему.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Выбор фреймворка
Оценить два варианта:

**Tailwind CSS:**
- ✅ Более популярен, больше документации
- ✅ Богатая экосистема плагинов
- ✅ Встроенная темная тема (dark:)
- ❌ Больший bundle size
- ❌ Requires Node.js build step

**UnoCSS:**
- ✅ Более быстрый (instant on-demand)
- ✅ Меньший bundle size
- ✅ Поддержка Tailwind syntax + custom shortcuts
- ✅ Zero-config dark mode
- ❌ Меньше community resources

**Рекомендация:** UnoCSS для production (быстрее, легче), но можно начать с Tailwind для простоты.

### 2. Установка и настройка

```bash
# Вариант 1: Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init

# Вариант 2: UnoCSS
npm install -D unocss
```

### 3. Конфигурация темы
Создать `tailwind.config.js` или `uno.config.js` с брендовыми цветами:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // поддержка dark mode через класс
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... (взять из текущих CSS переменных)
          900: '#0c4a6e'
        },
        accent: {
          // текущий accent color
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        // glassmorphism shadows
      }
    }
  }
}
```

### 4. Миграция CSS переменных
Найти все CSS переменные в `style.css` и заменить на Tailwind utilities:

**До:**
```css
.card {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}
```

**После:**
```html
<div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-glass">
  <!-- card content -->
</div>
```

### 5. Поэтапная замена классов
- Начать с простых компонентов (buttons, cards)
- Заменить margin/padding на Tailwind spacing (m-4, p-6)
- Заменить цвета на Tailwind color palette
- Заменить flexbox/grid на Tailwind layout utilities
- Оставить сложные анимации в отдельном CSS файле (animations.css)

### 6. Build процесс
Обновить `package.json` для сборки CSS:

```json
{
  "scripts": {
    "build:css": "tailwindcss -i ./public/css/input.css -o ./public/css/output.css --watch",
    "dev": "npm run build:css & node server-postgresql.js"
  }
}
```

### 7. Оптимизация production
- PurgeCSS для удаления неиспользуемых стилей
- Минификация CSS
- CDN для production (если нужен zero-config)

### 8. Тестирование
- Проверить все страницы в light/dark theme
- Проверить responsive на mobile/tablet/desktop
- Убедиться, что glassmorphism эффекты сохранены
- Проверить анимации (transitions, hover states)

## ВАЖНО
1. Обновить `PLAN.md`: заменить `[ ]` на `[>]` для задачи "Дизайн-система"
2. НЕ удалять старый CSS сразу - делать постепенную миграцию
3. Сохранить все кастомные анимации (@keyframes)
4. Сохранить glassmorphism эффекты (backdrop-filter)

## ГОТОВО КОГДА
- [ ] Tailwind/UnoCSS установлен и настроен
- [ ] Конфигурация темы создана с брендовыми цветами
- [ ] Хотя бы 5 компонентов мигрированы (buttons, cards, header, nav, footer)
- [ ] Dark mode работает корректно
- [ ] Build процесс настроен
- [ ] PLAN.md обновлен ([>] → [x] статус)
- [ ] Код готов к коммиту

## АЛЬТЕРНАТИВНЫЙ ПОДХОД (OPTIONAL)
Если полная миграция слишком масштабна для одной итерации, можно начать с:
1. Установить Tailwind CDN (для быстрого старта без build step)
2. Создать utility классы для 10 самых используемых паттернов
3. Мигрировать только критичные компоненты (header, cards)
4. Оставить остальное на следующие итерации

Это позволит быстрее получить результат и оценить преимущества.
