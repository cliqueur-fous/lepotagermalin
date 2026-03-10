// ============================
// PLANNER — Planificateur intelligent v2
// ============================

const CELL_CM = 10; // Each cell = 10cm

// Toast notification (non-blocking replacement for alert)
function showToast(msg, duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:380px';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.style.cssText = 'background:#fff;border-left:4px solid #f0ad4e;border-radius:8px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,.15);font-size:.8rem;line-height:1.4;animation:toastIn .3s ease;cursor:pointer;word-break:break-word';
  toast.innerHTML = msg.replace(/\n/g, '<br>');
  toast.onclick = () => { toast.style.animation = 'toastOut .2s ease forwards'; setTimeout(() => toast.remove(), 200); };
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) { toast.style.animation = 'toastOut .2s ease forwards'; setTimeout(() => toast.remove(), 200); } }, duration);
}
const MARGIN_CELLS = 1; // Border margin

// Zone type definitions
const ZONE_TYPES = {
  serre:   { label: 'Serre',    emoji: '🏠', bg: 'rgba(255,235,59,.18)', border: '2px dashed #f9a825', color: '#f57f17' },
  chemin:  { label: 'Chemin',   emoji: '🚶', bg: 'rgba(160,120,80,.25)', border: '2px solid #8d6e63',  color: '#5d4037' },
  arbre:   { label: 'Arbre',    emoji: '🌳', bg: 'rgba(56,142,60,.22)',  border: '2px solid #388e3c',  color: '#1b5e20' },
  fleurs:  { label: 'Fleurs',   emoji: '🌸', bg: 'rgba(206,147,216,.25)',border: '2px solid #ab47bc',  color: '#6a1b9a' },
  compost: { label: 'Compost',  emoji: '🔲', bg: 'rgba(93,64,55,.25)',   border: '2px solid #4e342e',  color: '#3e2723' }
};

// Bed colors for visual grouping
const BED_COLORS = [
  'rgba(255,183,77,.14)', 'rgba(129,199,132,.14)', 'rgba(100,181,246,.14)',
  'rgba(206,147,216,.14)', 'rgba(255,138,128,.14)', 'rgba(255,241,118,.14)',
  'rgba(128,222,234,.14)', 'rgba(255,171,145,.14)', 'rgba(174,213,129,.14)',
  'rgba(149,117,205,.14)', 'rgba(77,182,172,.14)', 'rgba(240,98,146,.14)'
];

// ═══════ STATE ═══════

let pl = JSON.parse(localStorage.getItem('lpm-planner') || 'null') || {
  width: 4, length: 3,
  zones: [],
  placements: []
};

// Migrate from old format
if (pl.serre && !pl.zones) {
  pl.zones = [{ type: 'serre', r1: pl.serre.r1, c1: pl.serre.c1, r2: pl.serre.r2, c2: pl.serre.c2 }];
  delete pl.serre;
}
if (!Array.isArray(pl.zones)) pl.zones = [];
if (!Array.isArray(pl.placements)) pl.placements = [];
if (!Array.isArray(pl.beds)) pl.beds = [];
if (!pl.width || !pl.length || pl.width < 1 || pl.length < 1) {
  pl = { width: 4, length: 3, zones: [], placements: [] };
}

// ═══════ ZONE OVERLAP CHECK ═══════
// Zones are IMMUTABLE once placed. New zones that overlap are REJECTED.
function zonesOverlap(r1, c1, r2, c2) {
  return pl.zones.some(z => !(r2 < z.r1 || r1 > z.r2 || c2 < z.c1 || c1 > z.c2));
}

let drawMode = false;      // zone drawing
let drawZoneType = null;
let drawStart = null;
let drawEnd = null;
let gridCols = 0, gridRows = 0;
let expandedCare = null;

// Plant drawing mode
let drawPlantMode = false;
let drawPlantId = null;

function savePl() {
  localStorage.setItem('lpm-planner', JSON.stringify(pl));
}

// ═══════ MAIN RENDER ═══════

