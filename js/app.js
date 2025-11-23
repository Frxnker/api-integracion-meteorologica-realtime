const apiKey = '7e50bc34948a127770dae194c3045e04'; // Tu clave API de OpenWeather

document.getElementById('currentWeatherBtn').addEventListener('click', getCurrentWeather);
document.getElementById('forecastWeatherBtn').addEventListener('click', getWeatherForecast);

function getCurrentWeather() {
  const city = document.getElementById('city').value;
  if (city === '') {
    alert('Por favor, introduce una ciudad');
    return;
  }

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=es&appid=${apiKey}`)
    .then(response => response.json())
    .then(data => displayCurrentWeather(data))
    .catch(error => console.error('Error:', error));
}

function displayCurrentWeather(data) {
  const { name, sys, coord, main, weather } = data;
  const weatherInfo = `
        <h2>Tiempo Actual en ${name}, ${sys.country}</h2>
        <p><strong>Coordenadas:</strong> Latitud ${coord.lat}, Longitud ${coord.lon}</p>
        <p><strong>Temperatura:</strong> ${main.temp} °C</p>
        <p><strong>Sensación Térmica:</strong> ${main.feels_like} °C</p>
        <p><strong>Temperatura Mínima:</strong> ${main.temp_min} °C</p>
        <p><strong>Temperatura Máxima:</strong> ${main.temp_max} °C</p>
        <p><strong>Presión:</strong> ${main.pressure} hPa</p>
        <p><strong>Humedad:</strong> ${main.humidity} %</p>
        <p><strong>Descripción:</strong> ${weather[0].description}</p>
        <img src="http://openweathermap.org/img/wn/${weather[0].icon}.png" alt="Icono del tiempo">
    `;
  document.getElementById('result').innerHTML = weatherInfo;
}

function getWeatherForecast() {
  const city = document.getElementById('city').value;
  const days = 5; // Aquí puedes modificar para que el usuario seleccione el número de días

  if (city === '') {
    alert('Por favor, introduce una ciudad');
    return;
  }

  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=es&cnt=${days * 8}&appid=${apiKey}`)
    .then(response => response.json())
    .then(data => displayWeatherForecast(data))
    .catch(error => console.error('Error:', error));
}

function displayWeatherForecast(data) {
  const { city, list } = data;
  let forecastInfo = `
        <h2>Predicción del Tiempo en ${city.name}, ${city.country}</h2>
        <p><strong>Coordenadas:</strong> Latitud ${city.coord.lat}, Longitud ${city.coord.lon}</p>
    `;

  list.forEach(forecast => {
    const { dt_txt, main, weather, clouds, wind } = forecast;
    forecastInfo += `
            <h3>${dt_txt}</h3>
            <p><strong>Temperatura:</strong> ${main.temp} °C</p>
            <p><strong>Sensación Térmica:</strong> ${main.feels_like} °C</p>
            <p><strong>Temperatura Mínima:</strong> ${main.temp_min} °C</p>
            <p><strong>Temperatura Máxima:</strong> ${main.temp_max} °C</p>
            <p><strong>Presión:</strong> ${main.pressure} hPa</p>
            <p><strong>Humedad:</strong> ${main.humidity} %</p>
            <p><strong>Descripción:</strong> ${weather[0].description}</p>
            <img src="http://openweathermap.org/img/wn/${weather[0].icon}.png" alt="Icono del tiempo">
            <p><strong>Nubes:</strong> ${clouds.all} %</p>
            <p><strong>Velocidad del Viento:</strong> ${wind.speed} m/s</p>
            <p><strong>Dirección del Viento:</strong> ${wind.deg} °</p>
        `;
  });

  document.getElementById('result').innerHTML = forecastInfo;
}
