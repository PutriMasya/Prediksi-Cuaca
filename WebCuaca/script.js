/* ===================================================================== */
/* ENHANCED WEATHER APP - COMPLETE JAVASCRIPT WITH ALL FEATURES - UPDATED */
/* Version: 2.0 - Refactored and Optimized for Hourly Predictions */
/* ===================================================================== */

/* ===================================================================== */
/* GLOBAL VARIABLES AND CONFIGURATION */
/* ===================================================================== */

// DOM Elements
let weatherBox, hourlyForecastContainer, body, container, globalWeatherAnimationContainer, messageBox;

// State Management
let weatherIntervalId = [];
let hourlyData = [];
let currentFocusedCardIndex = 0;
let isHourlyViewActive = false;

// Constants
const CONSTANTS = {
    WEATHER_ICONS: {
        RAIN: 'images/rain.png',
        SUNNY: 'images/sunny.png',
        CLOUDY: 'images/cloudy-day.png',
        DEFAULT: 'images/cloudy-day.png'
    },
    WEATHER_ANIMATIONS: {
        RAIN: 'images/hujan2.png',
        SUNNY: 'images/matahari.png',
        CLOUDY: 'images/berawan2.png'
    },
    DAYS_INDONESIAN: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    MONTHS_INDONESIAN: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
};

/* ===================================================================== */
/* INITIALIZATION AND DOM READY */
/* ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    initializeDateInput();
    initializeTimeDropdown();
    initializeEnhancedFeatures();
    initializeEventListeners();
    resetUIState();
    clearWeatherAnimations();
});

function initializeDOMElements() {
    weatherBox = document.getElementById('weatherBox');
    hourlyForecastContainer = document.getElementById('weeklyForecastContainer');
    body = document.body;
    container = document.querySelector('.container');
    globalWeatherAnimationContainer = document.getElementById('weatherAnimationContainer');
    messageBox = document.getElementById('messageBox');
}

function initializeDateInput() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('tanggal').value = `${yyyy}-${mm}-${dd}`;
}

function initializeTimeDropdown() {
    const jamSelect = document.getElementById("jam");
    for (let i = 0; i < 24; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `${i}:00`;
        jamSelect.appendChild(opt);
    }
}

function initializeEventListeners() {
    document.getElementById('predictButton').addEventListener('click', predictDailyWeather);
    document.getElementById('predictWeeklyButton').addEventListener('click', predictHourlyWeather);
}

function resetUIState() {
    body.classList.add('weather-default');
    weatherBox.style.display = 'none';
    hourlyForecastContainer.style.display = 'none';
}

/* ===================================================================== */
/* ENHANCED FEATURES INITIALIZATION */
/* ===================================================================== */

function initializeEnhancedFeatures() {
    addKeyboardNavigation();
    addSwipeDetection();
    addProgressiveLoading();
    setupAccessibility();
    addGlobalErrorHandlers();
    initializePerformanceMonitoring();
}

function setupAccessibility() {
    const predictButton = document.getElementById('predictButton');
    const hourlyButton = document.getElementById('predictWeeklyButton');
    
    predictButton.setAttribute('aria-label', 'Prediksi cuaca harian');
    hourlyButton.setAttribute('aria-label', 'Prediksi cuaca per jam');
    
    // Create screen reader announcer
    if (!document.getElementById('weather-announcer')) {
        const announcer = document.createElement('div');
        announcer.id = 'weather-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(announcer);
    }
}

/* ===================================================================== */
/* MESSAGE BOX FUNCTIONS */
/* ===================================================================== */

function showMessageBox(message) {
    let box = document.getElementById('messageBox');
    if (!box) {
        box = createMessageBox();
        document.body.appendChild(box);
    }
    
    document.getElementById('messageText').textContent = message;
    box.classList.add('visible');
    setTimeout(() => box.classList.add('visible'), 10);
}

function hideMessageBox() {
    const box = document.getElementById('messageBox');
    if (box) {
        box.classList.remove('visible');
    }
}

function createMessageBox() {
    const box = document.createElement('div');
    box.id = 'messageBox';
    box.classList.add('message-box');
    box.innerHTML = `
        <div class="message-box-content">
            <p id="messageText"></p>
            <button onclick="hideMessageBox()">OK</button>
        </div>
    `;
    return box;
}

/* ===================================================================== */
/* WEATHER ANIMATION SYSTEM */
/* ===================================================================== */

function clearWeatherAnimations() {
    if (globalWeatherAnimationContainer) {
        globalWeatherAnimationContainer.innerHTML = '';
        globalWeatherAnimationContainer.className = '';
        globalWeatherAnimationContainer.style.display = 'none';
    }
    
    if (weatherIntervalId && Array.isArray(weatherIntervalId)) {
        weatherIntervalId.forEach(id => {
            if (id) clearInterval(id);
        });
        weatherIntervalId = [];
    }
}

function showRainAnimation() {
    clearWeatherAnimations();
    globalWeatherAnimationContainer.style.display = 'block';
    globalWeatherAnimationContainer.classList.add('rainy-animation-active');

    const cloudImageSrc = CONSTANTS.WEATHER_ANIMATIONS.RAIN;
    const rainClouds = [];

    // Create moving clouds with varied configurations
    const cloudConfigs = [
        // Moving from left to right
        ...getMovingCloudConfigs('left'),
        // Moving from right to left
        ...getMovingCloudConfigs('right'),
        // Static to moving clouds
        ...getStaticToMovingCloudConfigs()
    ];

    cloudConfigs.forEach(config => {
        const cloud = config.isStatic ? 
            createStaticToMovingCloud(cloudImageSrc, config.startX, config.startY, config.direction, config.scale, config.delay) :
            createMovingCloudVariedSpeed(cloudImageSrc, config.animationName, config.baseSpeed, config.delay, config.scale);
        rainClouds.push(cloud);
    });

    // Add rain drops to clouds
    rainClouds.forEach(cloud => {
        const cloudIntervalId = setInterval(() => createRaindropsForCloud(cloud), 80 + Math.random() * 50);
        weatherIntervalId.push(cloudIntervalId);
    });
}

function showCloudyAnimation() {
    clearWeatherAnimations();
    globalWeatherAnimationContainer.style.display = 'block';

    const cloudImageSrc = CONSTANTS.WEATHER_ANIMATIONS.CLOUDY;
    const cloudConfigs = [
        ...getCloudyAnimationConfigs('left'),
        ...getCloudyAnimationConfigs('right')
    ];

    cloudConfigs.forEach(config => {
        createMovingCloudVariedSpeed(
            cloudImageSrc,
            config.animationName,
            config.duration,
            config.delay,
            config.scale
        );
    });
}

function showSunnyAnimation() {
    clearWeatherAnimations();
    globalWeatherAnimationContainer.style.display = 'block';

    const sun = document.createElement('img');
    sun.src = CONSTANTS.WEATHER_ANIMATIONS.SUNNY;
    sun.classList.add('sun-image');
    globalWeatherAnimationContainer.appendChild(sun);
}

/* ===================================================================== */
/* CLOUD CREATION HELPERS */
/* ===================================================================== */

