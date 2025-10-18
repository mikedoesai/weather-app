// Supabase configuration
import { config, getConfig } from './config.example.js'

// Wait for Supabase to be available from CDN
function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabase && window.supabase.createClient) {
            resolve(window.supabase.createClient);
        } else {
            // Wait for CDN to load
            const checkSupabase = () => {
                if (window.supabase && window.supabase.createClient) {
                    resolve(window.supabase.createClient);
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            checkSupabase();
        }
    });
}

// Initialize Supabase client
let supabase = null;
let createClient = null;

async function initializeSupabase() {
    try {
        createClient = await waitForSupabase();
        console.log('Supabase CDN loaded, creating client');
        
        // Create client with default config initially
        supabase = createClient(config.supabase.url, config.supabase.anonKey);
        
        // Update supabase client when server config loads
        try {
            const serverConfig = await getConfig();
            if (serverConfig.supabase.url !== config.supabase.url || serverConfig.supabase.anonKey !== config.supabase.anonKey) {
                console.log('Updating Supabase client with server config');
                supabase = createClient(serverConfig.supabase.url, serverConfig.supabase.anonKey);
            }
        } catch (error) {
            console.warn('Failed to update Supabase client, using default config:', error);
        }
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        // Create a mock client to prevent errors
        supabase = {
            from: () => ({ select: () => ({ order: () => ({ data: [], error: null }) }) }),
            auth: { getUser: () => ({ data: { user: null }, error: null }) }
        };
    }
}

// Initialize immediately
initializeSupabase();

export { supabase };

// Database functions for the weather app
export class WeatherAppDatabase {
    
    // Sponsorships
    static async getSponsorships() {
        const { data, error } = await supabase
            .from('sponsorships')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data || []
    }

    static async addSponsorship(sponsorship) {
        const { data, error } = await supabase
            .from('sponsorships')
            .insert([sponsorship])
            .select()
        
        if (error) throw error
        return data[0]
    }

    static async updateSponsorship(id, updates) {
        const { data, error } = await supabase
            .from('sponsorships')
            .update(updates)
            .eq('id', id)
            .select()
        
        if (error) throw error
        return data[0]
    }

    static async deleteSponsorship(id) {
        const { error } = await supabase
            .from('sponsorships')
            .delete()
            .eq('id', id)
        
        if (error) throw error
    }

    // Usage tracking
    static async addUsageData(usageData) {
        const { data, error } = await supabase
            .from('usage_data')
            .insert([usageData])
            .select()
        
        if (error) throw error
        return data[0]
    }

    static async getUsageData() {
        const { data, error } = await supabase
            .from('usage_data')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data || []
    }

    // Feedback
    static async addFeedback(feedback) {
        const { data, error } = await supabase
            .from('feedback')
            .insert([feedback])
            .select()
        
        if (error) throw error
        return data[0]
    }

    static async getFeedback() {
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data || []
    }

    // Real-time subscriptions
    static subscribeToSponsorships(callback) {
        return supabase
            .channel('sponsorships')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'sponsorships' }, 
                callback
            )
            .subscribe()
    }

    static subscribeToUsageData(callback) {
        return supabase
            .channel('usage_data')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'usage_data' }, 
                callback
            )
            .subscribe()
    }

    static subscribeToFeedback(callback) {
        return supabase
            .channel('feedback')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'feedback' }, 
                callback
            )
            .subscribe()
    }
}
