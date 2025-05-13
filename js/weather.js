// Improved date/time function with proper timezone handling
function updateDateTime() {
    const now = new Date();
    const options = { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    };
    const date = now.toLocaleDateString('en-IN', options).replace(/\//g, '-');
    const time = now.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('currentDate').textContent = date;
    document.getElementById('currentTime').textContent = time;
}
setInterval(updateDateTime, 1000);
updateDateTime();

const apiKey = "b3d3c17af9f002aebc156da6a39b5480";
const city = "jodhpur";
const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

// Data management class
class WeatherData {
    constructor() {
        // Current day data
        this.current = {
            windMax: this.getStoredValue("windMax"),
            windMin: this.getStoredValue("windMin"),
            windAvrAngDir: this.getStoredValue("windAvrAngDir"),
            stPressMax: this.getStoredValue("stPressMax"),
            stPressMin: this.getStoredValue("stPressMin"),
            meanSeaPressMax: this.getStoredValue("meanSeaPressMax"),
            meanSeaPressMin: this.getStoredValue("meanSeaPressMin"),
            tempMax: this.getStoredValue("tempMax"),
            tempMin: this.getStoredValue("tempMin"),
            humidityMax: this.getStoredValue("humidityMax"),
            humidityMin: this.getStoredValue("humidityMin"),
            rainfall: this.getStoredValue("rainfallPrev")
        };
        
        // Previous day data - using dedicated previous day keys only
        this.previous = {
            windMax: this.getStoredValue("previousDayWindMax") || 0,
            windMin: this.getStoredValue("previousDayWindMin") || 0,
            windAvrAngDir: this.getStoredValue("previousDayWindAvrAngDir") || 0,
            stPressMax: this.getStoredValue("previousStPressMax") || 0,
            stPressMin: this.getStoredValue("previousStPressMin") || 0,
            meanSeaPressMax: this.getStoredValue("previousMeanSeaPressMax") || 0,
            meanSeaPressMin: this.getStoredValue("previousMeanSeaPressMin") || 0,
            tempMax: this.getStoredValue("previousTempMax") || 0,
            tempMin: this.getStoredValue("previousTempMin") || 0,
            humidityMax: this.getStoredValue("previousHumidityMax") || 0,
            humidityMin: this.getStoredValue("previousHumidityMin") || 0,
            rainfall: this.getStoredValue("previousRainfallPrev") || 0
        };
        
        // Wind history
        this.windSpeedHistory = JSON.parse(localStorage.getItem("windSpeedHistory")) || [];
        this.windDirectionHistory = JSON.parse(localStorage.getItem("windDirectionHistory")) || [];
        
        // Track current day
        this.currentDay = new Date().getDate();
    }
    
    getStoredValue(key) {
        const value = localStorage.getItem(key);
        const numValue = parseFloat(value);
        return value !== null && !isNaN(numValue) ? numValue : null;
    }
    
    saveCurrentData() {
        // Save current data
        for (const [key, value] of Object.entries(this.current)) {
            if (value !== null) {
                localStorage.setItem(key, value);
            }
        }
        
        // Save wind history
        localStorage.setItem("windSpeedHistory", JSON.stringify(this.windSpeedHistory));
        localStorage.setItem("windDirectionHistory", JSON.stringify(this.windDirectionHistory));
    }
    
    savePreviousDayData() {
        // Save previous day data with dedicated keys
        localStorage.setItem("previousDayWindMax", this.previous.windMax);
        localStorage.setItem("previousDayWindMin", this.previous.windMin);
        localStorage.setItem("previousDayWindAvrAngDir", this.previous.windAvrAngDir);
        localStorage.setItem("previousStPressMax", this.previous.stPressMax);
        localStorage.setItem("previousStPressMin", this.previous.stPressMin);
        localStorage.setItem("previousMeanSeaPressMax", this.previous.meanSeaPressMax);
        localStorage.setItem("previousMeanSeaPressMin", this.previous.meanSeaPressMin);
        localStorage.setItem("previousTempMax", this.previous.tempMax);
        localStorage.setItem("previousTempMin", this.previous.tempMin);
        localStorage.setItem("previousHumidityMax", this.previous.humidityMax);
        localStorage.setItem("previousHumidityMin", this.previous.humidityMin);
        localStorage.setItem("previousRainfallPrev", this.previous.rainfall);
    }
    
    checkDayChange() {
        const now = new Date();
        const currentDay = now.getDate();
        
        if (currentDay !== this.currentDay) {
            // Ensure wind averages are calculated before saving
            if (this.windDirectionHistory.length > 0) {
                this.current.windAvrAngDir = this.calculateAverageDirection(this.windDirectionHistory);
            }
            
            // Day changed - save current data as previous day first
            this.saveAsPreviousDay();
            
            // Then reset current day data
            this.resetCurrentDay();
            this.currentDay = currentDay;

            this.windSpeedHistory = [];
            this.windDirectionHistory = [];
            return true;
        }
        return false;
    }
    
    saveAsPreviousDay() {
        // Copy current data to previous day
        this.previous = {
            windMax: this.current.windMax || 0,
            windMin: this.current.windMin || 0,
            windAvrAngDir: this.current.windAvrAngDir || 0,
            stPressMax: this.current.stPressMax || 0,
            stPressMin: this.current.stPressMin || 0,
            meanSeaPressMax: this.current.meanSeaPressMax || 0,
            meanSeaPressMin: this.current.meanSeaPressMin || 0,
            tempMax: this.current.tempMax || 0,
            tempMin: this.current.tempMin || 0,
            humidityMax: this.current.humidityMax || 0,
            humidityMin: this.current.humidityMin || 0,
            rainfall: this.current.rainfall || 0
        };
        
        this.savePreviousDayData();
    }
    
    resetCurrentDay() {
        // Reset current day max/min values (keep current readings)
        const resetValues = {
            windMax: null,
            windMin: null,
            stPressMax: null,
            stPressMin: null,
            meanSeaPressMax: null,
            meanSeaPressMin: null,
            tempMax: null,
            tempMin: null,
            humidityMax: null,
            humidityMin: null,
            rainfall: null
        };
        
        Object.assign(this.current, resetValues);
    }
    
    updateWindValues(windSpeed, windDirection) {
        const windSpeedKmh = windSpeed * 1.944; // Convert to knots
        
        // Update max/min
        if (this.current.windMax === null || windSpeedKmh > this.current.windMax) {
            this.current.windMax = windSpeedKmh;
        }
        if (this.current.windMin === null || windSpeedKmh < this.current.windMin) {
            this.current.windMin = windSpeedKmh;
        }
        
        // Add to history
        this.windSpeedHistory.push(windSpeedKmh);
        this.windDirectionHistory.push(windDirection);
        
        // Calculate average direction
        if (this.windDirectionHistory.length > 0) {
            this.current.windAvrAngDir = this.calculateAverageDirection(this.windDirectionHistory);
        }
    }
    
    updatePressureValues(stationPressure, meanSeaPressure) {
        if (this.current.stPressMax === null || stationPressure > this.current.stPressMax) {
            this.current.stPressMax = stationPressure;
        }
        if (this.current.stPressMin === null || stationPressure < this.current.stPressMin) {
            this.current.stPressMin = stationPressure;
        }
        if (this.current.meanSeaPressMax === null || meanSeaPressure > this.current.meanSeaPressMax) {
            this.current.meanSeaPressMax = meanSeaPressure;
        }
        if (this.current.meanSeaPressMin === null || meanSeaPressure < this.current.meanSeaPressMin) {
            this.current.meanSeaPressMin = meanSeaPressure;
        }
    }
    
    updateTemperatureValues(temperature) {
        if (this.current.tempMax === null || temperature > this.current.tempMax) {
            this.current.tempMax = temperature;
        }
        if (this.current.tempMin === null || temperature < this.current.tempMin) {
            this.current.tempMin = temperature;
        }
    }
    
    updateHumidityValues(humidity) {
        if (this.current.humidityMax === null || humidity > this.current.humidityMax) {
            this.current.humidityMax = humidity;
        }
        if (this.current.humidityMin === null || humidity < this.current.humidityMin) {
            this.current.humidityMin = humidity;
        }
    }
    
    updateRainfallValues(rainfall) {
        this.current.rainfall = rainfall;
    }
    
    calculateAverageDirection(directions) {
        let sinSum = 0;
        let cosSum = 0;

        directions.forEach(dir => {
            sinSum += Math.sin(dir * Math.PI / 180);
            cosSum += Math.cos(dir * Math.PI / 180);
        });

        const avgSin = sinSum / directions.length;
        const avgCos = cosSum / directions.length;
        const avgDir = Math.atan2(avgSin, avgCos) * 180 / Math.PI;

        return (avgDir + 360) % 360;
    }
}

// Initialize weather data manager
const weatherData = new WeatherData();

// Thermometer scale functions based on label values
function getScaleValues(scaleId) {
    const labels = Array.from(document.querySelectorAll(`#${scaleId} span`))
                       .map(span => parseFloat(span.textContent));
    return {
        min: Math.min(...labels),
        max: Math.max(...labels),
        range: Math.max(...labels) - Math.min(...labels)
    };
}

function updateTemperatureScale(temp) {
    const { min, range } = getScaleValues('tempLabels');
    let percentage = (temp - min) / range;
    percentage = Math.max(0, Math.min(1, percentage));
    
    const indicator = document.getElementById('tempIndicator');
    if (indicator) {
        indicator.style.height = `${percentage * 100}%`;
    }
}

function updateHumidityScale(humidity) {
    const { min, range } = getScaleValues('humidityLabels');
    let percentage = (humidity - min) / range;
    percentage = Math.max(0, Math.min(1, percentage));
    
    const indicator = document.getElementById('humidityIndicator');
    if (indicator) {
        indicator.style.height = `${percentage * 100}%`;
    }
}

function updateRainScale(rainfall) {
    const { min, range } = getScaleValues('rainLabels');
    let percentage = (rainfall - min) / range;
    percentage = Math.max(0, Math.min(1, percentage));
    
    const indicator = document.getElementById('rainIndicator');
    if (indicator) {
        indicator.style.height = `${percentage * 100}%`;
    }
}

// Update UI functions
function updateWeatherUI(data) {
    const windSpeedKmh = data.windSpeed * 1.944;
    
    // Update wind data
    updateWindUI(windSpeedKmh, data.windDirection);
    
    // Update pressure data
    updatePressureUI(data.stationPressure, data.meanSeaPressure);
    
    // Update temperature data (with thermometer scale)
    updateTemperatureUI(data.temperature);
    
    // Update humidity data (with thermometer scale)
    updateHumidityUI(data.humidity);
    
    // Update rainfall data (with thermometer scale)
    updateRainfallUI(data.rainfall);
    
    // Update previous day data
    updatePreviousDayUI();
}

function updateWindUI(windSpeedKmh, windDirection) {
    // Wind speed gauge
    const windSpeedRotation = mapValueToAngle(windSpeedKmh, 0, 24, -90, 90);
    document.getElementById("windSpeedNeedle").style.setProperty("--rotation", `${windSpeedRotation}deg`);
    document.getElementById("windSpeedValue").textContent = `${windSpeedKmh.toFixed(1)} knot`;
    
    // Wind direction gauge
    document.getElementById("windDirectionNeedle").style.setProperty("--rotation", `${windDirection}deg`);
    document.getElementById("windDirectionvalue").textContent = `${windDirection}°`;
    
    // Current day stats
    document.getElementById("windMax").textContent = formatValue(weatherData.current.windMax, " knot");
    document.getElementById("windMin").textContent = formatValue(weatherData.current.windMin, " knot");
    document.getElementById("WindAvrAngDir").textContent = formatValue(weatherData.current.windAvrAngDir, "°");
}

function updatePressureUI(stationPressure, meanSeaPressure) {
    document.getElementById("stationPressure").textContent = `${stationPressure.toFixed(2)} hPa`;
    document.getElementById("meanSeaPressure").textContent = `${meanSeaPressure.toFixed(2)} hPa/gpm`;
    
    // Current day stats
    document.getElementById("stPressMax").textContent = formatValue(weatherData.current.stPressMax, " hPa");
    document.getElementById("stPressMin").textContent = formatValue(weatherData.current.stPressMin, " hPa");
    document.getElementById("MeanSeaPressMax").textContent = formatValue(weatherData.current.meanSeaPressMax, " hPa/gpm");
    document.getElementById("MeanSeaPressMin").textContent = formatValue(weatherData.current.meanSeaPressMin, " hPa/gpm");
}

function updateTemperatureUI(temperature) {
    document.getElementById("temperatureValue").textContent = `${temperature.toFixed(1)}°C`;
    document.querySelector(".digital-display#temperatureValue").textContent = `${temperature.toFixed(1)}°C`;
    
    // Update thermometer scale
    updateTemperatureScale(temperature);
    
    // Current day stats
    document.getElementById("tempMax").textContent = formatValue(weatherData.current.tempMax, "°C");
    document.getElementById("tempMin").textContent = formatValue(weatherData.current.tempMin, "°C");
}

function updateHumidityUI(humidity) {
    document.getElementById("humidityValue").textContent = `${humidity}%`;
    document.querySelector(".digital-display#humidityValue").textContent = `${humidity}%`;
    
    // Update thermometer scale
    updateHumidityScale(humidity);
    
    // Current day stats
    document.getElementById("humidityMax").textContent = formatValue(weatherData.current.humidityMax, "%");
    document.getElementById("humidityMin").textContent = formatValue(weatherData.current.humidityMin, "%");
}

function updateRainfallUI(rainfall) {
    document.getElementById("rainValue").textContent = `${rainfall.toFixed(1)} mm`;
    document.querySelector(".digital-display#rainValue").textContent = `${rainfall.toFixed(1)} mm`;
    
    // Update thermometer scale
    updateRainScale(rainfall);
}

function updatePreviousDayUI() {
    // Wind data
    document.getElementById("WindPrevMax").textContent = formatValue(weatherData.previous.windMax, " knot");
    document.getElementById("WindPrevMin").textContent = formatValue(weatherData.previous.windMin, " knot");
    document.getElementById("WindAvrAngPrevDir").textContent = formatValue(weatherData.previous.windAvrAngDir, "°");
    
    // Pressure data
    document.getElementById("StPressPrevMax").textContent = formatValue(weatherData.previous.stPressMax, " hPa");
    document.getElementById("StPressPrevMin").textContent = formatValue(weatherData.previous.stPressMin, " hPa");
    document.getElementById("meanSeaPressPrevMax").textContent = formatValue(weatherData.previous.meanSeaPressMax, " hPa/gpm");
    document.getElementById("meanSeaPressPrevMin").textContent = formatValue(weatherData.previous.meanSeaPressMin, " hPa/gpm");
    
    // Temperature data
    document.getElementById("tempPrevMax").textContent = formatValue(weatherData.previous.tempMax, "°C");
    document.getElementById("tempPrevMin").textContent = formatValue(weatherData.previous.tempMin, "°C");
    
    // Humidity data
    document.getElementById("humidityPrevMax").textContent = formatValue(weatherData.previous.humidityMax, "%");
    document.getElementById("humidityPrevMin").textContent = formatValue(weatherData.previous.humidityMin, "%");
    
    // Rainfall data
    document.getElementById("rainfallPrev").textContent = formatValue(weatherData.previous.rainfall, " mm");
}

function formatValue(value, unit) {
    if (value === null || isNaN(value)) {
        return "--";
    }
    return `${value.toFixed(1)}${unit}`;
}

// Helper function to map values to angles
function mapValueToAngle(value, minValue, maxValue, minAngle, maxAngle) {
    return ((value - minValue) / (maxValue - minValue)) * (maxAngle - minAngle) + minAngle;
}

// Fetch weather data
async function fetchWeatherData() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("API Response:", data);

        // Extract required values
        const weatherDataPoints = {
            windSpeed: data.wind?.speed || 0,
            windDirection: data.wind?.deg || 0,
            temperature: data.main?.temp || 0,
            stationPressure: data.main?.pressure || 0,
            humidity: data.main?.humidity || 0,
            rainfall: data.rain ? data.rain["1h"] || 0 : 0,
            meanSeaPressure: data.main?.sea_level || data.main?.pressure || 0
        };

        // Check for day change
        weatherData.checkDayChange();
        
        // Update all values
        weatherData.updateWindValues(weatherDataPoints.windSpeed, weatherDataPoints.windDirection);
        weatherData.updatePressureValues(weatherDataPoints.stationPressure, weatherDataPoints.meanSeaPressure);
        weatherData.updateTemperatureValues(weatherDataPoints.temperature);
        weatherData.updateHumidityValues(weatherDataPoints.humidity);
        weatherData.updateRainfallValues(weatherDataPoints.rainfall);
        
        // Update UI
        updateWeatherUI(weatherDataPoints);
        
        // Save data
        weatherData.saveCurrentData();
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

// Initialize and start updates
function startWeatherUpdates(interval = 60000) {
    fetchWeatherData(); // Initial fetch
    setInterval(fetchWeatherData, interval); // Periodic updates
    
    // Update previous day UI immediately
    updatePreviousDayUI();
    // Also check for day change on startup
    weatherData.checkDayChange();
}

// Start the application
window.addEventListener('load', () => {
    startWeatherUpdates();
    updateDateTime();
    
    // Initialize thermometer indicators with default values
    updateTemperatureScale(20);  // Default value
    updateHumidityScale(50);     // Default value
    updateRainScale(0);         // Default value
});