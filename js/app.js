const apiKey = '7e50bc34948a127770dae194c3045e04'; // Tu clave API de OpenWeather

const form = document.getElementById('searchForm');
const cityInput = document.getElementById('city');
const currentBtn = document.getElementById('currentWeatherBtn');
const forecastBtn = document.getElementById('forecastWeatherBtn');
const resultContainer = document.getElementById('result');
const notification = document.getElementById('notification');
const suggestionChips = document.querySelectorAll('.chip[data-city]');

const emptyStateMarkup = resultContainer.innerHTML;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(pointer: coarse)');

let lastMode = 'current';
let isLoading = false;

currentBtn.addEventListener('click', () => fetchWeather('current'));
forecastBtn.addEventListener('click', () => fetchWeather('forecast'));

// Enter en el campo repite el último tipo de consulta
form.addEventListener('submit', event => {
  event.preventDefault();
  fetchWeather(lastMode);
});

suggestionChips.forEach(chip => {
  chip.addEventListener('click', () => {
    cityInput.value = chip.dataset.city;
    fetchWeather(lastMode);
  });
});

function fetchWeather(mode) {
  if (isLoading) return;

  const city = cityInput.value.trim();
  if (!city) {
    showNotification('Introduce una ciudad antes de realizar la consulta.', 'error');
    cityInput.focus();
    return;
  }

  lastMode = mode;
  toggleLoading(true, mode);
  showNotification(`Cargando datos para ${city}...`, 'loading');
  renderSkeleton();

  const url = mode === 'forecast'
    ? `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&lang=es&cnt=40&appid=${apiKey}`
    : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=es&appid=${apiKey}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(response.status === 404
          ? `No se encontró la ciudad: ${city}`
          : `Error al obtener los datos (código ${response.status}). Inténtalo de nuevo.`);
      }
      return response.json();
    })
    .then(data => {
      if (mode === 'forecast') {
        displayWeatherForecast(data);
      } else {
        displayCurrentWeather(data);
      }
      showNotification('Datos cargados con éxito.', 'success');
      revealResults();
    })
    .catch(error => {
      console.error('Error:', error);
      const message = error instanceof TypeError
        ? 'No se pudo conectar con el servicio. Comprueba tu conexión.'
        : error.message || 'Error al obtener los datos. Inténtalo de nuevo.';
      showNotification(message, 'error');
      resultContainer.innerHTML = emptyStateMarkup;
      document.body.removeAttribute('data-sky');
    })
    .finally(() => toggleLoading(false));
}

function showNotification(message, type = 'info') {
  notification.textContent = message;
  notification.className = `notification is-${type}`;
}

function toggleLoading(loading, mode) {
  isLoading = loading;

  [currentBtn, forecastBtn].forEach(button => {
    const isActive = loading && button.dataset.mode === mode;
    button.disabled = loading;
    button.classList.toggle('is-loading', isActive);
    button.querySelector('.btn-label').textContent = isActive ? 'Cargando...' : button.dataset.label;
  });

  suggestionChips.forEach(chip => { chip.disabled = loading; });
  resultContainer.setAttribute('aria-busy', String(loading));
}

// En una sola columna los resultados quedan debajo del formulario: los acercamos
function revealResults() {
  if (coarsePointer.matches) cityInput.blur();

  const { top } = resultContainer.getBoundingClientRect();
  if (top > window.innerHeight * 0.6) {
    resultContainer.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }
}

function renderSkeleton() {
  resultContainer.innerHTML = `
    <div class="view skeleton" aria-hidden="true">
      <div class="weather-hero">
        <div>
          <span class="sk sk-title"></span>
          <span class="sk sk-text"></span>
        </div>
        <span class="sk sk-temp"></span>
      </div>
      <div class="card">
        <div class="metrics">${'<span class="sk sk-tile"></span>'.repeat(4)}</div>
      </div>
    </div>
  `;
}

