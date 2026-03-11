// ============================
// 📋 DASHBOARD — Aujourd'hui + Tâches
// ============================

// Task checklist stored per day: { "2026-03-10": ["task-id-1", "task-id-2"] }
function getCheckedTasks() {
  try { return JSON.parse(localStorage.getItem('lpm-tasks') || '{}'); } catch { return {}; }
}
function saveCheckedTasks(data) {
  localStorage.setItem('lpm-tasks', JSON.stringify(data));
  syncToServer();
}
function todayKey() {
  return TODAY.toISOString().slice(0, 10);
}
function toggleTask(taskId) {
  const data = getCheckedTasks();
  const key = todayKey();
  if (!data[key]) data[key] = [];
  const idx = data[key].indexOf(taskId);
  if (idx === -1) data[key].push(taskId);
  else data[key].splice(idx, 1);
  saveCheckedTasks(data);
  renderDash();
}
function isTaskDone(taskId) {
  const data = getCheckedTasks();
  return (data[todayKey()] || []).includes(taskId);
}

// Clean old task data (keep last 30 days)
function cleanOldTasks() {
  const data = getCheckedTasks();
  const cutoff = new Date(TODAY);
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  Object.keys(data).forEach(k => { if (k < cutoffKey) delete data[k]; });
  saveCheckedTasks(data);
}

function renderDash() {
  const c = document.getElementById('dashContent');
  const dn = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  document.getElementById('todayDate').textContent =
    `${dn[TODAY.getDay()]} ${TODAY.getDate()} ${MN[NOW]} ${TODAY.getFullYear()} ${ME[NOW]}`;

  // Garden info bar
  const gb = document.getElementById('gardenBar');
  if (gb && gardenCode) {
    const gname = localStorage.getItem('lpm-garden-name') || 'Mon jardin';
    gb.innerHTML = `
      <div class="gb-info">
        <span class="gb-name">${gname}</span>
        <span class="gb-code" onclick="copyGardenCode()" title="Cliquer pour copier">${gardenCode}</span>
      </div>
      <div class="gb-actions">
        <button class="gb-btn" onclick="copyGardenCode()">Copier le code</button>
        <button class="gb-btn" onclick="exportGardenData()">💾 Sauvegarder</button>
        <button class="gb-btn gb-btn-danger" onclick="leaveGarden()">Quitter</button>
      </div>`;
  } else if (gb) { gb.innerHTML = ''; }

  const sel = PLANTS.filter(p => myG.includes(p.id));
  if (!sel.length) {
    c.innerHTML = `<div class="empty-state"><div class="big-emoji">🌱</div>
      <p>Ton potager est vide ! Choisis tes plantes.</p>
      <button class="btn" onclick="goTo('selection')">🌱 Choisir mes plantes</button></div>`;
    return;
  }

  cleanOldTasks();

  const toSow = sel.filter(p => inR(p.sow, NOW_H));
  const toPlant = sel.filter(p => inR(p.plant, NOW_H));
  const toHarv = sel.filter(p => inR(p.harvest, NOW_H));
  const waiting = sel.filter(p => !inR(p.sow, NOW_H) && !inR(p.plant, NOW_H) && !inR(p.harvest, NOW_H));
  const period = NOW_H % 2 === 0 ? 'Début' : 'Fin';
  const total = toSow.length + toPlant.length + toHarv.length;

  // Generate tasks
  const tasks = generateTasks(sel, toSow, toPlant, toHarv);
  const doneTasks = tasks.filter(t => isTaskDone(t.id));
  const todoPct = tasks.length ? Math.round(doneTasks.length / tasks.length * 100) : 0;

  let h = `<div class="dash-summary">
    <div class="dash-period">📍 ${period} ${MN[NOW]}</div>
    <div class="dash-stats">
      ${toSow.length ? `<div class="dash-stat sow"><span class="dash-num">${toSow.length}</span> à semer</div>` : ''}
      ${toPlant.length ? `<div class="dash-stat plant"><span class="dash-num">${toPlant.length}</span> à planter</div>` : ''}
      ${toHarv.length ? `<div class="dash-stat harvest"><span class="dash-num">${toHarv.length}</span> à récolter</div>` : ''}
      ${!total ? `<div class="dash-stat rest">😴 Rien à faire ce mois-ci</div>` : ''}
    </div>
  </div>`;

  // ═══════ PLANT STAGES TRACKER ═══════
  h += renderStagesTracker(sel);

  // Companion alerts
  const alerts = [];
  for (let i = 0; i < sel.length; i++) {
    for (let j = i + 1; j < sel.length; j++) {
      if (getCompanion(sel[i].id, sel[j].id) === -1) {
        alerts.push(`${sel[i].e} ${sel[i].n} + ${sel[j].e} ${sel[j].n}`);
      }
    }
  }
  if (alerts.length) {
    h += `<div class="dash-alerts">
      <div class="alert-title">⚠️ Attention aux associations</div>
      ${alerts.map(a => `<div class="alert-item">❌ ${a} — à éloigner</div>`).join('')}
      <div class="alert-link" onclick="goTo('encyclo')">→ Voir les associations</div>
    </div>`;
  }

  // ═══════ TASK CHECKLIST ═══════
  if (tasks.length) {
    h += `<div class="task-checklist">
      <div class="task-checklist-header">
        <h3>✅ Tâches du jour</h3>
        <div class="task-progress">
          <div class="task-progress-bar"><div class="task-progress-fill" style="width:${todoPct}%"></div></div>
          <span class="task-progress-text">${doneTasks.length}/${tasks.length}</span>
        </div>
      </div>`;

    // Group tasks by category
    const categories = {};
    tasks.forEach(t => {
      if (!categories[t.cat]) categories[t.cat] = { label: t.catLabel, icon: t.catIcon, tasks: [] };
      categories[t.cat].tasks.push(t);
    });

    Object.values(categories).forEach(cat => {
      const catDone = cat.tasks.filter(t => isTaskDone(t.id)).length;
      h += `<details class="task-cat-section" ${catDone < cat.tasks.length ? 'open' : ''}>
        <summary class="task-cat-header">${cat.icon} ${cat.label} <span class="task-cat-count">${catDone}/${cat.tasks.length}</span></summary>
        <div class="task-cat-list">`;

      cat.tasks.forEach(t => {
        const done = isTaskDone(t.id);
        h += `<div class="task-check-item ${done ? 'done' : ''}" onclick="toggleTask('${t.id}')">
          <span class="task-checkbox">${done ? '☑️' : '⬜'}</span>
          <div class="task-check-body">
            <div class="task-check-text">${t.text}</div>
            ${t.detail ? `<div class="task-check-detail">${t.detail}</div>` : ''}
          </div>
        </div>`;
      });

      h += '</div></details>';
    });

    h += '</div>';
  }

  // ═══════ PLANT SECTIONS ═══════
  if (toSow.length) h += dashSection('🌰 À semer', 'sow-title', toSow);
  if (toPlant.length) h += dashSection('🌱 À planter', 'plant-title', toPlant);
  if (toHarv.length) h += dashSection('🧺 À récolter', 'harvest-title', toHarv);
  if (waiting.length) h += dashSection('😴 En attente', 'wait-title', waiting);

  h += nextUp(sel);
  c.innerHTML = h;
}

