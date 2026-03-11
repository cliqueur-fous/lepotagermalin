// ============================
// 🌱 SELECTION — Mon Potager
// ============================

function renderSel() {
  const c = document.getElementById('selContent');
  const cats = [
    { k: 'legume', l: '🥬 Légumes', items: PLANTS.filter(p => p.c === 'legume') },
    { k: 'fruit', l: '🍓 Fruits', items: PLANTS.filter(p => p.c === 'fruit') },
    { k: 'aromate', l: '🌿 Aromates', items: PLANTS.filter(p => p.c === 'aromate') },
  ];

  let h = `<div class="sel-actions">
    <button class="btn btn-secondary" onclick="selPop()">⚡ Sélection express</button>
    <button class="btn btn-secondary" onclick="selAll()">✅ Tout sélectionner</button>
    ${myG.length ? `<button class="btn btn-danger" onclick="clearAll()">🗑️ Tout vider</button>` : ''}
  </div>`;

  // Inventory summary with real quantities
  if (myG.length) {
    const selPlants = myG.map(id => plantById(id)).filter(Boolean);
    const itemsWithRec = selPlants.filter(p => RECOMMENDED_QTY[p.id]);
    let toBuy = [];

    itemsWithRec.forEach(p => {
      const rec = RECOMMENDED_QTY[p.id];
      const owned = getInventoryQty(p.id);
      if (owned < rec.qty) {
        toBuy.push({ p, rec, owned, missing: rec.qty - owned });
      }
    });

    const completePct = itemsWithRec.length
      ? Math.round((itemsWithRec.length - toBuy.length) / itemsWithRec.length * 100)
      : 0;

    h += `<div class="inv-summary">
      <div class="inv-header">
        <h3>🌰 Inventaire graines & plants</h3>
        <span class="inv-count">${completePct}% complet</span>
      </div>
      <div class="inv-bar"><div class="inv-bar-fill" style="width:${completePct}%"></div></div>`;

    if (toBuy.length) {
      h += `<div class="inv-missing">
        <div class="inv-missing-title">🛒 Liste de courses — ${toBuy.length} à compléter :</div>
        <div class="inv-missing-list">${toBuy.map(({ p, rec, owned, missing }) => {
          return `<div class="inv-missing-item">
            <span>${p.e} ${p.n}</span>
            <span class="inv-missing-qty">${missing} ${rec.unit}${owned > 0 ? ` (${owned}/${rec.qty} en stock)` : ''}</span>
            <button class="inv-check-btn" onclick="event.stopPropagation();setInventoryQty('${p.id}',${rec.qty});renderSel()" title="J'ai tout !">✅</button>
          </div>`;
        }).join('')}</div>
      </div>`;
    } else if (itemsWithRec.length) {
      h += `<div class="inv-complete">✅ Tu as tout en stock !</div>`;
    }

    h += `</div>`;
  }

  cats.forEach(cat => {
    const selCount = cat.items.filter(p => myG.includes(p.id)).length;
    h += `<div class="cat-section">
      <div class="cat-title">${cat.l} <span class="cat-count">${selCount}/${cat.items.length}</span></div>
      <div class="plant-grid">${cat.items.map(p => {
        const sel = myG.includes(p.id);
        const acts = [];
        if (inR(p.sow, NOW_H)) acts.push('🌰');
        if (inR(p.plant, NOW_H)) acts.push('🌱');
        if (inR(p.harvest, NOW_H)) acts.push('🧺');
        const rq = RECOMMENDED_QTY[p.id];
        const owned = getInventoryQty(p.id);
        return `<div class="plant-chip ${sel ? 'selected' : ''}" onclick="toggle('${p.id}');renderSel()">
          <div class="p-emoji">${p.e}</div>
          <div class="p-name">${sel ? '✅ ' : ''}${p.n}</div>
          <div class="p-diff ${p.d}">${DL[p.d]}</div>
          ${rq ? `<div class="p-qty">📦 ${rq.qty} ${rq.unit}</div>` : ''}
          ${acts.length ? `<div class="p-status">${acts.join(' ')} actif</div>` : ''}
          ${sel && rq ? `<div class="p-inv-control" onclick="event.stopPropagation()">
            <button class="inv-btn" onclick="invAdjust('${p.id}',-1)">−</button>
            <input type="number" class="inv-qty-input" value="${owned}" min="0"
              onchange="setInventoryQty('${p.id}',this.value);renderSel()"
              onclick="this.select()">
            <span class="inv-qty-unit">/ ${rq.qty}</span>
            <button class="inv-btn" onclick="invAdjust('${p.id}',1)">+</button>
          </div>` : ''}
        </div>`;
      }).join('')}</div>
    </div>`;
  });

  c.innerHTML = h;
  updCounts();
}

function invAdjust(plantId, delta) {
  const current = getInventoryQty(plantId);
  setInventoryQty(plantId, Math.max(0, current + delta));
  renderSel();
}

function selPop() {
  ['tomate','salade','carotte','courgette','radis','haricot','basilic','persil','fraise','pdt','oignon','menthe']
    .forEach(id => { if (!myG.includes(id)) myG.push(id); });
  save(); renderSel();
  showToast('Sélection express ajoutée !', 'success');
}

function selAll() {
  PLANTS.forEach(p => { if (!myG.includes(p.id)) myG.push(p.id); });
  save(); renderSel();
}

function clearAll() {
  if (!confirm('Vider tout ton potager ?')) return;
  myG = []; save(); renderSel();
  showToast('Potager vidé', 'warn');
}
