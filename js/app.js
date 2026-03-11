// ============================
// 🌱 LE POTAGER MALIN — APP
// ============================

const NOW = new Date().getMonth();
const TODAY = new Date();
const NOW_H = NOW * 2 + (TODAY.getDate() > 15 ? 1 : 0);

// ═══════ UTILS ═══════
function inR(ranges, idx) {
  return ranges.some(([s, e]) => idx >= s && idx <= e);
}

function halfLabel(idx) {
  const m = Math.floor(idx / 2);
  return (idx % 2 === 0 ? 'Début ' : 'Fin ') + MN[m];
}

function getCompanion(idA, idB) {
  for (const [a, b, v] of COMPANIONS) {
    if ((a === idA && b === idB) || (a === idB && b === idA)) return v;
  }
  return 0;
}

function getCompanionsFor(id) {
  const good = [], bad = [];
  for (const [a, b, v] of COMPANIONS) {
    if (a === id) { v > 0 ? good.push(b) : bad.push(b); }
    else if (b === id) { v > 0 ? good.push(a) : bad.push(a); }
  }
  return { good, bad };
}

function plantById(id) {
  return PLANTS.find(p => p.id === id);
}

// ═══════ STATE ═══════
let myG = JSON.parse(localStorage.getItem('lpm-garden') || '[]');
let _syncTimer = null;
let gardenCode = localStorage.getItem('lpm-code') || '';

function save() {
  localStorage.setItem('lpm-garden', JSON.stringify(myG));
  updCounts();
  syncToServer();
}