// ═══════ STAGES TRACKER ═══════
function renderStagesTracker(sel) {
  const stageTypes = [
    { key: 'sow', label: '🌰 Semé', color: 'var(--sow)' },
    { key: 'plant', label: '🌱 Planté', color: 'var(--plant)' },
    { key: 'harvest', label: '🧺 Récolté', color: 'var(--harvest)' },
  ];

  // Count stages
  let totalStages = 0, doneStages = 0;
  sel.forEach(p => {
    const ps = getPlantStage(p.id);
    if (p.sow.length) { totalStages++; if (ps.sow) doneStages++; }
    if (p.plant.length) { totalStages++; if (ps.plant) doneStages++; }
    if (p.harvest.length) { totalStages++; if (ps.harvest) doneStages++; }
  });
  const pct = totalStages ? Math.round(doneStages / totalStages * 100) : 0;

  let h = `<div class="stages-tracker">
    <div class="stages-header">
      <h3>📊 Suivi de saison</h3>
      <div class="stages-progress">
        <div class="stages-progress-bar"><div class="stages-progress-fill" style="width:${pct}%"></div></div>
        <span class="stages-progress-text">${pct}%</span>
      </div>
    </div>
    <div class="stages-grid">`;

  sel.forEach(p => {
    const ps = getPlantStage(p.id);
    const rq = RECOMMENDED_QTY[p.id];
    h += `<div class="stage-plant">
      <div class="stage-plant-info">
        <span class="stage-emoji">${p.e}</span>
        <span class="stage-name">${p.n}</span>
        ${rq ? `<span class="stage-qty" title="${rq.note} (pour 2 pers.)">${getInventoryQty(p.id)}/${rq.qty} ${rq.unit}</span>` : ''}
      </div>
      <div class="stage-steps">`;

    if (p.sow.length) {
      const done = ps.sow;
      h += `<button class="stage-step ${done ? 'done' : ''}" style="${done ? 'background:var(--sow);color:#5a4000' : ''}"
        onclick="event.stopPropagation();setStage('${p.id}','sow');renderDash()" title="${done ? 'Semé le ' + done + ' — cliquer pour annuler' : 'Marquer comme semé'}">
        🌰 ${done ? done.slice(5) : 'Semer'}
      </button>`;
    }
    if (p.plant.length) {
      const done = ps.plant;
      h += `<button class="stage-step ${done ? 'done' : ''}" style="${done ? 'background:var(--plant);color:#fff' : ''}"
        onclick="event.stopPropagation();setStage('${p.id}','plant');renderDash()" title="${done ? 'Planté le ' + done + ' — cliquer pour annuler' : 'Marquer comme planté'}">
        🌱 ${done ? done.slice(5) : 'Planter'}
      </button>`;
    }
    if (p.harvest.length) {
      const done = ps.harvest;
      h += `<button class="stage-step ${done ? 'done' : ''}" style="${done ? 'background:var(--harvest);color:#fff' : ''}"
        onclick="event.stopPropagation();setStage('${p.id}','harvest');renderDash()" title="${done ? 'Récolté le ' + done + ' — cliquer pour annuler' : 'Marquer comme récolté'}">
        🧺 ${done ? done.slice(5) : 'Récolter'}
      </button>`;
    }

    h += `</div></div>`;
  });

  h += '</div></div>';
  return h;
}

