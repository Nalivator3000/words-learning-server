const fs = require('fs');
const path = require('path');

// Proper translations for missing keys
const missingTranslations = {
  "word_lists_description": {
    "en": "Browse and import curated word collections by topic, level, and language",
    "ru": "Просматривайте и импортируйте готовые коллекции слов по темам, уровням и языкам",
    "de": "Durchsuchen und importieren Sie kuratierte Wortsammlungen nach Thema, Niveau und Sprache",
    "es": "Explore e importe colecciones de palabras seleccionadas por tema, nivel e idioma",
    "fr": "Parcourez et importez des collections de mots organisées par thème, niveau et langue",
    "it": "Sfoglia e importa raccolte di parole curate per argomento, livello e lingua"
  },
  "add_word": {
    "en": "Add Word",
    "ru": "Добавить слово",
    "de": "Wort hinzufügen",
    "es": "Añadir palabra",
    "fr": "Ajouter un mot",
    "it": "Aggiungi parola"
  },
  "achievements_description": {
    "en": "Track your progress and unlock special achievements",
    "ru": "Отслеживайте прогресс и разблокируйте специальные достижения",
    "de": "Verfolgen Sie Ihren Fortschritt und schalten Sie besondere Erfolge frei",
    "es": "Rastrea tu progreso y desbloquea logros especiales",
    "fr": "Suivez vos progrès et débloquez des réalisations spéciales",
    "it": "Traccia i tuoi progressi e sblocca risultati speciali"
  },
  "active_freezes": {
    "en": "Active Freezes",
    "ru": "Активные заморозки",
    "de": "Aktive Freezes",
    "es": "Congelaciones activas",
    "fr": "Gels actifs",
    "it": "Congelamenti attivi"
  },
  "auto_recommended": {
    "en": "Auto (Recommended)",
    "ru": "Авто (Рекомендуется)",
    "de": "Auto (Empfohlen)",
    "es": "Auto (Recomendado)",
    "fr": "Auto (Recommandé)",
    "it": "Auto (Consigliato)"
  },
  "auto_voice_info": {
    "en": "Automatically selects the best available voice for each language",
    "ru": "Автоматически выбирает лучший доступный голос для каждого языка",
    "de": "Wählt automatisch die beste verfügbare Stimme für jede Sprache",
    "es": "Selecciona automáticamente la mejor voz disponible para cada idioma",
    "fr": "Sélectionne automatiquement la meilleure voix disponible pour chaque langue",
    "it": "Seleziona automaticamente la migliore voce disponibile per ogni lingua"
  },
  "bug_description": {
    "en": "Description",
    "ru": "Описание",
    "de": "Beschreibung",
    "es": "Descripción",
    "fr": "Description",
    "it": "Descrizione"
  },
  "bug_reports": {
    "en": "Bug Reports",
    "ru": "Отчёты об ошибках",
    "de": "Fehlerberichte",
    "es": "Reportes de errores",
    "fr": "Rapports de bugs",
    "it": "Segnalazioni di bug"
  },
  "bug_reports_description": {
    "en": "Help us improve the app by reporting bugs and issues",
    "ru": "Помогите нам улучшить приложение, сообщая об ошибках и проблемах",
    "de": "Helfen Sie uns, die App zu verbessern, indem Sie Fehler und Probleme melden",
    "es": "Ayúdanos a mejorar la aplicación reportando errores y problemas",
    "fr": "Aidez-nous à améliorer l'application en signalant des bugs et des problèmes",
    "it": "Aiutaci a migliorare l'app segnalando bug e problemi"
  },
  "bug_severity": {
    "en": "Severity",
    "ru": "Серьёзность",
    "de": "Schweregrad",
    "es": "Gravedad",
    "fr": "Gravité",
    "it": "Gravità"
  },
  "bug_steps": {
    "en": "Steps to reproduce",
    "ru": "Шаги для воспроизведения",
    "de": "Schritte zur Reproduktion",
    "es": "Pasos para reproducir",
    "fr": "Étapes pour reproduire",
    "it": "Passaggi per riprodurre"
  },
  "bug_title": {
    "en": "Title",
    "ru": "Заголовок",
    "de": "Titel",
    "es": "Título",
    "fr": "Titre",
    "it": "Titolo"
  },
  "characters_left": {
    "en": "characters left",
    "ru": "символов осталось",
    "de": "Zeichen übrig",
    "es": "caracteres restantes",
    "fr": "caractères restants",
    "it": "caratteri rimanenti"
  },
  "claim_free_freeze": {
    "en": "Claim Free Freeze",
    "ru": "Получить бесплатную заморозку",
    "de": "Kostenloses Einfrieren beanspruchen",
    "es": "Reclamar congelación gratis",
    "fr": "Réclamer un gel gratuit",
    "it": "Richiedi congelamento gratuito"
  },
  "controls": {
    "en": "Controls",
    "ru": "Управление",
    "de": "Steuerung",
    "es": "Controles",
    "fr": "Contrôles",
    "it": "Controlli"
  },
  "duels_description": {
    "en": "Challenge other players and compete for the top spot",
    "ru": "Соревнуйтесь с другими игроками и боритесь за первое место",
    "de": "Fordere andere Spieler heraus und kämpfe um den Spitzenplatz",
    "es": "Desafía a otros jugadores y compite por el primer puesto",
    "fr": "Défiez d'autres joueurs et affrontez-vous pour la première place",
    "it": "Sfida altri giocatori e compete per il primo posto"
  },
  "errors": {
    "en": "Errors",
    "ru": "Ошибки",
    "de": "Fehler",
    "es": "Errores",
    "fr": "Erreurs",
    "it": "Errori"
  },
  "free_freeze": {
    "en": "Free Freeze",
    "ru": "Бесплатная заморозка",
    "de": "Kostenloses Einfrieren",
    "es": "Congelación gratis",
    "fr": "Gel gratuit",
    "it": "Congelamento gratuito"
  },
  "free_freeze_description": {
    "en": "Get a free streak freeze every 7 days of consecutive learning",
    "ru": "Получайте бесплатную заморозку серии каждые 7 дней непрерывного обучения",
    "de": "Erhalte alle 7 Tage ununterbrochenen Lernens ein kostenloses Streak-Einfrieren",
    "es": "Obtén una congelación de racha gratis cada 7 días de aprendizaje consecutivo",
    "fr": "Obtenez un gel de série gratuit tous les 7 jours d'apprentissage consécutif",
    "it": "Ottieni un congelamento della serie gratuito ogni 7 giorni di apprendimento consecutivo"
  },
  "freeze_history": {
    "en": "Freeze History",
    "ru": "История заморозок",
    "de": "Einfrierhistorie",
    "es": "Historial de congelaciones",
    "fr": "Historique des gels",
    "it": "Cronologia congelamenti"
  },
  "friends_description": {
    "en": "Connect with friends and see their progress",
    "ru": "Общайтесь с друзьями и следите за их прогрессом",
    "de": "Verbinde dich mit Freunden und sieh ihren Fortschritt",
    "es": "Conéctate con amigos y ve su progreso",
    "fr": "Connectez-vous avec des amis et voyez leur progrès",
    "it": "Connettiti con gli amici e guarda i loro progressi"
  },
  "german_de": {
    "en": "German",
    "ru": "Немецкий",
    "de": "Deutsch",
    "es": "Alemán",
    "fr": "Allemand",
    "it": "Tedesco"
  },
  "instant_answer": {
    "en": "Instant Answer",
    "ru": "Мгновенный ответ",
    "de": "Sofortantwort",
    "es": "Respuesta instantánea",
    "fr": "Réponse instantanée",
    "it": "Risposta istantanea"
  },
  "leagues_description": {
    "en": "Compete in leagues and climb to the top division",
    "ru": "Соревнуйтесь в лигах и поднимайтесь в высший дивизион",
    "de": "Nimm an Ligen teil und steige in die oberste Division auf",
    "es": "Compite en ligas y sube a la división superior",
    "fr": "Participez aux ligues et montez dans la division supérieure",
    "it": "Compete nei campionati e sali alla divisione superiore"
  },
  "my_bug_reports": {
    "en": "My Bug Reports",
    "ru": "Мои отчёты об ошибках",
    "de": "Meine Fehlerberichte",
    "es": "Mis reportes de errores",
    "fr": "Mes rapports de bugs",
    "it": "Le mie segnalazioni di bug"
  },
  "normal": {
    "en": "Normal",
    "ru": "Обычный",
    "de": "Normal",
    "es": "Normal",
    "fr": "Normal",
    "it": "Normale"
  },
  "or": {
    "en": "or",
    "ru": "или",
    "de": "oder",
    "es": "o",
    "fr": "ou",
    "it": "o"
  },
  "personal_insights_description": {
    "en": "View detailed statistics and insights about your learning",
    "ru": "Просматривайте детальную статистику и аналитику вашего обучения",
    "de": "Zeige detaillierte Statistiken und Einblicke in dein Lernen an",
    "es": "Ve estadísticas detalladas e información sobre tu aprendizaje",
    "fr": "Affichez des statistiques détaillées et des informations sur votre apprentissage",
    "it": "Visualizza statistiche dettagliate e informazioni sul tuo apprendimento"
  },
  "personal_rating_description": {
    "en": "Your personal ranking based on XP and achievements",
    "ru": "Ваш личный рейтинг на основе опыта и достижений",
    "de": "Deine persönliche Rangliste basierend auf XP und Erfolgen",
    "es": "Tu clasificación personal basada en XP y logros",
    "fr": "Votre classement personnel basé sur l'XP et les réalisations",
    "it": "La tua classifica personale basata su XP e risultati"
  },
  "profile_title": {
    "en": "Profile",
    "ru": "Профиль",
    "de": "Profil",
    "es": "Perfil",
    "fr": "Profil",
    "it": "Profilo"
  },
  "quick_choice": {
    "en": "Quick Choice",
    "ru": "Быстрый выбор",
    "de": "Schnellwahl",
    "es": "Elección rápida",
    "fr": "Choix rapide",
    "it": "Scelta rapida"
  },
  "reset_form": {
    "en": "Reset",
    "ru": "Сбросить",
    "de": "Zurücksetzen",
    "es": "Restablecer",
    "fr": "Réinitialiser",
    "it": "Ripristina"
  },
  "russian": {
    "en": "Russian",
    "ru": "Русский",
    "de": "Russisch",
    "es": "Ruso",
    "fr": "Russe",
    "it": "Russo"
  },
  "send_bug_report": {
    "en": "Send Bug Report",
    "ru": "Отправить отчёт об ошибке",
    "de": "Fehlerbericht senden",
    "es": "Enviar reporte de error",
    "fr": "Envoyer un rapport de bug",
    "it": "Invia segnalazione di bug"
  },
  "severity_critical": {
    "en": "Critical",
    "ru": "Критическая",
    "de": "Kritisch",
    "es": "Crítico",
    "fr": "Critique",
    "it": "Critico"
  },
  "severity_high": {
    "en": "High",
    "ru": "Высокая",
    "de": "Hoch",
    "es": "Alto",
    "fr": "Élevé",
    "it": "Alto"
  },
  "severity_low": {
    "en": "Low",
    "ru": "Низкая",
    "de": "Niedrig",
    "es": "Bajo",
    "fr": "Faible",
    "it": "Basso"
  },
  "severity_medium": {
    "en": "Medium",
    "ru": "Средняя",
    "de": "Mittel",
    "es": "Medio",
    "fr": "Moyen",
    "it": "Medio"
  },
  "space": {
    "en": "Space",
    "ru": "Пробел",
    "de": "Leertaste",
    "es": "Espacio",
    "fr": "Espace",
    "it": "Spazio"
  },
  "streak_freeze_description": {
    "en": "Protect your streak from breaking when you miss a day",
    "ru": "Защитите свою серию от разрыва, если пропустите день",
    "de": "Schütze deinen Streak vor dem Brechen, wenn du einen Tag verpasst",
    "es": "Protege tu racha de romperse cuando te pierdas un día",
    "fr": "Protégez votre série de rupture lorsque vous manquez un jour",
    "it": "Proteggi la tua serie dalla rottura quando salti un giorno"
  },
  "streak_freeze_title": {
    "en": "Streak Freeze",
    "ru": "Заморозка серии",
    "de": "Streak Einfrieren",
    "es": "Congelación de racha",
    "fr": "Gel de série",
    "it": "Congelamento della serie"
  },
  "test_with_current_settings": {
    "en": "Test with current settings",
    "ru": "Протестировать с текущими настройками",
    "de": "Mit aktuellen Einstellungen testen",
    "es": "Probar con la configuración actual",
    "fr": "Tester avec les paramètres actuels",
    "it": "Testa con le impostazioni correnti"
  },
  "time": {
    "en": "Time",
    "ru": "Время",
    "de": "Zeit",
    "es": "Tiempo",
    "fr": "Temps",
    "it": "Tempo"
  },
  "use_freeze": {
    "en": "Use Freeze",
    "ru": "Использовать заморозку",
    "de": "Einfrieren verwenden",
    "es": "Usar congelación",
    "fr": "Utiliser le gel",
    "it": "Usa congelamento"
  },
  "use_freeze_button": {
    "en": "Use Freeze",
    "ru": "Использовать",
    "de": "Verwenden",
    "es": "Usar",
    "fr": "Utiliser",
    "it": "Usa"
  },
  "use_freeze_description": {
    "en": "Click to use a streak freeze and protect your streak",
    "ru": "Нажмите, чтобы использовать заморозку и защитить свою серию",
    "de": "Klicke, um ein Streak-Einfrieren zu verwenden und deinen Streak zu schützen",
    "es": "Haz clic para usar una congelación y proteger tu racha",
    "fr": "Cliquez pour utiliser un gel de série et protéger votre série",
    "it": "Clicca per usare un congelamento e proteggere la tua serie"
  },
  "voice_parameters": {
    "en": "Voice Parameters",
    "ru": "Параметры голоса",
    "de": "Sprachparameter",
    "es": "Parámetros de voz",
    "fr": "Paramètres de voix",
    "it": "Parametri vocali"
  },
  "volume": {
    "en": "Volume",
    "ru": "Громкость",
    "de": "Lautstärke",
    "es": "Volumen",
    "fr": "Volume",
    "it": "Volume"
  },
  "weekly_challenges_description": {
    "en": "Complete weekly challenges and earn rewards",
    "ru": "Выполняйте еженедельные задания и получайте награды",
    "de": "Schließe wöchentliche Herausforderungen ab und verdiene Belohnungen",
    "es": "Completa desafíos semanales y gana recompensas",
    "fr": "Complétez des défis hebdomadaires et gagnez des récompenses",
    "it": "Completa le sfide settimanali e guadagna ricompense"
  }
};

// Read existing translations
const translationsPath = path.join(__dirname, '../public/translations/source-texts.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

// Merge missing translations
let addedCount = 0;
for (const [key, value] of Object.entries(missingTranslations)) {
  if (!translations[key]) {
    translations[key] = value;
    addedCount++;
    console.log(`✅ Added: ${key}`);
  } else {
    console.log(`⏭️  Skipped (exists): ${key}`);
  }
}

// Save updated translations
fs.writeFileSync(translationsPath, JSON.stringify(translations, null, 2), 'utf8');

console.log(`\n✅ Successfully added ${addedCount} missing translations!`);
console.log(`📁 Updated file: ${translationsPath}`);