function renderPlanner() {
  const c = document.getElementById('plannerContent');
  if (!c) return;

  const sel = PLANTS.filter(p => myG.includes(p.id));
  gridCols = Math.round(pl.width * 100 / CELL_CM);
  gridRows = Math.round(pl.length * 100 / CELL_CM);

  const totalArea = pl.width * pl.length;
  const hasSerre = pl.zones.some(z => z.type === 'serre');
  const zonesSummary = pl.zones.length
    ? pl.zones.map(z => {
        const zt = ZONE_TYPES[z.type] || ZONE_TYPES.serre;
        const w = ((z.c2 - z.c1 + 1) * CELL_CM / 100).toFixed(1);
        const h = ((z.r2 - z.r1 + 1) * CELL_CM / 100).toFixed(1);
        return `${zt.emoji} ${zt.label} ${w}×${h}m`;
      }).join(', ')
    : 'Aucune';

  c.innerHTML = `
  <div class="pl-layout">
    <div class="pl-sidebar">
      <!-- DIMENSIONS -->
      <div class="pl-panel">
        <h3>📐 Parcelle</h3>
        <div class="cfg-row">
          <label>Largeur</label>
          <div class="cfg-input"><input type="number" id="plW" value="${pl.width}" min="1" max="20" step="0.5"><span>m</span></div>
        </div>
        <div class="cfg-row">
          <label>Longueur</label>
          <div class="cfg-input"><input type="number" id="plL" value="${pl.length}" min="1" max="20" step="0.5"><span>m</span></div>
        </div>
        <div class="cfg-row">
          <label>Surface</label>
          <div class="cfg-val">${totalArea.toFixed(1)} m²</div>
        </div>
        <button class="btn btn-full" onclick="updateDimensions()">Appliquer</button>
      </div>

      <!-- ZONES -->
      <div class="pl-panel">
        <h3>📍 Zones</h3>
        <div class="pl-zone-btns" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
          ${Object.entries(ZONE_TYPES).map(([key, zt]) => `
            <button class="btn btn-sm-pl ${drawMode && drawZoneType === key ? 'btn-danger' : 'btn-secondary'}"
              onclick="toggleDrawZone('${key}')" title="${zt.label}">
              ${zt.emoji} ${zt.label}
            </button>
          `).join('')}
        </div>
        ${drawMode ? `<p class="pl-hint" style="color:#e65100;font-weight:700">Dessine la zone ${ZONE_TYPES[drawZoneType].emoji} sur la parcelle (cliquer-glisser)</p>` : ''}
        ${pl.zones.length ? `
          <div class="pl-zone-list" style="font-size:.75rem">
            ${pl.zones.map((z, i) => {
              const zt = ZONE_TYPES[z.type] || ZONE_TYPES.serre;
              const w = ((z.c2 - z.c1 + 1) * CELL_CM / 100).toFixed(1);
              const h = ((z.r2 - z.r1 + 1) * CELL_CM / 100).toFixed(1);
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid #eee">
                <span>${zt.emoji} ${zt.label} (${w}×${h}m)</span>
                <button class="btn btn-danger btn-sm-pl" onclick="removeZone(${i})" style="padding:2px 6px;font-size:.65rem">🗑️</button>
              </div>`;
            }).join('')}
          </div>
        ` : '<p class="pl-hint">Aucune zone. Clique un bouton ci-dessus pour dessiner.</p>'}
      </div>

      <!-- PLANTS -->
      <div class="pl-panel">
        <h3>🌱 Mes plantes <span class="pl-count">${sel.length}</span></h3>
        ${drawPlantMode
          ? `<p class="pl-hint" style="color:#e65100;font-weight:700">🌱 Dessine la planche de ${(plantById(drawPlantId)||{}).e||''} ${(plantById(drawPlantId)||{}).n||''} sur la parcelle (cliquer-glisser)</p>
             <button class="btn btn-danger btn-sm-pl" onclick="cancelPlantDraw()" style="margin-bottom:6px">✖ Annuler</button>`
          : !pl.placements.length ? `<p class="pl-hint">Clique une plante ci-dessous puis dessine sa planche sur la parcelle</p>` : ''}
        ${sel.length ? `
          <div class="pl-plant-list">
            ${renderPlantList(sel, hasSerre)}
          </div>
          <div class="pl-auto-section" style="margin-top:10px">
            <div style="font-size:.68rem;font-weight:700;color:var(--muted);margin-bottom:4px">🪄 Placement automatique :</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <button class="btn btn-full btn-sm-pl" onclick="autoPlace('assoc')" title="Groupe les bonnes associations sur la même planche">
                🤝 Planches associées <span style="font-size:.58rem;opacity:.7">(recommandé)</span>
              </button>
              <button class="btn btn-secondary btn-full btn-sm-pl" onclick="autoPlace('mono')" title="Une plante par planche, plus simple">
                🌱 Planches mono-culture
              </button>
              <button class="btn btn-secondary btn-full btn-sm-pl" onclick="autoPlace('rows')" title="En rangs sur toute la largeur">
                📏 Rangs horizontaux
              </button>
            </div>
          </div>
          ${pl.placements.length ? `
            <button class="btn btn-secondary btn-full" onclick="exportPlan()" style="margin-top:6px">📸 Exporter en image</button>
            <button class="btn btn-danger btn-full" onclick="clearPlacements()" style="margin-top:6px">🗑️ Effacer le plan</button>` : ''}
        ` : `<p class="pl-hint">Sélectionne des plantes d'abord</p>
          <button class="btn btn-sm-action" onclick="goTo('selection')">🌱 Choisir</button>`}
      </div>

      <!-- STATS -->
      ${pl.placements.length ? renderPlacementStats() : ''}
    </div>

    <!-- PLOT -->
    <div class="pl-main">
      <div class="pl-plot-wrap">
        <div class="pl-plot" id="plPlot"
          style="aspect-ratio:${gridCols}/${gridRows};height:auto;grid-template-columns:repeat(${gridCols},minmax(0,1fr));grid-template-rows:repeat(${gridRows},minmax(0,1fr));background-image:repeating-linear-gradient(180deg,transparent,transparent calc(100% / ${gridRows} - 1px),rgba(0,0,0,.06) calc(100% / ${gridRows} - 1px),rgba(0,0,0,.06) calc(100% / ${gridRows})),repeating-linear-gradient(90deg,transparent,transparent calc(100% / ${gridCols} - 1px),rgba(0,0,0,.06) calc(100% / ${gridCols} - 1px),rgba(0,0,0,.06) calc(100% / ${gridCols}));"
          onmousedown="plotMouseDown(event)"
          onmousemove="plotMouseMove(event)"
          onmouseup="plotMouseUp(event)"
          ontouchstart="plotTouchStart(event)"
          ontouchmove="plotTouchMove(event)"
          ontouchend="plotTouchEnd(event)">
          ${renderGrid()}
        </div>
        <div class="pl-ruler-x">${rulerX()}</div>
      </div>
      <div class="pl-legend-bar">
        ${drawMode
          ? `${ZONE_TYPES[drawZoneType].emoji} <b>Clique et glisse</b> pour dessiner la zone ${ZONE_TYPES[drawZoneType].label}`
          : drawPlantMode
            ? `🌱 <b>Clique et glisse</b> pour dessiner la planche de ${(plantById(drawPlantId)||{}).e||''} ${(plantById(drawPlantId)||{}).n||''}`
            : pl.placements.length
              ? `🌱 ${pl.placements.length} plants placés · Clique sur un plant pour le retirer`
              : '✏️ Clique une plante dans la liste puis dessine sa planche sur la parcelle'}
      </div>

      <!-- ASSOCIATION TABLE -->
      ${sel.length >= 2 ? `<div class="pl-panel" style="margin-top:14px">
        <h3>🤝 Matrice d'associations</h3>
        ${renderAssocMatrix(sel)}
      </div>` : ''}
    </div>
  </div>`;
}

// ═══════ CARE PANEL ═══════

function toggleCarePanel(plantId) {
  if (expandedCare === plantId) {
    expandedCare = null;
  } else {
    expandedCare = plantId;
  }
  renderPlanner();
}

function renderCarePanel(plantId) {
  if (typeof CARE_DATA === 'undefined' || !CARE_DATA || !CARE_DATA[plantId]) return '';
  const care = CARE_DATA[plantId];
  const fields = [
    { key: 'water',    icon: '💧', label: 'Arrosage' },
    { key: 'sun',      icon: '☀️', label: 'Exposition' },
    { key: 'soil',     icon: '🪨', label: 'Sol' },
    { key: 'pruning',  icon: '✂️', label: 'Taille' },
    { key: 'diseases', icon: '🦠', label: 'Maladies' }
  ];
  const rows = fields
    .filter(f => care[f.key])
    .map(f => `<div style="font-size:.7rem;padding:2px 0;border-bottom:1px solid #f0f0f0">
      <b>${f.icon} ${f.label}:</b> ${care[f.key]}
    </div>`)
    .join('');
  if (!rows) return '';
  return `<div style="background:#fafffe;border:1px solid #c8e6c9;border-radius:8px;padding:8px 10px;margin:4px 0 8px 28px;font-size:.72rem">
    ${rows}
  </div>`;
}

// ═══════ GRID RENDERING ═══════

function renderGrid() {
  let h = '';

  // Bed overlays (colored backgrounds per plant type)
  if (pl.placements.length) {
    const beds = computeBeds();
    beds.forEach(bed => {
      if (!bed.plant) return;
      h += `<div class="pl-bed-overlay" style="
        grid-column:${bed.minC + 1}/${bed.maxC + 2};
        grid-row:${bed.minR + 1}/${bed.maxR + 2};
        background:${bed.color};
      "><span class="pl-bed-label">${bed.plant.e} ${bed.plant.n} <small>(${bed.count})</small></span></div>`;
    });
  }

  // Zone overlays — ALWAYS on top, never displaced by plants
  pl.zones.forEach((z, i) => {
    const zt = ZONE_TYPES[z.type] || ZONE_TYPES.serre;
    const isRound = z.type === 'arbre';
    h += `<div style="
      grid-column:${z.c1 + 1}/${z.c2 + 2};
      grid-row:${z.r1 + 1}/${z.r2 + 2};
      background:${zt.bg};
      border:${zt.border};
      border-radius:${isRound ? '50%' : '6px'};
      display:flex;align-items:center;justify-content:center;
      z-index:8;pointer-events:none;
      overflow:hidden;
    "><span style="font-size:.65rem;font-weight:800;color:${zt.color};background:rgba(255,255,255,.75);padding:1px 6px;border-radius:6px;white-space:nowrap">${zt.emoji} ${zt.label}</span></div>`;
  });

  // Drawing preview
  h += `<div class="pl-draw-preview" id="zonePreview" style="display:none"></div>`;

  // Placed plants
  pl.placements.forEach((p, idx) => {
    const plant = plantById(p.id);
    if (!plant) return;

    // Check for bad neighbor
    let conflict = false;
    pl.placements.forEach((other, oi) => {
      if (oi === idx || other.id === p.id) return;
      if (getCompanion(p.id, other.id) === -1) {
        const dist = Math.sqrt((p.row - other.row) ** 2 + (p.col - other.col) ** 2);
        if (dist < 8) conflict = true;
      }
    });

    h += `<div class="pl-marker ${conflict ? 'pl-conflict' : ''}"
      style="grid-column:${p.col + 1};grid-row:${p.row + 1}"
      onclick="removePlacement(${idx})"
      title="${plant.n}${conflict ? ' ⚠️ Mauvaise association proche !' : ''}">
      ${plant.e}
    </div>`;
  });

  return h;
}

function rulerX() {
  let h = '';
  for (let i = 0; i <= pl.width; i++) {
    h += `<span class="pl-ruler-mark" style="left:${(i / pl.width) * 100}%">${i}m</span>`;
  }
  return h;
}

// ═══════ DIMENSIONS ═══════

function updateDimensions() {
  const w = parseFloat(document.getElementById('plW').value);
  const l = parseFloat(document.getElementById('plL').value);
  if (w > 0 && l > 0 && w <= 20 && l <= 20) {
    const oldW = pl.width, oldL = pl.length;
    pl.width = w;
    pl.length = l;
    // Only clear placements if dimensions actually changed
    if (w !== oldW || l !== oldL) {
      pl.placements = [];
      pl.beds = [];
      // Remove zones that no longer fit in the new grid
      const newCols = Math.round(w / (CELL_CM / 100));
      const newRows = Math.round(l / (CELL_CM / 100));
      pl.zones = pl.zones.filter(z => z.r1 < newRows && z.c1 < newCols);
      // Clamp zone boundaries to new grid
      pl.zones.forEach(z => {
        z.r2 = Math.min(z.r2, newRows - 1);
        z.c2 = Math.min(z.c2, newCols - 1);
      });
    }
    savePl();
    renderPlanner();
  }
}

// ═══════ ZONE DRAWING ═══════

function toggleDrawZone(type) {
  // Cancel plant draw if active
  drawPlantMode = false;
  drawPlantId = null;

  if (drawMode && drawZoneType === type) {
    drawMode = false;
    drawZoneType = null;
  } else {
    drawMode = true;
    drawZoneType = type;
  }
  drawStart = null;
  drawEnd = null;
  renderPlanner();
}

function removeZone(idx) {
  const z = pl.zones[idx];
  // Remove plants that were inside this zone
  if (z) {
    pl.placements = pl.placements.filter(p =>
      !(p.row >= z.r1 && p.row <= z.r2 && p.col >= z.c1 && p.col <= z.c2)
    );
  }
  pl.zones.splice(idx, 1);
  savePl();
  renderPlanner();
}

function getCellFromEvent(e) {
  const plot = document.getElementById('plPlot');
  if (!plot) return null;
  const rect = plot.getBoundingClientRect();
  if (rect.height === 0 || rect.width === 0) return null;
  const clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const col = Math.floor(x / rect.width * gridCols);
  const row = Math.floor(y / rect.height * gridRows);
  return {
    row: Math.max(0, Math.min(row, gridRows - 1)),
    col: Math.max(0, Math.min(col, gridCols - 1))
  };
}

// ═══════ PLANT LIST RENDER ═══════