// ═══════ TASK GENERATOR — Période-aware ═══════

function generateTasks(sel, toSow, toPlant, toHarv) {
  const tasks = [];
  const month = NOW; // 0-11
  const isWarm = month >= 4 && month <= 9;  // mai-oct
  const isHot = month >= 5 && month <= 8;   // juin-sep
  const isCold = month <= 2 || month >= 10; // nov-mar

  // Plants actually in the ground (planted AND been there long enough for care tasks)
  const inGround = sel.filter(p => {
    if (inR(p.harvest, NOW_H)) return true;
    if (!inR(p.plant, NOW_H)) return false;
    const range = p.plant.find(([s, e]) => NOW_H >= s && NOW_H <= e);
    return range && (NOW_H - range[0]) >= 2;
  });
  const beingSown = sel.filter(p => inR(p.sow, NOW_H) && !inR(p.plant, NOW_H));
  const comingSoon = sel.filter(p => {
    const next1 = NOW_H + 1, next2 = NOW_H + 2;
    return !inR(p.sow, NOW_H) && !inR(p.plant, NOW_H) && !inR(p.harvest, NOW_H)
      && (inR(p.sow, next1) || inR(p.sow, next2) || inR(p.plant, next1) || inR(p.plant, next2));
  });

  // ── 1. SEMIS ──
  if (month >= 1 && month <= 3) {
    const indoorSow = beingSown.filter(p => p.serre);
    indoorSow.forEach(p => {
      tasks.push({
        id: `sow-indoor-${p.id}`, cat: 'actions', catLabel: 'Semis & Plantations', catIcon: '🌱',
        text: `🏠 ${p.e} Semer ${p.n} en intérieur`,
        detail: `${p.t} · En godet ou terrine, au chaud (18-22°C)`
      });
    });
    const outdoorSow = beingSown.filter(p => !p.serre);
    outdoorSow.forEach(p => {
      tasks.push({
        id: `sow-${p.id}`, cat: 'actions', catLabel: 'Semis & Plantations', catIcon: '🌱',
        text: `${p.e} Semer ${p.n} en pleine terre`,
        detail: `${p.t} · Sol à 8°C+ minimum`
      });
    });
  } else {
    toSow.forEach(p => {
      tasks.push({
        id: `sow-${p.id}`, cat: 'actions', catLabel: 'Semis & Plantations', catIcon: '🌱',
        text: `${p.e} Semer ${p.n}`, detail: p.t
      });
    });
  }

  // Plantation
  toPlant.forEach(p => {
    const plantTip = getPlantingTip(p, NOW_H);
    const careHints = [];
    const soil = getCareField(p.id, 'soil');
    if (soil) careHints.push(soil.replace(/^[^\w\dÀ-ú]*/,'').split('.')[0]);
    const range = p.plant.find(([s, e]) => NOW_H >= s && NOW_H <= e);
    const isEarlyPhase = range && (NOW_H - range[0]) < 2;
    let detail = plantTip
      || `Espacement : ${p.spacing}cm entre plants, ${p.row || Math.round(p.spacing * 1.2)}cm entre rangs`
         + (careHints.length ? `. ${careHints[0]}` : '');
    const NEEDS_PREP = ['pdt', 'ail', 'echalote', 'oignon', 'poireau'];
    const verb = isEarlyPhase && NEEDS_PREP.includes(p.id) ? 'Préparer' : 'Planter';
    tasks.push({
      id: `plant-${p.id}`, cat: 'actions', catLabel: 'Semis & Plantations', catIcon: '🌱',
      text: `${p.e} ${verb} ${p.n}`, detail
    });
  });

  // Coming soon
  if (comingSoon.length) {
    comingSoon.forEach(p => {
      const nextAction = inR(p.sow, NOW_H + 1) || inR(p.sow, NOW_H + 2) ? 'semis' : 'plantation';
      tasks.push({
        id: `soon-${p.id}`, cat: 'actions', catLabel: 'Semis & Plantations', catIcon: '🌱',
        text: `⏳ ${p.e} ${p.n} : ${nextAction} bientôt !`,
        detail: `Préparer le matériel et l'emplacement`
      });
    });
  }

  // ── 2. RÉCOLTES ──
  toHarv.forEach(p => {
    tasks.push({
      id: `harvest-${p.id}`, cat: 'harvest', catLabel: 'Récoltes', catIcon: '🧺',
      text: `${p.e} Récolter ${p.n}`,
      detail: getCareField(p.id, 'harvest_tips') || ''
    });
  });

  // ── 3. ARROSAGE ──
  if (inGround.length && isWarm) {
    const waterHigh = inGround.filter(p => {
      const w = getCareField(p.id, 'water') || '';
      return w.includes('💧💧💧') || w.toLowerCase().includes('abondant') || w.toLowerCase().includes('régulier');
    });
    const waterLow = inGround.filter(p => !waterHigh.includes(p));

    if (waterHigh.length) {
      let detail;
      if (isHot) detail = 'Arroser le matin tôt ou le soir. Au pied, jamais le feuillage ! 2-3x par semaine minimum.';
      else if (month === 4 || month === 9) detail = 'Arroser si pas de pluie depuis 3-4 jours. Vérifier le sol en enfonçant le doigt.';
      else detail = 'Arroser si le sol est sec en surface.';
      tasks.push({
        id: 'water-high', cat: 'water', catLabel: 'Arrosage', catIcon: '💧',
        text: `💧💧💧 Arrosage abondant : ${waterHigh.map(p => p.e).join(' ')}`, detail
      });
    }
    if (waterLow.length) {
      tasks.push({
        id: 'water-low', cat: 'water', catLabel: 'Arrosage', catIcon: '💧',
        text: `💧 Arrosage léger : ${waterLow.map(p => p.e).join(' ')}`,
        detail: 'Vérifier l\'humidité avant d\'arroser — ces plantes préfèrent un sol pas trop humide'
      });
    }
  } else if (beingSown.length && month >= 2 && month <= 4) {
    tasks.push({
      id: 'water-seedlings', cat: 'water', catLabel: 'Arrosage', catIcon: '💧',
      text: `🌱💧 Maintenir les semis humides : ${beingSown.map(p => p.e).join(' ')}`,
      detail: 'Vaporiser ou arroser en pluie fine. Le terreau ne doit jamais sécher complètement.'
    });
  }

  // ── 4. ENTRETIEN ──
  if (inGround.length) {
    if (month >= 4 && month <= 7) {
      const toStake = inGround.filter(p =>
        ['tomate', 'poivron', 'piment', 'aubergine', 'concombre', 'haricot'].includes(p.id) &&
        (getCareField(p.id, 'pruning') || '').toLowerCase().includes('tuteur')
      );
      if (toStake.length) {
        tasks.push({
          id: 'stake', cat: 'care', catLabel: 'Entretien', catIcon: '✂️',
          text: `🪴 Vérifier les tuteurs : ${toStake.map(p => p.e).join(' ')}`,
          detail: 'Attacher les tiges sans serrer. Vérifier la solidité après le vent.'
        });
      }
    }

    inGround.forEach(p => {
      const pruning = getCareField(p.id, 'pruning');
      if (!pruning) return;
      tasks.push({
        id: `prune-${p.id}`, cat: 'care', catLabel: 'Entretien', catIcon: '✂️',
        text: `${p.e} ${p.n} : entretien`, detail: pruning
      });
    });

    if (isWarm) {
      const diseaseWatch = inGround.filter(p => getCareField(p.id, 'diseases'));
      if (diseaseWatch.length) {
        tasks.push({
          id: 'disease-check', cat: 'care', catLabel: 'Entretien', catIcon: '✂️',
          text: `🛡️ Inspecter maladies/ravageurs : ${diseaseWatch.map(p => p.e).join(' ')}`,
          detail: isHot
            ? 'Mildiou, oïdium, pucerons — inspecter feuilles matin et soir. Traiter dès les premiers signes.'
            : 'Vérifier limaces, pucerons, taches sur feuillage.'
        });
      }
    }
  }

  // ── 5. SAISONNIER ──
  const seasonal = getSeasonalTasks(month, sel, inGround, beingSown, comingSoon);
  seasonal.forEach(t => tasks.push(t));

  return tasks;
}

