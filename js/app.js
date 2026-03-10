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

function save() {
  localStorage.setItem('lpm-garden', JSON.stringify(myG));
  updCounts();
}

function toggle(id) {
  const i = myG.indexOf(id);
  if (i === -1) myG.push(id);
  else myG.splice(i, 1);
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
    case 'planner': renderPlanner(); break;
    case 'journal': renderJournal(); break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => goTo(tab.dataset.page));
  });
  updCounts();
  renderDash();
  loadWeather();
  registerSW();
});

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

// ═══════ EXPORT PLAN ═══════
function exportPlan() {
  const plot = document.getElementById('plPlot');
  if (!plot) return;

  // Use canvas to capture
  const rect = plot.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Draw background
  ctx.fillStyle = '#e8f5e9';
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Draw grid
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  const cellW = rect.width / gridCols;
  const cellH = rect.height / gridRows;
  for (let i = 0; i <= gridCols; i++) {
    ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, rect.height); ctx.stroke();
  }
  for (let i = 0; i <= gridRows; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(rect.width, i * cellH); ctx.stroke();
  }

  // Draw zones
  (pl.zones || []).forEach(z => {
    const zt = typeof ZONE_TYPES !== 'undefined' ? ZONE_TYPES[z.type] : null;
    const zx = z.c1 * cellW, zy = z.r1 * cellH;
    const zw = (z.c2 - z.c1 + 1) * cellW, zh = (z.r2 - z.r1 + 1) * cellH;
    ctx.fillStyle = zt ? zt.bg : 'rgba(255,235,59,0.2)';
    ctx.fillRect(zx, zy, zw, zh);
    ctx.strokeStyle = zt ? zt.border.replace(/2px (solid|dashed) /, '') : '#f9a825';
    ctx.lineWidth = 2;
    if (z.type === 'serre') ctx.setLineDash([6, 3]);
    else ctx.setLineDash([]);
    ctx.strokeRect(zx, zy, zw, zh);
    ctx.setLineDash([]);
    ctx.fillStyle = zt ? zt.color : '#f57f17';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${zt ? zt.emoji + ' ' + zt.label : '🏠 Serre'}`, zx + zw / 2, zy + zh / 2 + 4);
  });

  // Draw plants
  pl.placements.forEach(p => {
    const plant = plantById(p.id);
    if (!plant) return;
    const x = (p.col + 0.5) * cellW;
    const y = (p.row + 0.5) * cellH;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plant.e, x, y);
  });

  // Title
  ctx.fillStyle = '#2d3436';
  ctx.font = 'bold 14px Nunito, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Le Potager Malin — ${pl.width}m × ${pl.length}m`, 8, 16);

  // Download
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `potager-${pl.width}x${pl.length}m.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
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
