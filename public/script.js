import { WeatherAppDatabase } from './supabase.js';
import { config, getConfig } from './config.js';
import { safeSetInnerHTML, validateInput, generateSecureId, rateLimiter } from './utils/security.js';

class WeatherApp {
    constructor() {
        // Load profanity mode from localStorage or default to false
        this.profanityMode = localStorage.getItem('weatherAppProfanityMode') === 'true';
        this.temperatureUnit = 'celsius'; // Default to celsius
        this.currentTemperatureCelsius = null; // Store the original Celsius value
        this.openWeatherApiKey = config.openWeatherApiKey;
        this.initializeElements();
        this.bindEvents();
        this.initializeTemperatureUnit();
        this.initializeProfanityToggle();
        this.hideWeatherWarning(); // Ensure banner is hidden on startup
        this.clearTestSponsoredMessages(); // Clear any test data
        this.initializeConfig();
    }

    async initializeConfig() {
        try {
            console.log('Initializing config...');
            const serverConfig = await getConfig();
            this.openWeatherApiKey = serverConfig.openWeatherApiKey;
            console.log('Config initialized successfully:', {
                isProduction: serverConfig.isProduction,
                hasApiKey: !!this.openWeatherApiKey,
                apiKeyLength: this.openWeatherApiKey ? this.openWeatherApiKey.length : 0
            });
        } catch (error) {
            console.error('Failed to load server config, using defaults:', error);
            // Ensure we have a fallback API key
            if (!this.openWeatherApiKey) {
                this.openWeatherApiKey = '5fcfc173deb068b3716c14a2d27c8ee3';
                console.log('Using fallback API key');
            }
        }
    }

    initializeElements() {
        // State elements
        this.initialState = document.getElementById('initial-state');
        this.loadingState = document.getElementById('loading-state');
        this.weatherResult = document.getElementById('weather-result');
        this.errorState = document.getElementById('error-state');

        // Button elements
        this.getLocationBtn = document.getElementById('get-location-btn');
        this.checkAgainBtn = document.getElementById('check-again-btn');
        this.retryBtn = document.getElementById('retry-btn');
        this.profanityToggle = document.getElementById('profanity-toggle');

        // Weather display elements
        this.weatherIcon = document.getElementById('weather-icon');
        this.rainStatus = document.getElementById('rain-status');
        this.temperature = document.getElementById('temperature');
        this.weatherDescription = document.getElementById('weather-description');
        this.precipitationInfo = document.getElementById('precipitation-info');
        this.errorMessage = document.getElementById('error-message');

        // Temperature unit elements
        this.temperatureToggle = document.getElementById('temperature-toggle');
        this.temperatureUnitText = document.getElementById('temperature-unit-text');

        // Weather warning elements
        this.weatherWarningBanner = document.getElementById('weather-warning-banner');
        this.warningTitle = document.getElementById('warning-title');
        this.warningDescription = document.getElementById('warning-description');
        this.warningDuration = document.getElementById('warning-duration');

        // Feedback elements
        this.messageFeedback = document.getElementById('message-feedback');
        this.thumbsUpBtn = document.getElementById('thumbs-up');
        this.thumbsDownBtn = document.getElementById('thumbs-down');
        this.feedbackThanks = document.getElementById('feedback-thanks');
    }

    bindEvents() {
        this.getLocationBtn.addEventListener('click', () => this.getUserLocation());
        this.checkAgainBtn.addEventListener('click', () => this.getUserLocation());
        this.retryBtn.addEventListener('click', () => this.getUserLocation());
        this.profanityToggle.addEventListener('change', (e) => {
            this.profanityMode = e.target.checked;
            // Save profanity mode state to localStorage
            localStorage.setItem('weatherAppProfanityMode', this.profanityMode.toString());
            this.trackGoogleAnalytics('profanity_toggle', {
                enabled: this.profanityMode
            });
        });
        this.temperatureToggle.addEventListener('change', (e) => {
            this.temperatureUnit = e.target.checked ? 'fahrenheit' : 'celsius';
            this.updateTemperatureUnitDisplay();
            this.saveTemperatureUnitPreference();
            this.trackGoogleAnalytics('temperature_unit_change', {
                unit: this.temperatureUnit
            });
            // If weather data is already displayed, update it with new unit
            if (!this.weatherResult.classList.contains('hidden') && this.currentTemperatureCelsius !== null) {
                this.updateDisplayedTemperature();
            }
        });
        
        // Feedback event listeners
        this.thumbsUpBtn.addEventListener('click', () => this.submitFeedback('positive'));
        this.thumbsDownBtn.addEventListener('click', () => this.submitFeedback('negative'));
    }

    showState(state) {
        // Hide all states
        this.initialState.classList.add('hidden');
        this.loadingState.classList.add('hidden');
        this.weatherResult.classList.add('hidden');
        this.errorState.classList.add('hidden');

        // Show the requested state
        document.getElementById(state).classList.remove('hidden');
    }