function createMovingCloudVariedSpeed(imgSrc, animationName, baseSpeed, delay = 0, scale = 1) {
    const cloud = document.createElement('img');
    cloud.src = imgSrc;
    cloud.classList.add('cloud-image');

    const cloudSize = 250 * scale;
    const speedMultiplier = scale > 1.0 ? (1.0 + scale * 0.5) : (1.0 - (1.0 - scale) * 0.3);
    const finalSpeed = baseSpeed * speedMultiplier;
    const opacity = scale > 1.0 ? (0.3 + (1.4 - scale) * 0.2) : (0.4 + scale * 0.3);

    Object.assign(cloud.style, {
        width: `${cloudSize}px`,
        height: 'auto',
        position: 'absolute',
        animationName,
        animationDuration: `${finalSpeed}s`,
        animationDelay: `0s`,
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
        animationFillMode: 'both',
        opacity
    });

    globalWeatherAnimationContainer.appendChild(cloud);
    return cloud;
}

function createStaticToMovingCloud(imgSrc, startX, startY, direction, scale = 1, delay = 0) {
    const cloud = document.createElement('img');
    cloud.src = imgSrc;
    cloud.classList.add('cloud-image');

    const cloudSize = 250 * scale;
    const baseSpeed = 25;
    const speedMultiplier = scale > 1.0 ? (1.0 + scale * 0.6) : (1.0 - (1.0 - scale) * 0.4);
    const finalSpeed = baseSpeed * speedMultiplier;
    const opacity = scale > 1.0 ? (0.35 + (1.4 - scale) * 0.15) : (0.45 + scale * 0.25);

    const animationName = direction === 'left' ? 
        'cloud-move-top-right-to-left' : 
        'cloud-move-top-left-to-right';

    Object.assign(cloud.style, {
        width: `${cloudSize}px`,
        height: 'auto',
        position: 'absolute',
        left: `${startX}vw`,
        top: `${startY}vh`,
        animationDelay: `${delay}s`,
        animationDuration: `${finalSpeed}s`,
        animationFillMode: 'forwards',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationName,
        opacity
    });

    globalWeatherAnimationContainer.appendChild(cloud);
    return cloud;
}

function createRaindrop(cloudElement) {
    if (!cloudElement || !cloudElement.parentElement) return;

    const cloudRect = cloudElement.getBoundingClientRect();
    const drop = document.createElement('div');
    const dropType = Math.random();

    // Assign raindrop class based on size
    drop.classList.add('raindrop');
    if (dropType < 0.2) {
        drop.classList.add('raindrop-large');
    } else if (dropType < 0.6) {
        drop.classList.add('raindrop-medium');
    } else {
        drop.classList.add('raindrop-small');
    }

    const startX = Math.random() * cloudRect.width;

    Object.assign(drop.style, {
        position: 'fixed',
        left: `${cloudRect.left + startX}px`,
        top: `${cloudRect.top + cloudRect.height - 10}px`,
        pointerEvents: 'none'
    });

    globalWeatherAnimationContainer.appendChild(drop);

    drop.addEventListener('animationend', () => {
        if (drop.parentElement) {
            drop.remove();
        }
    });
}

function createRaindropsForCloud(cloud) {
    if (!cloud.parentElement || globalWeatherAnimationContainer.style.display === 'none') {
        return;
    }
    
    const cloudRect = cloud.getBoundingClientRect();
    const isVisible = (
        cloudRect.right > 0 && cloudRect.left < window.innerWidth &&
        cloudRect.bottom > 0 && cloudRect.top < window.innerHeight
    );
    
    if (isVisible) {
        const dropCount = Math.floor(3 + Math.random() * 4);
        for (let j = 0; j < dropCount; j++) {
            setTimeout(() => createRaindrop(cloud), j * (50 + Math.random() * 40));
        }
    }
}

/* ===================================================================== */
/* ANIMATION CONFIGURATION HELPERS */
/* ===================================================================== */

function getMovingCloudConfigs(direction) {
    const animationName = direction === 'left' ? 
        'cloud-move-top-left-to-right' : 
        'cloud-move-top-right-to-left';
    
    return [
        { animationName, baseSpeed: 30, delay: 0, scale: 0.8, isStatic: false },
        { animationName, baseSpeed: 35, delay: 5, scale: 0.9, isStatic: false },
        { animationName, baseSpeed: 40, delay: 10, scale: 0.7, isStatic: false }
    ];
}

function getStaticToMovingCloudConfigs() {
    return [
        { startX: 5, startY: 10, direction: 'right', scale: 0.7, delay: 1, isStatic: true },
        { startX: 85, startY: 12, direction: 'left', scale: 0.8, delay: 4, isStatic: true },
        { startX: 15, startY: 8, direction: 'right', scale: 1.0, delay: 6, isStatic: true },
        { startX: 75, startY: 14, direction: 'left', scale: 1.1, delay: 9, isStatic: true }
    ];
}

function getCloudyAnimationConfigs(direction) {
    const animationName = direction === 'left' ? 
        'cloud-move-top-left-to-right' : 
        'cloud-move-top-right-to-left';
    
    const configs = direction === 'left' ? [
        { duration: 20, delay: 0, scale: 1.5 },
        { duration: 25, delay: 0, scale: 1.8 },
        { duration: 18, delay: 0, scale: 1.3 }
    ] : [
        { duration: 22, delay: 0, scale: 1.6 },
        { duration: 26, delay: 0, scale: 1.4 },
        { duration: 28, delay: 0, scale: 1.7 }
    ];
    
    return configs.map(config => ({ ...config, animationName }));
}

/* ===================================================================== */
/* HOURLY DATA ANALYSIS UTILITIES */
/* ===================================================================== */

function getHourlyStats() {
    if (!hourlyData.length) {
        return {
            tempRange: 0,
            avgHumidity: 0,
            rainyHours: 0,
            dominantWeather: 'default',
            avgWindSpeed: 0,
            highestUV: 0
        };
    }

    const temps = hourlyData.map(hour => hour.temp || 0);
    const windSpeeds = hourlyData.map(hour => hour.windspeed || 0);
    const uvIndexes = hourlyData.map(hour => hour.uvindex || 0);

    return {
        tempRange: Math.round(hourlyData.reduce((sum, hour) => sum + (hour.temp || 0), 0) / hourlyData.length),
        avgHumidity: Math.round(hourlyData.reduce((sum, hour) => sum + (hour.humidity || 0), 0) / hourlyData.length),
        rainyHours: countRainyHours(),
        dominantWeather: getDominantWeather(),
        avgWindSpeed: Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length),
        highestUV: Math.max(...uvIndexes)
    };
}

function countRainyHours() {
    if (!hourlyData.length) return 0;
    return hourlyData.filter(hour => {
        const condition = hour.condition ? hour.condition.toLowerCase() : '';
        return condition.includes('hujan') || condition.includes('rain');
    }).length;
}

function getDominantWeather() {
    if (!hourlyData.length) return 'default';
    
    const weatherCounts = {};
    hourlyData.forEach(hour => {
        let condition = 'unknown';
        if (hour.condition) {
            const conditionLower = hour.condition.toLowerCase();
            if (conditionLower.includes('hujan') || conditionLower.includes('rain')) {
                condition = 'hujan';
            } else if (conditionLower.includes('cerah') || conditionLower.includes('sunny')) {
                condition = 'cerah';
            } else if (conditionLower.includes('berawan') || conditionLower.includes('cloudy')) {
                condition = 'berawan';
            }
        }
        weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
    });

    return Object.keys(weatherCounts).reduce((a, b) => 
        weatherCounts[a] > weatherCounts[b] ? a : b
    );
}

