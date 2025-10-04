const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    port: process.env.PORT,
    timestamp: new Date().toISOString(),
    status: 'Server is running'
  });
});

// Weather API endpoint (simplified for Vercel)
app.get('/api/weather', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    console.log(`Fetching weather for: ${latitude}, ${longitude}`);
    
    // Fetch from Open-Meteo API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation&timezone=auto`;
    
    const response = await fetch(weatherUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Weather API error: ${data.reason || 'Unknown error'}`);
    }

    // Process weather data
    const currentWeather = data.current_weather;
    const hourly = data.hourly;
    
    const isRaining = currentWeather.weathercode >= 51 && currentWeather.weathercode <= 86;
    const temperature = Math.round(currentWeather.temperature);
    const weatherDescription = getWeatherDescription(currentWeather.weathercode);
    
    // Get precipitation for next few hours
    const precipitation = hourly.precipitation.slice(0, 6).reduce((sum, val) => sum + val, 0);

    const result = {
      isRaining,
      temperature,
      weatherDescription,
      precipitation: Math.round(precipitation * 10) / 10,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      cached: false,
      responseTime: `${Date.now() - Date.now()}ms`
    };

    console.log('Weather data processed:', result);
    res.json(result);

  } catch (error) {
    console.error('Weather API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error.message 
    });
  }
});

// Helper function to get weather description
const getWeatherDescription = (weatherCode) => {
  const weatherDescriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return weatherDescriptions[weatherCode] || 'Unknown weather condition';
};

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🌧️ Weather app server running on http://localhost:${PORT}`);
    console.log(`📊 Debug endpoint: http://localhost:${PORT}/api/debug`);
  });
}

// Export for Vercel
module.exports = app;
