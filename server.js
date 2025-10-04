const express = require('express');
const cors = require('cors');
const path = require('path');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Redis client configuration
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.log('Redis server connection refused, running without cache');
      return undefined; // Don't retry
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.log('Redis retry time exhausted, running without cache');
      return undefined;
    }
    if (options.attempt > 10) {
      console.log('Redis max retry attempts reached, running without cache');
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Redis connection handling
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.log('⚠️ Redis connection error:', err.message);
  console.log('App will continue running without caching');
});

redisClient.on('end', () => {
  console.log('Redis connection ended');
});

// Connect to Redis (with error handling)
redisClient.connect().catch((err) => {
  console.log('Redis connection failed, continuing without cache:', err.message);
});

// Cache configuration
const CACHE_DURATION = 600; // 10 minutes in seconds
const STALE_CACHE_DURATION = 3600; // 1 hour for stale data

// Cache helper functions
const getCacheKey = (latitude, longitude) => {
  // Round coordinates to 3 decimal places for better cache hits
  const lat = parseFloat(latitude).toFixed(3);
  const lon = parseFloat(longitude).toFixed(3);
  return `weather:${lat}:${lon}`;
};

const getCachedData = async (cacheKey) => {
  try {
    if (!redisClient.isOpen) return null;
    const cached = await redisClient.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.log('Cache read error:', error.message);
    return null;
  }
};

const setCachedData = async (cacheKey, data) => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(cacheKey, CACHE_DURATION, JSON.stringify(data));
    console.log(`✅ Cached weather data for ${cacheKey}`);
  } catch (error) {
    console.log('Cache write error:', error.message);
  }
};

const setStaleCachedData = async (cacheKey, data) => {
  try {
    if (!redisClient.isOpen) return;
    const staleKey = `${cacheKey}:stale`;
    await redisClient.setEx(staleKey, STALE_CACHE_DURATION, JSON.stringify(data));
    console.log(`✅ Cached stale weather data for ${cacheKey}`);
  } catch (error) {
    console.log('Stale cache write error:', error.message);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Weather API endpoint with Redis caching
app.get('/api/weather', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    const cacheKey = getCacheKey(latitude, longitude);
    const startTime = Date.now();

    // Try to get data from cache first
    let cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`🚀 Cache hit! Response time: ${responseTime}ms`);
      return res.json({
        ...cachedData,
        cached: true,
        responseTime: `${responseTime}ms`
      });
    }

    console.log(`🔄 Cache miss - fetching from API for ${cacheKey}`);
    
    // Cache miss - fetch from API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation&timezone=auto`;
    
    const response = await fetch(weatherUrl);
    const data = await response.json();

    if (!response.ok) {
      // Try to serve stale cached data if API fails
      const staleData = await getCachedData(`${cacheKey}:stale`);
      if (staleData) {
        console.log('⚠️ API failed, serving stale cached data');
        return res.json({
          ...staleData,
          cached: true,
          stale: true,
          warning: 'Showing cached data - may not be current'
        });
      }
      throw new Error(`Weather API error: ${data.reason || 'Unknown error'}`);
    }

    // Process weather data
    const currentWeather = data.current_weather;
    const hourlyPrecipitation = data.hourly.precipitation[0]; // Current hour precipitation
    
    const isRaining = hourlyPrecipitation > 0;
    const temperature = currentWeather.temperature;
    const weatherCode = currentWeather.weathercode;

    // Weather code descriptions for better user experience
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

    const weatherDescription = weatherDescriptions[weatherCode] || 'Unknown weather condition';

    const result = {
      isRaining,
      temperature: Math.round(temperature),
      weatherDescription,
      precipitation: hourlyPrecipitation,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      cached: false,
      responseTime: `${Date.now() - startTime}ms`
    };

    // Cache the fresh data
    await setCachedData(cacheKey, result);
    await setStaleCachedData(cacheKey, result);

    console.log(`✅ Fresh data fetched and cached for ${cacheKey}`);
    res.json(result);

  } catch (error) {
    console.error('Weather API Error:', error);
    
    // Try to serve stale data as last resort
    const { latitude, longitude } = req.query;
    if (latitude && longitude) {
      const cacheKey = getCacheKey(latitude, longitude);
      const staleData = await getCachedData(`${cacheKey}:stale`);
      if (staleData) {
        console.log('🆘 Serving stale data due to API error');
        return res.json({
          ...staleData,
          cached: true,
          stale: true,
          warning: 'Weather service temporarily unavailable - showing cached data'
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      details: error.message 
    });
  }
});

// Cache status endpoint
app.get('/api/cache/status', async (req, res) => {
  try {
    const isConnected = redisClient.isOpen;
    const info = isConnected ? await redisClient.info('memory') : null;
    
    res.json({
      redis: {
        connected: isConnected,
        status: isConnected ? 'connected' : 'disconnected'
      },
      cache: {
        duration: CACHE_DURATION,
        staleDuration: STALE_CACHE_DURATION
      }
    });
  } catch (error) {
    res.json({
      redis: {
        connected: false,
        status: 'error',
        error: error.message
      }
    });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (redisClient.isOpen) {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (redisClient.isOpen) {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🌧️ Weather app server running on http://localhost:${PORT}`);
  console.log(`📊 Cache status: http://localhost:${PORT}/api/cache/status`);
  console.log(`💾 Redis caching: ${redisClient.isOpen ? 'Enabled' : 'Disabled (will run without cache)'}`);
});



