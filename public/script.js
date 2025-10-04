class WeatherApp {
    constructor() {
        this.profanityMode = false;
        this.initializeElements();
        this.bindEvents();
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
    }

    bindEvents() {
        this.getLocationBtn.addEventListener('click', () => this.getUserLocation());
        this.checkAgainBtn.addEventListener('click', () => this.getUserLocation());
        this.retryBtn.addEventListener('click', () => this.getUserLocation());
        this.profanityToggle.addEventListener('change', (e) => {
            this.profanityMode = e.target.checked;
        });
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
                timeout: 10000,
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
            const response = await fetch(`/api/weather?latitude=${latitude}&longitude=${longitude}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch weather data');
            }

            this.displayWeatherData(data);
        } catch (error) {
            console.error('Weather API error:', error);
            this.showError('Failed to fetch weather data. Please try again later.');
        }
    }

    displayWeatherData(data) {
        const { isRaining, temperature, weatherDescription, precipitation } = data;

        // Set weather icon and status
        if (isRaining) {
            this.weatherIcon.innerHTML = '<i class="fas fa-cloud-rain text-blue-500"></i>';
            
            // Get appropriate messages based on profanity mode
            const rainMessages = this.getRainMessages();
            
            // Pick a random message
            const randomMessage = rainMessages[Math.floor(Math.random() * rainMessages.length)];
            this.rainStatus.innerHTML = `<span style="color: #10769C;">${randomMessage}</span>`;
        } else {
            // Determine weather type based on description and temperature
            const weatherType = this.getWeatherType(weatherDescription, temperature);
            
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
                        "Enjoy the sunshine, damn it!"
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
                        "Enjoy the sunshine!"
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
                        "No, it's not raining",
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
                        "No, it's not raining",
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
                        "No, it's not raining",
                        "Completely overcast, depressing!",
                        "Heavy cloud cover, what a downer!",
                        "Dense cloud layer, gloomy!",
                        "Overcast but dry, at least there's that!",
                        "Thick cloud blanket, depressing!",
                        "Solid cloud cover, gloomy!",
                        "Overcast conditions, what a bummer!",
                        "Heavy cloudiness, depressing!",
                        "Dense overcast sky, gloomy!"
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
                        "Dense overcast sky!"
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
                        "Some clouds, some sun, alright!",
                        "Partly sunny weather, could be worse!",
                        "Clouds and sunshine, not too shabby!",
                        "Variable cloudiness, typical!",
                        "Sunny with some clouds, decent!",
                        "Partly clear skies, not bad!",
                        "Mixed weather conditions, typical!"
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
                        "No, it's not raining",
                        "Foggy conditions today, annoying!",
                        "Misty weather outside, what a pain!",
                        "Low visibility ahead, frustrating!",
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

        // Set temperature
        this.temperature.innerHTML = `${temperature}°C`;

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
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.showState('error-state');
    }

    getRainMessages() {
        if (this.profanityMode) {
            return [
                "Bloody hell, it's raining!",
                "Damn it, grab your umbrella!",
                "Crap, it's pouring outside!",
                "Rain, rain, go to hell!",
                "Time for indoor activities, dammit!",
                "The sky is crying like a baby!",
                "Wet weather ahead, what a pain!",
                "Raindrops are falling on my head!",
                "Better stay inside, this sucks!",
                "It's a crappy rainy day!"
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
                "It's a rainy day!"
            ];
        }
    }

    getWeatherType(weatherDescription, temperature) {
        const description = weatherDescription.toLowerCase();
        
        // Thunderstorm conditions
        if (description.includes('thunderstorm') || description.includes('thunder')) {
            return 'thunderstorm';
        }
        
        // Heavy rain conditions
        if (description.includes('heavy rain') || description.includes('violent rain')) {
            return 'heavy_rain';
        }
        
        // Light rain conditions
        if (description.includes('light rain') || description.includes('slight rain')) {
            return 'light_rain';
        }
        
        // Drizzle conditions
        if (description.includes('drizzle')) {
            return 'drizzle';
        }
        
        // Snow conditions
        if (description.includes('heavy snow') || description.includes('blizzard')) {
            return 'heavy_snow';
        }
        
        if (description.includes('light snow') || description.includes('slight snow')) {
            return 'light_snow';
        }
        
        if (description.includes('snow') || description.includes('snowfall')) {
            return 'snowy';
        }
        
        // Fog and mist conditions
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
        } else if (temperature > 30) {
            return 'hot_sunny';
        } else if (temperature > 20) {
            return 'sunny';
        } else {
            return 'cloudy';
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});



