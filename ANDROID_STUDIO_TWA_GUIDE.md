# 📱 Android Studio TWA Guide - LexiBooster

## Пошаговое руководство по созданию Android APK через Android Studio

---

## 🎯 Что мы будем делать:

Создадим Trusted Web Activity (TWA) приложение, которое обернет ваше веб-приложение в нативный Android APK.

---

## 📋 Шаг 1: Открыть Android Studio

1. Запустите Android Studio
2. Если открывается проект - закройте его: **File → Close Project**
3. Вы увидите Welcome Screen

---

## 📦 Шаг 2: Создать новый проект

На Welcome Screen:

1. Нажмите **"New Project"**
2. В окне выбора шаблона:
   - Слева выберите категорию: **"Phone and Tablet"**
   - Найдите и выберите: **"No Activity"** (пустой проект)
   - Нажмите **"Next"**

⚠️ **Важно:** Выбираем "No Activity", потому что будем использовать готовый код TWA.

---

## 📝 Шаг 3: Настроить проект

Заполните поля:

**Name:**
```
LexiBooster
```

**Package name:**
```
com.lexibooster.app
```

⚠️ **КРИТИЧЕСКИ ВАЖНО:** Package name нельзя изменить после публикации в Google Play!

**Save location:**
```
C:\Users\Nalivator3000\LexiBooster-Android
```

**Language:**
```
Java
```

**Minimum SDK:**
```
API 21: Android 5.0 (Lollipop)
```
(Это покроет 99%+ всех Android устройств)

**Build configuration language:**
```
Groovy DSL (build.gradle)
```

Нажмите **"Finish"**

---

## ⏳ Шаг 4: Дождаться синхронизации

Android Studio будет:
1. Создавать файлы проекта
2. Скачивать Gradle (если нужно)
3. Синхронизировать зависимости

**Время:** 2-5 минут

Внизу экрана будет прогресс: "Gradle sync in progress..."

Дождитесь завершения! ⏰

---

## 📂 Шаг 5: Добавить зависимость TWA

Когда синхронизация завершится:

1. Слева в панели **Project** найдите и откройте:
   ```
   app → build.gradle
   ```
   (НЕ build.gradle (Project), а build.gradle (Module: app))

2. Найдите секцию `dependencies { ... }`

3. Добавьте в конец секции dependencies (перед закрывающей скобкой):
   ```gradle
   implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
   ```

4. Нажмите **"Sync Now"** в появившейся желтой плашке сверху

**Пример как должно выглядеть:**
```gradle
dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    // ... другие зависимости ...

    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
```

---

## 📄 Шаг 6: Создать LauncherActivity

1. В панели **Project** слева:
   ```
   app → src → main → java → com → lexibooster → app
   ```

2. Правой кнопкой на папке **app** → **New → Java Class**

3. Назовите класс:
   ```
   LauncherActivity
   ```

4. Нажмите **Enter**

5. Замените весь код в созданном файле на:

```java
package com.lexibooster.app;

import android.net.Uri;
import android.os.Bundle;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse("https://words-learning-server-copy-production.up.railway.app");
    }
}
```

6. Сохраните файл: **Ctrl + S**

---

## 📋 Шаг 7: Настроить AndroidManifest.xml

1. Откройте:
   ```
   app → src → main → AndroidManifest.xml
   ```

2. Замените весь содержимый файл на:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.lexibooster.app">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="LexiBooster"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar"
        tools:ignore="GoogleAppIndexingWarning">

        <activity
            android:name=".LauncherActivity"
            android:exported="true"
            android:theme="@android:style/Theme.Translucent.NoTitleBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="https"
                    android:host="words-learning-server-copy-production.up.railway.app"/>
            </intent-filter>
        </activity>

        <meta-data
            android:name="asset_statements"
            android:value='[{\"relation\": [\"delegate_permission/common.handle_all_urls\"],
                          \"target\": {\"namespace\": \"web\",
                                       \"site\": \"https://words-learning-server-copy-production.up.railway.app\"}}]' />
    </application>

</manifest>
```

3. Сохраните: **Ctrl + S**

---

## 🎨 Шаг 8: Добавить иконку приложения (опционально)

Если хотите использовать свою иконку:

1. Скопируйте файл:
   ```
   c:\Users\Nalivator3000\words-learning-server\public\icons\icon-512x512.png
   ```

2. В Android Studio: **Правой кнопкой на res → New → Image Asset**

3. В открывшемся окне:
   - **Icon Type:** Launcher Icons (Adaptive and Legacy)
   - **Name:** ic_launcher
   - **Asset Type:** Image
   - **Path:** [Выберите ваш icon-512x512.png]
   - Нажмите **Next → Finish**

Или пропустите этот шаг - будет стандартная иконка Android.

---

## 🔨 Шаг 9: Собрать APK

Теперь создадим APK файл:

1. В меню сверху: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

2. Внизу появится прогресс: "Building APK..."

3. **Время:** 3-10 минут (первый раз может долго)

4. Когда build завершится, появится уведомление внизу справа:
   ```
   APK(s) generated successfully
   ```

5. Нажмите на **"locate"** в уведомлении

6. APK находится в:
   ```
   C:\Users\Nalivator3000\LexiBooster-Android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## ✅ Поздравляю! APK создан!

