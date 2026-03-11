// ============================
// 📝 JOURNAL — Carnet de bord + Stats récoltes
// ============================

let journal = JSON.parse(localStorage.getItem('lpm-journal') || '[]');
// Each entry: {id, date, plantId, action, note, qty}
// action: 'sow','plant','harvest','water','treat','other'

const J_ACTIONS = {
  sow:     { l:'🌰 Semis',     bg:'#fff3cd', color:'#856404' },
  plant:   { l:'🌱 Plantation', bg:'#d4edda', color:'#155724' },
  harvest: { l:'🧺 Récolte',   bg:'#f8d7da', color:'#721c24' },
  water:   { l:'💧 Arrosage',  bg:'#d6eaf8', color:'#1a5276' },
  treat:   { l:'🛡️ Traitement', bg:'#fdebd0', color:'#7e5109' },
  other:   { l:'📝 Note',      bg:'#eee',    color:'#333' },
};

function saveJournal() {
  localStorage.setItem('lpm-journal', JSON.stringify(journal));
  syncToServer();
}

function renderJournal() {
  const c = document.getElementById('journalContent');
  const sel = PLANTS.filter(p => myG.includes(p.id));

  // Stats
  const thisMonth = journal.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === NOW && d.getFullYear() === TODAY.getFullYear();
  });
  const thisYear = journal.filter(e => {
    return new Date(e.date).getFullYear() === TODAY.getFullYear();
  });
  const totalHarvest = journal
    .filter(e => e.action === 'harvest' && e.qty)
    .reduce((s, e) => s + e.qty, 0);

  let h = `
  <div class="j-top">
    <div class="j-stats">
      <div class="j-stat"><span class="j-stat-num">${journal.length}</span><small>total</small></div>
      <div class="j-stat"><span class="j-stat-num">${thisMonth.length}</span><small>ce mois</small></div>
      <div class="j-stat"><span class="j-stat-num">${thisYear.length}</span><small>cette année</small></div>
      ${totalHarvest ? `<div class="j-stat j-stat-green"><span class="j-stat-num">${totalHarvest.toFixed(1)}</span><small>kg récoltés</small></div>` : ''}
    </div>
  </div>`;

  // ═══════ HARVEST STATS CHART ═══════
  h += renderHarvestStats();

  // ADD FORM
  h += `<div class="j-form-card">
    <h3>➕ Nouvelle entrée</h3>
    <div class="j-form">
      <div class="j-form-row">
        <label>Date</label>
        <input type="date" id="jDate" value="${TODAY.toISOString().slice(0,10)}">
      </div>
      <div class="j-form-row">
        <label>Plante</label>
        <select id="jPlant">
          <option value="">-- Choisir --</option>
          ${sel.length ? sel.map(p => `<option value="${p.id}">${p.e} ${p.n}</option>`).join('') : ''}
          <optgroup label="Toutes les plantes">
            ${PLANTS.filter(p => !myG.includes(p.id)).map(p => `<option value="${p.id}">${p.e} ${p.n}</option>`).join('')}
          </optgroup>
        </select>
      </div>
      <div class="j-form-row">
        <label>Action</label>
        <div class="j-action-btns">
          ${Object.entries(J_ACTIONS).map(([k,v]) =>
            `<button class="j-action-btn" data-action="${k}" onclick="selectJAction('${k}')"
              style="background:${v.bg};color:${v.color}">${v.l}</button>`
          ).join('')}
        </div>
      </div>
      <input type="hidden" id="jAction" value="">
      <div class="j-form-row j-qty-row" id="jQtyRow" style="display:none">
        <label>Quantité (kg)</label>
        <input type="number" id="jQty" step="0.1" min="0" placeholder="0.5">
      </div>
      <div class="j-form-row">
        <label>Note</label>
        <textarea id="jNote" rows="2" placeholder="Détails, observations..."></textarea>
      </div>
      <button class="btn btn-full" onclick="addJournalEntry()">✅ Ajouter</button>
    </div>
  </div>

  <!-- FILTERS -->
  <div class="j-filters">
    <select id="jFilterPlant" onchange="renderJournalEntries()">
      <option value="">Toutes les plantes</option>
      ${[...new Set(journal.map(e=>e.plantId))].filter(Boolean).map(id => {
        const p = plantById(id);
        return p ? `<option value="${id}">${p.e} ${p.n}</option>` : '';
      }).join('')}
    </select>
    <select id="jFilterAction" onchange="renderJournalEntries()">
      <option value="">Toutes les actions</option>
      ${Object.entries(J_ACTIONS).map(([k,v]) => `<option value="${k}">${v.l}</option>`).join('')}
    </select>
  </div>

  <div id="jEntries"></div>`;

  c.innerHTML = h;
  renderJournalEntries();
}

