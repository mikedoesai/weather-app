// Quick test script to verify weather API works
const fetch = require('node-fetch');

async function testWeatherAPI() {
  try {
    console.log('Testing weather API...');
    
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true&hourly=precipitation&timezone=auto';
    
    const response = await fetch(weatherUrl);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.reason || 'Unknown error'}`);
    }
    
    console.log('✅ Weather API is working!');
    console.log('Current weather:', data.current_weather);
    console.log('Hourly precipitation:', data.hourly.precipitation.slice(0, 5));
    
    // Test our processing logic
    const currentWeather = data.current_weather;
    const isRaining = currentWeather.weathercode >= 51 && currentWeather.weathercode <= 86;
    const temperature = Math.round(currentWeather.temperature);
    
    console.log('Processed data:');
    console.log('- Is raining:', isRaining);
    console.log('- Temperature:', temperature + '°C');
    console.log('- Weather code:', currentWeather.weathercode);
    
  } catch (error) {
    console.error('❌ Weather API test failed:', error.message);
  }
}

testWeatherAPI();