// ═══════ CLOUD SYNC (per-garden) ═══════
function syncToServer() {
  if (!gardenCode) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    const j = JSON.parse(localStorage.getItem('lpm-journal') || '[]');
    const t = JSON.parse(localStorage.getItem('lpm-tasks') || '{}');
    fetch(`/api/garden/${gardenCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ garden: myG, journal: j, tasks: t })
    }).catch(() => {});
  }, 500);
}

function syncFromServer() {
  if (!gardenCode) return Promise.resolve();
  return fetch(`/api/garden/${gardenCode}`)
    .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
    .then(data => {
      if (Array.isArray(data.garden)) {
        myG = data.garden;
        localStorage.setItem('lpm-garden', JSON.stringify(myG));
      }
      if (Array.isArray(data.journal)) {
        localStorage.setItem('lpm-journal', JSON.stringify(data.journal));
        if (typeof journal !== 'undefined') journal = data.journal;
      }
      if (data.tasks && typeof data.tasks === 'object') {
        localStorage.setItem('lpm-tasks', JSON.stringify(data.tasks));
      }
      updCounts();
    })
    .catch(() => {});
}

// ═══════ GARDEN SETUP (create / join) ═══════
function showGardenSetup() {
  const main = document.getElementById('gardenSetup');
  if (!main) return;
  main.style.display = 'flex';
  document.querySelector('nav').style.display = 'none';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('selBar').style.display = 'none';
  document.querySelector('footer').style.display = 'none';

  main.innerHTML = `
    <div class="gs-card">
      <div class="gs-icon">🌱</div>
      <h1>Le Potager Malin</h1>
      <p class="gs-sub">Planifie ton potager a plusieurs, gratuitement</p>

      <div class="gs-section">
        <h3>Creer un nouveau jardin</h3>
        <input type="text" id="gsName" class="gs-input" placeholder="Nom du jardin (ex: Potager de Gaetan)" maxlength="50">
        <button class="btn btn-full" onclick="createGarden()">Creer mon jardin</button>
      </div>

      <div class="gs-divider"><span>ou</span></div>

      <div class="gs-section">
        <h3>Rejoindre un jardin existant</h3>
        <input type="text" id="gsCode" class="gs-input" placeholder="Code du jardin (ex: A1B2C3)" maxlength="6" style="text-transform:uppercase;text-align:center;font-size:1.2rem;letter-spacing:4px">
        <button class="btn btn-secondary btn-full" onclick="joinGarden()">Rejoindre</button>
      </div>
    </div>`;
}

function createGarden() {
  const name = document.getElementById('gsName').value.trim() || 'Mon Potager';
  fetch('/api/garden/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
    .then(r => r.json())
    .then(data => {
      gardenCode = data.code;
      localStorage.setItem('lpm-code', gardenCode);
      localStorage.setItem('lpm-garden-name', data.name);
      // Push current local data to the new garden
      syncToServer();
      hideGardenSetup();
      showToast(`Jardin cree ! Code : ${gardenCode}`, 'success', 4000);
    })
    .catch(() => showToast('Erreur de connexion', 'warn'));
}

function joinGarden() {
  const code = document.getElementById('gsCode').value.trim().toUpperCase();
  if (!code || code.length < 4) { showToast('Entre un code valide', 'warn'); return; }

  fetch(`/api/garden/${code}`)
    .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
    .then(data => {
      gardenCode = code;
      localStorage.setItem('lpm-code', code);
      localStorage.setItem('lpm-garden-name', data.name || 'Jardin partage');
      // Load server data
      if (Array.isArray(data.garden)) {
        myG = data.garden;
        localStorage.setItem('lpm-garden', JSON.stringify(myG));
      }
      if (Array.isArray(data.journal)) {
        localStorage.setItem('lpm-journal', JSON.stringify(data.journal));
        if (typeof journal !== 'undefined') journal = data.journal;
      }
      if (data.tasks) localStorage.setItem('lpm-tasks', JSON.stringify(data.tasks));
      hideGardenSetup();
      showToast(`Connecte a "${data.name || 'Jardin'}" !`, 'success');
    })
    .catch(() => showToast('Jardin introuvable, verifie le code', 'warn'));
}

function hideGardenSetup() {
  const s = document.getElementById('gardenSetup');
  if (s) s.style.display = 'none';
  document.querySelector('nav').style.display = '';
  document.getElementById('selBar').style.display = '';
  document.querySelector('footer').style.display = '';
  updCounts();
  goTo('dashboard');
}

function leaveGarden() {
  if (!confirm('Quitter ce jardin ? Tu pourras le rejoindre a nouveau avec le code.')) return;
  gardenCode = '';
  localStorage.removeItem('lpm-code');
  localStorage.removeItem('lpm-garden-name');
  myG = [];
  localStorage.setItem('lpm-garden', '[]');
  localStorage.setItem('lpm-journal', '[]');
  localStorage.setItem('lpm-tasks', '{}');
  if (typeof journal !== 'undefined') journal = [];
  showGardenSetup();
}

function copyGardenCode() {
  if (!gardenCode) return;
  navigator.clipboard.writeText(gardenCode).then(() => {
    showToast('Code copie !', 'success');
  }).catch(() => {
    showToast(gardenCode, 'success', 4000);
  });
}

function toggle(id) {
  const i = myG.indexOf(id);
  const p = plantById(id);
  if (i === -1) {
    myG.push(id);
    if (p) showToast(`${p.e} ${p.n} ajouté !`, 'success');
  } else {
    myG.splice(i, 1);
    if (p) showToast(`${p.e} ${p.n} retiré`);
  }
  save();
}

function updCounts() {
  document.getElementById('navCount').textContent = myG.length;
  const bar = document.getElementById('selBar');
  if (bar) bar.classList.toggle('visible', myG.length > 0 && currentPage === 'selection');
  document.getElementById('selInfo').textContent =
    `${myG.length} plante${myG.length > 1 ? 's' : ''}`;
}

// ═══════ NAVIGATION ═══════
let currentPage = 'dashboard';

function goTo(pg) {
  currentPage = pg;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const tab = document.querySelector(`[data-page="${pg}"]`);
  if (tab) tab.classList.add('active');
  document.getElementById('page-' + pg).classList.add('active');
  updCounts();

  switch (pg) {
    case 'dashboard': renderDash(); break;
    case 'selection': renderSel(); break;
    case 'calendar': renderCal(); break;
    case 'encyclo': renderEnc(); break;
    case 'journal': renderJournal(); break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => goTo(tab.dataset.page));
  });

  // Check if user has a garden
  if (!gardenCode) {
    showGardenSetup();
    loadWeather();
    registerSW();
    return;
  }

  // Load from server first, then render
  syncFromServer().then(() => {
    updCounts();
    renderDash();
  });
  loadWeather();
  registerSW();

  // Re-sync when user comes back to the tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && gardenCode) {
      syncFromServer().then(() => {
        updCounts();
        if (currentPage === 'dashboard') renderDash();
        else if (currentPage === 'journal') renderJournal();
      });
    }
  });
});

// ═══════ TOAST NOTIFICATIONS ═══════
function showToast(msg, type = '', duration = 2200) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ═══════ PWA — SERVICE WORKER ═══════
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// ═══════ WEATHER WIDGET ═══════
function loadWeather() {
  const w = document.getElementById('weatherWidget');
  if (!w) return;

  // Try to get user location
  if (!navigator.geolocation) {
    w.innerHTML = '';
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    // Open-Meteo: free, no API key needed
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3`)
      .then(r => r.json())
      .then(data => renderWeather(data, w))
      .catch(() => { w.innerHTML = ''; });
  }, () => {
    // Fallback: Paris
    fetch('https://api.open-meteo.com/v1/forecast?latitude=48.86&longitude=2.35&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=3')
      .then(r => r.json())
      .then(data => renderWeather(data, w))
      .catch(() => { w.innerHTML = ''; });
  });
}

