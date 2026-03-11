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
let stages = JSON.parse(localStorage.getItem('lpm-stages') || '{}');
// inventory = { "tomate": 5, "basilic": 3, ... } — qty owned per plant
let inventory = JSON.parse(localStorage.getItem('lpm-inventory') || '{}');
// Migrate old array format → object
if (Array.isArray(inventory)) {
  const obj = {};
  inventory.forEach(id => { obj[id] = 1; });
  inventory = obj;
  localStorage.setItem('lpm-inventory', JSON.stringify(inventory));
}
let _syncTimer = null;
let gardenCode = localStorage.getItem('lpm-code') || '';

// ═══════ STAGES — Suivi des étapes par plante ═══════
// stages = { "tomate": { sow: "2026-03-15", plant: "2026-05-20", harvest: "2026-07-15" }, ... }
function getStages() { return stages; }
function setStage(plantId, stage, date) {
  if (!stages[plantId]) stages[plantId] = {};
  if (stages[plantId][stage] === date) {
    delete stages[plantId][stage]; // toggle off
    if (!Object.keys(stages[plantId]).length) delete stages[plantId];
  } else {
    stages[plantId][stage] = date || TODAY.toISOString().slice(0, 10);
  }
  localStorage.setItem('lpm-stages', JSON.stringify(stages));
  syncToServer();
}
function getPlantStage(plantId) { return stages[plantId] || {}; }

// ═══════ INVENTORY — Inventaire graines/plants ═══════
function getInventory() { return inventory; }
function setInventoryQty(plantId, qty) {
  qty = parseFloat(qty) || 0;
  if (qty <= 0) {
    delete inventory[plantId];
  } else {
    inventory[plantId] = qty;
  }
  localStorage.setItem('lpm-inventory', JSON.stringify(inventory));
  syncToServer();
}
function getInventoryQty(plantId) { return inventory[plantId] || 0; }
function hasInInventory(plantId) { return (inventory[plantId] || 0) > 0; }