Теперь у тебя есть `app-debug.apk` (~5-10 MB)

---

## 📱 Шаг 10: Установить APK на телефон (тестирование)

### Вариант A: Через USB (ADB)

1. Включи на телефоне:
   - **Настройки → О телефоне → 7 раз тапнуть по "Номер сборки"**
   - **Настройки → Для разработчиков → Отладка по USB**

2. Подключи телефон к компьютеру по USB

3. В Android Studio: **Run → Run 'app'**

4. Выбери свое устройство

5. Приложение установится и запустится

### Вариант B: Скопировать APK на телефон

1. Скопируй `app-debug.apk` на телефон (через USB, облако, мессенджер)

2. На телефоне открой APK файл

3. Разреши установку из неизвестных источников (если попросит)

4. Установи

---

## 🏪 Шаг 11: Создать подписанный APK для Google Play

Debug APK нельзя загрузить в Google Play. Нужен **signed release APK**.

### Создание Keystore (один раз):

1. В Android Studio: **Build → Generate Signed Bundle / APK**

2. Выбери: **APK** → **Next**

3. Нажми **"Create new..."** (создать новый keystore)

4. Заполни:
   ```
   Key store path: C:\Users\Nalivator3000\lexibooster-keystore.jks
   Password: [твой сильный пароль - СОХРАНИ ЕГО!]
   Confirm: [повтори пароль]

   Alias: lexibooster-key
   Password: [тот же пароль]
   Confirm: [повтори]

   Validity (years): 25

   Certificate:
   First and Last Name: [твое имя]
   Organizational Unit: LexiBooster
   Organization: LexiBooster Team
   City: [твой город]
   State: [твой регион]
   Country Code: RU
   ```

5. Нажми **OK**

6. Выбери:
   - **Build Variants:** release
   - **Signature Versions:** ✅ V1, ✅ V2

7. Нажми **Finish**

8. Дождись завершения build

9. Signed APK будет в:
   ```
   C:\Users\Nalivator3000\LexiBooster-Android\app\release\app-release.apk
   ```

⚠️ **КРИТИЧЕСКИ ВАЖНО:**
- **СОХРАНИ keystore файл!** Без него не сможешь обновлять приложение!
- **СОХРАНИ пароль!** Его нельзя восстановить!
- **НЕ КОММИТЬ в Git!** Добавь в .gitignore

---

## 📦 Шаг 12: Создать AAB для Google Play (рекомендуется)

AAB (Android App Bundle) - предпочтительный формат для Google Play:

1. **Build → Generate Signed Bundle / APK**

2. Выбери: **Android App Bundle** → **Next**

3. Выбери существующий keystore (созданный в Шаге 11)

4. Введи пароли

5. Выбери **release**

6. Нажми **Finish**

7. AAB будет в:
   ```
   C:\Users\Nalivator3000\LexiBooster-Android\app\release\app-release.aab
   ```

---

## 🎉 Готово!

Теперь у тебя есть:
- ✅ `app-debug.apk` - для тестирования
- ✅ `app-release.apk` - подписанный APK для распространения
- ✅ `app-release.aab` - для загрузки в Google Play Store

---

## 🐛 Возможные ошибки и решения

### Ошибка: "SDK not found"
**Решение:**
1. **Tools → SDK Manager**
2. Установи: Android SDK Platform 33, Android SDK Build-Tools 33
3. Нажми **Apply**

### Ошибка: "Gradle sync failed"
**Решение:**
1. **File → Invalidate Caches / Restart**
2. Перезапусти Android Studio

### Ошибка: "Java not configured"
**Решение:**
1. **File → Project Structure → SDK Location**
2. Укажи JDK: `C:\Program Files\Eclipse Adoptium\jdk-25.0.0.36-hotspot`

### Ошибка при установке APK: "App not installed"
**Решение:**
1. Удали старую версию приложения с телефона
2. Попробуй установить снова

---

## 📞 Что делать дальше?

После успешного создания APK/AAB:

1. **Протестируй приложение** на реальном Android устройстве
2. **Убедись, что все работает:**
   - Логин/регистрация
   - Изучение слов
   - Статистика
   - Таблица лидеров
   - Offline режим
3. **Если все ОК** → Загружай AAB в Google Play Console

---

**Создано:** 2025-10-26
**Для проекта:** LexiBooster
**Версия:** 1.0
