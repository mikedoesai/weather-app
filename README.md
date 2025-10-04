# Rain Check - Weather App

A simple and beautiful weather application that tells you whether it's raining in your local area or not.

## Features

- 🌧️ **Rain Detection**: Instantly know if it's raining in your area
- 📍 **Location-based**: Uses your current location for accurate weather data
- 🎨 **Beautiful UI**: Modern design with Tailwind CSS and smooth animations
- 📱 **Responsive**: Works perfectly on desktop and mobile devices
- 🆓 **Free API**: Uses Open-Meteo API (no API key required)

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Weather API**: Open-Meteo (free, no API key needed)
- **Styling**: Tailwind CSS with custom animations

## Installation & Setup

1. **Clone or download the project**
   ```bash
   cd "Weather app"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### **Optional: Redis Caching (Recommended)**

For 20-60x faster performance, install Redis:

**Windows:**
```bash
choco install redis-64
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

**Or use Docker:**
```bash
docker run -d --name redis-weather -p 6379:6379 redis:alpine
```

See [REDIS_SETUP.md](REDIS_SETUP.md) for detailed setup instructions.

## 🐙 **GitHub Repository**

To connect this project to GitHub:
1. See [GITHUB_SETUP.md](GITHUB_SETUP.md) for complete setup instructions
2. Or follow the quick setup below:

```bash
# Initialize Git repository
git init
git add .
git commit -m "Initial commit: Weather app with Redis caching"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/weather-app.git
git branch -M main
git push -u origin main
```

## 🚀 **Deploy to Vercel**

Deploy your weather app to Vercel for free:

### **Quick Deploy**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Deploy automatically!

### **Detailed Guide**
See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for complete deployment instructions.

**Live Demo**: Your app will be available at `https://your-weather-app.vercel.app`

## Development

For development with auto-restart:
```bash
npm run dev
```

## How It Works

1. **Location Access**: The app requests permission to access your current location
2. **Weather Data**: Uses your coordinates to fetch real-time weather data from Open-Meteo API
3. **Rain Detection**: Analyzes precipitation data to determine if it's currently raining
4. **Display Results**: Shows a clear "Yes, it's raining!" or "No, it's not raining" message

## API Information

This app uses the [Open-Meteo API](https://open-meteo.com/), which provides:
- Free access without API key
- Real-time weather data
- Global coverage
- High accuracy forecasts

## Browser Compatibility

- Modern browsers with geolocation support
- HTTPS required for geolocation (use localhost for development)

## Project Structure

```
Weather app/
├── server.js          # Express server with weather API integration
├── package.json       # Dependencies and scripts
├── public/
│   ├── index.html     # Main HTML file with Tailwind CSS
│   └── script.js      # Frontend JavaScript logic
└── README.md          # This file
```

## Features in Detail

- **Smart Rain Detection**: Uses precipitation data to accurately determine rainfall
- **Weather Descriptions**: Provides detailed weather conditions beyond just rain
- **Temperature Display**: Shows current temperature in Celsius
- **Error Handling**: Graceful error handling for location and API issues
- **Responsive Design**: Optimized for all screen sizes
- **Smooth Animations**: Rain and sun animations for better user experience

Enjoy checking if it's raining in your area! 🌧️☀️



