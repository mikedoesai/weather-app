export default async function handler(req, res) {
  console.log('Config API handler called:', req.method, req.url);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  try {
    // Return configuration for production
    const config = {
      openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '5fcfc173deb068b3716c14a2d27c8ee3',
      supabase: {
        url: process.env.SUPABASE_URL || 'https://tzhzfiiwecohdkmxvol.supabase.co',
        anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aHpmaXlpd2Vjb2hka214dm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTk3MDgsImV4cCI6MjA3NjI3NTcwOH0.KIgVbyEw8DeaZlKBCZie-8qu9v4Bz9UZDTpwV5UeCek'
      },
      admin: {
        password: process.env.ADMIN_PASSWORD || 'YOUR_ADMIN_PASSWORD_HERE'
      },
      isProduction: process.env.NODE_ENV === 'production'
    };

    console.log('Config endpoint called, returning config for production');
    return res.json(config);
  } catch (error) {
    console.error('Config API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch configuration',
      details: error.message 
    });
  }
}
