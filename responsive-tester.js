class ResponsiveTester {
    constructor() {
        // Популярные разрешения экранов для тестирования
        this.devices = {
            // Mobile devices
            'iPhone SE': { width: 375, height: 667, deviceType: 'mobile' },
            'iPhone 12': { width: 390, height: 844, deviceType: 'mobile' },
            'iPhone 12 Pro Max': { width: 428, height: 926, deviceType: 'mobile' },
            'Samsung Galaxy S21': { width: 384, height: 854, deviceType: 'mobile' },
            'Google Pixel 6': { width: 393, height: 851, deviceType: 'mobile' },
            
            // Tablets
            'iPad Mini': { width: 768, height: 1024, deviceType: 'tablet' },
            'iPad': { width: 820, height: 1180, deviceType: 'tablet' },
            'iPad Pro 11"': { width: 834, height: 1194, deviceType: 'tablet' },
            'Samsung Galaxy Tab': { width: 800, height: 1280, deviceType: 'tablet' },
            
            // Desktop/Laptop
            'Small Laptop': { width: 1366, height: 768, deviceType: 'desktop' },
            'Standard Desktop': { width: 1920, height: 1080, deviceType: 'desktop' },
            'Large Desktop': { width: 2560, height: 1440, deviceType: 'desktop' },
            'Ultra Wide': { width: 3440, height: 1440, deviceType: 'desktop' }
        };

        // UI экраны для тестирования  
        this.screens = [
            { name: 'Login', route: '/', section: 'auth', description: 'Authentication modal' },
            { name: 'Home', route: '/', section: 'home', description: 'Main dashboard' },
            { name: 'Import', route: '/import', section: 'import', description: 'Import words section' },
            { name: 'Study', route: '/study', section: 'study', description: 'Study mode selection' },
            { name: 'Study Exercise', route: '/study', section: 'study', exercise: true, description: 'Study exercise interface' },
            { name: 'Review', route: '/review', section: 'review', description: 'Review mode' },
            { name: 'Statistics', route: '/stats', section: 'stats', description: 'Statistics page' },
            { name: 'Settings', route: '/settings', section: 'settings', description: 'Settings page' }
        ];

        this.screenshots = {};
        this.isRunning = false;
    }

    // Установить размер viewport
    setViewportSize(width, height) {
        // Для браузерного тестирования используем CSS viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = `width=${width}, height=${height}, initial-scale=1.0`;
        }

        // Изменяем размер окна (если возможно)
        if (window.resizeTo && !window.location.href.includes('railway.app')) {
            try {
                window.resizeTo(width, height + 100); // +100 для браузерных элементов
            } catch (e) {
                console.warn('Cannot resize window:', e.message);
            }
        }

        // Эмулируем размер через CSS
        document.body.style.width = width + 'px';
        document.body.style.height = height + 'px';
        document.body.style.overflow = 'hidden';
        
        // Добавляем класс для мобильной версии
        if (width <= 768) {
            document.body.classList.add('mobile-test-mode');
        } else {
            document.body.classList.remove('mobile-test-mode');
        }

        console.log(`📱 Viewport set to ${width}x${height}`);
    }

    // Восстановить нормальный размер
    resetViewport() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0';
        }

        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        document.body.classList.remove('mobile-test-mode');

        console.log('📱 Viewport reset to normal');
    }

    // Сделать скриншот (эмуляция - в браузере создаем визуальный отчет)
    async captureScreenshot(deviceName, screenName, element = document.body) {
        return new Promise((resolve) => {
            // Используем html2canvas для создания скриншота (если доступен)
            if (window.html2canvas) {
                html2canvas(element, {
                    allowTaint: true,
                    useCORS: true,
                    scale: 0.5, // Уменьшаем для экономии места
                    scrollX: 0,
                    scrollY: 0
                }).then(canvas => {
                    const dataUrl = canvas.toDataURL('image/png');
                    this.screenshots[`${deviceName}_${screenName}`] = {
                        device: deviceName,
                        screen: screenName,
                        dataUrl: dataUrl,
                        timestamp: new Date().toISOString(),
                        dimensions: {
                            width: canvas.width,
                            height: canvas.height
                        }
                    };
                    resolve(dataUrl);
                }).catch(error => {
                    console.warn('Screenshot failed:', error);
                    resolve(null);
                });
            } else {
                // Fallback: создаем визуальную информацию без изображения
                this.screenshots[`${deviceName}_${screenName}`] = {
                    device: deviceName,
                    screen: screenName,
                    dataUrl: null,
                    timestamp: new Date().toISOString(),
                    dimensions: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    info: 'Screenshot library not available'
                };
                resolve(null);
            }
        });
    }

    // Навигация к экрану
    async navigateToScreen(screen) {
        return new Promise((resolve) => {
            try {
                // Сначала скрыть auth modal если нужно
                const authModal = document.getElementById('authModal');
                if (authModal && screen.section !== 'auth') {
                    authModal.style.display = 'none';
                }

                if (screen.section === 'auth') {
                    // Показать auth modal
                    if (authModal) {
                        authModal.style.display = 'flex';
                    }
                } else {
                    // Навигация к секции через router или прямо
                    if (window.router && window.router.navigateTo) {
                        window.router.navigateTo(screen.route);
                    } else if (window.app && window.app.showSection) {
                        window.app.showSection(screen.section);
                    }

                    // Для упражнений - запустить тестовое упражнение
                    if (screen.exercise && window.app) {
                        setTimeout(() => {
                            // Запустить первое упражнение для тестирования
                            if (window.app.startStudyQuiz) {
                                window.app.startStudyQuiz('multiple');
                            }
                        }, 500);
                    }
                }

                // Ждем загрузки интерфейса
                setTimeout(resolve, 1000);
            } catch (error) {
                console.warn('Navigation failed:', error);
                setTimeout(resolve, 500);
            }
        });
    }

    // Ждать загрузки элементов
    async waitForElements(selectors, timeout = 3000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const allFound = selectors.every(selector => {
                const element = document.querySelector(selector);
                return element && element.offsetWidth > 0 && element.offsetHeight > 0;
            });
            
            if (allFound) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return false;
    }

    // Тестирование одного устройства
    async testDevice(deviceName, deviceConfig) {
        console.log(`📱 Testing device: ${deviceName} (${deviceConfig.width}x${deviceConfig.height})`);
        
        const results = {
            device: deviceName,
            config: deviceConfig,
            screens: {},
            timestamp: new Date().toISOString()
        };

        // Установить размер viewport
        this.setViewportSize(deviceConfig.width, deviceConfig.height);
        
        // Ждать применения стилей
        await new Promise(resolve => setTimeout(resolve, 500));

        // Тестируем каждый экран
        for (const screen of this.screens) {
            console.log(`  📄 Testing screen: ${screen.name}`);
            
            try {
                // Навигация к экрану
                await this.navigateToScreen(screen);

                // Ждем загрузки ключевых элементов
                const keyElements = ['.container', 'header', 'main'];
                await this.waitForElements(keyElements, 2000);

                // Анализируем layout
                const analysis = this.analyzeLayout(screen, deviceConfig);
                
                // Делаем скриншот
                const screenshot = await this.captureScreenshot(deviceName, screen.name);

                results.screens[screen.name] = {
                    ...analysis,
                    screenshot: screenshot ? 'captured' : 'failed',
                    screenshotKey: screenshot ? `${deviceName}_${screen.name}` : null
                };

                console.log(`    ✅ Screen ${screen.name}: ${analysis.status}`);
            } catch (error) {
                results.screens[screen.name] = {
                    status: 'error',
                    error: error.message,
                    screenshot: 'failed'
                };
                console.log(`    ❌ Screen ${screen.name}: Error - ${error.message}`);
            }

            // Небольшая пауза между экранами
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        return results;
    }

    // Анализ layout на предмет проблем
    analyzeLayout(screen, deviceConfig) {
        const issues = [];
        const warnings = [];
        
        try {
            // Проверка горизонтальной прокрутки
            if (document.body.scrollWidth > deviceConfig.width) {
                issues.push(`Horizontal scroll detected: ${document.body.scrollWidth}px > ${deviceConfig.width}px`);
            }

            // Проверка переполнения элементов
            const container = document.querySelector('.container');
            if (container) {
                const containerWidth = container.getBoundingClientRect().width;
                if (containerWidth > deviceConfig.width) {
                    issues.push(`Container overflow: ${Math.round(containerWidth)}px > ${deviceConfig.width}px`);
                }
            }

            // Проверка мобильного режима для маленьких экранов
            if (deviceConfig.width <= 768) {
                if (!document.body.classList.contains('mobile-exercise-mode')) {
                    // Проверяем, если мы в упражнении
                    const quizArea = document.querySelector('#quizArea:not(.hidden)');
                    const survivalArea = document.querySelector('#survivalArea:not(.hidden)');
                    
                    if (quizArea || survivalArea) {
                        warnings.push('Mobile exercise mode not activated');
                    }
                }
            }

            // Проверка видимости критических элементов
            const criticalElements = {
                'header': 'Header missing',
                'main': 'Main content missing',
                '.nav-btn': 'Navigation missing'
            };

            for (const [selector, message] of Object.entries(criticalElements)) {
                const element = document.querySelector(selector);
                if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
                    if (screen.section !== 'auth') { // Auth screen может не иметь навигации
                        warnings.push(message);
                    }
                }
            }

            // Проверка кнопок в упражнениях
            if (screen.exercise && deviceConfig.deviceType === 'mobile') {
                const actionBtn = document.querySelector('.action-btn:not(.hidden)');
                if (actionBtn) {
                    const btnRect = actionBtn.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    
                    if (btnRect.bottom > viewportHeight) {
                        issues.push('Action button not visible on screen');
                    }
                    
                    if (btnRect.top < viewportHeight * 0.5) {
                        warnings.push('Action button might overlap with content');
                    }
                }
            }

            // Определение общего статуса
            let status = 'good';
            if (issues.length > 0) {
                status = 'issues';
            } else if (warnings.length > 0) {
                status = 'warnings';
            }

            return {
                status,
                issues,
                warnings,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                scrollSize: {
                    width: document.body.scrollWidth,
                    height: document.body.scrollHeight
                }
            };
        } catch (error) {
            return {
                status: 'error',
                issues: [`Analysis failed: ${error.message}`],
                warnings: [],
                error: error.message
            };
        }
    }

    // Запуск полного тестирования
    async runFullTest(deviceFilter = null) {
        if (this.isRunning) {
            console.warn('⚠️ Responsive test already running');
            return;
        }

        this.isRunning = true;
        this.screenshots = {};
        
        console.log('🚀 Starting responsive design testing...');
        const startTime = Date.now();
        
        const results = {
            summary: {
                startTime: new Date().toISOString(),
                devices: {},
                totalDevices: 0,
                totalScreens: 0,
                issues: 0,
                warnings: 0
            },
            devices: {},
            screenshots: {}
        };

        try {
            const devicesToTest = deviceFilter 
                ? Object.entries(this.devices).filter(([name]) => deviceFilter.includes(name))
                : Object.entries(this.devices);

            results.summary.totalDevices = devicesToTest.length;
            results.summary.totalScreens = devicesToTest.length * this.screens.length;

            // Тестируем каждое устройство
            for (const [deviceName, deviceConfig] of devicesToTest) {
                const deviceResults = await this.testDevice(deviceName, deviceConfig);
                results.devices[deviceName] = deviceResults;

                // Подсчитываем статистику
                for (const screenResult of Object.values(deviceResults.screens)) {
                    results.summary.issues += screenResult.issues ? screenResult.issues.length : 0;
                    results.summary.warnings += screenResult.warnings ? screenResult.warnings.length : 0;
                }

                results.summary.devices[deviceName] = {
                    status: this.getDeviceStatus(deviceResults),
                    screensCount: Object.keys(deviceResults.screens).length
                };
            }

            // Сохраняем скриншоты
            results.screenshots = { ...this.screenshots };

        } finally {
            // Восстанавливаем нормальный viewport
            this.resetViewport();
            this.isRunning = false;
        }

        const endTime = Date.now();
        results.summary.endTime = new Date().toISOString();
        results.summary.duration = endTime - startTime;

        console.log(`✅ Responsive testing completed in ${results.summary.duration}ms`);
        console.log(`📊 Summary: ${results.summary.issues} issues, ${results.summary.warnings} warnings`);

        // Сохраняем результаты
        window.lastResponsiveTestResults = results;

        return results;
    }

    // Определить общий статус устройства
    getDeviceStatus(deviceResults) {
        const screenStatuses = Object.values(deviceResults.screens).map(s => s.status);
        
        if (screenStatuses.includes('error') || screenStatuses.includes('issues')) {
            return 'issues';
        } else if (screenStatuses.includes('warnings')) {
            return 'warnings';
        } else {
            return 'good';
        }
    }

    // Быстрый тест популярных устройств
    async quickTest() {
        const popularDevices = ['iPhone 12', 'iPad', 'Standard Desktop'];
        return this.runFullTest(popularDevices);
    }

    // Тест только мобильных устройств
    async mobileTest() {
        const mobileDevices = Object.entries(this.devices)
            .filter(([, config]) => config.deviceType === 'mobile')
            .map(([name]) => name);
        return this.runFullTest(mobileDevices);
    }

    // Создать HTML отчет
    generateReport(results = window.lastResponsiveTestResults) {
        if (!results) {
            return '<p>No test results available. Run runResponsiveTest() first.</p>';
        }

        const summary = results.summary;
        const devices = results.devices;

        let html = `
            <div style="font-family: monospace; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h2>📱 Responsive Design Test Report</h2>
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <h3>Summary</h3>
                    <p><strong>Devices tested:</strong> ${summary.totalDevices}</p>
                    <p><strong>Total screens:</strong> ${summary.totalScreens}</p>
                    <p><strong>Issues found:</strong> <span style="color: ${summary.issues > 0 ? 'red' : 'green'}">${summary.issues}</span></p>
                    <p><strong>Warnings:</strong> <span style="color: ${summary.warnings > 0 ? 'orange' : 'green'}">${summary.warnings}</span></p>
                    <p><strong>Duration:</strong> ${summary.duration}ms</p>
                </div>
        `;

        // Детали по устройствам
        for (const [deviceName, deviceData] of Object.entries(devices)) {
            const statusColor = deviceData.config.deviceType === 'mobile' ? '#007bff' : 
                               deviceData.config.deviceType === 'tablet' ? '#28a745' : '#6c757d';
            
            html += `
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid ${statusColor};">
                    <h3>${deviceName} (${deviceData.config.width}x${deviceData.config.height})</h3>
                    <p><em>${deviceData.config.deviceType}</em></p>
            `;

            for (const [screenName, screenData] of Object.entries(deviceData.screens)) {
                const statusIcon = screenData.status === 'good' ? '✅' : 
                                 screenData.status === 'warnings' ? '⚠️' : '❌';
                
                html += `<div style="margin-left: 20px; padding: 5px;">
                    ${statusIcon} <strong>${screenName}</strong>`;

                if (screenData.issues && screenData.issues.length > 0) {
                    html += `<ul style="color: red; margin-left: 20px;">`;
                    for (const issue of screenData.issues) {
                        html += `<li>${issue}</li>`;
                    }
                    html += `</ul>`;
                }

                if (screenData.warnings && screenData.warnings.length > 0) {
                    html += `<ul style="color: orange; margin-left: 20px;">`;
                    for (const warning of screenData.warnings) {
                        html += `<li>${warning}</li>`;
                    }
                    html += `</ul>`;
                }

                html += `</div>`;
            }

            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    // Показать отчет в DOM
    showReport(results = window.lastResponsiveTestResults) {
        const reportHtml = this.generateReport(results);
        
        // Создаем или обновляем окно отчета
        let reportWindow = document.getElementById('responsiveTestReport');
        if (!reportWindow) {
            reportWindow = document.createElement('div');
            reportWindow.id = 'responsiveTestReport';
            reportWindow.style.cssText = `
                position: fixed;
                top: 50px;
                right: 50px;
                width: 600px;
                max-height: 80vh;
                background: white;
                border: 2px solid #ccc;
                border-radius: 10px;
                z-index: 10000;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #f44336;
                color: white;
                border: none;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10001;
            `;
            closeBtn.onclick = () => reportWindow.remove();
            
            reportWindow.appendChild(closeBtn);
            document.body.appendChild(reportWindow);
        }

        reportWindow.innerHTML = closeBtn.outerHTML + reportHtml;
    }
}

// Создание глобального экземпляра
window.responsiveTester = new ResponsiveTester();

// Удобные функции для консоли
window.runResponsiveTest = () => window.responsiveTester.runFullTest();
window.quickResponsiveTest = () => window.responsiveTester.quickTest();
window.mobileResponsiveTest = () => window.responsiveTester.mobileTest();
window.showResponsiveReport = () => window.responsiveTester.showReport();

console.log('📱 Responsive Design Tester loaded!');
console.log('💡 Available commands:');
console.log('   runResponsiveTest() - Test all devices and screens');
console.log('   quickResponsiveTest() - Test popular devices only');
console.log('   mobileResponsiveTest() - Test mobile devices only');
console.log('   showResponsiveReport() - Show visual report');
console.log('   responsiveTester.runFullTest([\"iPhone 12\", \"iPad\"]) - Test specific devices');