function getPlantingTip(p, nowH) {
  const plantRange = p.plant.find(([s, e]) => nowH >= s && nowH <= e);
  if (!plantRange) return '';
  const weekInPeriod = nowH - plantRange[0];
  const isEarlyInPeriod = weekInPeriod <= 1;

  const TIPS = {
    pdt: isEarlyInPeriod
      ? '🥔 Faire germer les tubercules à la lumière (2-3 semaines, 10°C). Préparer des sillons de 10-15cm. Planter quand sol ≥ 10°C, tous les 35cm, rangs espacés 65cm.'
      : '🥔 Planter les tubercules germés pointe en haut dans des sillons de 10-15cm. Espacement 35cm × 65cm. Butter dès 15cm de hauteur.',
    tomate: isEarlyInPeriod
      ? '🍅 Repiquer les plants achetés ou semés. Attendre fin des gelées ! Enterrer la tige jusqu\'aux premières feuilles. Tuteurer immédiatement.'
      : '🍅 Planter en plein soleil, 50cm entre plants. Enterrer profond, pailler le pied. Tuteurer dès la plantation.',
    courgette: isEarlyInPeriod
      ? '🥒 Attendre que le sol soit chaud (15°C+). 1m entre plants. Apporter beaucoup de compost. 2-3 pieds suffisent !'
      : '🥒 Planter en terre enrichie. 80cm-1m entre plants. Pailler généreusement. Arroser au pied.',
    poivron: isEarlyInPeriod
      ? '🫑 Très frileux ! Ne pas planter avant fin mai. Sol chaud, exposition abritée. 45cm entre plants.'
      : '🫑 Planter en sol chaud, plein soleil. 45cm × 60cm. Pailler le pied. Tuteur conseillé.',
    aubergine: isEarlyInPeriod
      ? '🍆 Encore plus frileuse que le poivron ! Sol chaud obligatoire (18°C+). Abriter du vent.'
      : '🍆 Planter en plein soleil, sol riche et chaud. 50cm entre plants. Arrosage régulier.',
    salade: '🥬 Planter tous les 25cm. Ne pas enterrer le collet ! Arroser à la plantation. Semer un nouveau lot toutes les 2-3 semaines.',
    oignon: '🧅 Planter les bulbilles pointe en haut, à peine enfoncés. 12cm × 25cm. Sol drainé, pas de fumier frais.',
    ail: '🧄 Planter les caïeux pointe en haut à 3cm de profondeur. 12cm × 25cm. Sol léger et drainant.',
    echalote: 'Planter les bulbes pointe en haut, à fleur de terre. 15cm × 25cm. Sol bien drainé.',
    poireau: '🧅 Habiller les plants (couper racines à 2cm, feuilles à 15cm). Planter en sillon profond, 10cm × 40cm. Butter régulièrement.',
    chou: '🥦 Planter profond, jusqu\'aux premières feuilles. 40-50cm entre plants. Sol riche, ferme. Filet anti-piéride conseillé.',
    celeri: 'Ne pas enterrer le cœur. 30cm entre plants. Sol riche, frais. Arrosage très régulier.',
    fraise: '🍓 Planter en sol riche, en butte si sol lourd. 30cm entre plants. Pailler avec de la paille. Ne pas enterrer le cœur.',
  };

  return TIPS[p.id] || '';
}