function renderPlantList(sel, hasSerre) {
  // Priorité serre: solanacées d'abord (tomate, poivron, aubergine, piment, concombre, melon)
  const SERRE_PRIORITY = ['tomate','poivron','aubergine','piment','concombre','melon'];

  function plantItem(p) {
    const comp = getCompanionsFor(p.id);
    const badInSel = comp.bad.filter(id => myG.includes(id));
    const placedCount = pl.placements.filter(x => x.id === p.id).length;
    const isDrawing = drawPlantMode && drawPlantId === p.id;
    const reco = RECOMMENDED_QTY[p.id];
    const overMax = reco && placedCount > reco[1];
    return `<div class="pl-plant-item ${isDrawing ? 'pl-plant-drawing' : ''}" onclick="startPlantDraw('${p.id}')" style="cursor:pointer" title="Cliquer pour dessiner une planche">
      <span class="pl-plant-emoji">${p.e}</span>
      <div class="pl-plant-info">
        <div class="pl-plant-name">${p.n}
          ${placedCount ? `<span style="font-size:.6rem;background:${overMax ? 'var(--warn)' : 'var(--accent)'};color:#fff;padding:0 5px;border-radius:6px;margin-left:3px">${placedCount}${reco ? '/' + reco[1] : ''}</span>` : ''}
        </div>
        <div class="pl-plant-meta">${p.spacing}cm${p.row ? ' × ' + p.row + 'cm rangs' : ''} ${p.serre ? '· 🏠' : ''}
          ${reco && !placedCount ? `<span style="color:var(--muted);font-size:.6rem"> · reco: ${reco[0]}-${reco[1]}</span>` : ''}
          ${badInSel.length ? `<span class="pl-warn">⚠️ ${badInSel.map(id => { const x = plantById(id); return x ? x.e : ''; }).join('')}</span>` : ''}
        </div>
      </div>
      ${placedCount ? `<button class="pl-remove-btn" onclick="event.stopPropagation();removePlantPlacements('${p.id}')" title="Retirer tous les ${p.n}">🗑️</button>` : '<span class="pl-draw-icon">✏️</span>'}
    </div>`;
  }

  // If there's a serre, split into two groups
  if (hasSerre) {
    const serrePlants = sel.filter(p => p.serre).sort((a, b) => {
      const aP = SERRE_PRIORITY.indexOf(a.id), bP = SERRE_PRIORITY.indexOf(b.id);
      if (aP !== -1 && bP !== -1) return aP - bP;
      if (aP !== -1) return -1;
      if (bP !== -1) return 1;
      return a.n.localeCompare(b.n, 'fr');
    });
    const openPlants = sel.filter(p => !p.serre);

    let h = '';
    if (serrePlants.length) {
      h += `<div class="pl-group-label" style="font-size:.65rem;font-weight:800;color:#f57f17;padding:4px 6px;background:#fff8e1;border-radius:6px;margin-bottom:3px">🏠 Recommandé en serre</div>`;
      h += serrePlants.map(plantItem).join('');
    }
    if (openPlants.length) {
      h += `<div class="pl-group-label" style="font-size:.65rem;font-weight:800;color:#155724;padding:4px 6px;background:#d4edda;border-radius:6px;margin:6px 0 3px">🌿 Plein air</div>`;
      h += openPlants.map(plantItem).join('');
    }
    return h;
  }

  return sel.map(plantItem).join('');
}

// ═══════ PLANT DRAWING ═══════

function startPlantDraw(plantId) {
  if (drawPlantMode && drawPlantId === plantId) {
    cancelPlantDraw();
    return;
  }
  drawPlantMode = true;
  drawPlantId = plantId;
  drawMode = false;
  drawZoneType = null;
  drawStart = null;
  drawEnd = null;
  renderPlanner();
}

function cancelPlantDraw() {
  drawPlantMode = false;
  drawPlantId = null;
  drawStart = null;
  drawEnd = null;
  renderPlanner();
}

// Recommended max quantities for a family garden
const RECOMMENDED_QTY = {
  tomate: [6, 12], courgette: [2, 4], concombre: [3, 5], aubergine: [3, 6],
  poivron: [4, 8], piment: [2, 4], melon: [3, 5], pasteque: [2, 3], butternut: [3, 5],
  pdt: [15, 40], salade: [10, 30], haricot: [30, 80], petitpois: [20, 50],
  carotte: [30, 80], radis: [20, 60], oignon: [15, 40], ail: [15, 40],
  echalote: [10, 25], poireau: [15, 40], chou: [6, 12], epinard: [15, 30],
  betterave: [15, 30], navet: [15, 30], celeri: [4, 8], feve: [15, 30],
  fraise: [10, 25], mais: [12, 30], fenouil: [4, 8],
};

function fillBedWithPlant(plantId, r1, c1, r2, c2) {
  const plant = plantById(plantId);
  if (!plant) return;

  // Check if drawn area overlaps existing plants of OTHER types
  const otherPlantsInArea = new Set();
  pl.placements.forEach(p => {
    if (p.id !== plantId && p.row >= r1 && p.row <= r2 && p.col >= c1 && p.col <= c2) {
      otherPlantsInArea.add(p.id);
    }
  });
  if (otherPlantsInArea.size > 0) {
    const names = [...otherPlantsInArea].map(id => { const p = plantById(id); return p ? p.e + ' ' + p.n : id; }).join(', ');
    showToast(`⚠️ Zone déjà occupée par : ${names}\n\nDessine ta planche sur un espace libre.`, 4000);
    return;
  }

  const exclusion = buildExclusionGrid();
  const serreGrid = buildSerreGrid();
  // Build occupied grid (exact cell)
  const occupied = Array.from({ length: gridRows }, () => Array(gridCols).fill(false));
  pl.placements.forEach(p => {
    if (p.row < gridRows && p.col < gridCols) occupied[p.row][p.col] = true;
  });

  // Build "claimed" grid: cells near existing plants of OTHER types are off-limits
  // This prevents different cultures from overlapping/mixing
  const claimed = Array.from({ length: gridRows }, () => Array(gridCols).fill(null));
  pl.placements.forEach(p => {
    if (p.id === plantId) return; // Same plant type can share space
    const otherPlant = plantById(p.id);
    if (!otherPlant) return;
    const buffer = Math.max(2, Math.round(otherPlant.spacing / CELL_CM / 2));
    for (let dr = -buffer; dr <= buffer; dr++) {
      for (let dc = -buffer; dc <= buffer; dc++) {
        const nr = p.row + dr, nc = p.col + dc;
        if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols) {
          claimed[nr][nc] = p.id;
        }
      }
    }
  });

  const spaceCells = Math.max(1, Math.round(plant.spacing / CELL_CM));
  const rowCells = Math.max(1, Math.round((plant.row || plant.spacing * 1.2) / CELL_CM));

  // Check how many already placed
  const alreadyPlaced = pl.placements.filter(p => p.id === plantId).length;
  const reco = RECOMMENDED_QTY[plantId];

  // Determine if this bed is inside a serre
  const isInSerre = serreGrid[r1] && serreGrid[r1][c1];

  let placed = 0;
  for (let r = r1; r <= r2; r += rowCells) {
    for (let c = c1; c <= c2; c += spaceCells) {
      if (r >= gridRows || c >= gridCols) continue;
      // NEVER place on excluded zones (chemin, arbre, compost, fleurs)
      if (exclusion[r][c]) continue;
      if (occupied[r][c]) continue;
      // Don't invade another plant type's bed area
      if (claimed[r][c] && claimed[r][c] !== plantId) continue;
      // If drawing inside serre, only place on serre cells
      // If drawing outside serre, skip serre cells (don't invade serre)
      if (isInSerre && !serreGrid[r][c]) continue;
      if (!isInSerre && serreGrid[r][c]) continue;
      pl.placements.push({ id: plantId, row: r, col: c });
      occupied[r][c] = true;
      placed++;
    }
  }

  // Save the drawn bed surface (fixed boundaries)
  if (placed > 0) {
    pl.beds.push({ id: plantId, r1, c1, r2, c2 });
  }

  if (placed > 0) {
    const totalNow = alreadyPlaced + placed;
    const conflicts = checkBedConflicts(plantId, r1, c1, r2, c2);
    savePl();
    renderPlanner();

    // Build warning messages
    const msgs = [];
    if (conflicts.length) msgs.push(...conflicts);
    if (reco && totalNow > reco[1]) {
      msgs.push(`📊 ${plant.e} ${plant.n} : ${totalNow} pieds placés ! Recommandé : ${reco[0]}-${reco[1]} pour un potager familial.`);
    }

    // Serre advice
    if (isInSerre && !plant.serre) {
      msgs.push(`🏠 ${plant.e} ${plant.n} n'a pas besoin de serre — l'espace serait mieux utilisé pour des plantes frileuses (tomate, poivron, aubergine…)`);
    }
    if (!isInSerre && plant.serre && !plant.id.match(/salade|radis|epinard|mache|roquette|persil|basilic|fraise/)) {
      msgs.push(`💡 ${plant.e} ${plant.n} pousse mieux en serre ! Pense à la placer dans ta zone 🏠 serre si possible.`);
    }

    if (msgs.length) {
      setTimeout(() => showToast(`⚠️ Attention !\n\n${msgs.join('\n\n')}`, 5000), 100);
    }
  } else if (placed === 0) {
    // Nothing placed — likely drew on a zone
    setTimeout(() => showToast(`⚠️ Aucun pied placé !\n\nLa zone dessinée est peut-être sur un chemin, arbre ou autre zone. Dessine ta planche sur une zone libre.`), 100);
  }
}

function checkBedConflicts(plantId, r1, c1, r2, c2) {
  const warnings = [];
  const nearbyPlants = new Set();
  const RANGE = 5; // check 50cm around the bed

  pl.placements.forEach(p => {
    if (p.id === plantId) return;
    if (p.row >= r1 - RANGE && p.row <= r2 + RANGE && p.col >= c1 - RANGE && p.col <= c2 + RANGE) {
      nearbyPlants.add(p.id);
    }
  });

  nearbyPlants.forEach(otherId => {
    if (getCompanion(plantId, otherId) === -1) {
      const other = plantById(otherId);
      const me = plantById(plantId);
      if (other && me) warnings.push(`❌ ${me.e} ${me.n} + ${other.e} ${other.n} = mauvaise association !`);
    }
  });
  return warnings;
}

