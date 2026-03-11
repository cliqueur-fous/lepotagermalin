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

  if (myG.length) {
    const selPlants = myG.map(id => plantById(id)).filter(Boolean);
    const itemsWithRec = selPlants.filter(p => RECOMMENDED_QTY[p.id]);

    // ═══════ 1. RECOMMANDATIONS (read-only) ═══════
    if (itemsWithRec.length) {
      h += `<details class="inv-summary reco-section">
        <summary class="inv-toggle">
          <div class="inv-header">
            <h3>📋 Recommandations pour 2 personnes</h3>
            <span class="inv-hint-badge">${itemsWithRec.length} plantes</span>
          </div>
          <span class="inv-hint">Quantités conseillées par Rustica, Vilmorin, Terre Vivante</span>
        </summary>
        <div class="inv-body">
          <div class="reco-list">${itemsWithRec.map(p => {
            const rec = RECOMMENDED_QTY[p.id];
            return `<div class="reco-item">
              <span class="reco-plant">${p.e} ${p.n}</span>
              <span class="reco-qty">${rec.qty} ${rec.unit}</span>
              <span class="reco-note">${rec.note}</span>
            </div>`;
          }).join('')}</div>
        </div>
      </details>`;
    }

    // ═══════ 2. MON INVENTAIRE (editable) ═══════
    const invPlants = selPlants.filter(p => getInventoryQty(p.id) > 0);
    const emptyInv = selPlants.filter(p => getInventoryQty(p.id) === 0);
    const totalOwned = invPlants.length;

    h += `<details class="inv-summary" ${emptyInv.length ? 'open' : ''}>
      <summary class="inv-toggle">
        <div class="inv-header">
          <h3>🌰 Mon inventaire</h3>
          <span class="inv-count">${totalOwned}/${selPlants.length} en stock</span>
        </div>
        <div class="inv-bar"><div class="inv-bar-fill" style="width:${selPlants.length ? Math.round(totalOwned/selPlants.length*100) : 0}%"></div></div>
        <span class="inv-hint">Ce que tu as vraiment — modifie les quantités sur chaque plante ci-dessous</span>
      </summary>
      <div class="inv-body">`;

    // What's missing (0 in stock)
    if (emptyInv.length) {
      h += `<div class="inv-missing">
        <div class="inv-missing-title">🛒 ${emptyInv.length} plante${emptyInv.length > 1 ? 's' : ''} sans stock</div>
        <div class="inv-missing-list">${emptyInv.map(p => {
          const rq = RECOMMENDED_QTY[p.id];
          return `<div class="inv-missing-item">
            <span>${p.e} ${p.n}</span>
            ${rq ? `<span class="inv-missing-qty">reco: ${rq.qty} ${rq.unit}</span>` : ''}
            <button class="inv-check-btn" onclick="event.stopPropagation();setInventoryQty('${p.id}',${rq ? rq.qty : 1});renderSel()" title="Ajouter la quantité recommandée">➕</button>
          </div>`;
        }).join('')}</div>
      </div>`;
    }

    // What we have
    if (invPlants.length) {
      h += `<div class="inv-owned">
        <div class="inv-owned-title">✅ En stock</div>
        <div class="inv-missing-list">${invPlants.map(p => {
          const rq = RECOMMENDED_QTY[p.id];
          const owned = getInventoryQty(p.id);
          return `<div class="inv-missing-item inv-owned-item">
            <span>${p.e} ${p.n}</span>
            <span class="inv-owned-qty">${owned} ${rq ? rq.unit : ''}</span>
            <button class="inv-check-btn" onclick="event.stopPropagation();setInventoryQty('${p.id}',0);renderSel()" title="Retirer du stock">🗑️</button>
          </div>`;
        }).join('')}</div>
      </div>`;
    }

    h += `</div></details>`;
  }

  // Plant grid
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
          ${acts.length ? `<div class="p-status">${acts.join(' ')} actif</div>` : ''}
          ${sel && rq ? `<div class="p-inv-control" onclick="event.stopPropagation()">
            <button class="inv-btn" onclick="invAdjust('${p.id}',-1)">−</button>
            <input type="number" class="inv-qty-input" value="${owned}" min="0"
              onchange="setInventoryQty('${p.id}',this.value);renderSel()"
              onclick="this.select()">
            <span class="inv-qty-unit">/ ${rq.qty} ${rq.unit}</span>
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
