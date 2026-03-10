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
        return `<div class="plant-chip ${sel ? 'selected' : ''}" onclick="toggle('${p.id}');renderSel()">
          <div class="p-emoji">${p.e}</div>
          <div class="p-name">${sel ? '✅ ' : ''}${p.n}</div>
          <div class="p-diff ${p.d}">${DL[p.d]}</div>
          ${acts.length ? `<div class="p-status">${acts.join(' ')} actif</div>` : ''}
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
}

function selAll() {
  PLANTS.forEach(p => { if (!myG.includes(p.id)) myG.push(p.id); });
  save(); renderSel();
}

function clearAll() { myG = []; save(); renderSel(); }
