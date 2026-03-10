// ============================
// 📅 CALENDAR — Calendrier annuel
// ============================

function renderCal() {
  const g = document.getElementById('calGrid');
  const sel = PLANTS.filter(p => myG.includes(p.id));

  if (!sel.length) {
    g.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="big-emoji">📅</div><p>Sélectionne des plantes d'abord !</p>
      <button class="btn" onclick="goTo('selection')">🌱 Choisir</button></div>`;
    return;
  }

  g.innerHTML = MN.map((name, m) => {
    const mh0 = m * 2, mh1 = m * 2 + 1;
    const sw = sel.filter(p => inR(p.sow, mh0) || inR(p.sow, mh1));
    const pl = sel.filter(p => inR(p.plant, mh0) || inR(p.plant, mh1));
    const hv = sel.filter(p => inR(p.harvest, mh0) || inR(p.harvest, mh1));

    let tasks = '';
    sw.forEach(p => {
      const deb = inR(p.sow, mh0), fin = inR(p.sow, mh1);
      const w = deb && fin ? '' : ` <small class="half-hint">${deb ? 'début' : 'fin'}</small>`;
      tasks += `<div class="cal-task sow">🌰 ${p.e} ${p.n}${w}</div>`;
    });
    pl.forEach(p => {
      const deb = inR(p.plant, mh0), fin = inR(p.plant, mh1);
      const w = deb && fin ? '' : ` <small class="half-hint">${deb ? 'début' : 'fin'}</small>`;
      tasks += `<div class="cal-task plant">🌱 ${p.e} ${p.n}${w}</div>`;
    });
    hv.forEach(p => {
      const deb = inR(p.harvest, mh0), fin = inR(p.harvest, mh1);
      const w = deb && fin ? '' : ` <small class="half-hint">${deb ? 'début' : 'fin'}</small>`;
      tasks += `<div class="cal-task harvest">🧺 ${p.e} ${p.n}${w}</div>`;
    });
    if (!tasks) tasks = '<div class="cal-nothing">Rien ce mois 😴</div>';

    return `<div class="cal-month ${m === NOW ? 'current' : ''}">
      <div class="cal-month-header">
        <span class="m-emoji">${ME[m]}</span>
        <span class="m-name">${name}</span>
        ${m === NOW ? '<span class="m-label">maintenant</span>' : ''}
      </div>
      <div class="cal-tasks">${tasks}</div>
    </div>`;
  }).join('');
}