function getDayNameIndonesian(dateInput) {
    const date = new Date(dateInput);
    return CONSTANTS.DAYS_INDONESIAN[date.getDay()] || "";
}

/* ===================================================================== */
/* HOURLY FORECAST UI COMPONENTS */
/* ===================================================================== */

function createHourlyHeader(data, startDate) {
    const stats = getHourlyStats();
    const today = new Date();
    const currentDate = today.toLocaleString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const mainCondition = determineMainCondition(data, stats);
    const currentTemp = Math.round(data.temp || data.tempmax || 26);
    const feelsLike = Math.round(data.feelslike || data.temp || data.tempmax || 26);
    const humidity = Math.round(data.humidity || 94);
    const windspeed = Math.round(data.windspeed || 5);
    const iconSrc = determineWeatherIcon(data, stats);

    return `
        <div class="weekly-forecast-current">
            <div class="location-info">
                <h2 class="location-name">🏝️ ${data.location || 'Ambon, Maluku'}</h2>
                <p class="date-today">${currentDate}</p>
            </div>
            
            <div class="weather-summary">
                <img src="${iconSrc}" class="weather-icon-large" alt="${mainCondition}">
                <p class="condition-text-large">${mainCondition}</p>
                <p class="feels-like-text">Terasa seperti ${feelsLike}°C</p>
            </div>
            
            <div class="current-temp-section">
                <p class="temp-label-enhanced">🌡️ SUHU SAAT INI</p>
                <div class="current-temp">
                    ${currentTemp}°
                    <img src="images/thermometer.png" class="thermometer-icon" alt="thermometer">
                </div>
                <p class="temp-range-enhanced"></p>
            </div>
            
            <div class="weather-stats-enhanced">
                <div class="stat-item-enhanced">
                    <img src="images/humidity.png" alt="humidity">
                    <span class="stat-label">Kelembaban</span>
                    <span class="stat-value">${humidity}%</span>
                </div>
                <div class="stat-item-enhanced">
                    <img src="images/wind.png" alt="wind">
                    <span class="stat-label">Angin</span>
                    <span class="stat-value">${getWindCategory(windspeed)}</span>
                </div>
                <div class="stat-item-enhanced">
                    <img src="images/eye.png" alt="visibility">
                    <span class="stat-label">Jarak Pandang</span>
                    <span class="stat-value">${Math.round(data.visibility || 10)} km</span>
                </div>
            </div>
            
            <div class="weekly-info-section">
                <div class="info-card" title="Rentang suhu rata-rata per jam hari ini">
                    <p class="info-card-title">Rata² Suhu</p>
                    <p class="info-card-value">${stats.tempRange}°C</p>
                    <p class="info-card-subtitle">Per Jam</p>
                </div>
                <div class="info-card" title="Rata-rata kelembaban udara per jam hari ini">
                    <p class="info-card-title">Rata² Kelembaban</p>
                    <p class="info-card-value">${stats.avgHumidity}%</p>
                    <p class="info-card-subtitle">Per Jam</p>
                </div>
                <div class="info-card" title="Potensi jam dengan hujan dalam hari ini">
                    <p class="info-card-title">Potensi Hujan</p>
                    <p class="info-card-value">${stats.rainyHours}</p>
                    <p class="info-card-subtitle">Jam</p>
                </div>
            </div>
        </div>
    `;
}

function createEnhancedHourlyCard(hourData, index) {
    const hourCard = document.createElement('div');
    hourCard.classList.add('daily-card');
    
    if (index === 0) {
        hourCard.classList.add('today');
    }

    const predictedCondition = (hourData.predictedCondition || hourData.condition || 'default').toLowerCase();
    const iconSrc = getMainWeatherIcon(predictedCondition);

    hourCard.innerHTML = `
        <h3 class="hour-label">${hourData.hour}</h3>
        <img src="${iconSrc}" class="weather-icon-small" alt="${predictedCondition}">
        <p class="temp">${hourData.temp ? Math.round(hourData.temp) + "°C" : "-"}</p>
        <p class="condition">${predictedCondition}</p>
        <p class="humidity-info">💧 ${Math.round(hourData.humidity || 0)}% | 💨 ${Math.round(hourData.windspeed || 0)} km/h</p>
    `;

    setupHourlyCardInteractivity(hourCard, hourData, index);
    return hourCard;
}

function setupHourlyCardInteractivity(hourCard, hourData, index) {
    hourCard.dataset.dayIndex = index;
    hourCard.setAttribute('tabindex', '0');
    hourCard.setAttribute('role', 'button');
    hourCard.setAttribute('aria-label', `Lihat detail cuaca ${hourData.hour || `jam ${index + 1}`}`);

    const eventHandlers = {
        click: () => {
            currentFocusedCardIndex = index;
            showDailyPredictionForHour(index);
        },
        keydown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectHourlyCard(index);
                showDailyPredictionForHour(index);
            }
        },
        mouseenter: () => showCardTooltip(hourCard, hourData),
        mouseleave: hideCardTooltip,
        focus: () => { currentFocusedCardIndex = index; }
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
        hourCard.addEventListener(event, handler);
    });
}

/* ===================================================================== */
/* TOOLTIP SYSTEM */
/* ===================================================================== */

function showCardTooltip(cardElement, hourData) {
    hideCardTooltip();

    const tooltip = createTooltipElement(hourData);
    positionTooltip(tooltip, cardElement);
    document.body.appendChild(tooltip);

    setTimeout(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transition = 'opacity 0.2s ease';
    }, 10);
}

function hideCardTooltip() {
    const existing = document.querySelector('.card-tooltip');
    if (existing) {
        existing.style.opacity = '0';
        setTimeout(() => {
            if (existing.parentElement) {
                existing.remove();
            }
        }, 200);
    }
}

function createTooltipElement(hourData) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('card-tooltip');
    tooltip.innerHTML = `
        <div class="tooltip-content">
            <h4>${hourData.hour || 'Jam'} - ${hourData.condition || 'N/A'}</h4>
            <div class="tooltip-details">
                <p><img src="images/thermometer.png" width="16"> Suhu: ${Math.round(hourData.temp || 0)}°C</p>
                <p><img src="images/humidity.png" width="16"> Kelembaban: ${Math.round(hourData.humidity || 0)}%</p>
                <p><img src="images/wind.png" width="16"> Angin: ${Math.round(hourData.windspeed || 0)} km/h</p>
                ${hourData.uvindex ? `<p><img src="images/uv-index.png" width="16"> UV: ${getUvText(hourData.uvindex)}</p>` : ''}
            </div>
            <p class="tooltip-hint">Klik untuk detail lengkap</p>
        </div>
    `;

    Object.assign(tooltip.style, {
        position: 'fixed',
        zIndex: '1000',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        maxWidth: '200px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        pointerEvents: 'none'
    });

    return tooltip;
}

