// Configuration for different environments
const config = {
    development: {
        apiUrl: 'http://localhost:3000/api',
        features: {
            enableTestingFunctions: true,
            enableLogging: true,
            enableResponsiveTesting: true
        }
    },
    production: {
        apiUrl: 'https://your-api-server.railway.app/api', // Update with your actual Railway URL
        features: {
            enableTestingFunctions: false,
            enableLogging: false,
            enableResponsiveTesting: false
        }
    }
};

// Auto-detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';

const currentEnv = isLocalhost ? 'development' : 'production';
const currentConfig = config[currentEnv];

// Export configuration
window.appConfig = currentConfig;

console.log(`🔧 Environment: ${currentEnv}`);
console.log(`📡 API URL: ${currentConfig.apiUrl}`);
console.log(`⚙️ Features:`, currentConfig.features);