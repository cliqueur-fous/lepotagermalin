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

  // Shopping list: plants selected but not in inventory
  const missing = myG.filter(id => !hasInInventory(id));
  const owned = myG.filter(id => hasInInventory(id));

  let h = `<div class="sel-actions">
    <button class="btn btn-secondary" onclick="selPop()">⚡ Sélection express</button>
    <button class="btn btn-secondary" onclick="selAll()">✅ Tout sélectionner</button>
    ${myG.length ? `<button class="btn btn-danger" onclick="clearAll()">🗑️ Tout vider</button>` : ''}
  </div>`;

  // Inventory summary
  if (myG.length) {
    h += `<div class="inv-summary">
      <div class="inv-header">
        <h3>🌰 Inventaire graines & plants</h3>
        <span class="inv-count">${owned.length}/${myG.length} en stock</span>
      </div>
      <div class="inv-bar"><div class="inv-bar-fill" style="width:${myG.length ? Math.round(owned.length/myG.length*100) : 0}%"></div></div>
      ${missing.length ? `<div class="inv-missing">
        <div class="inv-missing-title">🛒 Liste de courses — ${missing.length} à acheter :</div>
        <div class="inv-missing-list">${missing.map(id => {
          const p = plantById(id);
          if (!p) return '';
          const rq = RECOMMENDED_QTY[id];
          return `<div class="inv-missing-item">
            <span>${p.e} ${p.n}</span>
            ${rq ? `<span class="inv-missing-qty">${rq.qty} ${rq.unit}</span>` : ''}
            <button class="inv-check-btn" onclick="event.stopPropagation();toggleInventory('${id}');renderSel()" title="J'ai !">✅</button>
          </div>`;
        }).join('')}</div>
      </div>` : `<div class="inv-complete">✅ Tu as tout en stock !</div>`}
    </div>`;
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
        const inInv = hasInInventory(p.id);
        return `<div class="plant-chip ${sel ? 'selected' : ''}" onclick="toggle('${p.id}');renderSel()">
          <div class="p-emoji">${p.e}</div>
          <div class="p-name">${sel ? '✅ ' : ''}${p.n}</div>
          <div class="p-diff ${p.d}">${DL[p.d]}</div>
          ${rq ? `<div class="p-qty">📦 ${rq.qty} ${rq.unit}</div>` : ''}
          ${acts.length ? `<div class="p-status">${acts.join(' ')} actif</div>` : ''}
          ${sel ? `<div class="p-inv-toggle ${inInv ? 'owned' : ''}" onclick="event.stopPropagation();toggleInventory('${p.id}');renderSel()">
            ${inInv ? '🌰 En stock' : '🛒 Pas en stock'}
          </div>` : ''}
        </div>`;
      }).join('')}</div>
    </div>`;
  });

  c.innerHTML = h;
  updCounts();
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
