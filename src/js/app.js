const apiKey = '7e50bc34948a127770dae194c3045e04'; // Tu clave API de OpenWeather

const currentBtn = document.getElementById('currentWeatherBtn');
const forecastBtn = document.getElementById('forecastWeatherBtn');
const resultContainer = document.getElementById('result');
const notification = document.getElementById('notification');

currentBtn.addEventListener('click', () => fetchWeather('current'));
forecastBtn.addEventListener('click', () => fetchWeather('forecast'));

function fetchWeather(mode) {
  const city = document.getElementById('city').value.trim();
  if (!city) {
    showNotification('Introduce una ciudad antes de realizar la consulta.', true);
    return;
  }

  toggleLoading(true);
  showNotification(`Cargando datos para ${city}...`);

  const url = mode === 'forecast'
    ? `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&lang=es&cnt=40&appid=${apiKey}`
    : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=es&appid=${apiKey}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`No se encontró la ciudad: ${city}`);
      }
      return response.json();
    })
    .then(data => {
      if (mode === 'forecast') {
        displayWeatherForecast(data);
      } else {
        displayCurrentWeather(data);
      }
      showNotification('Datos cargados con éxito. Desplázate para ver el resultado.');
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification(error.message || 'Error al obtener los datos. Inténtalo de nuevo.', true);
      resultContainer.innerHTML = '';
    })
    .finally(() => toggleLoading(false));
}

function showNotification(message, isError = false) {
  notification.textContent = message;
  notification.classList.remove('hidden');
  notification.style.background = isError ? 'rgba(255, 114, 114, 0.13)' : 'rgba(74,144,226,0.1)';
  notification.style.borderColor = isError ? 'rgba(255, 114, 114, 0.24)' : 'rgba(74,144,226,0.18)';
  notification.style.color = isError ? '#7a1f24' : '#12315f';
}

function toggleLoading(isLoading) {
  currentBtn.disabled = isLoading;
  forecastBtn.disabled = isLoading;
  if (isLoading) {
    currentBtn.textContent = 'Cargando...';
    forecastBtn.textContent = 'Cargando...';
  } else {
    currentBtn.textContent = 'Tiempo Actual';
    forecastBtn.textContent = 'Pronóstico 5 días';
  }
}

function displayCurrentWeather(data) {
  const { name, sys, coord, main, weather } = data;
  const description = weather[0].description;
  const icon = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;

  resultContainer.innerHTML = `
    <article class="result-card">
      <h2>Tiempo actual en ${name}, ${sys.country}</h2>
      <p class="result-summary">${description.charAt(0).toUpperCase() + description.slice(1)}</p>
      <div class="result-grid">
        <div class="weather-metric"><strong>Temperatura</strong>${main.temp} °C</div>
        <div class="weather-metric"><strong>Sensación térmica</strong>${main.feels_like} °C</div>
        <div class="weather-metric"><strong>Humedad</strong>${main.humidity} %</div>
        <div class="weather-metric"><strong>Presión</strong>${main.pressure} hPa</div>
      </div>
      <p><strong>Coordenadas:</strong> ${coord.lat.toFixed(2)}, ${coord.lon.toFixed(2)}</p>
      <img src="${icon}" alt="Icono del tiempo">
    </article>
  `;
}

function displayWeatherForecast(data) {
  const { city, list } = data;
  const icon = `https://openweathermap.org/img/wn/${list[0].weather[0].icon}@2x.png`;
  const summary = list[0].weather[0].description;

  let cards = list.slice(0, 5).map(forecast => {
    const { dt_txt, main, weather, wind, clouds } = forecast;
    return `
      <div class="result-card">
        <h3>${dt_txt}</h3>
        <p class="result-summary">${weather[0].description.charAt(0).toUpperCase() + weather[0].description.slice(1)}</p>
        <div class="result-grid">
          <div class="weather-metric"><strong>Temp.</strong>${main.temp} °C</div>
          <div class="weather-metric"><strong>Sentir</strong>${main.feels_like} °C</div>
          <div class="weather-metric"><strong>Viento</strong>${wind.speed} m/s</div>
          <div class="weather-metric"><strong>Nubes</strong>${clouds.all} %</div>
        </div>
        <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="Icono del tiempo">
      </div>
    `;
  }).join('');

  resultContainer.innerHTML = `
    <article class="result-card">
      <h2>Pronóstico en ${city.name}, ${city.country}</h2>
      <p class="result-summary">${summary.charAt(0).toUpperCase() + summary.slice(1)} durante los próximos días.</p>
      <p><strong>Coordenadas:</strong> ${city.coord.lat.toFixed(2)}, ${city.coord.lon.toFixed(2)}</p>
      <img src="${icon}" alt="Icono del tiempo">
    </article>
    <div class="result-grid">${cards}</div>
  `;
}