function plotMouseDown(e) {
  if (!drawMode && !drawPlantMode) return;
  e.preventDefault();
  drawStart = getCellFromEvent(e);
  drawEnd = drawStart;
}

function plotMouseMove(e) {
  if ((!drawMode && !drawPlantMode) || !drawStart) return;
  e.preventDefault();
  drawEnd = getCellFromEvent(e);
  updateZonePreview();
}

function plotMouseUp(e) {
  if ((!drawMode && !drawPlantMode) || !drawStart) return;
  drawEnd = getCellFromEvent(e);
  if (drawEnd) {
    const r1 = Math.min(drawStart.row, drawEnd.row);
    const c1 = Math.min(drawStart.col, drawEnd.col);
    const r2 = Math.max(drawStart.row, drawEnd.row);
    const c2 = Math.max(drawStart.col, drawEnd.col);

    if (r2 - r1 >= 1 && c2 - c1 >= 1) {
      if (drawMode) {
        // Zone drawing — REJECT if overlapping any existing zone
        if (zonesOverlap(r1, c1, r2, c2)) {
          showToast('⚠️ Impossible : cette zone chevauche une zone existante. Supprime d\'abord la zone existante si tu veux la remplacer.', 4000);
          drawMode = false;
          drawZoneType = null;
          drawStart = null;
          drawEnd = null;
          renderPlanner();
          return;
        }
        pl.zones.push({ type: drawZoneType, r1, c1, r2, c2 });
        savePl();
        drawMode = false;
        drawZoneType = null;
      } else if (drawPlantMode) {
        // Plant bed drawing
        fillBedWithPlant(drawPlantId, r1, c1, r2, c2);
        // Stay in plant draw mode for same plant (draw multiple beds)
        drawStart = null;
        drawEnd = null;
        return;
      }
    }
  }
  drawStart = null;
  drawEnd = null;
  if (!drawPlantMode) renderPlanner();
  else renderPlanner();
}

// Touch support
function plotTouchStart(e) {
  if (drawMode || drawPlantMode) { e.preventDefault(); plotMouseDown(e); }
}
function plotTouchMove(e) {
  if (drawMode || drawPlantMode) { e.preventDefault(); plotMouseMove(e); }
}
function plotTouchEnd(e) {
  if (drawMode || drawPlantMode) plotMouseUp(e);
}

function updateZonePreview() {
  const preview = document.getElementById('zonePreview');
  if (!preview || !drawStart || !drawEnd) return;
  const r1 = Math.min(drawStart.row, drawEnd.row);
  const c1 = Math.min(drawStart.col, drawEnd.col);
  const r2 = Math.max(drawStart.row, drawEnd.row);
  const c2 = Math.max(drawStart.col, drawEnd.col);

  preview.style.display = 'block';
  preview.style.gridColumn = `${c1 + 1} / ${c2 + 2}`;
  preview.style.gridRow = `${r1 + 1} / ${r2 + 2}`;

  if (drawMode) {
    const zt = ZONE_TYPES[drawZoneType] || ZONE_TYPES.serre;
    // Check overlap with existing zones
    const hasOverlap = zonesOverlap(r1, c1, r2, c2);
    if (hasOverlap) {
      preview.style.background = 'rgba(255,0,0,.2)';
      preview.style.border = '2px dashed #e74c3c';
      preview.innerHTML = `<span style="font-size:.55rem;font-weight:800;color:#c0392b;background:rgba(255,255,255,.9);padding:2px 5px;border-radius:4px">⛔ Zone occupée — placement impossible</span>`;
    } else {
      preview.style.background = zt.bg;
      preview.style.border = zt.border;
      preview.textContent = '';
    }
  } else if (drawPlantMode) {
    const plant = plantById(drawPlantId);
    // Show size + estimated plant count (accounting for zones)
    const w = ((c2 - c1 + 1) * CELL_CM / 100).toFixed(1);
    const h = ((r2 - r1 + 1) * CELL_CM / 100).toFixed(1);
    const exclusion = buildExclusionGrid();
    const serreGrid = buildSerreGrid();
    const isInSerre = serreGrid[r1] && serreGrid[r1][c1];
    // Check if drawing overlaps a zone
    let hasZoneConflict = false;
    for (let r = r1; r <= r2 && !hasZoneConflict; r++)
      for (let c = c1; c <= c2 && !hasZoneConflict; c++)
        if (r < gridRows && c < gridCols && exclusion[r][c]) hasZoneConflict = true;

    if (hasZoneConflict) {
      preview.style.background = 'rgba(255,0,0,.1)';
      preview.style.border = '2px dashed #e74c3c';
      preview.innerHTML = `<span style="font-size:.6rem;font-weight:800;color:#c0392b;background:rgba(255,255,255,.9);padding:2px 6px;border-radius:4px">⚠️ Zone occupée — les plants s'adapteront</span>`;
    } else {
      preview.style.background = 'rgba(0,184,148,.15)';
      preview.style.border = '2px dashed var(--accent)';
      if (plant) {
        const spaceCells = Math.max(1, Math.round(plant.spacing / CELL_CM));
        const rowCells = Math.max(1, Math.round((plant.row || plant.spacing * 1.2) / CELL_CM));
        // Count actually plantable cells
        let count = 0;
        for (let r = r1; r <= r2; r += rowCells)
          for (let c = c1; c <= c2; c += spaceCells)
            if (r < gridRows && c < gridCols && !exclusion[r][c] &&
                (isInSerre ? serreGrid[r][c] : !serreGrid[r][c])) count++;
        preview.innerHTML = `<span style="font-size:.6rem;font-weight:800;color:#155724;background:rgba(255,255,255,.9);padding:2px 6px;border-radius:4px">${plant.e} ~${count} pieds · ${w}×${h}m</span>`;
      }
    }
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';
  }
}

// ═══════ EXCLUSION GRID ═══════

function buildExclusionGrid() {
  const excl = Array.from({ length: gridRows }, () => Array(gridCols).fill(false));
  // Serre is NOT excluded — plants can go inside serre
  pl.zones.filter(z => z.type !== 'serre').forEach(z => {
    for (let r = z.r1; r <= z.r2; r++) {
      for (let c = z.c1; c <= z.c2; c++) {
        if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
          excl[r][c] = true;
        }
      }
    }
  });
  return excl;
}

function buildSerreGrid() {
  const sg = Array.from({ length: gridRows }, () => Array(gridCols).fill(false));
  pl.zones.filter(z => z.type === 'serre').forEach(z => {
    for (let r = z.r1; r <= z.r2; r++) {
      for (let c = z.c1; c <= z.c2; c++) {
        if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
          sg[r][c] = true;
        }
      }
    }
  });
  return sg;
}

// ═══════ AUTO-PLACEMENT v7 — PROPER BED PACKING ═══════

const ASSOC_GROUPS = [
  ['tomate', 'basilic', 'persil', 'carotte'],
  ['carotte', 'oignon', 'poireau', 'ciboulette'],
  ['courgette', 'haricot', 'mais'],
  ['salade', 'radis', 'epinard'],
  ['chou', 'celeri', 'betterave', 'epinard'],
  ['pdt', 'haricot', 'feve'],
  ['poivron', 'aubergine', 'basilic'],
  ['concombre', 'aneth', 'salade'],
  ['fraise', 'thym', 'sauge'],
  ['petitpois', 'salade', 'carotte'],
  ['oignon', 'ail', 'echalote'],
  ['navet', 'petitpois', 'salade'],
];

/*
 * autoPlace v8 — SIMPLE RECTANGULAR BEDS
 *
 * 1. Find large free rectangular regions (avoiding ALL zones)
 * 2. Subdivide into 1.2m-wide vertical beds with 40cm paths
 * 3. Assign plant groups to beds
 * 4. Fill each bed top-to-bottom in a neat grid
 */

