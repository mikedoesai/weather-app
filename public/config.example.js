// Configuration file for environment variables
// Copy this file to config.js and replace with your actual values

export const config = {
    // OpenWeatherMap API Key - should be moved to environment variables
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY_HERE',
    
    // Supabase configuration - should be moved to environment variables
    supabase: {
        url: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE',
        anonKey: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'
    },
    
    // Admin configuration
    admin: {
        password: process.env.ADMIN_PASSWORD || 'YOUR_ADMIN_PASSWORD_HERE'
    },
    
    // Environment
    isProduction: process.env.NODE_ENV === 'production'
};
