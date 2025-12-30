// Onboarding state
const onboarding = {
    currentStep: 1,
    uiLanguage: null,
    nativeLanguage: null,
    learningLanguage: null,
    selectedWordSets: [],
    userId: null,
    languagePairId: null
};

// Supported languages with flags
const LANGUAGES = [
    { code: 'russian', name: 'Русский', flag: '🇷🇺' },
    { code: 'english', name: 'English', flag: '🇬🇧' },
    { code: 'german', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'spanish', name: 'Español', flag: '🇪🇸' },
    { code: 'french', name: 'Français', flag: '🇫🇷' },
    { code: 'italian', name: 'Italiano', flag: '🇮🇹' },
    { code: 'chinese', name: '中文', flag: '🇨🇳' },
    { code: 'japanese', name: '日本語', flag: '🇯🇵' },
    { code: 'korean', name: '한국어', flag: '🇰🇷' },
    { code: 'portuguese', name: 'Português', flag: '🇵🇹' },
    { code: 'polish', name: 'Polski', flag: '🇵🇱' },
    { code: 'ukrainian', name: 'Українська', flag: '🇺🇦' },
    { code: 'turkish', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'arabic', name: 'العربية', flag: '🇸🇦' },
    { code: 'hindi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'swahili', name: 'Kiswahili', flag: '🇰🇪' },
    { code: 'romanian', name: 'Română', flag: '🇷🇴' },
    { code: 'serbian', name: 'Српски', flag: '🇷🇸' }
];

// Translations for interface
const TRANSLATIONS = {
    russian: {
        'native-lang-title': 'Какой ваш родной язык?',
        'native-lang-desc': 'Язык, на котором вы уже говорите',
        'learning-lang-title': 'Какой язык вы хотите изучать?',
        'learning-lang-desc': 'Выберите целевой язык',
        'word-sets-title': 'Выберите начальный словарь',
        'word-sets-desc': 'Выберите наборы слов для начала обучения'
    },
    english: {
        'native-lang-title': "What's your native language?",
        'native-lang-desc': 'The language you already speak',
        'learning-lang-title': 'Which language do you want to learn?',
        'learning-lang-desc': 'Choose your target language',
        'word-sets-title': 'Choose your starting vocabulary',
        'word-sets-desc': 'Select word sets to begin learning'
    }
};

// Initialize onboarding
function init() {
    // Auto-detect browser language
    const browserLang = navigator.language.split('-')[0];
    const detectedLang = LANGUAGES.find(l => l.code.startsWith(browserLang));

    // Pre-select detected language in UI language step
    if (detectedLang) {
        onboarding.uiLanguage = detectedLang.code;
    }

    updateProgressIndicator();
    renderLanguageGrid('ui-language-grid', (lang) => selectUILanguage(lang), onboarding.uiLanguage);
}

// Navigate steps
function nextStep() {
    if (onboarding.currentStep === 4) {
        // Before showing word sets, create language pair
        createLanguagePair();
        return;
    }

    onboarding.currentStep++;
    showCurrentStep();
    updateProgressIndicator();

    // Populate step content
    if (onboarding.currentStep === 3) {
        renderLanguageGrid('native-language-grid', (lang) => selectNativeLanguage(lang), onboarding.nativeLanguage || onboarding.uiLanguage);
    } else if (onboarding.currentStep === 4) {
        renderLanguageGrid('learning-language-grid', (lang) => selectLearningLanguage(lang), null, onboarding.nativeLanguage);
    }
}

function prevStep() {
    if (onboarding.currentStep > 1) {
        onboarding.currentStep--;
        showCurrentStep();
        updateProgressIndicator();
    }
}

function showCurrentStep() {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.add('hidden');
    });

    const currentStepEl = document.querySelector(`[data-step="${onboarding.currentStep}"]`);
    if (currentStepEl) {
        currentStepEl.classList.remove('hidden');
    }

    // Update translations if UI language changed
    if (onboarding.uiLanguage && TRANSLATIONS[onboarding.uiLanguage]) {
        applyTranslations();
    }
}

function updateProgressIndicator() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNum < onboarding.currentStep) {
            step.classList.add('completed');
        } else if (stepNum === onboarding.currentStep) {
            step.classList.add('active');
        }
    });

    document.querySelectorAll('.progress-line').forEach((line, index) => {
        line.classList.remove('active');
        if (index < onboarding.currentStep - 1) {
            line.classList.add('active');
        }
    });
}