function getCareField(plantId, field) {
  if (typeof CARE_DATA === 'undefined' || !CARE_DATA || !CARE_DATA[plantId]) return '';
  return CARE_DATA[plantId][field] || '';
}

function getSeasonalTasks(month, sel, inGround, beingSown, comingSoon) {
  const tasks = [];
  const base = { cat: 'seasonal', catLabel: 'Saison', catIcon: '📅' };

  // ── HIVER (Dec-Fev) ──
  if (month >= 11 || month <= 1) {
    tasks.push({ ...base, id: 'plan-season', text: '📝 Planifier la saison', detail: 'Commander les graines, vérifier le stock, planifier les rotations de cultures' });
    if (month === 1) {
      tasks.push({ ...base, id: 'prune-fruit', text: '✂️ Tailler les arbres fruitiers (si temps sec)', detail: 'Taille de formation en février, hors gel' });
    }
    if (sel.some(p => p.serre) && month >= 1) {
      const serrePlants = sel.filter(p => p.serre && inR(p.sow, month * 2) || inR(p.sow, month * 2 + 1));
      if (serrePlants.length) {
        tasks.push({ ...base, id: 'check-shelter',
          text: `🏠 Vérifier l'abri/serre pour semis`,
          detail: `Préparer pour ${serrePlants.map(p => p.e + ' ' + p.n).join(', ')}`
        });
      }
    }
    tasks.push({ ...base, id: 'tool-care', text: '🔧 Entretenir les outils', detail: 'Nettoyer, affûter, huiler les outils' });
    if (month === 11) {
      tasks.push({ ...base, id: 'rest-plan', text: '📋 Bilan de saison', detail: 'Noter les réussites, échecs, variétés préférées, problèmes rencontrés' });
    }
  }

  // ── PRINTEMPS PREP (Mars) ──
  if (month === 2) {
    tasks.push({ ...base, id: 'prep-soil', text: '🪱 Préparer le sol', detail: 'Aérer à la grelinette (pas bêcher !), apporter 3-5 cm de compost mûr' });
    tasks.push({ ...base, id: 'check-seeds', text: '🌰 Vérifier les graines', detail: 'Tester la germination des vieilles graines. Commander ce qui manque.' });
    if (comingSoon.length) {
      tasks.push({ ...base, id: 'prep-beds',
        text: `🛏️ Préparer les planches pour : ${comingSoon.map(p => p.e).join(' ')}`,
        detail: 'Désherber, aérer et amender les emplacements prévus'
      });
    }
  }

  // ── PRINTEMPS (Avril) ──
  if (month === 3) {
    if (beingSown.filter(p => p.serre).length) {
      tasks.push({ ...base, id: 'harden', text: '🌱 Endurcir les plants', detail: 'Sortir les semis d\'intérieur quelques heures par jour, à l\'abri du vent' });
    }
    tasks.push({ ...base, id: 'compost-spread', text: '🔲 Épandre le compost sur les planches', detail: '3-5 cm en surface, ne pas enfouir' });
  }

  // ── MAI ──
  if (month === 4) {
    tasks.push({ ...base, id: 'frost-watch', text: '❄️ Saints de Glace (11-13 mai)', detail: 'Ne pas planter tomates, courgettes, poivrons dehors avant mi-mai !' });
    tasks.push({ ...base, id: 'mulch-start', text: '🍂 Commencer le paillage', detail: 'Pailler 5-10 cm (paille, BRF, tonte séchée) pour garder l\'humidité' });
  }

  // ── ÉTÉ (Juin-Août) ──
  if (month >= 5 && month <= 7) {
    if (inGround.length) {
      tasks.push({ ...base, id: 'mulch-check', text: '🍂 Compléter le paillage', detail: 'Maintenir 5-10 cm. Réduit l\'arrosage de 50% et empêche les adventices' });
      tasks.push({ ...base, id: 'weed', text: '🌿 Désherber', detail: 'Arracher les adventices avant montée en graines, surtout entre les rangs' });
    }
    if (month >= 6) {
      tasks.push({ ...base, id: 'fall-prep', text: '🍁 Préparer l\'automne', detail: 'Semer mâche, épinards, navets pour l\'automne. Planifier les engrais verts.' });
    }
  }

  // ── SEPTEMBRE ──
  if (month === 8) {
    if (inGround.length) {
      tasks.push({ ...base, id: 'harvest-preserve', text: '🫙 Conserver les surplus', detail: 'Congeler, sécher, stériliser, lacto-fermenter les excédents de récolte' });
    }
    tasks.push({ ...base, id: 'green-manure', text: '🌱 Semer engrais verts', detail: 'Moutarde, phacélie, trèfle sur les planches libérées' });
  }

  // ── AUTOMNE (Oct-Nov) ──
  if (month >= 9 && month <= 10) {
    tasks.push({ ...base, id: 'cleanup', text: '🧹 Nettoyer les planches', detail: 'Retirer les plants finis, composter (sauf malades)' });
    tasks.push({ ...base, id: 'protect-winter', text: '🛡️ Protéger pour l\'hiver', detail: 'Pailler épais (15-20 cm), voile d\'hivernage sur cultures tardives' });
    tasks.push({ ...base, id: 'compost-turn', text: '🔲 Retourner le compost', detail: 'Aérer le tas pour accélérer la décomposition' });
  }

  // ── Désherbage : avril-octobre seulement ──
  if (month >= 3 && month <= 9 && inGround.length && month < 5) {
    tasks.push({ ...base, id: 'weed', text: '🌿 Désherber les allées', detail: 'Retirer les adventices avant qu\'elles ne colonisent les planches' });
  }

  return tasks;
}

