// Configuration file for environment variables
// Copy this file to config.js and replace with your actual values

console.log('Config.example.js loading...');

// Default configuration (fallback)
const defaultConfig = {
    openWeatherApiKey: 'YOUR_OPENWEATHER_API_KEY_HERE',
    supabase: {
        url: 'YOUR_SUPABASE_URL_HERE',
        anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE'
    },
    admin: {
        password: 'YOUR_ADMIN_PASSWORD_HERE'
    },
    isProduction: false
};

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
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            }
        });
        
        clearTimeout(timeoutId);
        console.log('Config response status:', response.status);
        
        if (response.ok) {
            const serverConfig = await response.json();
            console.log('Server config received successfully:', serverConfig);
            return { ...defaultConfig, ...serverConfig };
        } else {
            console.warn('Config response not ok:', response.status, response.statusText);
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

// Update the config object once the async config loads
configPromise.then(serverConfig => {
    config = serverConfig;
    console.log('Configuration loaded:', { 
        isProduction: config.isProduction,
        hasServerConfig: serverConfig !== defaultConfig 
    });
}).catch(error => {
    console.error('Config loading failed:', error);
    // Use default config if loading fails
    config = defaultConfig;
});

console.log('Config.example.js loaded');