// Language selection
function renderLanguageGrid(gridId, onSelect, preselected, exclude = null) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';

    LANGUAGES.forEach(lang => {
        if (exclude && lang.code === exclude) return; // Skip excluded language

        const card = document.createElement('div');
        card.className = 'language-card';
        if (preselected === lang.code) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <div class="flag">${lang.flag}</div>
            <div class="name">${lang.name}</div>
        `;

        card.addEventListener('click', () => {
            grid.querySelectorAll('.language-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            onSelect(lang.code);
        });

        grid.appendChild(card);
    });
}

function selectUILanguage(lang) {
    onboarding.uiLanguage = lang;
    document.getElementById('btn-continue-ui-lang').disabled = false;
}

function selectNativeLanguage(lang) {
    onboarding.nativeLanguage = lang;
    document.getElementById('btn-continue-native').disabled = false;
}

function selectLearningLanguage(lang) {
    onboarding.learningLanguage = lang;
    document.getElementById('btn-continue-learning').disabled = false;
}

function applyTranslations() {
    const translations = TRANSLATIONS[onboarding.uiLanguage];
    if (!translations) return;

    Object.keys(translations).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = translations[key];
        }
    });
}

// Create language pair
async function createLanguagePair() {
    try {
        // Get current user (assuming user is logged in)
        const userResponse = await fetch('/api/auth/user', {
            credentials: 'include'
        });

        if (!userResponse.ok) {
            throw new Error('Please log in first');
        }

        const userData = await userResponse.json();
        onboarding.userId = userData.user.id;

        // Create language pair
        const response = await fetch('/api/language-pairs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                name: `${LANGUAGES.find(l => l.code === onboarding.learningLanguage).name} → ${LANGUAGES.find(l => l.code === onboarding.nativeLanguage).name}`,
                fromLang: onboarding.learningLanguage,
                toLang: onboarding.nativeLanguage,
                isActive: true
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create language pair');
        }

        const languagePair = await response.json();
        onboarding.languagePairId = languagePair.id || languagePair.languagePair?.id;

        // Move to word sets step
        onboarding.currentStep = 5;
        showCurrentStep();
        updateProgressIndicator();

        // Load word sets
        await loadWordSets();

    } catch (error) {
        console.error('Error creating language pair:', error);
        alert('Error: ' + error.message + '. Please refresh and try again.');
    }
}

// Load word sets
async function loadWordSets() {
    const container = document.getElementById('word-sets-container');
    container.innerHTML = '<div class="loading">Loading word sets...</div>';

    try {
        const response = await fetch(`/api/word-sets?sourceLang=${onboarding.learningLanguage}&targetLang=${onboarding.nativeLanguage}`);

        if (!response.ok) {
            throw new Error('Failed to load word sets');
        }

        const wordSets = await response.json();

        if (wordSets.length === 0) {
            container.innerHTML = '<div class="loading">No word sets available for this language pair yet.</div>';
            return;
        }

        container.innerHTML = '';

        // Pre-select A1 level sets
        wordSets.forEach(set => {
            const item = createWordSetItem(set);
            container.appendChild(item);

            // Auto-select A1 sets
            if (set.level === 'A1') {
                item.click();
            }
        });

    } catch (error) {
        console.error('Error loading word sets:', error);
        container.innerHTML = `<div class="loading">Error loading word sets. Please try again.</div>`;
    }
}

function createWordSetItem(set) {
    const item = document.createElement('div');
    item.className = 'word-set-item';
    item.dataset.setId = set.id;
    item.dataset.wordCount = set.word_count;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `set-${set.id}`;

    const info = document.createElement('div');
    info.className = 'word-set-info';
    info.innerHTML = `
        <div class="word-set-title">${set.title}</div>
        <div class="word-set-description">${set.description || ''}</div>
        <div class="word-set-count">${set.word_count} words</div>
    `;

    item.appendChild(checkbox);
    item.appendChild(info);

    item.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
        }

        if (checkbox.checked) {
            item.classList.add('selected');
            onboarding.selectedWordSets.push(set.id);
        } else {
            item.classList.remove('selected');
            onboarding.selectedWordSets = onboarding.selectedWordSets.filter(id => id !== set.id);
        }

        updateWordSetsSummary();
    });

    return item;
}

function updateWordSetsSummary() {
    const count = onboarding.selectedWordSets.length;
    const totalWords = Array.from(document.querySelectorAll('.word-set-item.selected'))
        .reduce((sum, item) => sum + parseInt(item.dataset.wordCount), 0);

    document.getElementById('selected-count').textContent = `${count} set${count !== 1 ? 's' : ''} selected`;
    document.getElementById('total-words').textContent = `${totalWords} words`;
    document.getElementById('btn-import').disabled = count === 0;
}

// Import word sets
async function importWordSets() {
    const btn = document.getElementById('btn-import');
    btn.disabled = true;
    btn.textContent = 'Importing...';

    try {
        const response = await fetch('/api/onboarding/import-word-sets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                userId: onboarding.userId,
                languagePairId: onboarding.languagePairId,
                wordSetIds: onboarding.selectedWordSets
            })
        });

        if (!response.ok) {
            throw new Error('Failed to import word sets');
        }

        const result = await response.json();

        // Show success screen
        showSuccessScreen(result);

    } catch (error) {
        console.error('Error importing word sets:', error);
        alert('Error importing word sets. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Start Learning';
    }
}

function showSuccessScreen(result) {
    onboarding.currentStep = 6;
    showCurrentStep();
    updateProgressIndicator();

    const summary = document.getElementById('success-summary');
    const learningLangName = LANGUAGES.find(l => l.code === onboarding.learningLanguage).name;
    const nativeLangName = LANGUAGES.find(l => l.code === onboarding.nativeLanguage).name;

    summary.innerHTML = `
        <div><strong>Interface language:</strong> ${LANGUAGES.find(l => l.code === onboarding.uiLanguage).flag} ${LANGUAGES.find(l => l.code === onboarding.uiLanguage).name}</div>
        <div><strong>Learning:</strong> ${LANGUAGES.find(l => l.code === onboarding.learningLanguage).flag} ${learningLangName} → ${LANGUAGES.find(l => l.code === onboarding.nativeLanguage).flag} ${nativeLangName}</div>
        <div><strong>Words added:</strong> ${result.words_added || 0} words from ${onboarding.selectedWordSets.length} set${onboarding.selectedWordSets.length !== 1 ? 's' : ''}</div>
    `;
}

function goToDashboard() {
    window.location.href = '/';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