function autoPlace(mode = 'assoc') {
  const sel = PLANTS.filter(p => myG.includes(p.id));
  if (!sel.length) return;

  window._serreAlreadyPlaced = {}; // reset serre tracking
  const frozenZones = JSON.parse(JSON.stringify(pl.zones));
  pl.placements = [];
  pl.beds = [];

  const exclusion = buildExclusionGrid();
  const serreGrid = buildSerreGrid();
  const hasSerre = pl.zones.some(z => z.type === 'serre');

  // Full block grid for open-air: zones + serre
  const blockedOpen = Array.from({ length: gridRows }, () => Array(gridCols).fill(false));
  for (let r = 0; r < gridRows; r++)
    for (let c = 0; c < gridCols; c++)
      blockedOpen[r][c] = exclusion[r][c] || serreGrid[r][c];

  // ── Separate serre vs open-air plants ──
  const SERRE_PRIO = ['tomate', 'poivron', 'aubergine', 'piment', 'concombre', 'melon'];
  const SERRE_OK = ['basilic', 'persil', 'salade', 'radis', 'epinard', 'mache', 'roquette'];
  let serrePlants = [], openPlants = [...sel];

  if (hasSerre) {
    // Priority plants always go in serre
    serrePlants = sel.filter(p => SERRE_PRIO.includes(p.id));
    // Also include ALL serre-compatible plants (salade, radis, etc.) — fill the serre!
    const okPlants = sel.filter(p =>
      !SERRE_PRIO.includes(p.id) && (p.serre || SERRE_OK.includes(p.id))
    );
    serrePlants = [...serrePlants, ...okPlants];
    // All plants also go to open air — serre just gets them first, overflow handled below
    openPlants = sel.filter(p => !serrePlants.includes(p));
  }

  // ── Build groups based on mode ──
  let serreGroups, openGroups;
  if (mode === 'assoc') {
    serreGroups = buildAssocBeds(serrePlants);
    openGroups = buildAssocBeds(openPlants);
  } else if (mode === 'mono') {
    serreGroups = serrePlants.map(p => [p]);
    openGroups = openPlants.map(p => [p]);
  } else { // rows
    serreGroups = orderByCompanions(serrePlants).map(p => [p]);
    openGroups = orderByCompanions(openPlants).map(p => [p]);
  }

  // ── Phase 1: Serre ──
  if (serreGroups.length && hasSerre) {
    placeBedRects(serreGroups, serreGrid, exclusion, true, mode);
  }

  // Overflow: serre plants that didn't fully fit → add remainder to open air
  // Count how many of each type were placed in serre
  const serrePlacedCount = {};
  pl.placements.forEach(p => { serrePlacedCount[p.id] = (serrePlacedCount[p.id] || 0) + 1; });

  // Store serre counts so open-air placement can subtract them
  window._serreAlreadyPlaced = {};
  for (const p of serrePlants) {
    if (serrePlacedCount[p.id]) {
      window._serreAlreadyPlaced[p.id] = serrePlacedCount[p.id];
    }
  }

  // Only overflow plants that still need more placement
  const overflowPlants = serrePlants.filter(p => {
    const placed = serrePlacedCount[p.id] || 0;
    const reco = RECOMMENDED_QTY[p.id] || [4, 10];
    const target = Math.round((reco[0] + reco[1]) / 2);
    return placed < target; // still needs more in open air
  });

  if (overflowPlants.length) {
    const overflowGroups = (mode === 'assoc') ? buildAssocBeds(overflowPlants) : overflowPlants.map(p => [p]);
    // Append overflow AFTER open groups (don't interleave — avoids association conflicts)
    openGroups = [...openGroups, ...overflowGroups];
  }

  // ── Phase 2: Open air ──
  if (openGroups.length) {
    placeBedRects(openGroups, blockedOpen, exclusion, false, mode);
  }

  pl.zones = frozenZones;
  savePl();
  saveRotationHistory();
  renderPlanner();
}

/*
 * placeBedRects — Create clean rectangular beds
 *
 * Strategy:
 *  1. Find contiguous free columns (vertical strips with no zones)
 *  2. Group columns into beds of BED_W cells + PATH gap
 *  3. For each bed, find the free row range (top to bottom)
 *  4. Assign plant groups to beds and fill them neatly
 */
