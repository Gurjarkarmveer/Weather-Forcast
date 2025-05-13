//future  two days data 
function initializeWeatherCharts() {
    document.addEventListener('DOMContentLoaded', async function() {
        // API Configuration
        const apiKey = "570c923d25d987f8170fd287ba93382c";
        const lat = 26.2541; // Jodhpur latitude
        const lon = 72.9908; // Jodhpur longitude
        const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        
        // const forecastApiUrl = https://mosdac.gov.in/apiweather1/weather?lon=73.0232&lat=26.2833;
        // Chart Elements
        const chartConfigs = [
            { id: 'temperatureCanvas', type: 'temp', label: 'Temperature (°C)', color: 'rgba(255, 99, 132, 1)' },
            { id: 'humidityCanvas', type: 'humidity', label: 'Humidity (%)', color: 'rgba(54, 162, 235, 1)' },
            { id: 'windCanvas', type: 'wind_deg', label: 'Wind Direction (°)', color: 'rgba(255, 206, 86, 1)' },
            { id: 'windSpeedCanvas', type: 'wind_speed', label: 'Wind Speed (knot)', color: 'rgba(75, 192, 192, 1)' },
            { id: 'rainCanvas', type: 'rain', label: 'Rainfall (mm)', color: 'rgba(153, 102, 255, 1)' },
            { id: 'pressureCanvas', type: 'pressure', label: 'Pressure (hPa)', color: 'rgba(255, 159, 64, 1)' }
        ];

        // Initialize all charts
        const charts = {};
        chartConfigs.forEach(config => {
            const canvas = document.getElementById(config.id);
            if (!canvas) {
                console.error(`Canvas element with id ${config.id} not found`);
                return;
            }

            charts[config.type] = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: { labels: [], datasets: [{
                    label: config.label,
                    data: [],
                    borderColor: config.color,
                    backgroundColor: config.color.replace('1)', '0.2)'),
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }]},
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true }},
                    scales: {
                        y: { beginAtZero: config.type === 'rain' },
                        x: { 
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                callback: function(value) {
                                    // This will use the 24-hour format from our labels
                                    return this.getLabelForValue(value);
                                }
                            }
                        }
                    }
                }
            });
        });

        // Format time in 24-hour format (e.g., "14:30")
        function formatTime24Hour(dt_txt) {
            const date = new Date(dt_txt);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        // Format date (e.g., "Mon 15 Jan")
        function formatDate(dt_txt) {
            const date = new Date(dt_txt);
            const options = { day: 'numeric', month: 'short' };
            return date.toLocaleDateString('en-US', options);
        }

        // Process and display weather data
        async function fetchAndDisplayWeather() {
            try {
                console.log("Fetching weather data...");
                const response = await fetch(forecastApiUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log("Weather data received:", data);
                
                if (!data.list || data.list.length === 0) {
                    throw new Error("No weather data available");
                }

                // Process the data for the next 3 days (including today)
                const now = new Date();
                const threeDaysLater = new Date();
                threeDaysLater.setDate(now.getDate() + 2); // Today + 2 days = 3 days total
                
                const filteredData = data.list.filter(item => {
                    const itemDate = new Date(item.dt_txt);
                    return itemDate <= threeDaysLater;
                });

                // Prepare labels and datasets
                const labels = [];
                const datasets = {
                    temp: [],
                    humidity: [],
                    wind_deg: [],
                    wind_speed: [],
                    rain: [],
                    pressure: []
                };

                filteredData.forEach(item => {
                    // Create label in format "Mon 15 Jan 14:30"
                    const label = `${formatDate(item.dt_txt)} ${formatTime24Hour(item.dt_txt)}`;
                    labels.push(label);
                    
                    datasets.temp.push(item.main.temp);
                    datasets.humidity.push(item.main.humidity);
                    datasets.wind_deg.push(item.wind.deg);
                    datasets.wind_speed.push(item.wind.speed * 1.944); // Convert to knot
                    
                    // Handle rain data which might be missing
                    const rain = item.rain ? item.rain['3h'] || 0 : 0;
                    datasets.rain.push(rain);
                    
                    datasets.pressure.push(item.main.pressure);
                });

                // Update charts
                Object.entries(charts).forEach(([type, chart]) => {
                    chart.data.labels = labels;
                    chart.data.datasets[0].data = datasets[type];
                    chart.update();
                });

            } catch (error) {
                console.error("Error fetching or processing weather data:", error);
                // Display error to user
                alert("Failed to load weather data. Please try again later.");
            }
        }

        // Initial load
        await fetchAndDisplayWeather();
        
        // Update every hour
        setInterval(fetchAndDisplayWeather, 60 * 60 * 1000);
    });
}

// Start the application
initializeWeatherCharts();