// ═══════ EXISTING SECTIONS ═══════

function dashSection(title, cls, list) {
  return `<div class="action-section">
    <div class="action-title ${cls}">${title} <span class="count">${list.length}</span></div>
    <div class="task-list">${list.map(dashCard).join('')}</div>
  </div>`;
}

function dashCard(p) {
  let when = '';
  if (inR(p.sow, NOW_H)) {
    const end = p.sow.find(([s, e]) => NOW_H >= s && NOW_H <= e);
    if (end) when = `Semis → ${halfLabel(end[1])}`;
  }
  if (inR(p.plant, NOW_H)) {
    const end = p.plant.find(([s, e]) => NOW_H >= s && NOW_H <= e);
    if (end) when += (when ? ' · ' : '') + `Plant. → ${halfLabel(end[1])}`;
  }
  if (inR(p.harvest, NOW_H)) {
    const end = p.harvest.find(([s, e]) => NOW_H >= s && NOW_H <= e);
    if (end) when += (when ? ' · ' : '') + `Récolte → ${halfLabel(end[1])}`;
  }

  return `<div class="task-card">
    <div class="emoji">${p.e}</div>
    <div class="info">
      <div class="name">${p.n}</div>
      <div class="tip">💡 ${p.t}</div>
      ${when ? `<div class="when">⏰ ${when}</div>` : ''}
      <div class="actions-tags">${actionTags(p)}</div>
      ${miniBar24(p)}
    </div>
  </div>`;
}

function nextUp(sel) {
  let h = '<div class="next-up"><h3>📅 Les prochains mois</h3>';
  for (let off = 1; off <= 5; off++) {
    const m = (NOW + off) % 12;
    const mh = m * 2;
    const items = [];
    sel.forEach(p => {
      if (inR(p.sow, mh) || inR(p.sow, mh + 1)) items.push({ p, a: 'sow' });
      if (inR(p.plant, mh) || inR(p.plant, mh + 1)) items.push({ p, a: 'plant' });
      if (inR(p.harvest, mh) || inR(p.harvest, mh + 1)) items.push({ p, a: 'harvest' });
    });
    if (!items.length) continue;
    h += `<div class="timeline-item">
      <div class="timeline-month">${ME[m]} ${MN[m]}</div>
      <div class="timeline-plants">${items.map(it =>
        `<span class="timeline-chip ${it.a}">${it.p.e} ${it.p.n}</span>`
      ).join('')}</div>
    </div>`;
  }
  return h + '</div>';
}