function placeBedRects(groups, blockGrid, exclGrid, insideZone, mode) {
  const PATH = 3;    // 30cm path between beds (enough to walk/kneel for watering)
  const BED_W = 12;  // 1.2m bed width — arm reach from both sides (standard maraîchage)
  const BED_W_LARGE = 15; // 1.5m for sprawling plants (courgette, potimarron, melon)
  const M = insideZone ? 0 : MARGIN_CELLS;

  // IDs of plants that need extra width (sprawling / running)
  const LARGE_IDS = new Set(['courgette','potimarron','courge','melon','concombre','pastèque']);

  // Check if a cell is usable
  const isFree = (r, c) => {
    if (r < M || r >= gridRows - M || c < M || c >= gridCols - M) return false;
    return insideZone ? (blockGrid[r][c] && !exclGrid[r][c]) : !blockGrid[r][c];
  };

  // ══════ STEP 1: Find free rectangular regions ══════
  function findFreeRegions() {
    const regions = [];
    let rMin = gridRows, rMax = 0, cMin = gridCols, cMax = 0;
    for (let r = M; r < gridRows - M; r++)
      for (let c = M; c < gridCols - M; c++)
        if (isFree(r, c)) {
          rMin = Math.min(rMin, r); rMax = Math.max(rMax, r);
          cMin = Math.min(cMin, c); cMax = Math.max(cMax, c);
        }
    if (rMin > rMax) return regions;

    const colFree = [];
    for (let c = cMin; c <= cMax; c++) {
      colFree[c] = [];
      let segStart = -1;
      for (let r = rMin; r <= rMax; r++) {
        if (isFree(r, c)) {
          if (segStart < 0) segStart = r;
        } else {
          if (segStart >= 0 && (r - segStart) >= 4) {
            colFree[c].push({ rStart: segStart, rEnd: r - 1 });
          }
          segStart = -1;
        }
      }
      if (segStart >= 0 && (rMax + 1 - segStart) >= 4) {
        colFree[c].push({ rStart: segStart, rEnd: rMax });
      }
    }

    // Multi-pass: scan for regions, mark used column spans, repeat for tall leftovers
    const usedCols = new Set();

    for (let pass = 0; pass < 3; pass++) {
      let c = cMin;
      while (c <= cMax) {
        if (usedCols.has(c) || !colFree[c] || !colFree[c].length) { c++; continue; }

        // Find tallest unused segment at this column
        const seed = colFree[c].reduce((a, b) => (b.rEnd - b.rStart) > (a.rEnd - a.rStart) ? b : a);
        const seedH = seed.rEnd - seed.rStart + 1;
        let regR1 = seed.rStart, regR2 = seed.rEnd;
        let regC1 = c, regC2 = c;

        for (let cc = c + 1; cc <= cMax; cc++) {
          if (usedCols.has(cc) || !colFree[cc] || !colFree[cc].length) break;

          // Check if next column's tallest segment is much taller — stop to avoid dragging height down
          const nextTallest = colFree[cc].reduce((a, b) => (b.rEnd - b.rStart) > (a.rEnd - a.rStart) ? b : a);
          const nextH = nextTallest.rEnd - nextTallest.rStart + 1;
          const curH = regR2 - regR1 + 1;
          if (nextH > curH * 1.5 && curH < seedH * 0.7) break; // next col is much taller, let it seed its own region

          const overlap = colFree[cc].find(seg =>
            seg.rStart <= regR1 + 2 && seg.rEnd >= regR2 - 2
          );
          if (!overlap) break;
          regR1 = Math.max(regR1, overlap.rStart);
          regR2 = Math.min(regR2, overlap.rEnd);
          regC2 = cc;
          if (regR2 - regR1 < 4) break;
        }

        if ((regC2 - regC1 + 1) >= 3 && (regR2 - regR1 + 1) >= 4) {
          regions.push({ r1: regR1, r2: regR2, c1: regC1, c2: regC2 });
          for (let cc = regC1; cc <= regC2; cc++) usedCols.add(cc);
        }
        c = regC2 + 1;
      }

      // Remove used segments from colFree for next pass (find uncovered tall areas)
      for (const reg of regions) {
        for (let cc = reg.c1; cc <= reg.c2; cc++) {
          if (!colFree[cc]) continue;
          colFree[cc] = colFree[cc].flatMap(seg => {
            // Split segment around the used region
            const parts = [];
            if (seg.rStart < reg.r1 && (reg.r1 - 1 - seg.rStart) >= 4) {
              parts.push({ rStart: seg.rStart, rEnd: reg.r1 - 1 });
            }
            if (seg.rEnd > reg.r2 && (seg.rEnd - reg.r2 - 1) >= 4) {
              parts.push({ rStart: reg.r2 + 1, rEnd: seg.rEnd });
            }
            return parts;
          });
        }
      }
      usedCols.clear(); // allow re-use of columns for remaining segments
    }

    regions.sort((a, b) =>
      (b.r2 - b.r1 + 1) * (b.c2 - b.c1 + 1) - (a.r2 - a.r1 + 1) * (a.c2 - a.c1 + 1)
    );
    return regions;
  }

  // ══════ STEP 2: Subdivide regions into bed slots ══════
  function makeBedSlots(regions) {
    const slots = [];
    const isVertical = (mode !== 'rows');

    for (const reg of regions) {
      if (insideZone) {
        slots.push({ r1: reg.r1, r2: reg.r2, c1: reg.c1, c2: reg.c2, curR: reg.r1 + 1 });
      } else if (isVertical) {
        let c = reg.c1;
        while (c + BED_W - 1 <= reg.c2) {
          slots.push({ r1: reg.r1, r2: reg.r2, c1: c, c2: c + BED_W - 1, curR: reg.r1 + 1 });
          c += BED_W + PATH;
        }
        // Use leftover space if wide enough (at least 5 cells = 50cm)
        if (c <= reg.c2 && (reg.c2 - c + 1) >= 5) {
          slots.push({ r1: reg.r1, r2: reg.r2, c1: c, c2: reg.c2, curR: reg.r1 + 1 });
        }
      } else {
        // Rows mode: use whole region as one slot — species stack vertically across full width
        slots.push({ r1: reg.r1, r2: reg.r2, c1: reg.c1, c2: reg.c2, curR: reg.r1 + 1 });
      }
    }
    return slots;
  }

  // ══════ STEP 3: Calculate qty and space needed per group ══════
  function calcGroupNeeds(group) {
    return group.map(plant => {
      const reco = RECOMMENDED_QTY[plant.id] || [4, 10];
      let qty = Math.max(1, Math.round((reco[0] + reco[1]) / 2));
      // Subtract what was already placed in serre (for open-air overflow)
      if (!insideZone && window._serreAlreadyPlaced && window._serreAlreadyPlaced[plant.id]) {
        qty = Math.max(0, qty - window._serreAlreadyPlaced[plant.id]);
      }
      const sp = Math.max(1, Math.round(plant.spacing / CELL_CM));
      const rw = Math.max(1, Math.round((plant.row || Math.round(plant.spacing * 1.2)) / CELL_CM));
      return { plant, qty, sp, rw };
    });
  }

  // Estimate total cells (height) a species list needs inside a slot width
  function estimateHeight(speciesList, slotW) {
    let h = 0;
    for (const sp of speciesList) {
      if (sp.qty <= 0) continue;
      const usableW = Math.max(1, slotW - 2); // 1-cell margin each side
      const perRow = Math.max(1, Math.floor(usableW / sp.sp));
      const rows = Math.ceil(sp.qty / perRow);
      h += rows * sp.rw + 2; // 2-cell gap between species
    }
    return h;
  }

  // ══════ STEP 4: Fill a bed slot with plants ══════
  function fillSlot(slot, speciesList, occupied) {
    let placed = false;
    const slotMargin = 1;

    for (const sp of speciesList) {
      if (sp.qty <= 0) continue;
      const slotW = slot.c2 - slot.c1 + 1 - slotMargin * 2;
      if (slotW < 1) continue;
      const c1 = slot.c1 + slotMargin;
      const plantsPerRow = Math.max(1, Math.floor(slotW / sp.sp));

      // If previous species in this slot is an enemy, add extra gap (>10 cells for conflict radius)
      if (slot._lastPlantId && getCompanion(slot._lastPlantId, sp.plant.id) === -1) {
        slot.curR += 11; // 110cm gap to avoid conflict detection (radius 10 cells)
      }

      let count = 0;
      let bMinR = Infinity, bMaxR = -Infinity, bMinC = Infinity, bMaxC = -Infinity;

      for (let row = 0; count < sp.qty; row++) {
        const r = slot.curR + row * sp.rw;
        if (r >= slot.r2) break;

        for (let col = 0; col < plantsPerRow && count < sp.qty; col++) {
          const c = c1 + col * sp.sp;
          if (c >= slot.c2) break;
          if (!isFree(r, c) || occupied[r][c]) continue;
          pl.placements.push({ id: sp.plant.id, row: r, col: c });
          occupied[r][c] = true;
          count++;
          placed = true;
          bMinR = Math.min(bMinR, r); bMaxR = Math.max(bMaxR, r);
          bMinC = Math.min(bMinC, c); bMaxC = Math.max(bMaxC, c);
        }
      }

      if (count > 0) {
        const rowsUsed = Math.ceil(count / plantsPerRow);
        slot.curR += rowsUsed * sp.rw + (mode === 'rows' ? PATH : 2);
        slot._lastPlantId = sp.plant.id;
        sp.qty -= count;
        pl.beds.push({ id: sp.plant.id, r1: bMinR, c1: slot.c1, r2: bMaxR, c2: slot.c2 });
      }
    }
    return placed;
  }

  // ══════ EXECUTE ══════
  const regions = findFreeRegions();
  const slots = makeBedSlots(regions);
  if (!slots.length) return;

  // Per-slot width for accurate height estimation
  function slotWidth(idx) { return slots[idx].c2 - slots[idx].c1 + 1; }
  // For sorting/capacity, use average slot width (not max — avoids underestimating in narrow slots)
  const avgW = (mode === 'rows' && slots.length > 0)
    ? Math.round(slots.reduce((s, sl) => s + (sl.c2 - sl.c1 + 1), 0) / slots.length)
    : BED_W;

  const occupied = Array.from({ length: gridRows }, () => Array(gridCols).fill(false));

  if (insideZone) {
    // ── SERRE: place groups by priority until full ──
    const PRIO_ORDER = ['tomate', 'poivron', 'aubergine', 'piment', 'concombre', 'melon',
                        'salade', 'radis', 'epinard', 'mache', 'roquette', 'basilic', 'persil'];
    groups.sort((a, b) => {
      const aP = Math.min(...a.map(p => { const i = PRIO_ORDER.indexOf(p.id); return i >= 0 ? i : 99; }));
      const bP = Math.min(...b.map(p => { const i = PRIO_ORDER.indexOf(p.id); return i >= 0 ? i : 99; }));
      return aP - bP;
    });

    for (const group of groups) {
      const needs = calcGroupNeeds(group);
      // Try every slot that still has space
      for (let si = 0; si < slots.length; si++) {
        if (slots[si].curR >= slots[si].r2) continue;
        if (!needs.some(n => n.qty > 0)) break;
        fillSlot(slots[si], needs, occupied);
      }
    }
  } else {
    // ── OPEN-AIR: smart assignment like a real farmer ──
    // 0. Calculate all needs first, then scale if total exceeds capacity
    const allNeeds = groups.map(g => calcGroupNeeds(g));
    const totalCapacity = slots.reduce((sum, s) => sum + (s.r2 - s.r1 - 2), 0);
    const totalNeeded = allNeeds.reduce((sum, needs) => sum + estimateHeight(needs, avgW), 0);

    // Scale down quantities proportionally only if we'd really exceed capacity
    if (totalNeeded > totalCapacity) {
      const scale = (totalCapacity * 0.9) / totalNeeded;
      for (const needs of allNeeds) {
        for (const sp of needs) {
          sp.qty = Math.max(1, Math.round(sp.qty * scale));
        }
      }
    }

    // 1. Separate large/sprawling plants from normal ones
    const largeGroups = [];
    const normalGroups = [];
    const largeNeedsMap = [];
    const normalNeedsMap = [];
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].some(p => LARGE_IDS.has(p.id))) {
        largeGroups.push(groups[i]);
        largeNeedsMap.push(allNeeds[i]);
      } else {
        normalGroups.push(groups[i]);
        normalNeedsMap.push(allNeeds[i]);
      }
    }

    // 2. Sort normal groups: biggest space needs first (greedy bin-packing)
    const normalNeeds = normalNeedsMap.map((needs, i) => {
      const h = estimateHeight(needs, avgW);
      return { group: normalGroups[i], needs, estHeight: h };
    });
    normalNeeds.sort((a, b) => b.estHeight - a.estHeight);

    // 3. Sort large groups similarly
    const largeNeeds = largeNeedsMap.map((needs, i) => {
      const h = estimateHeight(needs, avgW);
      return { group: largeGroups[i], needs, estHeight: h };
    });
    largeNeeds.sort((a, b) => b.estHeight - a.estHeight);

    // 4. Assign groups to slots — best-fit decreasing (minimize wasted space)
    // Track remaining height per slot
    const slotRemaining = slots.map(s => s.r2 - s.r1 - 2); // usable height

    function assignToSlot(entry) {
      // Find slot with least remaining space that still fits — use per-slot width for accuracy
      let bestIdx = -1, bestRem = Infinity;
      for (let i = 0; i < slots.length; i++) {
        const rem = slotRemaining[i];
        if (rem <= 0) continue;
        const h = estimateHeight(entry.needs, slotWidth(i)); // per-slot estimate
        if (rem >= h && rem < bestRem) {
          bestIdx = i;
          bestRem = rem;
        }
      }

      // If no perfect fit, use slot with most remaining space
      if (bestIdx < 0) {
        let maxRem = 0;
        for (let i = 0; i < slots.length; i++) {
          if (slotRemaining[i] > maxRem) { maxRem = slotRemaining[i]; bestIdx = i; }
        }
      }

      if (bestIdx < 0 || slotRemaining[bestIdx] <= 0) return; // no space anywhere

      fillSlot(slots[bestIdx], entry.needs, occupied);
      slotRemaining[bestIdx] = slots[bestIdx].r2 - slots[bestIdx].curR;

      // If some species didn't fit, try overflow into ALL other slots with any space
      const remaining = entry.needs.filter(n => n.qty > 0);
      if (remaining.some(n => n.qty > 0)) {
        // Sort remaining slots by available space (most space first)
        const slotOrder = slots.map((_, i) => i).filter(i => i !== bestIdx && slotRemaining[i] > 0).sort((a, b) => slotRemaining[b] - slotRemaining[a]);
        for (const i of slotOrder) {
          if (!remaining.some(n => n.qty > 0)) break;
          fillSlot(slots[i], remaining, occupied);
          slotRemaining[i] = slots[i].r2 - slots[i].curR;
        }
      }
    }

    // 5. Place large plants first (they need most space & may need wider beds)
    for (const entry of largeNeeds) {
      assignToSlot(entry);
    }

    // 6. Place normal groups — biggest first for best packing
    for (const entry of normalNeeds) {
      assignToSlot(entry);
    }

    // 7. Final sweep: try to place any unplaced species into any remaining space
    const allEntries = [...largeNeeds, ...normalNeeds];
    const unplaced = allEntries.filter(e => e.needs.some(n => n.qty > 0));
    if (unplaced.length > 0) {
      // Refresh slot remaining from actual cursor positions
      for (let i = 0; i < slots.length; i++) {
        slotRemaining[i] = slots[i].r2 - slots[i].curR;
      }
      for (const entry of unplaced) {
        const rem = entry.needs.filter(n => n.qty > 0);
        if (!rem.length) continue;
        // Try every slot that has any space
        const avail = slots.map((_, i) => i).filter(i => slotRemaining[i] > 2).sort((a, b) => slotRemaining[b] - slotRemaining[a]);
        for (const i of avail) {
          if (!rem.some(n => n.qty > 0)) break;
          fillSlot(slots[i], rem, occupied);
          slotRemaining[i] = slots[i].r2 - slots[i].curR;
        }
      }

      // 8. Direct grid fallback: scan grid for free rows to place remaining species
      // This bypasses slot constraints and places directly into any free space
      const stillUnplaced = allEntries.filter(e => e.needs.some(n => n.qty > 0));
      if (stillUnplaced.length > 0) {
        // Build placement grid for fast enemy lookups
        const placementGrid = {};
        for (const p of pl.placements) {
          const key = p.row + ',' + p.col;
          placementGrid[key] = p.id;
        }

        for (const entry of stillUnplaced) {
          for (const sp of entry.needs) {
            if (sp.qty <= 0) continue;
            // Scan each region for free rows not tracked by the slot cursor
            for (const reg of regions) {
              if (sp.qty <= 0) break;
              const regW = reg.c2 - reg.c1 + 1 - 2;
              if (regW < sp.sp) continue;
              const perRow = Math.max(1, Math.floor(regW / sp.sp));
              const c1 = reg.c1 + 1;
              let bMinR = Infinity, bMaxR = -Infinity, bMinC = Infinity, bMaxC = -Infinity;
              let count = 0;

              for (let r = reg.r1 + 1; r < reg.r2 && sp.qty > 0; r += sp.rw) {
                // Check if this row has free cells
                let rowFree = true;
                for (let cc = c1; cc < c1 + Math.min(perRow, sp.qty) * sp.sp; cc++) {
                  if (cc > reg.c2 - 1) break;
                  if (occupied[r] && occupied[r][cc]) { rowFree = false; break; }
                }
                if (!rowFree) continue;

                // Check if enemy plants are nearby (within 11 cells of this row area)
                let hasEnemyNearby = false;
                const ENEMY_GAP = 11;
                const cEnd = Math.min(c1 + perRow * sp.sp, reg.c2);
                for (let dr = -ENEMY_GAP; dr <= ENEMY_GAP && !hasEnemyNearby; dr++) {
                  const nr = r + dr;
                  if (nr < 0 || nr >= gridRows) continue;
                  for (let nc = c1 - ENEMY_GAP; nc <= cEnd + ENEMY_GAP && !hasEnemyNearby; nc++) {
                    if (nc < 0 || nc >= gridCols) continue;
                    const pid = placementGrid[nr + ',' + nc];
                    if (pid && getCompanion(sp.plant.id, pid) === -1) {
                      hasEnemyNearby = true;
                    }
                  }
                }
                if (hasEnemyNearby) continue;

                for (let col = 0; col < perRow && sp.qty > 0; col++) {
                  const c = c1 + col * sp.sp;
                  if (c >= reg.c2) break;
                  if (!isFree(r, c) || occupied[r][c]) continue;
                  pl.placements.push({ id: sp.plant.id, row: r, col: c });
                  occupied[r][c] = true;
                  placementGrid[r + ',' + c] = sp.plant.id;
                  count++;
                  sp.qty--;
                  bMinR = Math.min(bMinR, r); bMaxR = Math.max(bMaxR, r);
                  bMinC = Math.min(bMinC, c); bMaxC = Math.max(bMaxC, c);
                }
              }

              if (count > 0) {
                pl.beds.push({ id: sp.plant.id, r1: bMinR, c1: reg.c1, r2: bMaxR, c2: reg.c2 });
              }
            }
          }
        }
      }
    }
  }
}