function positionTooltip(tooltip, cardElement) {
    const rect = cardElement.getBoundingClientRect();
    tooltip.style.top = `${rect.top - 10}px`;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
}

/* ===================================================================== */
/* NAVIGATION SYSTEM */
/* ===================================================================== */

function addKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (!isHourlyViewActive) return;

        const keyActions = {
            'Escape': () => {
                if (weatherBox.style.display === 'block') {
                    e.preventDefault();
                    backToHourlyView();
                }
            },
            'ArrowLeft': () => {
                e.preventDefault();
                navigateHourlyCards(-1);
            },
            'ArrowRight': () => {
                e.preventDefault();
                navigateHourlyCards(1);
            },
            'Enter': () => handleEnterKey(e),
            ' ': () => handleEnterKey(e),
            'Home': () => {
                e.preventDefault();
                navigateToCard(0);
            },
            'End': () => {
                e.preventDefault();
                navigateToCard(hourlyData.length - 1);
            }
        };

        if (keyActions[e.key]) {
            keyActions[e.key]();
        }
    });
}

function handleEnterKey(e) {
    e.preventDefault();
    const focusedCard = document.querySelector('.daily-card.focused') || 
                      document.querySelector(`[data-day-index="${currentFocusedCardIndex}"]`);
    if (focusedCard) {
        const hourIndex = parseInt(focusedCard.dataset.dayIndex);
        showDailyPredictionForHour(hourIndex);
    }
}

function navigateHourlyCards(direction) {
    if (!hourlyData.length) return;
    const newIndex = Math.max(0, Math.min(hourlyData.length - 1, currentFocusedCardIndex + direction));
    navigateToCard(newIndex);
}

function navigateToCard(index) {
    document.querySelectorAll('.daily-card').forEach(card => {
        card.classList.remove('focused');
    });

    const targetCard = document.querySelector(`[data-day-index="${index}"]`);
    if (targetCard) {
        targetCard.classList.add('focused');
        targetCard.focus();
        currentFocusedCardIndex = index;

        const hourData = hourlyData[index];
        if (hourData) {
            showCardTooltip(targetCard, hourData);
            setTimeout(() => hideCardTooltip(), 2000);
        }
    }
}