function displayCurrentWeather(data) {
  const { name, sys, coord, main, weather, wind = {}, clouds = {}, visibility, dt, timezone = 0 } = data;
  const [sky] = weather;
  const theme = skyTheme(sky);
  const now = localDate(dt, timezone);
  const description = capitalize(sky.description);

  document.body.dataset.sky = theme;

  resultContainer.innerHTML = `
    <div class="view view-current">
      <article class="weather-hero" data-sky="${theme}">
        <header class="hero-top">
          <div class="place">
            <h2 class="place-name">${icons.pin}${escapeHtml(name)}<span class="place-country">${escapeHtml(sys.country || '')}</span></h2>
            <p class="place-meta">${capitalize(formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${formatTime(now)}</p>
          </div>
          <span class="badge">Ahora</span>
        </header>
        <div class="hero-main">
          <div class="hero-reading">
            <p class="temp-now">${Math.round(main.temp)}<span class="temp-unit">°C</span></p>
            <p class="hero-desc">${escapeHtml(description)}</p>
            <p class="hero-range">Máx. ${Math.round(main.temp_max)}° · Mín. ${Math.round(main.temp_min)}°</p>
          </div>
          <img class="hero-icon" src="${iconUrl(sky.icon, 4)}" alt="${escapeHtml(description)}" width="200" height="200">
        </div>
      </article>

      <section class="card">
        <h3 class="card-title">Detalles</h3>
        <div class="metrics">
          ${metric('thermometer', 'Sensación', `${Math.round(main.feels_like)}°`, `Real ${Math.round(main.temp)}°`)}
          ${metric('droplet', 'Humedad', `${main.humidity}%`, meter(main.humidity))}
          ${metric('wind', 'Viento', `${toKmh(wind.speed)} km/h`, windDetail(wind))}
          ${metric('gauge', 'Presión', `${main.pressure} hPa`)}
          ${metric('eye', 'Visibilidad', formatVisibility(visibility))}
          ${metric('cloud', 'Nubosidad', `${clouds.all ?? 0}%`, meter(clouds.all ?? 0))}
          ${metric('sunrise', 'Amanecer', sys.sunrise ? formatTime(localDate(sys.sunrise, timezone)) : '—')}
          ${metric('sunset', 'Atardecer', sys.sunset ? formatTime(localDate(sys.sunset, timezone)) : '—')}
        </div>
        <p class="coords">Coordenadas: ${coord.lat.toFixed(2)}, ${coord.lon.toFixed(2)}</p>
      </section>
    </div>
  `;
}

function displayWeatherForecast(data) {
  const { city, list } = data;
  const timezone = city.timezone || 0;
  const [first] = list;
  const sky = first.weather[0];
  const theme = skyTheme(sky);
  const description = capitalize(sky.description);
  const days = summarizeDays(list, timezone);

  // Escala común para las barras de rango de temperatura
  const low = Math.min(...days.map(day => day.min));
  const high = Math.max(...days.map(day => day.max));
  const span = Math.max(high - low, 1);

  const hours = list.slice(0, 8).map(item => {
    const itemDescription = capitalize(item.weather[0].description);
    return `
      <li class="hour">
        <span class="hour-time">${formatTime(localDate(item.dt, timezone))}</span>
        <img src="${iconUrl(item.weather[0].icon)}" alt="${escapeHtml(itemDescription)}" title="${escapeHtml(itemDescription)}" width="100" height="100" loading="lazy">
        <span class="hour-temp">${Math.round(item.main.temp)}°</span>
        <span class="hour-pop">${popLabel(item.pop)}</span>
      </li>
    `;
  }).join('');

  const dayRows = days.map(day => {
    const dayDescription = capitalize(day.weather.description);
    const from = ((day.min - low) / span) * 100;
    const to = ((day.max - low) / span) * 100;
    return `
      <li class="day">
        <div class="day-when">
          <span class="day-name">${day.label}</span>
          <span class="day-desc">${escapeHtml(dayDescription)}</span>
        </div>
        <div class="day-sky">
          <img src="${iconUrl(day.weather.icon)}" alt="${escapeHtml(dayDescription)}" title="${escapeHtml(dayDescription)}" width="100" height="100" loading="lazy">
          <span class="day-pop">${popLabel(day.pop)}</span>
        </div>
        <span class="day-min" aria-label="Mínima">${Math.round(day.min)}°</span>
        <span class="range" style="--from: ${from.toFixed(1)}%; --to: ${to.toFixed(1)}%" aria-hidden="true"><span></span></span>
        <span class="day-max" aria-label="Máxima">${Math.round(day.max)}°</span>
      </li>
    `;
  }).join('');

  document.body.dataset.sky = theme;

  resultContainer.innerHTML = `
    <div class="view view-forecast">
      <article class="weather-hero" data-sky="${theme}">
        <header class="hero-top">
          <div class="place">
            <h2 class="place-name">${icons.pin}${escapeHtml(city.name)}<span class="place-country">${escapeHtml(city.country || '')}</span></h2>
            <p class="place-meta">Pronóstico para los próximos días</p>
          </div>
          <span class="badge">5 días</span>
        </header>
        <div class="hero-main">
          <div class="hero-reading">
            <p class="temp-now">${Math.round(first.main.temp)}<span class="temp-unit">°C</span></p>
            <p class="hero-desc">${escapeHtml(description)}</p>
            <p class="hero-range">Máx. ${Math.round(days[0].max)}° · Mín. ${Math.round(days[0].min)}°</p>
          </div>
          <img class="hero-icon" src="${iconUrl(sky.icon, 4)}" alt="${escapeHtml(description)}" width="200" height="200">
        </div>
        <h3 class="hero-subtitle">Próximas 24 horas</h3>
        <ol class="hourly">${hours}</ol>
      </article>

      <section class="card">
        <h3 class="card-title">Próximos 5 días</h3>
        <ol class="days">${dayRows}</ol>
        <p class="coords">Coordenadas: ${city.coord.lat.toFixed(2)}, ${city.coord.lon.toFixed(2)}</p>
      </section>
    </div>
  `;
}