// Group plants into association beds
function buildAssocBeds(plants) {
  if (!plants.length) return [];
  const used = new Set();
  const beds = [];

  // Match plants to known association groups
  ASSOC_GROUPS.forEach(group => {
    const matched = group.filter(id => plants.some(p => p.id === id) && !used.has(id));
    if (matched.length >= 2) {
      matched.forEach(id => used.add(id));
      beds.push(matched.map(id => plants.find(p => p.id === id)));
    }
  });

  // Remaining: pair with companions or solo
  const remaining = plants.filter(p => !used.has(p.id));
  const usedR = new Set();
  remaining.forEach(p => {
    if (usedR.has(p.id)) return;
    usedR.add(p.id);
    const companion = remaining.find(o =>
      o.id !== p.id && !usedR.has(o.id) && getCompanion(p.id, o.id) > 0
    );
    if (companion) {
      usedR.add(companion.id);
      beds.push([p, companion]);
    } else {
      beds.push([p]);
    }
  });
  return beds;
}

function orderByCompanions(plants) {
  if (plants.length <= 1) return plants;
  const ordered = [plants[0]];
  const remaining = plants.slice(1);
  while (remaining.length) {
    const current = ordered[ordered.length - 1];
    // First try: find a non-enemy companion (score >= 0)
    let bestIdx = -1, bestScore = -999;
    remaining.forEach((p, i) => {
      const score = getCompanion(current.id, p.id);
      if (score >= 0 && score > bestScore) { bestScore = score; bestIdx = i; }
    });
    // Fallback: if all remaining are enemies, pick the least bad
    if (bestIdx < 0) {
      remaining.forEach((p, i) => {
        const score = getCompanion(current.id, p.id);
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      });
    }
    if (bestIdx < 0) bestIdx = 0;
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  return ordered;
}


// ═══════ BED VISUALIZATION ═══════

function computeBeds() {
  const beds = [];
  let colorIdx = 0;

  // Use saved bed surfaces (fixed boundaries from drawing)
  if (pl.beds && pl.beds.length) {
    const coveredPlacements = new Set();

    // Build exclusion set for zone cells (chemin, arbre, etc.)
    const zoneCells = new Set();
    pl.zones.filter(z => z.type !== 'serre').forEach(z => {
      for (let r = z.r1; r <= z.r2; r++)
        for (let c = z.c1; c <= z.c2; c++)
          zoneCells.add(r + ',' + c);
    });

    pl.beds.forEach(bed => {
      const plant = plantById(bed.id);
      if (!plant) return;
      // Collect placements in this bed
      const bedPlacements = [];
      pl.placements.forEach((p, idx) => {
        if (p.id === bed.id && p.row >= bed.r1 && p.row <= bed.r2 && p.col >= bed.c1 && p.col <= bed.c2) {
          bedPlacements.push({ p, idx });
          coveredPlacements.add(idx);
        }
      });
      if (!bedPlacements.length) return;

      // Split into column-contiguous clusters (avoid spanning over zones)
      const cols = [...new Set(bedPlacements.map(bp => bp.p.col))].sort((a, b) => a - b);
      const clusters = [];
      let cluster = [cols[0]];
      for (let i = 1; i < cols.length; i++) {
        // Check if there's a zone between this col and previous
        let blocked = false;
        for (let c = cluster[cluster.length - 1] + 1; c < cols[i]; c++) {
          // Check if ANY row in bed range has a zone cell at this column
          for (let r = bed.r1; r <= bed.r2; r++) {
            if (zoneCells.has(r + ',' + c)) { blocked = true; break; }
          }
          if (blocked) break;
        }
        if (blocked) {
          clusters.push(cluster);
          cluster = [cols[i]];
        } else {
          cluster.push(cols[i]);
        }
      }
      clusters.push(cluster);

      // Create a bed overlay for each cluster
      clusters.forEach(clusterCols => {
        const cSet = new Set(clusterCols);
        let count = 0, minR = Infinity, maxR = -Infinity;
        const minC = Math.min(...clusterCols), maxC = Math.max(...clusterCols);
        bedPlacements.forEach(bp => {
          if (cSet.has(bp.p.col)) {
            count++;
            minR = Math.min(minR, bp.p.row);
            maxR = Math.max(maxR, bp.p.row);
          }
        });
        if (count === 0) return;
        const color = BED_COLORS[colorIdx % BED_COLORS.length];
        colorIdx++;
        beds.push({ id: bed.id, minR, maxR, minC, maxC, count, color, plant });
      });
    });

    // Uncovered placements: strict bounding box (no expansion)
    const uncovered = {};
    pl.placements.forEach((p, idx) => {
      if (coveredPlacements.has(idx)) return;
      if (!uncovered[p.id]) uncovered[p.id] = [];
      uncovered[p.id].push(p);
    });

    Object.entries(uncovered).forEach(([id, placements]) => {
      const plant = plantById(id);
      const color = BED_COLORS[colorIdx % BED_COLORS.length];
      colorIdx++;
      let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
      placements.forEach(p => {
        minR = Math.min(minR, p.row); maxR = Math.max(maxR, p.row);
        minC = Math.min(minC, p.col); maxC = Math.max(maxC, p.col);
      });
      beds.push({ id, minR, maxR, minC, maxC, count: placements.length, color, plant });
    });

    return beds;
  }

  // Fallback: strict bounding box per plant type (no GAP expansion)
  const byPlant = {};
  pl.placements.forEach(p => {
    if (!byPlant[p.id]) byPlant[p.id] = [];
    byPlant[p.id].push(p);
  });

  Object.entries(byPlant).forEach(([id, placements]) => {
    const plant = plantById(id);
    const color = BED_COLORS[colorIdx % BED_COLORS.length];
    colorIdx++;
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    placements.forEach(p => {
      minR = Math.min(minR, p.row); maxR = Math.max(maxR, p.row);
      minC = Math.min(minC, p.col); maxC = Math.max(maxC, p.col);
    });
    beds.push({ id, minR, maxR, minC, maxC, count: placements.length, color, plant });
  });

  return beds;
}

// ═══════ PLACEMENT MANAGEMENT ═══════

function removePlacement(idx) {
  const removed = pl.placements[idx];
  pl.placements.splice(idx, 1);
  // Clean up empty beds: if a saved bed has no more plants inside, remove it
  if (removed && pl.beds) {
    pl.beds = pl.beds.filter(bed => {
      if (bed.id !== removed.id) return true;
      const count = pl.placements.filter(p =>
        p.id === bed.id && p.row >= bed.r1 && p.row <= bed.r2 && p.col >= bed.c1 && p.col <= bed.c2
      ).length;
      return count > 0;
    });
  }
  savePl();
  renderPlanner();
}

function removePlantPlacements(plantId) {
  pl.placements = pl.placements.filter(p => p.id !== plantId);
  pl.beds = (pl.beds || []).filter(b => b.id !== plantId);
  savePl();
  renderPlanner();
}

function clearPlacements() {
  pl.placements = [];
  pl.beds = [];
  savePl();
  renderPlanner();
}

// ═══════ STATS ═══════

function renderPlacementStats() {
  const beds = computeBeds();
  if (!beds.length) return '';

  let totalYield = 0;
  let totalPlants = 0;
  const rows = beds.map(bed => {
    if (!bed.plant) return '';
    const yieldEst = (bed.count * bed.plant.yieldKg).toFixed(1);
    totalYield += parseFloat(yieldEst);
    totalPlants += bed.count;
    const bedW = ((bed.maxC - bed.minC + 1) * CELL_CM / 100).toFixed(1);
    const bedH = ((bed.maxR - bed.minR + 1) * CELL_CM / 100).toFixed(1);
    return `<div class="stat-row">
      <span>${bed.plant.e} ${bed.plant.n}</span>
      <span><b>${bed.count}</b> pieds</span>
      <span class="stat-yield">~${yieldEst} kg</span>
    </div>
    <div style="font-size:.6rem;color:var(--muted);padding:0 0 3px;font-weight:600">
      Planche ${bedW}×${bedH}m · espacement ${bed.plant.spacing}cm
    </div>`;
  }).join('');

  // Count conflicts (only between adjacent different-type plants)
  let conflicts = 0;
  pl.placements.forEach((p, i) => {
    for (let j = i + 1; j < pl.placements.length; j++) {
      const other = pl.placements[j];
      if (other.id === p.id) continue;
      if (getCompanion(p.id, other.id) !== -1) continue;
      const dist = Math.abs(p.row - other.row) + Math.abs(p.col - other.col);
      if (dist <= 10) conflicts++;
    }
  });

  const rotationWarns = getRotationWarnings();

  // Utilization
  const exclGrid = buildExclusionGrid();
  let zonedCells = 0;
  for (let r = 0; r < gridRows; r++)
    for (let c = 0; c < gridCols; c++)
      if (exclGrid[r][c]) zonedCells++;
  const freeCells = gridCols * gridRows - zonedCells;
  const utilPct = freeCells > 0 ? Math.round(totalPlants / freeCells * 100) : 0;

  return `<div class="pl-panel">
    <h3>📊 Résultat — ${beds.length} planches</h3>
    <div class="stat-summary">
      <div class="stat-big">${totalPlants} <small>plants</small></div>
      <div class="stat-big stat-green">~${totalYield.toFixed(1)} <small>kg estimés</small></div>
      ${conflicts ? `<div class="stat-big stat-red">${conflicts} <small>conflits</small></div>` : `<div class="stat-big stat-green">0 <small>conflits ✅</small></div>`}
    </div>
    <div class="stat-row"><span>Utilisation parcelle</span><span><b>${utilPct}%</b> de l'espace libre</span></div>
    <div style="font-size:.65rem;color:var(--muted);padding:4px 0;font-weight:600">
      ${beds.length} planches · 30cm de passage entre chaque
    </div>
    ${rows}
    ${rotationWarns}
  </div>`;
}

// ═══════ ASSOCIATION MATRIX ═══════

function renderAssocMatrix(sel) {
  if (sel.length > 15) return '<p class="pl-hint">Trop de plantes pour la matrice (max 15)</p>';

  let h = '<div class="assoc-scroll"><table class="assoc-table"><thead><tr><th></th>';
  sel.forEach(p => { h += `<th title="${p.n}">${p.e}</th>`; });
  h += '</tr></thead><tbody>';

  sel.forEach((p1) => {
    h += `<tr><th>${p1.e} <span class="assoc-name">${p1.n}</span></th>`;
    sel.forEach((p2) => {
      if (p1.id === p2.id) {
        h += '<td class="assoc-self">·</td>';
      } else {
        const v = getCompanion(p1.id, p2.id);
        h += `<td class="${v > 0 ? 'assoc-good' : v < 0 ? 'assoc-bad' : 'assoc-neutral'}"
          title="${p1.n} + ${p2.n}: ${v > 0 ? 'Bonne' : v < 0 ? 'Mauvaise' : 'Neutre'}">${v > 0 ? '✅' : v < 0 ? '❌' : '·'}</td>`;
      }
    });
    h += '</tr>';
  });

  return h + '</tbody></table></div><div class="assoc-legend">✅ Bonne · ❌ Mauvaise · · Neutre/Inconnu</div>';
}

// ═══════ ROTATION DES CULTURES ═══════

function getRotationHistory() {
  try { return JSON.parse(localStorage.getItem('lpm-rotation') || '{}'); }
  catch { return {}; }
}

function saveRotationHistory() {
  const history = getRotationHistory();
  const year = TODAY.getFullYear().toString();
  const families = [...new Set(
    pl.placements.map(p => { const x = plantById(p.id); return x ? x.family : null; }).filter(Boolean)
  )];
  // Save bed positions per family for position-aware rotation
  const beds = computeBeds();
  const positions = beds.map(b => {
    if (!b.plant) return null;
    return {
      family: b.plant.family,
      plantId: b.id,
      name: b.plant.n,
      emoji: b.plant.e,
      minR: b.minR, maxR: b.maxR,
      minC: b.minC, maxC: b.maxC,
      count: b.count
    };
  }).filter(Boolean);

  history[year] = { families, positions, width: pl.width, length: pl.length };
  localStorage.setItem('lpm-rotation', JSON.stringify(history));
}

function getRotationWarnings() {
  const history = getRotationHistory();
  const lastYear = (TODAY.getFullYear() - 1).toString();
  const lastData = history[lastYear];

  if (!lastData) return '';

  // Compat: old format was just an array of families
  const lastFamilies = Array.isArray(lastData) ? lastData : (lastData.families || []);
  if (!lastFamilies.length) return '';

  const currentFamilies = [...new Set(
    pl.placements.map(p => { const x = plantById(p.id); return x ? x.family : null; }).filter(Boolean)
  )];
  const repeated = currentFamilies.filter(f => lastFamilies.includes(f));
  if (!repeated.length) return '';

  // Position-based overlap check
  const currentBeds = computeBeds();
  const lastPositions = (lastData.positions || []);
  const positionWarnings = [];

  if (lastPositions.length && currentBeds.length) {
    currentBeds.forEach(bed => {
      if (!bed.plant) return;
      lastPositions.forEach(last => {
        if (last.family === bed.plant.family) {
          const overlapR = bed.minR <= last.maxR && bed.maxR >= last.minR;
          const overlapC = bed.minC <= last.maxC && bed.maxC >= last.minC;
          if (overlapR && overlapC) {
            positionWarnings.push({ current: bed.plant.n, currentEmoji: bed.plant.e, last: last.name, lastEmoji: last.emoji, family: bed.plant.family });
          }
        }
      });
    });
  }

  let html = '<div class="pl-rotation-warn"><div class="rotation-title">🔄 Attention rotation !</div>';

  if (positionWarnings.length) {
    html += '<div class="rotation-text">⚠️ Même famille au même endroit que l\'an dernier :</div>';
    positionWarnings.forEach(w => {
      html += `<div class="rotation-family">📍 ${w.currentEmoji} ${w.current} → même zone que ${w.lastEmoji} ${w.last} en ${lastYear} (${FAMILY_NAMES[w.family] || w.family})</div>`;
    });
    html += '<div class="rotation-hint">💡 Déplace ces planches pour alterner les emplacements !</div>';
  } else {
    html += `<div class="rotation-text">Ces familles étaient plantées en ${lastYear} :</div>`;
    repeated.forEach(f => {
      html += `<div class="rotation-family">${FAMILY_NAMES[f] || f}</div>`;
    });
    html += '<div class="rotation-hint">✅ Mais elles sont dans des zones différentes — bonne rotation !</div>';
  }

  // Show last year's layout summary if available
  if (lastPositions.length) {
    html += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,179,0,.3)">
      <div style="font-size:.7rem;font-weight:700;color:#856404;margin-bottom:3px">📋 Plan ${lastYear} :</div>
      ${lastPositions.map(p => `<span style="font-size:.65rem;padding:1px 6px;background:rgba(255,179,0,.1);border-radius:4px;margin:1px;display:inline-block">${p.emoji} ${p.name} (${p.count})</span>`).join('')}
    </div>`;
  }

  html += '</div>';
  return html;
}