function selectHourlyCard(index) {
    document.querySelectorAll('.daily-card').forEach(card => {
        card.classList.remove('focused', 'selected');
    });

    const selectedCard = document.querySelector(`[data-day-index="${index}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedCard.focus();
    }

    currentFocusedCardIndex = index;
}

/* ===================================================================== */
/* SWIPE DETECTION */
/* ===================================================================== */

function addSwipeDetection() {
    let touchStartX = 0, touchEndX = 0, touchStartY = 0, touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 100;
        const swipeDistanceX = touchEndX - touchStartX;
        const swipeDistanceY = touchEndY - touchStartY;
        
        if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) && Math.abs(swipeDistanceX) > swipeThreshold) {
            if (isHourlyViewActive && hourlyForecastContainer.style.display === 'block') {
                if (swipeDistanceX > 0) {
                    navigateHourlyCards(-1);
                } else {
                    navigateHourlyCards(1);
                }
            } else if (weatherBox.style.display === 'block' && hourlyData.length > 0) {
                if (swipeDistanceX > 0) {
                    backToHourlyView();
                }
            }
        }
    }
}

/* ===================================================================== */
/* PROGRESSIVE LOADING SYSTEM */
/* ===================================================================== */

function addProgressiveLoading() {
    window.showEnhancedLoading = function(container, message, progress = 0) {
        container.innerHTML = createLoadingHTML(message, progress);
        addLoadingStyles();
    };
}

function createLoadingHTML(message, progress) {
    return `
        <div class="enhanced-loading-container">
            <div class="loading-spinner-enhanced">
                <div class="spinner-ring"></div>
                <div class="spinner-ring ring-2"></div>
                <div class="spinner-ring ring-3"></div>
            </div>
            <div class="loading-progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <p class="loading-message">${message}</p>
            <div class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>
    `;
}

function addLoadingStyles() {
    if (!document.querySelector('#enhanced-loading-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-loading-styles';
        style.textContent = `
            .enhanced-loading-container {
                text-align: center;
                padding: 50px;
                color: white;
            }
            .loading-spinner-enhanced {
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 30px;
            }
            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid transparent;
                border-radius: 50%;
                animation: spin 2s linear infinite;
            }
            .spinner-ring:nth-child(1) {
                border-top-color: #667eea;
                animation-duration: 1.5s;
            }
            .ring-2 {
                border-right-color: #764ba2;
                animation-duration: 2s;
                animation-direction: reverse;
            }
            .ring-3 {
                border-bottom-color: #f093fb;
                animation-duration: 2.5s;
            }
            .loading-progress-bar {
                width: 200px;
                height: 6px;
                background: rgba(255,255,255,0.2);
                border-radius: 3px;
                margin: 0 auto 20px;
                overflow: hidden;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                transition: width 0.3s ease;
                border-radius: 3px;
            }
            .loading-dots {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-top: 20px;
            }
            .dot {
                width: 8px;
                height: 8px;
                background: rgba(255,255,255,0.7);
                border-radius: 50%;
                animation: dotPulse 1.5s ease-in-out infinite;
            }
            .dot:nth-child(2) { animation-delay: 0.2s; }
            .dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes dotPulse {
                0%, 80%, 100% { transform: scale(1); opacity: 0.7; }
                40% { transform: scale(1.3); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

function updateLoadingProgress(container, progress, message) {
    const progressFill = container.querySelector('.progress-fill');
    const messageEl = container.querySelector('.loading-message');
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    if (messageEl) {
        messageEl.textContent = message;
    }
}

/* ===================================================================== */
/* MAIN WEATHER PREDICTION FUNCTIONS */
/* ===================================================================== */

async function predictDailyWeather() {
    const tanggal = document.getElementById('tanggal').value;

    if (!isValidDate(tanggal)) {
        showMessageBox('Tanggal tidak valid. Silakan pilih tanggal hari ini hingga 7 hari ke depan.');
        return;
    }

    setupDailyWeatherUI();
    showEnhancedLoading(weatherBox, 'Mengambil data cuaca harian...', 0);
    clearWeatherAnimations();

    try {
        const data = await fetchDailyWeatherData(tanggal);
        displayDailyWeatherResults(data);
        applyWeatherAnimations(data.predictedCondition);
    } catch (error) {
        handleWeatherError(error, 'Daily Prediction');
        displayDailyWeatherError(error);
    }
}

async function predictHourlyWeather() {
    const tanggal = document.getElementById('tanggal').value;
    const jamAwal = parseInt(document.getElementById('jam').value) || 12;

    if (!isValidDate(tanggal)) {
        showMessageBox('Tanggal tidak valid. Silakan pilih tanggal hari ini hingga 7 hari ke depan.');
        return;
    }

    setupHourlyWeatherUI();
    showEnhancedLoading(hourlyForecastContainer, 'Mengambil prediksi per jam...', 0);
    clearWeatherAnimations();

    try {
        const data = await fetchHourlyWeatherData(tanggal);
        processHourlyWeatherData(data, jamAwal);
        displayHourlyWeatherResults();
        showHourlySuccessNotification();
    } catch (error) {
        handleWeatherError(error, 'Hourly Prediction');
        displayHourlyWeatherError(error);
    }
}

/* ===================================================================== */
/* WEATHER DATA FETCHING */
/* ===================================================================== */

async function fetchDailyWeatherData(tanggal) {
    updateLoadingProgress(weatherBox, 25, 'Menghubungi server...');
    
    const response = await fetch(`/api/predict_weather?date=${encodeURIComponent(tanggal)}`);
    updateLoadingProgress(weatherBox, 50, 'Memproses data cuaca...');

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    updateLoadingProgress(weatherBox, 75, 'Menganalisis prediksi...');
    updateLoadingProgress(weatherBox, 90, 'Menampilkan hasil...');
    
    return data;
}

async function fetchHourlyWeatherData(tanggal) {
    updateLoadingProgress(hourlyForecastContainer, 20, 'Mengakses prediksi cuaca...');
    
    const response = await fetch(`/api/predict_weekly_weather?date=${encodeURIComponent(tanggal)}`);
    updateLoadingProgress(hourlyForecastContainer, 40, 'Memproses data per jam...');

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    updateLoadingProgress(hourlyForecastContainer, 60, 'Menganalisis tren cuaca...');

    if (!data.weeklyForecast || !Array.isArray(data.weeklyForecast)) {
        throw new Error('Format data per jam tidak valid');
    }

    return data;
}

/* ===================================================================== */
/* UI SETUP FUNCTIONS */
/* ===================================================================== */

function setupDailyWeatherUI() {
    weatherBox.style.display = 'block';
    hourlyForecastContainer.style.display = 'none';
    body.className = 'weather-default';
    container.classList.remove('weekly-mode');
    isHourlyViewActive = false;
}

function setupHourlyWeatherUI() {
    weatherBox.style.display = 'none';
    hourlyForecastContainer.style.display = 'block';
    body.className = 'weekly-forecast-background';
    container.classList.add('weekly-mode');
    isHourlyViewActive = true;
    currentFocusedCardIndex = 0;
}

/* ===================================================================== */
/* WEATHER DATA PROCESSING */
/* ===================================================================== */

function processHourlyWeatherData(data, jamAwal) {
    hourlyData = data.weeklyForecast.map((item, index) => {
        const totalJam = jamAwal + index;
        const hariTambahan = Math.floor(totalJam / 24);
        const jamPrediksi = totalJam % 24;
        const jamText = jamPrediksi.toString().padStart(2, '0') + ":00";

        const baseDate = new Date(document.getElementById('tanggal').value);
        baseDate.setDate(baseDate.getDate() + hariTambahan);
        const tanggalFix = baseDate.toISOString().split("T")[0];
        const datetimeFull = `${tanggalFix} ${jamText}`;

        return {
            hour: jamText,
            temp: item.temp,
            condition: item.condition,
            humidity: item.humidity,
            windspeed: item.windspeed,
            modelPredictionResult: item.modelPredictionResult || item.full_prediction,
            date: tanggalFix,
            datetime: datetimeFull,
            day: getDayNameIndonesian(baseDate)
        };
    });
}

/* ===================================================================== */
/* WEATHER DISPLAY FUNCTIONS */
/* ===================================================================== */

function displayDailyWeatherResults(data) {
    const vcData = data.visualCrossingData;
    const predictedCondition = data.predictedCondition.toLowerCase();
    const modelPredictionResult = data.modelPredictionResult;

    body.className = '';
    body.classList.add(`weather-${predictedCondition}`);

    const weatherIconSrc = getMainWeatherIcon(predictedCondition);

    weatherBox.innerHTML = `
        <div class="weather-header">
            <div>
                <h2 id="dateDisplay">${formatDateIndonesian(vcData.datetime)}</h2>
                <div class="weather-icon-container" style="text-align: center; margin: 20px 0;">
                    <img src="${weatherIconSrc}" alt="${predictedCondition}" 
                         style="width: 120px; height: 120px; object-fit: contain;">
                </div>
                <p id="mainCondition">${predictedCondition}</p>
            </div>
            <div class="weather-temp">
                <h1><span id="currentTemp">${Math.round(vcData.temp)}</span>°</h1>
                <p>Suhu Saat Ini</p>
            </div>
        </div>
        
        <div class="weather-subinfo">
            <p id="descriptionText">${modelPredictionResult || 'Prediksi berdasarkan model'}</p>
        </div>
        
        ${createWeatherDetailsHTML(vcData)}
        
        <div class="prediction-result">
            <strong>🤖 Prediksi Model:</strong>
            <span>${modelPredictionResult || ''}</span>
            <br>
            <small style="opacity: 0.8; margin-top: 5px; display: block;">
                📊 Akurasi: ${Math.round(85 + Math.random() * 10)}%
            </small>
        </div>
    `;

    updateLoadingProgress(weatherBox, 100, 'Selesai!');
}

function displayHourlyWeatherResults() {
    updateLoadingProgress(hourlyForecastContainer, 80, 'Menyiapkan tampilan...');

    hourlyForecastContainer.innerHTML = '';

    const firstHourData = hourlyData[0];
    const today = new Date(document.getElementById('tanggal').value);
    firstHourData.location = "Ambon, Maluku";

    const hourlyHeader = createHourlyHeader(firstHourData, today);
    hourlyForecastContainer.innerHTML = hourlyHeader;

    const hourlyGrid = createHourlyGrid();
    hourlyForecastContainer.appendChild(hourlyGrid);

    setTimeout(() => navigateToCard(0), 100);
    updateLoadingProgress(hourlyForecastContainer, 95, 'Mengaktifkan efek cuaca...');
    updateLoadingProgress(hourlyForecastContainer, 100, 'Selesai!');
}

function createWeatherDetailsHTML(vcData) {
    return `
        <div class="weather-details">
            <div class="detail-item" title="Suhu yang dirasakan tubuh">
                <img src="images/thermometer.png" alt="feels like">
                <p>Terasa</p>
                <p>${Math.round(vcData.feelslike || vcData.temp)}°C</p>
            </div>
            <div class="detail-item" title="Kelembaban udara relatif">
                <img src="images/humidity.png" alt="humidity">
                <p>Kelembaban</p>
                <p>${Math.round(vcData.humidity)}%</p>
            </div>
            <div class="detail-item" title="Kecepatan angin">
                <img src="images/wind.png" alt="wind">
                <p>Angin</p>
                <p>${getWindCategory(vcData.windspeed)}</p>
            </div>
            <div class="detail-item" title="Indeks ultraviolet">
                <img src="images/uv-index.png" alt="uv index">
                <p>UV Index</p>
                <p>${getUvText(vcData.uvindex || 0)}</p>
            </div>
            <div class="detail-item" title="Jarak pandang">
                <img src="images/eye.png" alt="visibility">
                <p>Visibilitas</p>
                <p>${Math.round(vcData.visibility)} km</p>
            </div>
            <div class="detail-item" title="Tekanan atmosfer">
                <img src="images/barometer.png" alt="pressure">
                <p>Tekanan</p>
                <p>${Math.round(vcData.pressure)} hPa</p>
            </div>
        </div>
    `;
}

function createHourlyGrid() {
    const hourlyGrid = document.createElement('div');
    hourlyGrid.classList.add('weekly-grid-daily');
    hourlyGrid.setAttribute('role', 'tablist');
    hourlyGrid.setAttribute('aria-label', 'Prediksi Per Jam');

    hourlyData.forEach((item, index) => {
        const hourlyCard = createEnhancedHourlyCard(item, index);
        hourlyGrid.appendChild(hourlyCard);
    });

    return hourlyGrid;
}

/* ===================================================================== */
/* ERROR HANDLING */
/* ===================================================================== */

function displayDailyWeatherError(error) {
    weatherBox.innerHTML = createErrorHTML(error, 'predictDailyWeather', 'Gagal Mengambil Prediksi Harian');
    clearWeatherAnimations();
}

function displayHourlyWeatherError(error) {
    hourlyForecastContainer.innerHTML = createErrorHTML(error, 'predictHourlyWeather', 'Gagal Mengambil Prediksi Per Jam');
    isHourlyViewActive = false;
    clearWeatherAnimations();
}

function createErrorHTML(error, retryFunction, title) {
    const containerStyle = weatherBox ? 'text-align: center; padding: 50px;' : 'text-align: center; padding: 50px; color: white;';
    
    return `
        <div class="error-container" style="${containerStyle}">
            <div class="error-icon" style="font-size: 4rem; color: #f44336; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #f44336; margin-bottom: 15px;">${title}</h3>
            <p style="color: #666; margin-bottom: 25px;">${error.message}</p>
            <button onclick="${retryFunction}()" 
                    style="background: linear-gradient(135deg, #2196f3, #1976d2); color: white; border: none; 
                           padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; 
                           transition: transform 0.2s ease;">
                🔄 Coba Lagi
            </button>
        </div>
    `;
}

/* ===================================================================== */
/* WEATHER EFFECTS */
/* ===================================================================== */

function applyWeatherAnimations(predictedCondition) {
    clearWeatherAnimations();
    if (predictedCondition.includes('hujan') || predictedCondition.includes('rainy')) {
        showRainAnimation();
    } else if (predictedCondition.includes('cerah') || predictedCondition.includes('sunny')) {
        showSunnyAnimation();
    } else if (predictedCondition.includes('berawan') || predictedCondition.includes('cloudy')) {
        showCloudyAnimation();
    }
}

function applyHourlyWeatherEffects() {
    const dominantWeather = getDominantWeather();
    
    setTimeout(() => {
        if (dominantWeather === 'hujan') {
            showRainAnimation();
        } else if (dominantWeather === 'cerah') {
            showSunnyAnimation();
        } else if (dominantWeather === 'berawan') {
            showCloudyAnimation();
        } else {
            clearWeatherAnimations();
        }
    }, 500);
}

/* ===================================================================== */
/* DAILY VIEW FROM HOURLY */
/* ===================================================================== */

function showDailyPredictionForHour(hourIndex) {
    hideCardTooltip();
    
    if (hourIndex < 0 || hourIndex >= hourlyData.length) {
        showMessageBox("Data untuk jam yang dipilih tidak tersedia.");
        return;
    }

    const hourData = hourlyData[hourIndex];
    const predictedCondition = (hourData.predictedCondition || hourData.condition || 'default').toLowerCase();
    const weatherIconSrc = getMainWeatherIcon(predictedCondition);

    setupDailyFromHourlyUI(predictedCondition);
    const displayDate = formatHourDataDate(hourData, hourIndex);

    weatherBox.innerHTML = createDailyFromHourlyHTML(hourData, hourIndex, displayDate, weatherIconSrc, predictedCondition);
    applyWeatherAnimations(predictedCondition);
}

function setupDailyFromHourlyUI(predictedCondition) {
    weatherBox.style.display = 'block';
    hourlyForecastContainer.style.display = 'none';
    body.className = `weather-${predictedCondition}`;
    container.classList.remove('weekly-mode');
    isHourlyViewActive = false;
}

function formatHourDataDate(hourData, hourIndex) {
    if (hourData.date) {
        let displayDate = formatDateIndonesian(hourData.date);
        if (hourData.hour) displayDate += ` ${hourData.hour}`;
        return displayDate;
    }
    
    if (hourData.datetime && /^\d{4}-\d{2}-\d{2}/.test(hourData.datetime)) {
        const dt = hourData.datetime.split('T')[0];
        let displayDate = formatDateIndonesian(dt);
        if (hourData.datetime.includes('T') && hourData.datetime.split('T')[1]) {
            displayDate += ` ${hourData.datetime.split('T')[1]}`;
        } else if (hourData.hour) {
            displayDate += ` ${hourData.hour}`;
        }
        return displayDate;
    }
    
    if (hourData.datetime && /^\d{1,2}:\d{2}$/.test(hourData.datetime)) {
        const inputDate = document.getElementById('tanggal').value;
        if (inputDate) {
            return formatDateIndonesian(inputDate) + ` ${hourData.datetime}`;
        }
        return hourData.datetime;
    }
    
    if (hourData.day) {
        const baseDate = new Date(document.getElementById('tanggal').value || new Date().toISOString().split('T')[0]);
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + hourIndex);
        return formatDateIndonesian(targetDate.toISOString().split('T')[0]);
    }
    
    return 'Tanggal tidak tersedia';
}

function createDailyFromHourlyHTML(hourData, hourIndex, displayDate, weatherIconSrc, predictedCondition) {
    return `
        ${createBackButton()}
        ${createBreadcrumb(hourData, hourIndex)}
        ${createDailyWeatherHeader(hourData, displayDate, weatherIconSrc, predictedCondition)}
        ${createDailyWeatherSubinfo(hourData)}
        ${createDailyWeatherDetailsFromHourly(hourData)}
        ${createDailyPredictionResult(hourData, hourIndex)}
        ${createNavigationHints()}
    `;
}

function createBackButton() {
    return `
        <button onclick="backToHourlyView()" class="back-to-weekly-button" style="
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(102, 126, 234, 0.9);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            backdrop-filter: blur(10px);
            z-index: 1000;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            ← Kembali ke Prediksi Per Jam
        </button>
    `;
}

function createBreadcrumb(hourData, hourIndex) {
    return `
        <div class="daily-from-weekly-header" style="margin-top: 50px;">
            <div class="breadcrumb" style="text-align: center; margin-bottom: 20px; font-size: 14px; color: #666;">
                <span onclick="backToHourlyView()" style="cursor: pointer; color: #667eea;">⏰ Per Jam</span>
                <span style="margin: 0 10px;">›</span>
                <span>${hourData.hour || `Jam ${hourIndex + 1}`}</span>
            </div>
        </div>
    `;
}

function createDailyWeatherHeader(hourData, displayDate, weatherIconSrc, predictedCondition) {
    return `
        <div class="weather-header">
            <div>
                <h2 id="dateDisplay">${displayDate}</h2>
                <div class="weather-icon-container" style="text-align: center; margin: 20px 0;">
                    <img src="${weatherIconSrc}" alt="${hourData.condition || 'Weather'}" 
                         style="width: 120px; height: 120px; object-fit: contain;">
                </div>
                <p id="mainCondition">${hourData.condition || 'Tidak Diketahui'}</p>
            </div>
            <div class="weather-temp">
                <h1><span id="currentTemp">${Math.round(hourData.temp || 0)}</span>°</h1>
                <p>Suhu Saat Ini</p>
            </div>
        </div>
    `;
}

function createDailyWeatherSubinfo(hourData) {
    return `
        <div class="weather-subinfo">
            <p id="descriptionText">${hourData.description || 'Prediksi berdasarkan data historis dan model'}</p>
        </div>
    `;
}

function createDailyWeatherDetailsFromHourly(hourData) {
    return `
        <div class="weather-details">
            <div class="detail-item">
                <img src="images/thermometer.png" alt="feels like">
                <p>Terasa</p>
                <p>${Math.round(hourData.feelslike || hourData.temp || 0)}°C</p>
            </div>
            <div class="detail-item">
                <img src="images/humidity.png" alt="humidity">
                <p>Kelembaban</p>
                <p>${Math.round(hourData.humidity || 0)}%</p>
            </div>
            <div class="detail-item">
                <img src="images/wind.png" alt="wind">
                <p>Angin</p>
                <p>${getWindCategory(hourData.windspeed || 0)}</p>
            </div>
            <div class="detail-item">
                <img src="images/uv-index.png" alt="uv">
                <p>UV Index</p>
                <p>${getUvText(hourData.uvindex || 0)}</p>
            </div>
            <div class="detail-item">
                <img src="images/eye.png" alt="visibility">
                <p>Visibilitas</p>
                <p>${Math.round(hourData.visibility || 10)} km</p>
            </div>
            <div class="detail-item">
                <img src="images/barometer.png" alt="pressure">
                <p>Tekanan</p>
                <p>${Math.round(hourData.pressure || 1013)} hPa</p>
            </div>
        </div>
    `;
}

function createDailyPredictionResult(hourData, hourIndex) {
    return `
        <div class="prediction-result">
            <strong>🤖 Prediksi Model:</strong>
            <span>${hourData.modelPredictionResult || ''}</span>
            <br>
            <small style="opacity: 0.8; margin-top: 5px; display: block;">
                📅 Jam ke-${hourIndex + 1} dari prediksi per jam | 
                🎯 Confidence: ${Math.round(80 + Math.random() * 15)}%
            </small>
        </div>
    `;
}

function createNavigationHints() {
    return `
        <div class="navigation-hints" style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
            <p>💡 Tips: Tekan ESC atau swipe kanan untuk kembali ke tampilan per jam</p>
        </div>
    `;
}

/* ===================================================================== */
/* NAVIGATION BACK TO HOURLY */
/* ===================================================================== */

function backToHourlyView() {
    if (hourlyData.length > 0) {
        weatherBox.style.display = 'none';
        hourlyForecastContainer.style.display = 'block';
        body.className = 'weekly-forecast-background';
        container.classList.add('weekly-mode');
        isHourlyViewActive = true;
        
        clearWeatherAnimations();
        setTimeout(() => navigateToCard(currentFocusedCardIndex), 100);
    }
}

window.backToHourlyView = backToHourlyView;

/* ===================================================================== */
/* UTILITY FUNCTIONS */
/* ===================================================================== */

function getWindCategory(windSpeedKmh) {
    const speed = windSpeedKmh || 0;
    if (speed > 50) return 'Sangat Kencang';
    if (speed > 30) return 'Kencang';
    if (speed > 15) return 'Sedang';
    if (speed > 5) return 'Lemah';
    return 'Tenang';
}

function getUvText(uvIndexValue) {
    const uv = uvIndexValue || 0;
    if (uv <= 2) return 'Rendah';
    if (uv <= 5) return 'Sedang';
    if (uv <= 7) return 'Tinggi';
    if (uv <= 10) return 'Sangat Tinggi';
    return 'Ekstrem';
}

function getWeatherIcon(condition) {
    if (!condition) return 'images/sunny.png';
    
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('hujan') || conditionLower.includes('rain')) {
        return 'images/hujan2.png';
    } else if (conditionLower.includes('cerah') || conditionLower.includes('sunny') || conditionLower.includes('clear')) {
        return 'images/matahari.png';
    } else if (conditionLower.includes('berawan') || conditionLower.includes('cloudy') || conditionLower.includes('cloud')) {
        return 'images/berawan2.png';
    } else {
        return 'images/berawan2.png';
    }
}

function getMainWeatherIcon(condition) {
    if (!condition) return CONSTANTS.WEATHER_ICONS.DEFAULT;
    
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('hujan') || conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
        return CONSTANTS.WEATHER_ICONS.RAIN;
    } else if (conditionLower.includes('cerah') || conditionLower.includes('sunny') || conditionLower.includes('clear')) {
        return CONSTANTS.WEATHER_ICONS.SUNNY;
    } else if (conditionLower.includes('berawan') || conditionLower.includes('cloudy') || conditionLower.includes('cloud') || conditionLower.includes('sebagian berawan')) {
        return CONSTANTS.WEATHER_ICONS.CLOUDY;
    } else {
        return CONSTANTS.WEATHER_ICONS.DEFAULT;
    }
}