// ═══════ EXPORT / IMPORT ═══════
function exportGardenData() {
  const data = {
    exportDate: new Date().toISOString(),
    gardenName: localStorage.getItem('lpm-garden-name') || 'Mon Potager',
    gardenCode: gardenCode,
    garden: myG,
    journal: JSON.parse(localStorage.getItem('lpm-journal') || '[]'),
    tasks: JSON.parse(localStorage.getItem('lpm-tasks') || '{}'),
    stages: stages,
    inventory: inventory,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `potager-${gardenCode || 'local'}-${TODAY.toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Sauvegarde téléchargée !', 'success');
}

function importGardenData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.garden)) { myG = data.garden; localStorage.setItem('lpm-garden', JSON.stringify(myG)); }
      if (Array.isArray(data.journal)) { localStorage.setItem('lpm-journal', JSON.stringify(data.journal)); if (typeof journal !== 'undefined') journal = data.journal; }
      if (data.tasks) localStorage.setItem('lpm-tasks', JSON.stringify(data.tasks));
      if (data.stages) { stages = data.stages; localStorage.setItem('lpm-stages', JSON.stringify(stages)); }
      if (data.inventory && typeof data.inventory === 'object' && !Array.isArray(data.inventory)) {
        inventory = data.inventory; localStorage.setItem('lpm-inventory', JSON.stringify(inventory));
      } else if (Array.isArray(data.inventory)) {
        inventory = {}; data.inventory.forEach(id => { inventory[id] = 1; });
        localStorage.setItem('lpm-inventory', JSON.stringify(inventory));
      }
      syncToServer();
      updCounts();
      goTo('dashboard');
      showToast('Données importées !', 'success');
    } catch { showToast('Fichier invalide', 'warn'); }
  };
  reader.readAsText(file);
}

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
    const s = JSON.parse(localStorage.getItem('lpm-stages') || '{}');
    const inv = JSON.parse(localStorage.getItem('lpm-inventory') || '{}');
    fetch(`/api/garden/${gardenCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ garden: myG, journal: j, tasks: t, stages: s, inventory: inv })
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
      if (data.stages && typeof data.stages === 'object') {
        stages = data.stages;
        localStorage.setItem('lpm-stages', JSON.stringify(data.stages));
      }
      if (data.inventory && typeof data.inventory === 'object' && !Array.isArray(data.inventory)) {
        inventory = data.inventory;
        localStorage.setItem('lpm-inventory', JSON.stringify(data.inventory));
      } else if (Array.isArray(data.inventory)) {
        inventory = {}; data.inventory.forEach(id => { inventory[id] = 1; });
        localStorage.setItem('lpm-inventory', JSON.stringify(inventory));
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

  const savedCity = localStorage.getItem('lpm-city') || '';

  main.innerHTML = `
    <div class="gs-card">
      <div class="gs-icon">🌱</div>
      <h1>Le Potager Malin</h1>
      <p class="gs-sub">Planifie ton potager a plusieurs, gratuitement</p>

      <div class="gs-section">
        <h3>Creer un nouveau jardin</h3>
        <input type="text" id="gsName" class="gs-input" placeholder="Nom du jardin (ex: Potager de Gaetan)" maxlength="50">
        <input type="text" id="gsCity" class="gs-input" placeholder="📍 Ta ville (ex: Lyon, Bordeaux, Paris)" value="${savedCity}" maxlength="80">
        <p class="gs-city-hint">Pour une meteo et des conseils adaptes a ta region</p>
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
  const city = document.getElementById('gsCity')?.value.trim() || '';

  // Save city for weather geolocation
  if (city) {
    localStorage.setItem('lpm-city', city);
    geocodeCity(city);
  }

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
      syncToServer();
      hideGardenSetup();
      showSaveCodeWarning(gardenCode);
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
      if (Array.isArray(data.garden)) {
        myG = data.garden;
        localStorage.setItem('lpm-garden', JSON.stringify(myG));
      }
      if (Array.isArray(data.journal)) {
        localStorage.setItem('lpm-journal', JSON.stringify(data.journal));
        if (typeof journal !== 'undefined') journal = data.journal;
      }
      if (data.tasks) localStorage.setItem('lpm-tasks', JSON.stringify(data.tasks));
      if (data.stages) { stages = data.stages; localStorage.setItem('lpm-stages', JSON.stringify(data.stages)); }
      if (data.inventory && typeof data.inventory === 'object' && !Array.isArray(data.inventory)) {
        inventory = data.inventory; localStorage.setItem('lpm-inventory', JSON.stringify(data.inventory));
      } else if (Array.isArray(data.inventory)) {
        inventory = {}; data.inventory.forEach(id => { inventory[id] = 1; });
        localStorage.setItem('lpm-inventory', JSON.stringify(inventory));
      }
      hideGardenSetup();
      showSaveCodeWarning(code);
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
  localStorage.setItem('lpm-stages', '{}');
  localStorage.setItem('lpm-inventory', '{}');
  stages = {};
  inventory = {};
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

// ═══════ SAVE CODE WARNING ═══════
function showSaveCodeWarning(code) {
  if (localStorage.getItem('lpm-save-warned')) return;
  localStorage.setItem('lpm-save-warned', '1');

  const overlay = document.createElement('div');
  overlay.className = 'save-warning-overlay';
  overlay.innerHTML = `
    <div class="save-warning-card">
      <div class="save-warning-icon">🔑</div>
      <h2>Note bien ton code !</h2>
      <div class="save-warning-code" onclick="navigator.clipboard.writeText('${code}').then(()=>this.textContent='Copie !')">${code}</div>
      <p>C'est la <strong>seule clé</strong> pour retrouver ton potager.<br>
      Sans ce code, tes données seront perdues si tu changes de navigateur ou vides tes cookies.</p>
      <div class="save-warning-tips">
        <div>📱 Fais une capture d'écran</div>
        <div>📝 Note-le quelque part</div>
        <div>📤 Partage-le pour jardiner à plusieurs</div>
      </div>
      <button class="btn btn-full" onclick="this.closest('.save-warning-overlay').remove()">J'ai noté mon code</button>
    </div>`;
  document.body.appendChild(overlay);
}

// ═══════ GEOLOCATION — City to coordinates ═══════
function geocodeCity(city) {
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`)
    .then(r => r.json())
    .then(data => {
      if (data.results && data.results.length) {
        const r = data.results[0];
        localStorage.setItem('lpm-lat', r.latitude);
        localStorage.setItem('lpm-lon', r.longitude);
        localStorage.setItem('lpm-city', r.name);
        loadWeather(); // Reload weather with new location
      }
    })
    .catch(() => {});
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

  // Init dark mode
  initDarkMode();

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

// ═══════ DARK MODE ═══════
function initDarkMode() {
  const saved = localStorage.getItem('lpm-dark');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === '1' || (saved === null && prefersDark)) {
    document.documentElement.classList.add('dark');
    updateDarkToggle(true);
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('lpm-dark', isDark ? '1' : '0');
  updateDarkToggle(isDark);
}

function updateDarkToggle(isDark) {
  const btn = document.querySelector('.dark-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// ═══════ PWA — SERVICE WORKER ═══════
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// ═══════ WEATHER WIDGET ═══════
let _weatherData = null; // Store weather data for dashboard tips

function loadWeather() {
  const w = document.getElementById('weatherWidget');
  if (!w) return;

  const savedLat = localStorage.getItem('lpm-lat');
  const savedLon = localStorage.getItem('lpm-lon');

  if (savedLat && savedLon) {
    // Use saved location
    fetchWeather(savedLat, savedLon, w);
    return;
  }

  // Try geolocation API
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      localStorage.setItem('lpm-lat', pos.coords.latitude);
      localStorage.setItem('lpm-lon', pos.coords.longitude);
      fetchWeather(pos.coords.latitude, pos.coords.longitude, w);
    }, () => {
      // Fallback: Paris
      fetchWeather(48.86, 2.35, w);
    });
  } else {
    fetchWeather(48.86, 2.35, w);
  }
}

