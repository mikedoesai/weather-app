# Supabase Setup Guide for Rain Check Weather App

## Step 1: Create Supabase Account and Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up** for a free account (or sign in if you have one)
3. **Click "New Project"**
4. **Fill in project details:**
   - **Name**: `rain-check-weather-app`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (perfect for starting)

5. **Click "Create new project"**
6. **Wait 2-3 minutes** for the project to be created

## Step 2: Get Your Project Credentials

1. **Go to Settings → API** in your Supabase dashboard
2. **Copy these values:**
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## Step 3: Set Up Database Schema

1. **Go to SQL Editor** in your Supabase dashboard
2. **Click "New Query"**
3. **Copy and paste** the contents of `database-schema.sql`
4. **Click "Run"** to create the tables and sample data

## Step 4: Update Your App Configuration

1. **Open `public/supabase.js`**
2. **Replace the placeholder values:**
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your Project URL
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your Anon public key
   ```

## Step 5: Test the Connection

1. **Open your app** in the browser
2. **Check the browser console** for any Supabase connection errors
3. **Try using the admin panel** to see if data loads from Supabase

## Step 6: Environment Variables (for Vercel deployment)

When you deploy to Vercel, you'll need to add these environment variables:

1. **Go to your Vercel project settings**
2. **Add Environment Variables:**
   - `SUPABASE_URL` = Your Project URL
   - `SUPABASE_ANON_KEY` = Your Anon public key

## Database Tables Created

### `sponsorships`
- Stores sponsored messages with weather targeting
- Fields: id, sponsor, message, weather_type, duration, price, status, start_date

### `usage_data`
- Tracks app usage and user behavior
- Fields: id, user_id, weather_type, profanity_mode, temp_unit, is_raining, temperature, location

### `feedback`
- Stores user feedback on messages
- Fields: id, user_id, type, message, profanity_mode

## Sample Data

The schema includes sample sponsored messages for testing:
- Coffee shop message for rain
- Resort message for sunny weather
- Photography message for overcast
- Snow gear message for snowy weather

## Next Steps

After completing this setup:
1. **Test the admin panel** to ensure data loads from Supabase
2. **Deploy to Vercel** with environment variables
3. **Test in production** to ensure everything works

## Troubleshooting

**Common Issues:**
- **Connection errors**: Check your URL and API key
- **Permission errors**: Make sure RLS is disabled for now
- **Data not loading**: Check browser console for errors

**Need Help?**
- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
