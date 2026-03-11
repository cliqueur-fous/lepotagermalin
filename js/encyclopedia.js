// ============================
// 📖 ENCYCLOPEDIA — Toutes les plantes
// ============================

let eF = { cat: 'all', acts: [], diffs: [], search: '' };

function initEncyclo() {
  document.querySelectorAll('.chip[data-ecat]').forEach(ch => {
    ch.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-ecat]').forEach(c => c.classList.remove('active'));
      ch.classList.add('active');
      eF.cat = ch.dataset.ecat;
      renderEnc();
    });
  });

  document.querySelectorAll('.chip[data-eaction]').forEach(ch => {
    ch.addEventListener('click', () => {
      const a = ch.dataset.eaction;
      const i = eF.acts.indexOf(a);
      if (i === -1) { eF.acts.push(a); ch.classList.add(a + '-active'); }
      else { eF.acts.splice(i, 1); ch.classList.remove(a + '-active'); }
      renderEnc();
    });
  });

  document.querySelectorAll('.chip[data-ediff]').forEach(ch => {
    ch.addEventListener('click', () => {
      const d = ch.dataset.ediff;
      const i = eF.diffs.indexOf(d);
      if (i === -1) { eF.diffs.push(d); ch.classList.add('active'); }
      else { eF.diffs.splice(i, 1); ch.classList.remove('active'); }
      renderEnc();
    });
  });

  document.getElementById('eSearch').addEventListener('input', e => {
    eF.search = e.target.value.toLowerCase();
    renderEnc();
  });
}

function renderEnc() {
  const g = document.getElementById('eGrid');
  let f = [...PLANTS];

  if (eF.cat === 'mine') f = f.filter(p => myG.includes(p.id));
  else if (eF.cat !== 'all') f = f.filter(p => p.c === eF.cat);
  if (eF.acts.length) {
    f = f.filter(p => eF.acts.some(a => {
      if (a === 'sow') return inR(p.sow, NOW_H);
      if (a === 'plant') return inR(p.plant, NOW_H);
      if (a === 'harvest') return inR(p.harvest, NOW_H);
    }));
  }
  if (eF.diffs.length) f = f.filter(p => eF.diffs.includes(p.d));
  if (eF.search) f = f.filter(p => p.n.toLowerCase().includes(eF.search));

  f.sort((a, b) => {
    const aG = myG.includes(a.id) ? 0 : 1, bG = myG.includes(b.id) ? 0 : 1;
    if (aG !== bG) return aG - bG;
    const aA = (inR(a.sow, NOW_H) || inR(a.plant, NOW_H) || inR(a.harvest, NOW_H)) ? 0 : 1;
    const bA = (inR(b.sow, NOW_H) || inR(b.plant, NOW_H) || inR(b.harvest, NOW_H)) ? 0 : 1;
    if (aA !== bA) return aA - bA;
    return a.n.localeCompare(b.n, 'fr');
  });

  const igc = f.filter(p => myG.includes(p.id)).length;
  document.getElementById('eResults').innerHTML = `
    <span>${f.length} plante${f.length > 1 ? 's' : ''}
    ${igc ? ` · <b class="text-accent">${igc} dans ton potager</b>` : ''}</span>
    ${eF.acts.length || eF.diffs.length || eF.search
      ? `<button class="btn-sm" onclick="resetEF()">🔄 Reset</button>` : ''}`;

  if (!f.length) {
    g.innerHTML = '<div class="e-no">😢 Aucun résultat</div>';
    return;
  }

  g.innerHTML = f.map(p => {
    const ig = myG.includes(p.id);
    const comp = getCompanionsFor(p.id);
    const goodPlants = comp.good.map(id => plantById(id)).filter(Boolean);
    const badPlants = comp.bad.map(id => plantById(id)).filter(Boolean);
    const rq = RECOMMENDED_QTY[p.id];

    return `<div class="e-card ${ig ? 'in-garden' : ''}">
      <button class="e-add ${ig ? 'added' : ''}" onclick="toggle('${p.id}');renderEnc()">
        ${ig ? '✅ Potager' : '➕ Ajouter'}</button>
      <div class="e-top">
        <span class="e-emoji">${p.e}</span>
        <div>
          <div class="e-name">${p.n} <span class="e-diff ${p.d}">${DL[p.d]}</span></div>
          <div class="e-cat">${p.c} · ${p.spacing}cm entre plants · ${p.perM2}/m²${p.serre ? ' · 🏠 serre' : ''}${rq ? ` · ${rq.qty} ${rq.unit} pour 2 pers.` : ''}</div>
        </div>
      </div>
      <div class="e-tip">💡 ${p.t}</div>
      <div class="e-actions">${actionTags(p)}</div>
      ${miniBar24(p)}
      ${encCareBlock(p)}
      ${goodPlants.length || badPlants.length ? `<div class="e-assoc-section">
        <div class="e-assoc-title">🤝 Associations</div>
        ${goodPlants.length ? `<div class="e-assoc-group e-assoc-good">
          <div class="e-assoc-label">✅ Planter à côté</div>
          <div class="e-assoc-list">${goodPlants.map(x =>
            `<span class="e-assoc-chip good" title="${x.n}">${x.e} ${x.n}</span>`
          ).join('')}</div>
        </div>` : ''}
        ${badPlants.length ? `<div class="e-assoc-group e-assoc-bad">
          <div class="e-assoc-label">❌ Éloigner</div>
          <div class="e-assoc-list">${badPlants.map(x =>
            `<span class="e-assoc-chip bad" title="${x.n}">${x.e} ${x.n}</span>`
          ).join('')}</div>
        </div>` : ''}
      </div>` : ''}
    </div>`;
  }).join('');
}

function resetEF() {
  eF = { cat: 'all', acts: [], diffs: [], search: '' };
  document.getElementById('eSearch').value = '';
  document.querySelectorAll('.chip[data-ecat]').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip[data-ecat="all"]').classList.add('active');
  document.querySelectorAll('.chip[data-eaction]').forEach(c => {
    c.classList.remove('sow-active', 'plant-active', 'harvest-active');
  });
  document.querySelectorAll('.chip[data-ediff]').forEach(c => c.classList.remove('active'));
  renderEnc();
}

function encCareBlock(p) {
  if (typeof CARE_DATA === 'undefined' || !CARE_DATA[p.id]) return '';
  const c = CARE_DATA[p.id];
  return `<details class="e-care-details">
    <summary class="e-care-toggle">🔧 Entretien & soins</summary>
    <div class="e-care">
      ${c.water ? `<div class="e-care-item"><span class="e-care-icon">💧</span> ${c.water}</div>` : ''}
      ${c.sun ? `<div class="e-care-item"><span class="e-care-icon">☀️</span> ${c.sun}</div>` : ''}
      ${c.soil ? `<div class="e-care-item"><span class="e-care-icon">🪱</span> ${c.soil}</div>` : ''}
      ${c.pruning ? `<div class="e-care-item"><span class="e-care-icon">✂️</span> ${c.pruning}</div>` : ''}
      ${c.diseases ? `<div class="e-care-item"><span class="e-care-icon">🛡️</span> ${c.diseases}</div>` : ''}
    </div>
  </details>`;
}

document.addEventListener('DOMContentLoaded', initEncyclo);
