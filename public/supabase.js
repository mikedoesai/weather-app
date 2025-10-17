// Supabase configuration
import { createClient } from '@supabase/supabase-js'
import { config } from './config.example.js'

export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

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