// Agrupa las franjas de 3 horas por día local de la ciudad
function summarizeDays(list, timezone) {
  const groups = new Map();
  list.forEach(item => {
    const key = dayKey(localDate(item.dt, timezone));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const nowSeconds = Date.now() / 1000;
  const today = dayKey(localDate(nowSeconds, timezone));
  const tomorrow = dayKey(localDate(nowSeconds + 86400, timezone));
  const distanceToMidday = item => Math.abs(localDate(item.dt, timezone).getUTCHours() - 13);

  return [...groups.entries()].slice(0, 5).map(([key, items]) => {
    const midday = items.reduce((best, item) => (distanceToMidday(item) < distanceToMidday(best) ? item : best));
    let label = capitalize(formatDate(localDate(items[0].dt, timezone), { weekday: 'short', day: 'numeric' }));
    if (key === today) label = 'Hoy';
    else if (key === tomorrow) label = 'Mañana';

    return {
      label,
      min: Math.min(...items.map(item => item.main.temp_min)),
      max: Math.max(...items.map(item => item.main.temp_max)),
      pop: Math.max(...items.map(item => item.pop || 0)),
      weather: { ...midday.weather[0], icon: midday.weather[0].icon.replace('n', 'd') },
    };
  });
}

/* ---------- Utilidades ---------- */

function skyTheme({ id, icon }) {
  const night = icon.endsWith('n');
  if (id >= 200 && id < 300) return 'storm';
  if (id >= 300 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'mist';
  if (id <= 801) return night ? 'clear-night' : 'clear-day';
  return night ? 'clouds-night' : 'clouds-day';
}

// Fecha "de pared" de la ciudad: se lee siempre con getUTC* / timeZone UTC
function localDate(unixSeconds, timezoneOffset) {
  return new Date((unixSeconds + timezoneOffset) * 1000);
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...options }).format(date);
}

function formatTime(date) {
  return formatDate(date, { hour: '2-digit', minute: '2-digit' });
}

function formatVisibility(meters) {
  if (meters == null) return '—';
  return meters >= 10000 ? '10+ km' : `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function toKmh(metersPerSecond = 0) {
  return Math.round(metersPerSecond * 3.6);
}

function compassPoint(degrees) {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return points[Math.round(degrees / 22.5) % 16];
}

function windDetail({ deg, gust }) {
  const parts = [];
  if (deg != null) {
    // La API indica de dónde viene el viento; la flecha apunta hacia dónde va
    parts.push(`<span class="wind-dir"><svg viewBox="0 0 24 24" aria-hidden="true" style="transform: rotate(${deg + 180}deg)"><path d="M12 2 19 21 12 17 5 21z"/></svg>${compassPoint(deg)}</span>`);
  }
  if (gust != null) parts.push(`<span>Ráfagas ${toKmh(gust)} km/h</span>`);
  return parts.join('');
}

function popLabel(pop = 0) {
  return pop >= 0.1 ? `${icons.drop}${Math.round(pop * 100)}%` : '';
}

function iconUrl(code, scale = 2) {
  return `https://openweathermap.org/img/wn/${code}@${scale}x.png`;
}

function metric(iconName, label, value, extra = '') {
  return `
    <div class="metric">
      <p class="metric-label">${icons[iconName]}<span>${label}</span></p>
      <p class="metric-value">${value}</p>
      ${extra ? `<div class="metric-extra">${extra}</div>` : ''}
    </div>
  `;
}

function meter(percent) {
  return `<span class="meter" aria-hidden="true"><span style="--value: ${Math.min(Math.max(percent, 0), 100)}%"></span></span>`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, char => entities[char]);
}

const svg = paths => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;

const icons = {
  pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  drop: svg('<path d="M12 2.7 17.7 8.3a8 8 0 1 1-11.4 0z"/>'),
  thermometer: svg('<path d="M14 14.8V3.5a2.5 2.5 0 0 0-5 0v11.3a4.5 4.5 0 1 0 5 0z"/>'),
  droplet: svg('<path d="M12 2.7 17.7 8.3a8 8 0 1 1-11.4 0z"/>'),
  wind: svg('<path d="M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"/>'),
  gauge: svg('<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>'),
  eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  cloud: svg('<path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'),
  sunrise: svg('<path d="M17 18a5 5 0 0 0-10 0M12 2v7M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4-4 4 4"/>'),
  sunset: svg('<path d="M17 18a5 5 0 0 0-10 0M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4"/>'),
};
