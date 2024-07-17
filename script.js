let weather = {
    "apikey": "1d7d29617dacd87503b935e4e160c4ac",
    timezone: null,
    fetchCurrentWeather : function (city) {
        fetch("https://api.openweathermap.org/data/2.5/weather?q=" 
        + city 
        + "&units=metric&appid=" 
        + this.apikey)
        .then((Response) => Response.json())
        .then((data) => {
            console.log(data); // Log the data to see it in JSON format
            this.displayCurrentWeather(data);
        });
    },

    displayCurrentWeather: function(data) {
        const { lat, lon } = data.coord;
        const { name, timezone } = data;
        this.timezone = timezone;
        const { icon, description } = data.weather[0];
        const { temp, humidity } = data.main;
        const { speed } = data.wind;
        document.querySelector(".city").innerText = name;
        const utcTime = Date.now() - 7200000; // Date.now() takes time specified in the device (my laptop) so having CET we need to substract 2 hours
        const time = new Date(utcTime + timezone * 1000)
        const hours = time.getHours().toString().padStart(2, '0'); //padStart is used to make sure there are two digits (puts 0 in front if hour is less than 10)
        const minutes = time.getMinutes().toString().padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = time.toLocaleDateString('en-GB', options);
        document.querySelector(".timezone").innerText = formattedDate + " " + formattedTime;
        document.querySelector(".icon").src = "https://openweathermap.org/img/wn/" + icon + ".png";
        document.querySelector(".description").innerText = description;
        document.querySelector(".temp").innerText = Math.floor(temp) + "°C";
        document.querySelector(".precipitation").innerText = humidity + "%";
        document.querySelector(".wind").innerText = "Wind speed: " + speed + " km/h";
        
        this.fetchOtherWeather(lat, lon)
    },

    fetchOtherWeather: function(lat, lon)  {
        fetch("https://api.openweathermap.org/data/3.0/onecall?lat="
        + lat + "&lon=" + lon + 
        "&units=metric&exclude=minutely,alerts&appid="
        + this.apikey)
        .then((Response) => Response.json())
        .then((data) => {
            console.log(data); // Log the data to see it in JSON format
            this.displayHourlyWeather(data.hourly);
            this.displayDailyWeather(data.daily);
        });
    },

    search : function() {
        this.fetchCurrentWeather(document.querySelector("#searchbar").value);
    },

    displayHourlyWeather: function(data) {
        const { uvi } = data[0];
        let uvindex;
        if (uvi <= 2) {
            uvindex = 'Low';
          } else if (uvi <= 5) {
            uvindex = 'Medium';
          } else if (uvi <= 7) {
            uvindex = 'High';
          } else if (uvi <= 10) {
            uvindex = 'Very High';
          } else if (uvi >= 11) {
            uvindex = 'Extreme';
          } else {
            uvindex = 'Unknown';
          }

        document.querySelector(".uv-index").innerText = uvindex;

        const sliderInner = document.querySelector(".carousel-inner");
        sliderInner.innerHTML = ""; // Clear any existing data
      
        // Loop through each slide
        for (let i = 0; i < 3; i++) {
          // Create a new carousel item
          const carouselItem = document.createElement("div");
          carouselItem.classList.add("carousel-item");
          if (i === 0) {
            carouselItem.classList.add("active"); // Set the first item as active
          }
      
          // Create a row for this slide
          const row = document.createElement("div");
          row.classList.add("row");
          
          // Loop through 8 hours of data for this slide
          for (let j = i * 8; j < Math.min((i + 1) * 8, data.length); j++) {
            const hour = data[j];
            // Format the timestamp to get the hour only
            const date = new Date(this.timezone * 1000 - 7200000 + hour.dt * 1000);
            const formattedHour = date.getHours();
      
            // Create a weather card for each hour
            const col = document.createElement("div");
            col.classList.add("col-md-3"); // Adjust column size as needed
      
            // Create HTML content for the weather card
            col.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <h4 class="card-title">${formattedHour}:00</h4>
                        <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" class="card-img-top">
                        <h3 class="card-text">${Math.floor(hour.temp)}°C</h3>
                        <p class="card-text">${hour.humidity}%</p>
                    </div>
                </div>
            `;
      
            // Append the weather card to the row
            row.appendChild(col);
          }
      
          // Append the row to the carousel item
          carouselItem.appendChild(row);
      
          // Append the carousel item to the slider inner
          sliderInner.appendChild(carouselItem);
        }
      },
    
    weatherChart: null,

    displayDailyWeather: function(dailyData){
        

        // Arrays to hold the data for each time of day
        const labels = [];
        const temps = [];


        let minTemp = Number.MAX_VALUE;
        let maxTemp = Number.MIN_VALUE;
        // Iterate through the daily data and extract the temperatures
        for (let i = 0; i < 8; i++) {
            const dayData = dailyData[i];
            labels.push(`Day ${i} M`);
            labels.push(`Day ${i} D`);
            labels.push(`Day ${i} E`);
            labels.push(`Day ${i} N`);
            temps.push(dayData.temp.morn);
            temps.push(dayData.temp.day);
            temps.push(dayData.temp.eve);
            temps.push(dayData.temp.night);

            if (dayData.temp.min < minTemp) {
              minTemp = dayData.temp.min;
            }
            if (dayData.temp.max > maxTemp) {
              maxTemp = dayData.temp.max;
            }
        }

        const minYAxisValue = Math.floor(minTemp / 5) * 5;
        const maxYAxisValue = Math.ceil(maxTemp / 5) * 5;

        const ctx = document.getElementById('myChart').getContext('2d');
        console.log(ctx)
        
        if (this.weatherChart !== null ) {
          this.weatherChart.destroy();
        }  

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 0, 255, 0.5)');    // Blue for cold temperatures
        gradient.addColorStop(0.25, 'rgba(0, 128, 255, 0.5)'); // Light Blue for cool temperatures
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');  // Cyan for moderate temperatures
        gradient.addColorStop(0.75, 'rgba(255, 255, 0, 0.5)'); // Yellow for warm temperatures
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.5)');     // Red for hot temperatures

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        console.log(this.weatherChart)

        this.weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'temperature',
                data: temps,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: gradient,
                fill: true,
                borderWidth: 1
              }]
            },
          options: {
            responsive: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Days from Now'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    min: minYAxisValue,
                    max: maxYAxisValue
                }
            }
        }
          });
          console.log(this.weatherChart) 
    }
};

document.querySelector("#search-button").addEventListener("click", function(event) {
    event.preventDefault();
    weather.search();
});

weather.fetchCurrentWeather("potsdam");