    async getUserLocation() {
        this.showState('loading-state');

        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser.');
            return;
        }

        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            await this.fetchWeatherData(latitude, longitude);
        } catch (error) {
            console.error('Location error:', error);
            this.showError(this.getLocationErrorMessage(error));
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000, // Increased timeout for Vercel
                maximumAge: 300000 // 5 minutes
            });
        });
    }

    getLocationErrorMessage(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Location access denied. Please allow location access and try again.';
            case error.POSITION_UNAVAILABLE:
                return 'Location information is unavailable. Please check your connection.';
            case error.TIMEOUT:
                return 'Location request timed out. Please try again.';
            default:
                return 'An unknown error occurred while getting your location.';
        }
    }

    async fetchWeatherData(latitude, longitude) {
        try {
            console.log(`Fetching weather for: ${latitude}, ${longitude}`);
            
            // Use absolute URL for Vercel compatibility
            const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/api/weather?latitude=${latitude}&longitude=${longitude}`;
            
            console.log('API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch weather data'}`);
            }
            
            const data = await response.json();
            console.log('Weather data received:', data);

            // Fetch weather alerts from OpenWeatherMap
            const alerts = await this.fetchWeatherAlerts(latitude, longitude);
            data.alerts = alerts;

            await this.displayWeatherData(data);
        } catch (error) {
            console.error('Weather API error:', error);
            this.showError(`Failed to fetch weather data: ${error.message}. Please try again later.`);
        }
    }

    async displayWeatherData(data) {
        const { isRaining, temperature, weatherDescription, precipitation } = data;

        // Track usage data for admin panel
        this.trackUsage(data);

        // Check for extremely hot weather first (overrides everything)
        if (temperature > 30) {
            this.weatherIcon.innerHTML = '<i class="fas fa-temperature-high text-red-600"></i>';
            
            const hotMessage = this.profanityMode 
                ? "It's hotter than Satan's ballsack in here!" 
                : "It's hot as hell in here!";
            
            this.rainStatus.innerHTML = `<span class="text-red-600 font-bold">${hotMessage}</span>`;
            
            // Set temperature and description for hot weather
            this.currentTemperatureCelsius = temperature; // Store original Celsius value
            const convertedTemp = this.convertTemperature(temperature);
            this.temperature.innerHTML = `${convertedTemp}${this.getTemperatureUnitSymbol()}`;
            this.weatherDescription.textContent = weatherDescription;
            this.precipitationInfo.innerHTML = `
                <i class="fas fa-tint mr-1"></i>
                No precipitation
            `;
            
            this.showState('weather-result');
            return; // Exit early to prevent further processing
        }
        // Set weather icon and status for rain
        else if (isRaining) {
            this.weatherIcon.innerHTML = '<i class="fas fa-cloud-rain text-blue-500"></i>';
            
            // Get appropriate messages based on profanity mode
            const rainMessages = await this.getRainMessages();
            
            // Pick a random message
            const randomMessage = rainMessages[Math.floor(Math.random() * rainMessages.length)];
            
            // Check if it's a sponsored message
            if (typeof randomMessage === 'object' && randomMessage.isSponsored) {
                this.rainStatus.innerHTML = this.displaySponsoredMessage(randomMessage);
            } else {
                this.rainStatus.innerHTML = `<span style="color: #10769C;">${randomMessage}</span>`;
            }
        } else {
            // Determine weather type based on description and temperature
            const weatherType = this.getWeatherType(weatherDescription, temperature);
            
            // Check for sponsored messages for this weather type
            const sponsoredMessage = await this.getSponsoredMessage(weatherType);
            if (sponsoredMessage) {
                this.rainStatus.innerHTML = this.displaySponsoredMessage(sponsoredMessage);
                await this.trackUsage(data);
                if (this.profanityMode) {
                    this.showMessageFeedback();
                } else {
                    this.hideMessageFeedback();
                }
                this.showState('weather-result');
                return; // Exit early to prevent further processing
            }
            
            switch (weatherType) {
                case 'clear_sky':
                    this.weatherIcon.innerHTML = '<i class="fas fa-sun text-yellow-500"></i>';
                    const clearSkyMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Crystal clear skies, finally!",
                        "Perfect clear weather, about damn time!",
                        "Not a cloud in sight, thank goodness!",
                        "Beautiful clear day, finally!",
                        "Sky is completely clear, hallelujah!",
                        "Stunning clear conditions, finally!",
                        "Clear as a bell, thank God!",
                        "Absolutely clear, it's about time!",
                        "Perfect visibility, finally!"
                    ] : [
                        "No, it's not raining",
                        "Crystal clear skies!",
                        "Perfect clear weather!",
                        "Not a cloud in sight!",
                        "Beautiful clear day!",
                        "Sky is completely clear!",
                        "Stunning clear conditions!",
                        "Clear as a bell!",
                        "Absolutely clear!",
                        "Perfect visibility!"
                    ];
                    const randomClearSkyMessage = clearSkyMessages[Math.floor(Math.random() * clearSkyMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-yellow-600">${randomClearSkyMessage}</span>`;
                    break;
                    
                case 'sunny':
                    this.weatherIcon.innerHTML = '<i class="fas fa-sun text-yellow-500"></i>';
                    const sunnyMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Beautiful sunny day, finally!",
                        "Perfect weather outside, about damn time!",
                        "Sunshine and clear skies, hallelujah!",
                        "Great day for outdoor fun, finally!",
                        "The sun is shining bright, thank God!",
                        "Lovely sunny weather, it's about time!",
                        "Clear skies ahead, finally!",
                        "Sunny and warm, thank goodness!",
                        "Enjoy the sunshine, damn it!",
                        "The sun is actually showing up for once!",
                        "Beautiful day, no complaints here!",
                        "Sunshine is finally doing its job!",
                        "Perfect weather, can't argue with that!",
                        "The sun is being generous today!",
                        "Lovely day, about damn time!",
                        "Sunshine and happiness, finally!",
                        "Great weather, no rain in sight!",
                        "The sun is shining like it means it!",
                        "Beautiful day, enjoy it while it lasts!",
                        "Sunshine is blessing us today!",
                        "Perfect weather, no complaints!",
                        "The sun is doing its thing!",
                        "Lovely day, make the most of it!",
                        "Sunshine and clear skies, perfect!",
                        "Great weather, no rain today!",
                        "The sun is being cooperative!",
                        "Beautiful day, soak it up!",
                        "Sunshine is working overtime!",
                        "Perfect weather, enjoy it!",
                        "The sun is shining bright and proud!",
                        "Lovely day, no rain to ruin it!",
                        "Sunshine and warmth, finally!",
                        "Great weather, make it count!",
                        "The sun is being generous!",
                        "Beautiful day, no complaints!",
                        "Sunshine is doing its job well!",
                        "Perfect weather, no rain!",
                        "The sun is shining like a star!",
                        "Lovely day, enjoy the warmth!",
                        "Sunshine and happiness, perfect!"
                    ] : [
                        "No, it's not raining",
                        "Beautiful sunny day!",
                        "Perfect weather outside!",
                        "Sunshine and clear skies!",
                        "Great day for outdoor fun!",
                        "The sun is shining bright!",
                        "Lovely sunny weather!",
                        "Clear skies ahead!",
                        "Sunny and warm!",
                        "Enjoy the sunshine!",
                        "The sun is blessing us today!",
                        "Perfect day for adventures!",
                        "Sunshine is nature's gift!",
                        "Beautiful weather, no rain!",
                        "The sun is doing its magic!",
                        "Lovely day for outdoor activities!",
                        "Sunshine and happiness!",
                        "Great weather for exploring!",
                        "The sun is shining with joy!",
                        "Perfect day for making memories!",
                        "Sunshine is lighting up the world!",
                        "Beautiful day for a walk!",
                        "The sun is being generous!",
                        "Lovely weather for picnics!",
                        "Sunshine and clear skies!",
                        "Great day for gardening!",
                        "The sun is warming our hearts!",
                        "Perfect weather for outdoor fun!",
                        "Sunshine is nature's smile!",
                        "Beautiful day for relaxation!",
                        "The sun is shining bright!",
                        "Lovely day for beach trips!",
                        "Sunshine and warmth!",
                        "Great weather for hiking!",
                        "The sun is blessing the earth!",
                        "Perfect day for outdoor sports!",
                        "Sunshine is spreading joy!",
                        "Beautiful weather for festivals!",
                        "The sun is doing its best!",
                        "Lovely day for photography!",
                        "Sunshine and clear skies!",
                        "Great weather for road trips!",
                        "The sun is shining with pride!",
                        "Perfect day for outdoor dining!",
                        "Sunshine is nature's energy!",
                        "Beautiful day for stargazing!",
                        "The sun is warming the world!",
                        "Lovely weather for camping!",
                        "Sunshine and happiness!",
                        "Great day for outdoor concerts!"
                    ];
                    const randomSunnyMessage = sunnyMessages[Math.floor(Math.random() * sunnyMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-green-600">${randomSunnyMessage}</span>`;
                    break;
                    
                case 'hot_sunny':
                    this.weatherIcon.innerHTML = '<i class="fas fa-sun text-red-500"></i>';
                    const hotSunnyMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Hot and sunny, damn it!",
                        "Scorching weather, this sucks!",
                        "Very hot and dry, what a pain!",
                        "Heat wave conditions, bloody hell!",
                        "Blazing hot sun, this is torture!",
                        "Extremely hot day, damn it!",
                        "Sizzling weather, this is hell!",
                        "Hot as an oven, what a nightmare!",
                        "Burning hot outside, this is awful!"
                    ] : [
                        "No, it's not raining",
                        "Hot and sunny!",
                        "Scorching weather!",
                        "Very hot and dry!",
                        "Heat wave conditions!",
                        "Blazing hot sun!",
                        "Extremely hot day!",
                        "Sizzling weather!",
                        "Hot as an oven!",
                        "Burning hot outside!"
                    ];
                    const randomHotSunnyMessage = hotSunnyMessages[Math.floor(Math.random() * hotSunnyMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-red-600">${randomHotSunnyMessage}</span>`;
                    break;
                    
                case 'few_clouds':
                    this.weatherIcon.innerHTML = '<i class="fas fa-cloud-sun text-yellow-400"></i>';
                    const fewCloudsMessages = this.profanityMode ? [
                        "It's not fucking raining, I guess that's something",
                        "Just a few clouds, not bad!",
                        "Mostly clear with some clouds, decent!",
                        "Scattered clouds today, could be worse!",
                        "Light cloud cover, not too shabby!",
                        "Few clouds in the sky, alright!",
                        "Mostly sunny with clouds, not bad!",
                        "Some clouds but clear, decent!",
                        "Light cloudiness, could be worse!",
                        "Minimal cloud cover, not too bad!"
                    ] : [
                        "No, it's not raining",
                        "Just a few clouds!",
                        "Mostly clear with some clouds!",
                        "Scattered clouds today!",
                        "Light cloud cover!",
                        "Few clouds in the sky!",
                        "Mostly sunny with clouds!",
                        "Some clouds but clear!",
                        "Light cloudiness!",
                        "Minimal cloud cover!"
                    ];
                    const randomFewCloudsMessage = fewCloudsMessages[Math.floor(Math.random() * fewCloudsMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-yellow-600">${randomFewCloudsMessage}</span>`;
                    break;
                    
                case 'broken_clouds':
                    this.weatherIcon.innerHTML = '<i class="fas fa-cloud text-gray-400"></i>';
                    const brokenCloudsMessages = this.profanityMode ? [
                        "It's not fucking raining, I guess that's something",
                        "Broken cloud cover, typical!",
                        "Variable cloudiness, what a mess!",
                        "Patchy clouds today, annoying!",
                        "Intermittent cloud cover, frustrating!",
                        "Broken sky conditions, typical!",
                        "Scattered cloud patches, messy!",
                        "Variable sky conditions, annoying!",
                        "Patchy cloudiness, what a pain!",
                        "Broken cloud formations, typical!"
                    ] : [
                        "No, it's not raining",
                        "Broken cloud cover!",
                        "Variable cloudiness!",
                        "Patchy clouds today!",
                        "Intermittent cloud cover!",
                        "Broken sky conditions!",
                        "Scattered cloud patches!",
                        "Variable sky conditions!",
                        "Patchy cloudiness!",
                        "Broken cloud formations!"
                    ];
                    const randomBrokenCloudsMessage = brokenCloudsMessages[Math.floor(Math.random() * brokenCloudsMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-gray-500">${randomBrokenCloudsMessage}</span>`;
                    break;
                    
                case 'overcast':
                    this.weatherIcon.innerHTML = '<i class="fas fa-cloud text-gray-500"></i>';
                    const overcastMessages = this.profanityMode ? [
                        "It's not raining but it is grey and shitty",
                        "Completely overcast, how damn depressing!",
                        "Heavy cloud cover, what a debby downer!",
                        "Dense cloud layer, all doom and gloomy",
                        "Overcast but dry, better than pissing rain!",
                        "Thick cloud blanket, the worst kind of blanket",
                        "Grey as fuck out there, don't bother putting your shoes on!",
                        "The clouds are fucking everywhere",
                        "Heavy cloudiness, how fucking depressing!",
                        "Dense overcast sky, gloomy!",
                        "The sky is having a grey day, just like my mood",
                        "Clouds so thick you could cut them with a knife",
                        "Overcast and underwhelming, typical!",
                        "The clouds are having a bad hair day",
                        "Grey sky, grey mood, grey everything",
                        "The weather is being a real downer",
                        "Clouds so dense they're blocking the sun's therapy",
                        "Overcast and over it, just like me",
                        "The sky is wearing a grey sweater",
                        "Clouds so thick they're suffocating the sunshine",
                        "Overcast and underappreciated",
                        "The weather is having an existential crisis",
                        "Grey sky, no lie, it's pretty depressing",
                        "The clouds are having a group therapy session",
                        "Overcast and overthinking everything",
                        "The sky is in a grey mood today",
                        "Clouds so heavy they're weighing down the atmosphere",
                        "Overcast and over it, just like Monday",
                        "The weather is being a real buzzkill",
                        "Grey sky, grey thoughts, grey day",
                        "The clouds are having a collective bad day",
                        "Overcast and under the weather",
                        "The sky is wearing its sad face",
                        "Clouds so thick they're blocking the good vibes",
                        "Overcast and overanalyzing everything",
                        "The weather is having a grey period",
                        "Grey sky, no high, just low energy",
                        "The clouds are having a pity party",
                        "Overcast and overthinking the meaning of life",
                        "The sky is in a contemplative mood",
                        "Clouds so dense they're absorbing all the happiness"
                    ] : [
                        "No, it's not raining",
                        "Completely overcast!",
                        "Heavy cloud cover!",
                        "Dense cloud layer!",
                        "Overcast but dry!",
                        "Thick cloud blanket!",
                        "Solid cloud cover!",
                        "Overcast conditions!",
                        "Heavy cloudiness!",
                        "Dense overcast sky!",
                        "The sky is wearing a grey coat today",
                        "Clouds are having a quiet day",
                        "Overcast and peaceful",
                        "The weather is being contemplative",
                        "Grey sky, but no rain!",
                        "The clouds are having a rest day",
                        "Overcast and serene",
                        "The sky is in a thoughtful mood",
                        "Clouds are providing gentle shade",
                        "Overcast but comfortable",
                        "The weather is being gentle today",
                        "Grey sky, peaceful vibes",
                        "The clouds are having a calm day",
                        "Overcast and cozy",
                        "The sky is wearing its soft colors",
                        "Clouds are creating a peaceful atmosphere",
                        "Overcast and tranquil",
                        "The weather is being mellow",
                        "Grey sky, but still beautiful",
                        "The clouds are having a quiet conversation",
                        "Overcast and meditative",
                        "The sky is in a reflective mood",
                        "Clouds are providing gentle coverage",
                        "Overcast and harmonious",
                        "The weather is being contemplative",
                        "Grey sky, peaceful energy",
                        "The clouds are having a gentle day",
                        "Overcast and serene",
                        "The sky is wearing its softest colors",
                        "Clouds are creating a peaceful ambiance",
                        "Overcast and calming",
                        "The weather is being gentle and kind",
                        "Grey sky, but full of peace",
                        "The clouds are having a quiet celebration",
                        "Overcast and harmonious",
                        "The sky is in a peaceful mood",
                        "Clouds are providing gentle protection",
                        "Overcast and tranquil",
                        "The weather is being soft and gentle",
                        "Grey sky, but full of grace",
                        "The clouds are having a peaceful gathering"
                    ];
                    const randomOvercastMessage = overcastMessages[Math.floor(Math.random() * overcastMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-gray-600">${randomOvercastMessage}</span>`;
                    break;
                    
                case 'partly_cloudy':
                    this.weatherIcon.innerHTML = '<i class="fas fa-cloud-sun text-orange-400"></i>';
                    const partlyCloudyMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Partly cloudy today, not bad!",
                        "Mix of sun and clouds, decent!",
                        "Today can't decide what it wants to be, too bloody relatable",
                        "Partly sunny weather, could be worse!",
                        "Clouds and sunshine, well that's a fucking relief!",
                        "As many clouds as fucks I could give right now",
                        "Sunny with some clouds, fucking aye!",
                        "Just a few clouds, I can almost see through this crappy day",
                        "Mixed weather conditions, fucking indecisive as hell!"
                    ] : [
                        "No, it's not raining",
                        "Partly cloudy today!",
                        "Mix of sun and clouds!",
                        "Some clouds, some sun!",
                        "Partly sunny weather!",
                        "Clouds and sunshine!",
                        "Variable cloudiness!",
                        "Sunny with some clouds!",
                        "Partly clear skies!",
                        "Mixed weather conditions!"
                    ];
                    const randomPartlyCloudyMessage = partlyCloudyMessages[Math.floor(Math.random() * partlyCloudyMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-orange-600">${randomPartlyCloudyMessage}</span>`;
                    break;
                    
                case 'foggy':
                    this.weatherIcon.innerHTML = '<i class="fas fa-smog text-gray-400"></i>';
                    const foggyMessages = this.profanityMode ? [
                        "No, it's not raining. That's all you get.",
                        "Foggy conditions today, annoying!",
                        "Misty weather outside, you won't be able to see shit!",
                        "Low visibility ahead, good day to avoid conversation",
                        "Fog but no rain, at least there's that!",
                        "Hazy conditions, annoying!",
                        "Misty morning, what a bummer!",
                        "Foggy but dry, could be worse!",
                        "Low clouds and fog, depressing!",
                        "Misty weather conditions, annoying!"
                    ] : [
                        "No, it's not raining",
                        "Foggy conditions today!",
                        "Misty weather outside!",
                        "Low visibility ahead!",
                        "Fog but no rain!",
                        "Hazy conditions!",
                        "Misty morning!",
                        "Foggy but dry!",
                        "Low clouds and fog!",
                        "Misty weather conditions!"
                    ];
                    const randomFoggyMessage = foggyMessages[Math.floor(Math.random() * foggyMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-gray-500">${randomFoggyMessage}</span>`;
                    break;
                    
                case 'dense_fog':
                    this.weatherIcon.innerHTML = '<i class="fas fa-smog text-gray-600"></i>';
                    const denseFogMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Dense fog conditions, bloody hell!",
                        "Very thick fog, this is awful!",
                        "Heavy fog today, what a nightmare!",
                        "Dense mist but no rain, at least there's that!",
                        "Thick fog blanket, this sucks!",
                        "Very low visibility, damn it!",
                        "Dense foggy weather, what a pain!",
                        "Heavy mist conditions, this is terrible!",
                        "Thick fog cover, bloody hell!"
                    ] : [
                        "No, it's not raining",
                        "Dense fog conditions!",
                        "Very thick fog!",
                        "Heavy fog today!",
                        "Dense mist but no rain!",
                        "Thick fog blanket!",
                        "Very low visibility!",
                        "Dense foggy weather!",
                        "Heavy mist conditions!",
                        "Thick fog cover!"
                    ];
                    const randomDenseFogMessage = denseFogMessages[Math.floor(Math.random() * denseFogMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-gray-700">${randomDenseFogMessage}</span>`;
                    break;
                    
                case 'light_snow':
                    this.weatherIcon.innerHTML = '<i class="fas fa-snowflake text-blue-200"></i>';
                    const lightSnowMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Light snow falling, not too bad!",
                        "Gentle snow flurries, could be worse!",
                        "Light snowfall today, alright!",
                        "Soft snow but no rain, decent!",
                        "Light winter precipitation, not bad!",
                        "Gentle snow showers, could be worse!",
                        "Light snow conditions, alright!",
                        "Soft snowflakes, not too shabby!",
                        "Light snow activity, could be worse!"
                    ] : [
                        "No, it's not raining",
                        "Light snow falling!",
                        "Gentle snow flurries!",
                        "Light snowfall today!",
                        "Soft snow but no rain!",
                        "Light winter precipitation!",
                        "Gentle snow showers!",
                        "Light snow conditions!",
                        "Soft snowflakes!",
                        "Light snow activity!"
                    ];
                    const randomLightSnowMessage = lightSnowMessages[Math.floor(Math.random() * lightSnowMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-blue-300">${randomLightSnowMessage}</span>`;
                    break;
                    
                case 'snowy':
                    this.weatherIcon.innerHTML = '<i class="fas fa-snowflake text-blue-300"></i>';
                    const snowyMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Snow instead of rain, typical!",
                        "Winter wonderland, bloody cold!",
                        "Snowy conditions, what a pain!",
                        "It's snowing outside, damn it!",
                        "White stuff falling, annoying!",
                        "Snow day weather, cold as hell!",
                        "Winter precipitation, what a bummer!",
                        "Snowflakes in the air, freezing!",
                        "Cold and snowy, damn it!"
                    ] : [
                        "No, it's not raining",
                        "Snow instead of rain!",
                        "Winter wonderland!",
                        "Snowy conditions!",
                        "It's snowing outside!",
                        "White stuff falling!",
                        "Snow day weather!",
                        "Winter precipitation!",
                        "Snowflakes in the air!",
                        "Cold and snowy!"
                    ];
                    const randomSnowyMessage = snowyMessages[Math.floor(Math.random() * snowyMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-blue-400">${randomSnowyMessage}</span>`;
                    break;
                    
                case 'heavy_snow':
                    this.weatherIcon.innerHTML = '<i class="fas fa-snowflake text-blue-500"></i>';
                    const heavySnowMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Heavy snow falling, bloody hell!",
                        "Blizzard conditions, this is awful!",
                        "Intense snowfall, what a nightmare!",
                        "Heavy winter storm, damn it!",
                        "Major snow event, this sucks!",
                        "Heavy snow but no rain, at least there's that!",
                        "Intense snow conditions, bloody hell!",
                        "Heavy snow activity, what a pain!",
                        "Major snowstorm, this is terrible!"
                    ] : [
                        "No, it's not raining",
                        "Heavy snow falling!",
                        "Blizzard conditions!",
                        "Intense snowfall!",
                        "Heavy winter storm!",
                        "Major snow event!",
                        "Heavy snow but no rain!",
                        "Intense snow conditions!",
                        "Heavy snow activity!",
                        "Major snowstorm!"
                    ];
                    const randomHeavySnowMessage = heavySnowMessages[Math.floor(Math.random() * heavySnowMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-blue-600">${randomHeavySnowMessage}</span>`;
                    break;
                    
                case 'freezing':
                    this.weatherIcon.innerHTML = '<i class="fas fa-icicles text-blue-400"></i>';
                    const freezingMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Freezing conditions, bloody hell!",
                        "Ice cold weather, this is awful!",
                        "Sub-zero temperatures, damn it!",
                        "Freezing but no rain, at least there's that!",
                        "Extremely cold, this sucks!",
                        "Frozen conditions, what a nightmare!",
                        "Arctic weather, bloody hell!",
                        "Ice cold outside, damn it!",
                        "Freezing temperatures, this is terrible!"
                    ] : [
                        "No, it's not raining",
                        "Freezing conditions!",
                        "Ice cold weather!",
                        "Sub-zero temperatures!",
                        "Freezing but no rain!",
                        "Extremely cold!",
                        "Frozen conditions!",
                        "Arctic weather!",
                        "Ice cold outside!",
                        "Freezing temperatures!"
                    ];
                    const randomFreezingMessage = freezingMessages[Math.floor(Math.random() * freezingMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-blue-500">${randomFreezingMessage}</span>`;
                    break;
                    
                case 'dusty':
                    this.weatherIcon.innerHTML = '<i class="fas fa-wind text-yellow-600"></i>';
                    const dustyMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Dusty conditions, what a pain!",
                        "Sandstorm weather, this sucks!",
                        "Dust in the air, annoying!",
                        "Sandy conditions, what a mess!",
                        "Dust storm activity, bloody hell!",
                        "Arid weather, damn it!",
                        "Dusty but no rain, at least there's that!",
                        "Sandy wind conditions, what a pain!",
                        "Dust storm conditions, this is awful!"
                    ] : [
                        "No, it's not raining",
                        "Dusty conditions!",
                        "Sandstorm weather!",
                        "Dust in the air!",
                        "Sandy conditions!",
                        "Dust storm activity!",
                        "Arid weather!",
                        "Dusty but no rain!",
                        "Sandy wind conditions!",
                        "Dust storm conditions!"
                    ];
                    const randomDustyMessage = dustyMessages[Math.floor(Math.random() * dustyMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-yellow-700">${randomDustyMessage}</span>`;
                    break;
                    
                default:
                    this.weatherIcon.innerHTML = '<i class="fas fa-sun text-yellow-500"></i>';
                    const defaultMessages = this.profanityMode ? [
                        "No, it's not raining",
                        "Dry weather today, finally!",
                        "No precipitation, thank goodness!",
                        "Staying dry outside, about damn time!",
                        "Clear conditions, finally!",
                        "No rain in sight, hallelujah!",
                        "Dry and clear, thank God!",
                        "No wet weather, it's about time!",
                        "Staying dry today, finally!",
                        "No rain falling, thank goodness!"
                    ] : [
                        "No, it's not raining",
                        "Dry weather today!",
                        "No precipitation!",
                        "Staying dry outside!",
                        "Clear conditions!",
                        "No rain in sight!",
                        "Dry and clear!",
                        "No wet weather!",
                        "Staying dry today!",
                        "No rain falling!"
                    ];
                    const randomDefaultMessage = defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
                    this.rainStatus.innerHTML = `<span class="text-green-600">${randomDefaultMessage}</span>`;
            }
        }

        // Set temperature with error handling
        if (typeof temperature === 'number' && !isNaN(temperature)) {
            this.currentTemperatureCelsius = temperature; // Store original Celsius value
            const convertedTemp = this.convertTemperature(temperature);
            this.temperature.innerHTML = `${convertedTemp}${this.getTemperatureUnitSymbol()}`;
        } else {
            this.currentTemperatureCelsius = null;
            this.temperature.innerHTML = `N/A${this.getTemperatureUnitSymbol()}`;
        }

        // Set weather description
        this.weatherDescription.textContent = weatherDescription;

        // Set precipitation info
        if (precipitation > 0) {
            this.precipitationInfo.innerHTML = `
                <i class="fas fa-tint mr-1"></i>
                Precipitation: ${precipitation.toFixed(1)} mm
            `;
        } else {
            this.precipitationInfo.innerHTML = `
                <i class="fas fa-tint mr-1"></i>
                No precipitation
            `;
        }

        this.showState('weather-result');
        
        // Show feedback section for profanity mode messages
        if (this.profanityMode) {
            this.showMessageFeedback();
        } else {
            this.hideMessageFeedback();
        }
        
        // Display weather alerts if present
        if (data.alerts && data.alerts.length > 0) {
            this.displayWeatherAlerts(data.alerts);
        } else {
            this.hideWeatherWarning();
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.showState('error-state');
    }

    async getRainMessages() {
        // Check for active sponsored messages first
        const sponsoredMessage = await this.getSponsoredMessage('rain');
        if (sponsoredMessage) {
            return [sponsoredMessage];
        }

        if (this.profanityMode) {
            return [
                "Of course it's fucking raining!",
                "Damn it, grab your pissing umbrella!",
                "Absolutely pissing it down",
                "Dear rain, go fuck yourself. Sincerely, everyone",
                "Not the kind of wet you're looking for",
                "The sky is crying like a baby!",
                "It's wet and fucking miserable",
                "There's no such thing as bad weather, except this shitty rain",
                "Don't bother going outside, it's shite",
                "Wet and woeful, stay the fuck inside",
                "Mother Nature's having a piss",
                "The clouds are literally crying",
                "It's raining cats and dogs, and they're all wet",
                "Water falling from the sky like it's the end of the world",
                "The weather gods are having a laugh at our expense",
                "Rain, rain, go the fuck away!",
                "It's wetter than a fish's dream",
                "The sky is leaking and nobody's fixing it",
                "Rain so heavy it could drown a duck",
                "Wet enough to make a duck jealous",
                "The clouds are having a breakdown",
                "It's raining harder than my ex's tears",
                "Water falling faster than my motivation",
                "The sky is literally crying for help",
                "Rain so intense it could wash away your problems",
                "It's wetter than a mermaid's handshake",
                "The clouds are having a water balloon fight",
                "Rain so heavy it could fill an ocean",
                "It's pouring like there's no tomorrow",
                "The sky is having a water crisis",
                "Rain so intense it could power a hydroelectric dam",
                "It's wetter than a sponge in a bathtub",
                "The clouds are having a meltdown",
                "Rain so heavy it could flood a desert",
                "It's pouring like the sky's broken",
                "The weather is having a water emergency",
                "Rain so intense it could wash away your sins",
                "It's wetter than a fish's handshake",
                "The clouds are having a water party",
                "Rain so heavy it could fill a swimming pool",
                "It's pouring like the sky's having a breakdown"
            ];
        } else {
            return [
                "Yes, it's raining!",
                "Grab your umbrella!",
                "It's pouring outside!",
                "Rain, rain, go away!",
                "Time for indoor activities!",
                "The sky is crying!",
                "Wet weather ahead!",
                "Raindrops are falling!",
                "Better stay inside!",
                "It's a rainy day!",
                "The clouds are sharing their tears",
                "Water is falling from the sky",
                "It's a perfect day for staying cozy",
                "The weather is being generous with water",
                "Rain is blessing the earth",
                "The sky is watering the plants",
                "It's a liquid sunshine kind of day",
                "The clouds are having a water party",
                "Rain is nature's way of cleaning",
                "The sky is sharing its refreshment",
                "It's a wet and wonderful day",
                "The clouds are giving us a shower",
                "Rain is falling like confetti",
                "The sky is being generous today",
                "It's a perfect day for reading",
                "The weather is being dramatic",
                "Rain is nature's music",
                "The clouds are having a conversation",
                "It's a liquid blessing from above",
                "The sky is sharing its emotions",
                "Rain is falling like magic",
                "The clouds are having a water show",
                "It's a perfect day for reflection",
                "The weather is being expressive",
                "Rain is nature's way of saying hello",
                "The sky is sharing its abundance",
                "It's a wet and wild adventure",
                "The clouds are having a celebration",
                "Rain is falling like poetry",
                "The sky is being creative today",
                "It's a perfect day for dreaming",
                "The weather is being artistic",
                "Rain is nature's way of connecting",
                "The sky is sharing its wisdom",
                "It's a liquid love letter from above",
                "The clouds are having a performance",
                "Rain is falling like blessings",
                "The sky is being generous with gifts",
                "It's a perfect day for gratitude"
            ];
        }
    }

    getWeatherType(weatherDescription, temperature) {
        const description = weatherDescription.toLowerCase();
        
        // Snow conditions (check before general snow)
        if (description.includes('heavy snow') || description.includes('blizzard')) {
            return 'heavy_snow';
        }
        
        if (description.includes('light snow') || description.includes('slight snow')) {
            return 'light_snow';
        }
        
        if (description.includes('snow') || description.includes('snowfall')) {
            return 'snowy';
        }
        
        // Fog and mist conditions (check dense fog first)
        if (description.includes('dense fog') || description.includes('thick fog')) {
            return 'dense_fog';
        }
        
        if (description.includes('fog') || description.includes('mist') || description.includes('haze')) {
            return 'foggy';
        }
        
        // Clear sky conditions
        if (description.includes('clear sky') || description.includes('clear')) {
            return 'clear_sky';
        }
        
        if (description.includes('sunny') || description.includes('sunshine')) {
            return 'sunny';
        }
        
        // Cloud conditions
        if (description.includes('few clouds') || description.includes('scattered clouds')) {
            return 'few_clouds';
        }
        
        if (description.includes('partly cloudy') || description.includes('partly clear')) {
            return 'partly_cloudy';
        }
        
        if (description.includes('broken clouds') || description.includes('variable clouds')) {
            return 'broken_clouds';
        }
        
        if (description.includes('overcast') || description.includes('cloudy')) {
            return 'overcast';
        }
        
        // Extreme weather conditions
        if (description.includes('freezing') || description.includes('ice')) {
            return 'freezing';
        }
        
        if (description.includes('dust') || description.includes('sandstorm')) {
            return 'dusty';
        }
        
        // Temperature-based fallback
        if (temperature < -10) {
            return 'freezing';
        } else if (temperature < 0) {
            return 'snowy';
        } else if (temperature > 20) {
            return 'sunny';
        } else {
            return 'overcast'; // Changed from 'cloudy' to 'overcast' since 'cloudy' is not a case
        }
    }

    // Temperature unit detection and management methods
    initializeTemperatureUnit() {
        // Check for saved preference first
        const savedUnit = localStorage.getItem('temperatureUnit');
        if (savedUnit) {
            this.temperatureUnit = savedUnit;
            this.temperatureToggle.checked = savedUnit === 'fahrenheit';
        } else {
            // Auto-detect based on location
            this.detectTemperatureUnitFromLocation();
        }
        this.updateTemperatureUnitDisplay();
    }

    initializeProfanityToggle() {
        // Set the profanity toggle to match the loaded state
        this.profanityToggle.checked = this.profanityMode;
    }

    detectTemperatureUnitFromLocation() {
        // Countries that primarily use Fahrenheit
        const fahrenheitCountries = [
            'US', 'BS', 'BZ', 'KY', 'PW', 'FM', 'MH', 'LR', 'MM'
        ];

        // Try to detect country from browser locale
        const locale = navigator.language || navigator.userLanguage;
        const countryCode = locale.split('-')[1]?.toUpperCase();

        if (countryCode && fahrenheitCountries.includes(countryCode)) {
            this.temperatureUnit = 'fahrenheit';
            this.temperatureToggle.checked = true;
        } else {
            // Default to Celsius for most of the world
            this.temperatureUnit = 'celsius';
            this.temperatureToggle.checked = false;
        }
    }

    updateTemperatureUnitDisplay() {
        const unitText = this.temperatureUnit === 'fahrenheit' ? 'Fahrenheit' : 'Celsius';
        this.temperatureUnitText.textContent = unitText;
    }

    saveTemperatureUnitPreference() {
        localStorage.setItem('temperatureUnit', this.temperatureUnit);
    }

    convertTemperature(celsius) {
        if (this.temperatureUnit === 'fahrenheit') {
            return Math.round((celsius * 9/5) + 32);
        }
        return Math.round(celsius);
    }

    getTemperatureUnitSymbol() {
        return this.temperatureUnit === 'fahrenheit' ? '°F' : '°C';
    }

    updateDisplayedTemperature() {
        // Use the stored Celsius value for conversion
        if (this.currentTemperatureCelsius !== null) {
            const convertedTemp = this.convertTemperature(this.currentTemperatureCelsius);
            this.temperature.innerHTML = `${convertedTemp}${this.getTemperatureUnitSymbol()}`;
        }
    }

    // Fetch weather alerts from OpenWeatherMap API
    async fetchWeatherAlerts(latitude, longitude) {
        try {
            // Use the newer One Call API 3.0 endpoint
            const alertsUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${this.openWeatherApiKey}&exclude=current,minutely,hourly,daily`;
            
            console.log('Fetching weather alerts from OpenWeatherMap...');
            
            const response = await fetch(alertsUrl);
            
            if (!response.ok) {
                console.warn('Failed to fetch weather alerts:', response.status, response.statusText);
                return [];
            }
            
            const data = await response.json();
            console.log('Weather alerts received:', data.alerts);
            
            return data.alerts || [];
        } catch (error) {
            console.warn('Error fetching weather alerts:', error);
            return [];
        }
    }

    // Display weather alerts
    displayWeatherAlerts(alerts) {
        if (!alerts || alerts.length === 0) {
            this.hideWeatherWarning();
            return;
        }

        // Get the most severe alert
        const alert = alerts[0];
        
        // Categorize the alert type
        const alertType = this.categorizeAlert(alert.event);
        
        // Update banner content
        this.warningTitle.textContent = alertType;
        this.warningDescription.textContent = "Bad weather is no joke! Please follow local guidance and stay safe.";
        
        // Format duration
        const startTime = new Date(alert.start * 1000);
        const endTime = new Date(alert.end * 1000);
        this.warningDuration.textContent = `Active until: ${endTime.toLocaleString()}`;
        
        // Show the banner
        this.weatherWarningBanner.classList.remove('hidden');
        
        console.log('Weather alert displayed:', alert);
    }

    // Hide weather warning banner
    hideWeatherWarning() {
        this.weatherWarningBanner.classList.add('hidden');
    }

    // Categorize alert types
    categorizeAlert(eventName) {
        const event = eventName.toLowerCase();
        
        if (event.includes('thunderstorm') || event.includes('storm')) {
            return 'Thunderstorm Warning';
        } else if (event.includes('tornado')) {
            return 'Tornado Warning';
        } else if (event.includes('flood')) {
            return 'Flood Warning';
        } else if (event.includes('hurricane') || event.includes('typhoon')) {
            return 'Hurricane Warning';
        } else if (event.includes('blizzard') || event.includes('snow')) {
            return 'Winter Storm Warning';
        } else if (event.includes('heat')) {
            return 'Heat Warning';
        } else if (event.includes('cold') || event.includes('freeze')) {
            return 'Cold Weather Warning';
        } else if (event.includes('wind')) {
            return 'High Wind Warning';
        } else if (event.includes('fog')) {
            return 'Dense Fog Warning';
        } else {
            return 'Weather Warning';
        }
    }

    // Message feedback methods
    showMessageFeedback() {
        this.messageFeedback.classList.remove('hidden');
        this.feedbackThanks.classList.add('hidden');
        
        // Reset button states
        this.thumbsUpBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        this.thumbsDownBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        
        // Show question text and buttons
        const questionText = this.messageFeedback.querySelector('p');
        const buttonsContainer = this.messageFeedback.querySelector('.flex.justify-center.space-x-4');
        
        if (questionText) questionText.classList.remove('hidden');
        if (buttonsContainer) buttonsContainer.classList.remove('hidden');
    }

    hideMessageFeedback() {
        this.messageFeedback.classList.add('hidden');
    }

    async submitFeedback(type) {
        // Store feedback data
        const feedbackData = {
            user_id: this.generateUserFingerprint(),
            type: type,
            message: this.rainStatus.textContent,
            profanity_mode: this.profanityMode
        };

        try {
            // Store in Supabase
            await WeatherAppDatabase.addFeedback(feedbackData);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            // Fallback to localStorage if Supabase fails
            const existingFeedback = JSON.parse(localStorage.getItem('weatherAppFeedback') || '[]');
            existingFeedback.push({
                ...feedbackData,
                timestamp: new Date().toISOString(),
                profanityMode: feedbackData.profanity_mode,
                userAgent: navigator.userAgent
            });
            localStorage.setItem('weatherAppFeedback', JSON.stringify(existingFeedback));
        }

        // Hide the question text and buttons
        const questionText = this.messageFeedback.querySelector('p');
        const buttonsContainer = this.messageFeedback.querySelector('.flex.justify-center.space-x-4');
        
        if (questionText) questionText.classList.add('hidden');
        if (buttonsContainer) buttonsContainer.classList.add('hidden');
        
        // Show thanks message
        this.feedbackThanks.classList.remove('hidden');

        // Track with Google Analytics
        this.trackGoogleAnalytics('message_feedback', {
            feedback_type: type,
            profanity_mode: this.profanityMode,
            message: this.rainStatus.textContent
        });

        // Log feedback for development
        console.log('Feedback submitted:', feedbackData);
        console.log('Total feedback entries:', existingFeedback.length);

        // Hide feedback after 3 seconds
        setTimeout(() => {
            this.hideMessageFeedback();
        }, 3000);
    }

    // Generate a simple user fingerprint for unique user tracking
    generateUserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('User fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Create a simple hash
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Track usage data for admin panel
    async trackUsage(weatherData) {
        const usageData = {
            user_id: this.generateUserFingerprint(),
            weather_type: this.getWeatherType(weatherData.weatherDescription, weatherData.temperature),
            profanity_mode: this.profanityMode,
            temp_unit: this.temperatureUnit,
            is_raining: weatherData.isRaining,
            temperature: weatherData.temperature,
            location: weatherData.location,
            user_agent: navigator.userAgent
        };

        try {
            // Store in Supabase
            await WeatherAppDatabase.addUsageData(usageData);
        } catch (error) {
            console.error('Error tracking usage:', error);
            // Fallback to localStorage if Supabase fails
            const existingUsage = JSON.parse(localStorage.getItem('weatherAppUsage') || '[]');
            existingUsage.push({
                ...usageData,
                timestamp: new Date().toISOString(),
                userId: usageData.user_id,
                profanityMode: usageData.profanity_mode,
                temperatureUnit: usageData.temp_unit,
                isRaining: usageData.is_raining,
                userAgent: usageData.user_agent
            });
            
            // Keep only last 1000 entries to prevent localStorage from getting too large
            if (existingUsage.length > 1000) {
                existingUsage.splice(0, existingUsage.length - 1000);
            }
            
            localStorage.setItem('weatherAppUsage', JSON.stringify(existingUsage));
        }

        // Track with Google Analytics
        this.trackGoogleAnalytics('weather_check', {
            weather_type: usageData.weatherType,
            is_raining: usageData.isRaining,
            profanity_mode: usageData.profanityMode,
            temperature_unit: usageData.temperatureUnit,
            temperature: usageData.temperature
        });
    }

    // Google Analytics tracking helper
    trackGoogleAnalytics(eventName, parameters = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
    }

    // Sponsored messages system
    async getSponsoredMessage(weatherType) {
        try {
            const sponsorships = await WeatherAppDatabase.getSponsorships();
            const now = new Date();
            
            // Find active sponsorships that match the weather type
            const activeSponsorships = sponsorships.filter(sponsorship => {
                const startDate = new Date(sponsorship.start_date);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + sponsorship.duration);
                return now >= startDate && now <= endDate && 
                       sponsorship.status === 'active' && 
                       sponsorship.weather_type === weatherType;
            });
            
            if (activeSponsorships.length === 0) {
                return null;
            }
            
            // Randomly select from active sponsorships
            const randomSponsorship = activeSponsorships[Math.floor(Math.random() * activeSponsorships.length)];
            
            // Track sponsorship display
            this.trackGoogleAnalytics('sponsored_message_displayed', {
                sponsor_name: randomSponsorship.sponsor,
                weather_type: weatherType,
                sponsorship_id: randomSponsorship.id
            });
            
            return {
                message: randomSponsorship.message,
                sponsor: randomSponsorship.sponsor,
                isSponsored: true
            };
        } catch (error) {
            console.error('Error getting sponsored message:', error);
            // Fallback to localStorage if Supabase fails
            const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
            const now = new Date();
            
            const activeSponsorships = sponsorships.filter(sponsorship => {
                const startDate = new Date(sponsorship.startDate);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + sponsorship.duration);
                return now >= startDate && now <= endDate && 
                       sponsorship.status === 'active' && 
                       sponsorship.weatherType === weatherType;
            });
            
            if (activeSponsorships.length === 0) {
                return null;
            }
            
            const randomSponsorship = activeSponsorships[Math.floor(Math.random() * activeSponsorships.length)];
            
            return {
                message: randomSponsorship.message,
                sponsor: randomSponsorship.sponsorName,
                isSponsored: true
            };
        }
    }

    displaySponsoredMessage(messageData) {
        if (messageData.isSponsored) {
            // Create sponsored message with special styling
            const sponsoredHTML = `
                <div class="sponsored-message bg-gradient-to-r from-yellow-100 to-orange-100 border-l-4 border-yellow-500 p-3 rounded-lg mb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-800 font-medium">${messageData.message}</p>
                            <p class="text-xs text-gray-600 mt-1">
                                <i class="fas fa-heart text-red-500 mr-1"></i>
                                Sponsored by ${messageData.sponsor}
                            </p>
                        </div>
                    </div>
                </div>
            `;
            return sponsoredHTML;
        }
        return messageData.message;
    }

    clearTestSponsoredMessages() {
        // Clear any test sponsored messages from localStorage
        const sponsorships = JSON.parse(localStorage.getItem('weatherAppSponsorships') || '[]');
        const testSponsorships = sponsorships.filter(s => s.id.startsWith('test-'));
        
        if (testSponsorships.length > 0) {
            const realSponsorships = sponsorships.filter(s => !s.id.startsWith('test-'));
            localStorage.setItem('weatherAppSponsorships', JSON.stringify(realSponsorships));
            console.log('Cleared test sponsored messages, kept real ones:', realSponsorships.length);
        }
    }

}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Trigger new deployment - temperature toggle fix applied