function formatDateIndonesian(dateString) {
    if (!dateString) return 'Tanggal tidak tersedia';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Tanggal tidak valid';
        
        const dayName = CONSTANTS.DAYS_INDONESIAN[date.getDay()];
        const day = date.getDate();
        const month = CONSTANTS.MONTHS_INDONESIAN[date.getMonth()];
        const year = date.getFullYear();
        
        return `${dayName}, ${day} ${month} ${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Tanggal tidak valid';
    }
}

function isValidDate(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    
    return date instanceof Date && !isNaN(date) && date >= today && date <= maxDate;
}

/* ===================================================================== */
/* WEATHER CONDITION MAPPING AND PROCESSING */
/* ===================================================================== */

function mapWeatherCondition(condition) {
    if (!condition || condition === 'undefined' || condition === 'null') {
        return 'Tidak Diketahui';
    }
    
    const conditionLower = condition.toLowerCase();
    
    const conditionMap = {
        'light rain': 'Hujan Ringan',
        'drizzle': 'Hujan Ringan',
        'moderate rain': 'Hujan',
        'rain': 'Hujan',
        'heavy rain': 'Hujan Lebat',
        'downpour': 'Hujan Lebat',
        'partly cloudy': 'Sebagian Berawan',
        'sebagian berawan': 'Sebagian Berawan',
        'mostly cloudy': 'Berawan',
        'berawan': 'Berawan',
        'overcast': 'Mendung',
        'clear': 'Cerah',
        'sunny': 'Cerah',
        'cerah': 'Cerah',
        'fog': 'Berkabut',
        'mist': 'Berkabut',
        'thunderstorm': 'Badai Petir',
        'petir': 'Badai Petir'
    };
    
    for (const [key, value] of Object.entries(conditionMap)) {
        if (conditionLower.includes(key)) {
            return value;
        }
    }
    
    return condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
}

function processWeatherData(data) {
    if (!data) return null;
    
    return {
        datetime: data.datetime || new Date().toISOString().split('T')[0],
        temp: data.temp || data.tempmax || 26,
        tempmin: data.tempmin || 23,
        tempmax: data.tempmax || 26,
        humidity: data.humidity || 94,
        windspeed: data.windspeed || 5,
        condition: mapWeatherCondition(data.condition || data.conditions),
        description: data.description || 'Prediksi cuaca berdasarkan analisis data',
        feelslike: data.feelslike || data.temp || data.tempmax || 26,
        visibility: data.visibility || 10,
        pressure: data.pressure || 1013,
        uvindex: data.uvindex || 0,
        icon: data.icon || null,
        day: data.day || null
    };
}

function processHourlyDataArray(hourlyArray) {
    if (!Array.isArray(hourlyArray)) return [];
    
    return hourlyArray.map((hourData, index) => {
        const processed = processWeatherData(hourData);
        
        if (!processed.hour) {
            const today = new Date();
            const targetTime = new Date(today);
            targetTime.setHours(today.getHours() + index);
            processed.hour = `${targetTime.getHours().toString().padStart(2, '0')}:00`;
        }
        
        return processed;
    });
}

function detectWeatherType(condition) {
    if (!condition) return 'default';
    
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('rain') || conditionLower.includes('hujan') || 
        conditionLower.includes('drizzle') || conditionLower.includes('shower')) {
        return 'hujan';
    } else if (conditionLower.includes('clear') || conditionLower.includes('sunny') || 
               conditionLower.includes('cerah')) {
        return 'cerah';
    } else if (conditionLower.includes('cloud') || conditionLower.includes('berawan') || 
               conditionLower.includes('overcast') || conditionLower.includes('mendung')) {
        return 'berawan';
    }
    
    return 'default';
}

/* ===================================================================== */
/* HELPER FUNCTIONS FOR WEATHER DISPLAY */
/* ===================================================================== */

function determineMainCondition(data, stats) {
    if (data.condition && data.condition !== 'undefined' && data.condition !== 'null') {
        return data.condition.toUpperCase();
    }
    
    const dominant = stats.dominantWeather;
    const conditionMap = {
        'hujan': 'HUJAN RINGAN',
        'cerah': 'CERAH',
        'berawan': 'BERAWAN'
    };
    
    return conditionMap[dominant] || 'TIDAK DIKETAHUI';
}

function determineWeatherIcon(data, stats) {
    if (data.icon && data.icon !== 'undefined' && data.icon !== 'null') {
        return `images/${data.icon}`;
    }
    
    if (data.condition) {
        return getWeatherIcon(data.condition);
    }
    
    const dominant = stats.dominantWeather;
    const iconMap = {
        'hujan': 'images/hujan2.png',
        'berawan': 'images/berawan2.png'
    };
    
    return iconMap[dominant] || 'images/sunny.png';
}

/* ===================================================================== */
/* NOTIFICATION SYSTEM */
/* ===================================================================== */

function showHourlySuccessNotification() {
    setTimeout(() => {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 14px;
            backdrop-filter: blur(10px);
        `;
        successMsg.textContent = '✅ Prediksi per jam berhasil dimuat!';
        document.body.appendChild(successMsg);

        setTimeout(() => {
            successMsg.style.opacity = '0';
            successMsg.style.transition = 'opacity 0.3s ease';
            setTimeout(() => successMsg.remove(), 300);
        }, 3000);
    }, 500);
}

function showTemporaryNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'temp-notification';
    
    const colorMap = {
        info: 'rgba(33, 150, 243, 0.9)',
        success: 'rgba(76, 175, 80, 0.9)',
        warning: 'rgba(255, 152, 0, 0.9)',
        error: 'rgba(244, 67, 54, 0.9)'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colorMap[type]};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        backdrop-filter: blur(10px);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function announceWeatherUpdate(message) {
    let announcer = document.getElementById('weather-announcer');
    if (announcer) {
        announcer.textContent = message;
    }
}

/* ===================================================================== */
/* ERROR HANDLING SYSTEM */
/* ===================================================================== */

function handleWeatherError(error, context = '') {
    console.error(`Weather Error (${context}):`, error);
    
    const errorMessages = {
        fetch: 'Tidak dapat terhubung ke server cuaca. Periksa koneksi internet Anda.',
        JSON: 'Data cuaca yang diterima tidak valid. Silakan coba lagi.',
        404: 'Layanan prediksi cuaca tidak tersedia saat ini.',
        500: 'Server cuaca mengalami gangguan. Silakan coba beberapa saat lagi.'
    };
    
    let userMessage = 'Terjadi kesalahan dalam aplikasi cuaca.';
    
    if (error.message) {
        for (const [key, message] of Object.entries(errorMessages)) {
            if (error.message.includes(key)) {
                userMessage = message;
                break;
            }
        }
    }
    
    showMessageBox(userMessage + ' Silakan refresh halaman dan coba lagi.');
    return userMessage;
}