function fetchWeather(lat, lon, w) {
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=4`)
    .then(r => r.json())
    .then(data => {
      _weatherData = data;
      renderWeather(data, w);
    })
    .catch(() => { w.innerHTML = ''; });
}

function renderWeather(data, w) {
  if (!data.current) { w.innerHTML = ''; return; }

  const cur = data.current;
  const wmo = weatherIcon(cur.weather_code);
  const temp = Math.round(cur.temperature_2m);
  const humidity = cur.relative_humidity_2m;
  const wind = Math.round(cur.wind_speed_10m);
  const isRaining = (cur.precipitation || 0) > 0;
  const city = localStorage.getItem('lpm-city') || '';

  // Daily data
  const minTemps = data.daily?.temperature_2m_min || [];
  const maxTemps = data.daily?.temperature_2m_max || [];
  const precipSums = data.daily?.precipitation_sum || [];
  const precipProbs = data.daily?.precipitation_probability_max || [];
  const frostDays = minTemps.filter(t => t <= 2);
  const rainTomorrow = precipSums[1] > 1;
  const rainToday = precipSums[0] > 1;
  const hotDay = maxTemps[0] > 30;

  // Contextual gardening tips
  let tips = [];

  // Frost warnings (highest priority)
  if (frostDays.length) {
    tips.push(`❄️ Risque de gel ! Rentre les plants fragiles et protege les semis`);
  }
  if (temp < 5) {
    tips.push('🥶 Trop froid pour les semis en pleine terre');
  } else if (temp < 10) {
    tips.push('🧊 Sol encore frais — protege tes semis avec un voile');
  }

  // Rain-based watering advice
  if (isRaining) {
    tips.push('🌧️ Il pleut — pas besoin d\'arroser aujourd\'hui !');
  } else if (rainToday && !isRaining) {
    tips.push('🌧️ Pluie prevue aujourd\'hui — attends avant d\'arroser');
  } else if (rainTomorrow) {
    tips.push('🌧️ Pluie prevue demain — arrosage leger suffit');
  } else if (temp > 25) {
    tips.push('☀️ Chaud et sec — arrose le soir apres 18h, jamais en plein soleil');
  } else if (temp > 20 && precipSums.slice(0,3).every(p => p < 1)) {
    tips.push('☀️ Pas de pluie prevue — pense a arroser regulierement');
  }

  // Heat
  if (hotDay) {
    tips.push('🔥 Canicule ! Paille epais, arrose matin et soir, ombre pour les salades');
  }

  // Humidity / disease
  if (humidity > 85 && temp > 15) {
    tips.push('💧 Humidite elevee — surveille le mildiou sur tomates et pommes de terre');
  }

  // Wind
  if (wind > 40) {
    tips.push('💨 Vent fort — verifie les tuteurs et protege les jeunes plants');
  }

  // Ideal conditions
  if (temp >= 15 && temp <= 25 && !frostDays.length && humidity < 80 && wind < 30 && !isRaining) {
    tips.push('👌 Conditions ideales pour le potager !');
  }

  // 3-day forecast
  const forecast = (data.daily?.time || []).slice(0, 4).map((date, i) => {
    const d = new Date(date);
    const dayName = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()];
    const precip = precipSums[i] || 0;
    const prob = precipProbs[i] || 0;
    return `<div class="w-forecast-day">
      <span class="w-day-name">${i === 0 ? "Auj." : dayName}</span>
      <span class="w-day-temps">${Math.round(data.daily.temperature_2m_min[i])}° / ${Math.round(data.daily.temperature_2m_max[i])}°</span>
      ${precip > 0 ? `<span class="w-day-rain">🌧 ${precip.toFixed(1)}mm</span>` :
        prob > 30 ? `<span class="w-day-rain">🌥 ${prob}%</span>` :
        '<span class="w-day-rain">☀️</span>'}
    </div>`;
  }).join('');

  w.innerHTML = `<div class="weather-card ${frostDays.length ? 'weather-frost' : ''}">
    <div class="w-current">
      <span class="w-icon">${wmo}</span>
      <div class="w-current-info">
        <span class="w-temp">${temp}°C</span>
        <span class="w-details">💧 ${humidity}% · 💨 ${wind} km/h${city ? ` · 📍 ${city}` : ''}</span>
      </div>
      ${!city ? `<button class="w-loc-btn" onclick="promptCity()" title="Changer la ville">📍</button>` : `<button class="w-loc-btn" onclick="promptCity()" title="Changer la ville (${city})">📍</button>`}
    </div>
    <div class="w-forecast">${forecast}</div>
    ${tips.length ? `<div class="w-tips">${tips.map(t => `<div class="w-tip">${t}</div>`).join('')}</div>` : ''}
  </div>`;
}

function promptCity() {
  const current = localStorage.getItem('lpm-city') || '';
  const city = prompt('Entre ta ville pour une meteo adaptee :', current);
  if (city && city.trim()) {
    geocodeCity(city.trim());
    showToast('Localisation mise a jour', 'success');
  }
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
