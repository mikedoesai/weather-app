// Configuration file for the weather app
// Fetches configuration from server API endpoint

console.log('Config.js loading...');

// Default configuration (fallback)
const defaultConfig = {
    openWeatherApiKey: '5fcfc173deb068b3716c14a2d27c8ee3',
    supabase: {
        url: 'https://tzhzfiiwecohdkmxvol.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aHpmaXlpd2Vjb2hka214dm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTk3MDgsImV4cCI6MjA3NjI3NTcwOH0.KIgVbyEw8DeaZlKBCZie-8qu9v4Bz9UZDTpwV5UeCek'
    },
    admin: {
        password: 'raincheck2024'
    },
    isProduction: false
};

console.log('Default config loaded:', defaultConfig);

// Fetch configuration from server
async function fetchConfig() {
    try {
        console.log('Fetching config from server...');
        const baseUrl = window.location.origin;
        const configUrl = `${baseUrl}/api/config`;
        console.log('Config URL:', configUrl);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(configUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Config response status:', response.status);
        
        if (response.ok) {
            const serverConfig = await response.json();
            console.log('Server config received successfully:', serverConfig);
            return { ...defaultConfig, ...serverConfig };
        } else {
            console.warn('Config response not ok:', response.status, response.statusText);
            const errorText = await response.text();
            console.warn('Error response body:', errorText);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Config fetch timed out, using defaults');
        } else {
            console.warn('Failed to fetch server config, using defaults:', error);
        }
    }
    console.log('Using default config');
    return defaultConfig;
}

// Initialize configuration
let configPromise = fetchConfig();

// Export a promise that resolves to the configuration
export const getConfig = () => configPromise;

// For backward compatibility, export a synchronous config object
// This will be updated once the async config loads
export let config = defaultConfig;

// Make config available globally for debugging
window.CONFIG_DEBUG = { config, getConfig };

// Update the config object once the async config loads
configPromise.then(serverConfig => {
    config = serverConfig;
    window.CONFIG_DEBUG.config = config;
    console.log('Configuration loaded:', { 
        isProduction: config.isProduction,
        hasServerConfig: serverConfig !== defaultConfig 
    });
}).catch(error => {
    console.error('Config loading failed:', error);
    // Use global fallback if available
    if (window.FALLBACK_CONFIG) {
        console.log('Using global fallback config');
        config = window.FALLBACK_CONFIG;
        window.CONFIG_DEBUG.config = config;
    }
});