function renderWeather(data, w) {
  if (!data.current) { w.innerHTML = ''; return; }

  const cur = data.current;
  const wmo = weatherIcon(cur.weather_code);
  const temp = Math.round(cur.temperature_2m);
  const humidity = cur.relative_humidity_2m;
  const wind = Math.round(cur.wind_speed_10m);

  // Frost warning
  const minTemps = data.daily?.temperature_2m_min || [];
  const frostDays = minTemps.filter(t => t <= 2);
  const rainDays = (data.daily?.precipitation_sum || []).filter(p => p > 1);

  // Gardening tips based on weather
  let tips = [];
  if (temp < 5) tips.push('🥶 Trop froid pour les semis en pleine terre');
  else if (temp < 10) tips.push('🧊 Attention, sol encore frais — protège tes semis');
  if (frostDays.length) tips.push(`⚠️ Risque de gel dans les ${frostDays.length > 1 ? 'prochains jours' : 'prochaines heures'} !`);
  if (humidity > 85) tips.push('💧 Humidité élevée — surveille le mildiou');
  if (wind > 40) tips.push('💨 Vent fort — protège les tuteurs');
  if (rainDays.length === 0 && temp > 20) tips.push('☀️ Sec et chaud — arrose le matin tôt');
  if (temp > 15 && temp < 25 && !frostDays.length) tips.push('👌 Conditions idéales pour le potager !');

  // 3-day forecast
  const forecast = (data.daily?.time || []).slice(0, 3).map((date, i) => {
    const d = new Date(date);
    const dayName = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()];
    return `<div class="w-forecast-day">
      <span class="w-day-name">${i === 0 ? "Auj." : dayName}</span>
      <span class="w-day-temps">${Math.round(data.daily.temperature_2m_min[i])}° / ${Math.round(data.daily.temperature_2m_max[i])}°</span>
      ${data.daily.precipitation_sum[i] > 0 ? `<span class="w-day-rain">🌧 ${data.daily.precipitation_sum[i].toFixed(1)}mm</span>` : '<span class="w-day-rain">☀️</span>'}
    </div>`;
  }).join('');

  w.innerHTML = `<div class="weather-card ${frostDays.length ? 'weather-frost' : ''}">
    <div class="w-current">
      <span class="w-icon">${wmo}</span>
      <span class="w-temp">${temp}°C</span>
      <span class="w-details">💧 ${humidity}% · 💨 ${wind} km/h</span>
    </div>
    <div class="w-forecast">${forecast}</div>
    ${tips.length ? `<div class="w-tips">${tips.map(t => `<div class="w-tip">${t}</div>`).join('')}</div>` : ''}
  </div>`;
}

function weatherIcon(code) {
  if (code <= 1) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '☁️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '⛈️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

// ═══════ SHARED RENDER HELPERS ═══════
function miniBar24(p) {
  return `<div class="mini-bar">${Array.from({ length: 24 }, (_, i) => {
    let cl = 'mc';
    if (inR(p.sow, i)) cl += ' sow';
    else if (inR(p.plant, i)) cl += ' plant';
    else if (inR(p.harvest, i)) cl += ' harvest';
    if (i === NOW_H) cl += ' now';
    return `<div class="${cl}"></div>`;
  }).join('')}</div>`;
}

function hbar(ranges, cls) {
  if (!ranges.length) return '';
  return `<div class="hbar">${Array.from({ length: 24 }, (_, i) =>
    `<div class="hc ${inR(ranges, i) ? cls : ''} ${i === NOW_H ? 'now' : ''}" title="${halfLabel(i)}"></div>`
  ).join('')}</div>`;
}

function monthLabels() {
  return `<div class="hbar-months">${MS.map(m => `<span>${m}</span>`).join('')}</div>`;
}

function actionTags(p) {
  const tags = [];
  if (inR(p.sow, NOW_H)) tags.push('<span class="tag sow">🌰 Semer</span>');
  if (inR(p.plant, NOW_H)) tags.push('<span class="tag plant">🌱 Planter</span>');
  if (inR(p.harvest, NOW_H)) tags.push('<span class="tag harvest">🧺 Récolter</span>');
  if (!tags.length) tags.push('<span class="tag rest">😴 Rien</span>');
  return tags.join('');
}