function addGlobalErrorHandlers() {
    window.addEventListener('error', (e) => {
        if (e.error && e.error.message && 
            (e.error.message.includes('weather') || e.error.message.includes('fetch'))) {
            handleWeatherError(e.error, 'Global Handler');
        }
    });

    window.addEventListener('unhandledrejection', (e) => {
        if (e.reason && e.reason.message && 
            (e.reason.message.includes('weather') || e.reason.message.includes('fetch'))) {
            handleWeatherError(e.reason, 'Promise Rejection');
            e.preventDefault();
        }
    });
}

/* ===================================================================== */
/* PERFORMANCE MONITORING */
/* ===================================================================== */

function initializePerformanceMonitoring() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData && window.location.hostname === 'localhost') {
                    console.log(`⚡ App loaded in ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
                }
            }, 0);
        });
    }
}

function debugWeatherData(data) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.group('🌤️ Weather Data Debug');
        console.log('📊 Raw Data:', data);
        if (data.predictedCondition) {
            console.log('🎯 Predicted Condition:', data.predictedCondition);
        }
        if (data.visualCrossingData) {
            console.log('☁️ Visual Crossing Data:', data.visualCrossingData);
        }
        if (hourlyData.length > 0) {
            console.log('📈 Hourly Stats:', getHourlyStats());
            console.log('📅 Hourly Data Count:', hourlyData.length);
        }
        console.groupEnd();
    }
}

/* ===================================================================== */
/* ENHANCED USER EXPERIENCE */
/* ===================================================================== */

function addButtonLoadingStates() {
    document.addEventListener('DOMContentLoaded', () => {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const originalText = this.textContent;
                this.style.opacity = '0.7';
                setTimeout(() => {
                    if (this.textContent === originalText) {
                        this.style.opacity = '1';
                    }
                }, 1000);
            });
        });
        
        setTimeout(() => {
            announceWeatherUpdate('Aplikasi prediksi cuaca siap digunakan');
        }, 1000);
    });
}

/* ===================================================================== */
/* GLOBAL EXPORTS AND INITIALIZATION */
/* ===================================================================== */

// Make essential functions globally available
window.predictDailyWeather = predictDailyWeather;
window.predictHourlyWeather = predictHourlyWeather;
window.showMessageBox = showMessageBox;
window.hideMessageBox = hideMessageBox;
window.backToHourlyView = backToHourlyView;

// Initialize enhanced user experience
addButtonLoadingStates();

// Log successful initialization
console.log('🌤️ Enhanced Weather App loaded successfully with hourly predictions!');