// ═══════ HARVEST STATS ═══════
function renderHarvestStats() {
  const harvestEntries = journal.filter(e => e.action === 'harvest' && e.qty > 0);
  if (!harvestEntries.length) return '';

  // By plant
  const byPlant = {};
  harvestEntries.forEach(e => {
    if (!e.plantId) return;
    if (!byPlant[e.plantId]) byPlant[e.plantId] = 0;
    byPlant[e.plantId] += e.qty;
  });

  const plantEntries = Object.entries(byPlant).sort((a, b) => b[1] - a[1]);
  const maxKg = Math.max(...plantEntries.map(([, v]) => v), 0.1);

  // By month
  const byMonth = {};
  harvestEntries.forEach(e => {
    const d = new Date(e.date);
    const m = d.getMonth();
    if (!byMonth[m]) byMonth[m] = 0;
    byMonth[m] += e.qty;
  });

  const monthEntries = Object.entries(byMonth).sort((a, b) => a[0] - b[0]);
  const maxMonthKg = Math.max(...monthEntries.map(([, v]) => v), 0.1);

  const totalKg = harvestEntries.reduce((s, e) => s + e.qty, 0);

  let h = `<div class="harvest-stats">
    <div class="harvest-stats-header">
      <h3>📊 Statistiques de récolte</h3>
      <span class="harvest-total">${totalKg.toFixed(1)} kg au total</span>
    </div>`;

  // Chart by plant
  if (plantEntries.length) {
    h += `<div class="harvest-section">
      <div class="harvest-section-title">Par plante</div>
      <div class="harvest-bars">`;
    plantEntries.forEach(([id, kg]) => {
      const p = plantById(id);
      if (!p) return;
      const pct = Math.round(kg / maxKg * 100);
      h += `<div class="harvest-bar-row">
        <div class="harvest-bar-label">${p.e} ${p.n}</div>
        <div class="harvest-bar-track">
          <div class="harvest-bar-fill" style="width:${pct}%;background:var(--harvest)"></div>
        </div>
        <div class="harvest-bar-value">${kg.toFixed(1)} kg</div>
      </div>`;
    });
    h += '</div></div>';
  }

  // Chart by month
  if (monthEntries.length) {
    h += `<div class="harvest-section">
      <div class="harvest-section-title">Par mois</div>
      <div class="harvest-bars">`;
    monthEntries.forEach(([m, kg]) => {
      const pct = Math.round(kg / maxMonthKg * 100);
      h += `<div class="harvest-bar-row">
        <div class="harvest-bar-label">${ME[m]} ${MN[m]}</div>
        <div class="harvest-bar-track">
          <div class="harvest-bar-fill" style="width:${pct}%;background:var(--accent)"></div>
        </div>
        <div class="harvest-bar-value">${kg.toFixed(1)} kg</div>
      </div>`;
    });
    h += '</div></div>';
  }

  h += '</div>';
  return h;
}

function selectJAction(action) {
  document.getElementById('jAction').value = action;
  document.querySelectorAll('.j-action-btn').forEach(b => b.classList.remove('j-action-selected'));
  document.querySelector(`.j-action-btn[data-action="${action}"]`).classList.add('j-action-selected');
  document.getElementById('jQtyRow').style.display = action === 'harvest' ? 'flex' : 'none';
}

function addJournalEntry() {
  const date = document.getElementById('jDate').value;
  const plantId = document.getElementById('jPlant').value;
  const action = document.getElementById('jAction').value;
  const note = document.getElementById('jNote').value.trim();
  const qty = parseFloat(document.getElementById('jQty')?.value) || 0;

  if (!action) { alert('Choisis une action !'); return; }

  journal.unshift({
    id: Date.now(),
    date,
    plantId: plantId || null,
    action,
    note,
    qty: action === 'harvest' ? qty : 0,
  });

  // Auto-update stages when logging sow/plant/harvest
  if (plantId && ['sow', 'plant', 'harvest'].includes(action)) {
    const ps = getPlantStage(plantId);
    if (!ps[action]) {
      setStage(plantId, action, date);
    }
  }

  saveJournal();
  showToast('Entrée ajoutée !', 'success');
  renderJournal();
}

function deleteJournalEntry(id) {
  journal = journal.filter(e => e.id !== id);
  saveJournal();
  renderJournalEntries();
}

function renderJournalEntries() {
  const container = document.getElementById('jEntries');
  if (!container) return;

  const filterPlant = document.getElementById('jFilterPlant')?.value || '';
  const filterAction = document.getElementById('jFilterAction')?.value || '';

  let entries = [...journal];
  if (filterPlant) entries = entries.filter(e => e.plantId === filterPlant);
  if (filterAction) entries = entries.filter(e => e.action === filterAction);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state"><div class="big-emoji">📝</div>
      <p>${journal.length ? 'Aucun résultat avec ces filtres' : 'Ton journal est vide — commence à noter !'}</p></div>`;
    return;
  }

  // Group by month
  const groups = {};
  entries.forEach(e => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    const label = `${ME[d.getMonth()]} ${MN[d.getMonth()]} ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(e);
  });

  let html = '';
  Object.keys(groups).sort().reverse().forEach(key => {
    const g = groups[key];
    html += `<div class="j-month-group">
      <div class="j-month-header">${g.label} <span class="j-month-count">${g.items.length}</span></div>`;

    g.items.sort((a, b) => b.date.localeCompare(a.date)).forEach(e => {
      const plant = e.plantId ? plantById(e.plantId) : null;
      const act = J_ACTIONS[e.action] || J_ACTIONS.other;
      const d = new Date(e.date);
      const dayStr = `${d.getDate()} ${MN[d.getMonth()].slice(0,3)}`;

      html += `<div class="j-entry">
        <div class="j-entry-date">${dayStr}</div>
        <div class="j-entry-body">
          <span class="j-entry-action" style="background:${act.bg};color:${act.color}">${act.l}</span>
          ${plant ? `<span class="j-entry-plant">${plant.e} ${plant.n}</span>` : ''}
          ${e.qty ? `<span class="j-entry-qty">${e.qty} kg</span>` : ''}
          ${e.note ? `<div class="j-entry-note">${e.note}</div>` : ''}
        </div>
        <button class="j-entry-del" onclick="deleteJournalEntry(${e.id})" title="Supprimer">×</button>
      </div>`;
    });

    html += '</div>';
  });

  container.innerHTML = html;
}
