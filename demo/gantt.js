// ─── GANTT ────────────────────────────────────────────────────────────────────
// Module extrait de index.html. Dépend de globales définies dans index.html :
// ofs, archives, machines, calcDates(), clientStyle(), deadlineStatus(), openDetail(),
// scheduleSave(), render(), showToast(), fmtDate(), lookupTC(), HEURES_PAR_JOUR,
// MACHINE_ORDER, machineSortIndex().
// Chargé via <script src="/gantt.js"></script> APRÈS le script inline principal
// (même convention que pdp.js/stock.js/besoins.js/commandes.js) : le routeur
// n'appelle renderGantt() qu'au clic sur l'onglet Gantt, jamais au chargement
// initial (vue par défaut = 'kanban'), donc pas de souci d'ordre de chargement.
// MACHINE_ORDER n'est PAS redéclarée ici : elle est définie une seule fois dans
// index.html (le Kanban/la Liste en ont besoin dès le tout premier rendu, avant
// que ce fichier soit chargé). Une redéclaration `const MACHINE_ORDER` ici
// provoquerait une erreur fatale "already been declared" au chargement de la page.

let ganttZoom = 'day';
let ganttShowArchived = false;

// Source unique pour la largeur de colonne et la largeur de la colonne
// "Machine" — AVANT, le rendu (renderGantt) utilisait colW=30/labelW=110
// tandis que le drag (ganttMoveMove/ganttResizeMove/updateGanttBarPreview)
// utilisait colW=36/labelW=130. Ce décalage désynchronisait la position de
// la tuile affichée pendant le déplacement par rapport à la grille de jours
// réellement dessinée, ce qui rendait le drag imprécis. Tout le monde doit
// maintenant lire ces deux fonctions/constantes plutôt que des valeurs codées
// en dur localement.
function ganttColW() { return ganttZoom === 'day' ? 30 : 90; }
const GANTT_LABEL_W = 110;

function getMachineOrder() {
  // Machines dans l'ordre défini + celles hors liste à la fin
  const fromMachines = machines.map(m=>m.name);
  const ordered = MACHINE_ORDER.filter(m => fromMachines.includes(m) || ofs.some(o=>o.machine===m));
  const others = [...new Set(ofs.map(o=>o.machine).filter(m=>m&&!ordered.includes(m)))].sort();
  const noMachine = ofs.some(o=>!o.machine) ? ['Non assigné'] : [];
  return [...ordered, ...others, ...noMachine];
}

function renderGantt() {
  const el = document.getElementById('view-gantt');
  if (!el) return;

  const today = new Date(); today.setHours(0,0,0,0);

  // OF à afficher selon le mode
  // En vue "en cours" : les OF encore en amont/pendant l'usinage. "attente"
  // vient APRÈS l'usinage dans l'ordre des étapes (creation → usinage →
  // attente → contrôle → joint) — un OF en attente a donc déjà quitté la
  // machine et ne doit plus s'afficher, demandé par Stéphane le 18/08/2026
  // ("les OF disparaissent une fois qu'ils ne sont plus en usinage").
  const STAGES_GANTT = ['creation', 'usinage'];
  const ofsActifs = ganttShowArchived
    ? archives.filter(a => a.archivedAt)
    : ofs.filter(o => STAGES_GANTT.includes(o.stage));

  const machineOrder = getMachineOrder();

  // Regrouper les OF par machine
  const byMachine = {};
  machineOrder.forEach(m => { byMachine[m] = []; });
  ofsActifs.forEach(o => {
    const m = o.machine || 'Non assigné';
    if (!byMachine[m]) byMachine[m] = [];
    byMachine[m].push(o);
  });

  // Plage de dates
  let minDate = new Date(today); minDate.setDate(minDate.getDate()-5);
  let maxDate = new Date(today); maxDate.setDate(maxDate.getDate()+60);
  ofs.forEach(o => {
    const {dates} = calcDates(o);
    if (o.date) { const d=new Date(o.date+'T00:00:00'); if(d<minDate) minDate=new Date(d); }
    if (dates.boite) { const d=new Date(dates.boite+'T00:00:00'); if(d>maxDate) maxDate=new Date(d); }
  });

  // Colonnes
  const cols = [];
  const cur = new Date(minDate);
  while (cur <= maxDate) {
    cols.push(new Date(cur));
    if (ganttZoom==='day') cur.setDate(cur.getDate()+1);
    else cur.setDate(cur.getDate()+7);
  }
  _ganttCols = [...cols];

  const colW   = ganttColW();
  const labelW = GANTT_LABEL_W;
  const rowH   = 48;
  const totalW = labelW + cols.length * colW;

  // En-tête mois
  const months = [];
  cols.forEach((d,i) => {
    const key = d.getFullYear()+'-'+d.getMonth();
    if (!months.length || months[months.length-1].key!==key)
      months.push({key, label:d.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}), startIdx:i, count:1});
    else months[months.length-1].count++;
  });
  const monthHeader = months.map(m => `<div class="gt-month" style="left:${m.startIdx*colW}px;width:${m.count*colW}px"><span>${m.label}</span></div>`).join('');

  // En-tête jours
  const dayHeader = cols.map((d,i) => {
    const we = d.getDay()===0||d.getDay()===6, td = d.toDateString()===today.toDateString(), mo = d.getDay()===1&&ganttZoom==='day';
    const label = ganttZoom==='day'
      ? `<small>${['D','L','M','M','J','V','S'][d.getDay()]}</small><b>${d.getDate()}</b>`
      : `<small>S${getWeekNum(d)}</small><b>${d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}</b>`;
    return `<div class="gt-day${we?' we':''}${td?' today':''}${mo?' mon':''}" style="left:${i*colW}px;width:${colW}px">${label}</div>`;
  }).join('');

  // Ligne de today
  const todayX = dateToPx(today, cols, colW, labelW, ganttZoom);

  const maxQ = Math.max(1, ...Object.values(byMachine).map(l=>l.reduce((a,o)=>a+(Number(o.qty)||0),0)));
  // Lignes par machine
  const rows = machineOrder.filter(m => byMachine[m]?.length > 0 || true).map((machine, rowIdx) => {
    const machineOfs = byMachine[machine] || [];
    const machineInfo = machines.find(m=>m.name===machine);
    const isPanne = machineInfo?.status==='panne';
    const rowBg = rowIdx%2===0 ? 'var(--surface)' : 'var(--bg)';

    // Fond avec weekends
    const bgCells = cols.map((d,i) => {
      const we = d.getDay()===0||d.getDay()===6, td = d.toDateString()===today.toDateString(), mo = d.getDay()===1&&ganttZoom==='day';
      return `<div class="gt-cell${we?' we':''}${td?' today':''}${mo?' mon':''}" style="left:${i*colW}px;width:${colW}px"></div>`;
    }).join('');

    // Barres des OF
    const mQty = machineOfs.reduce((s,o)=>s+(Number(o.qty)||0),0);
    const bars = machineOfs.map(o => {
      const {dates} = calcDates(o);
      const cs = clientStyle(o.produit);
      const startRaw = !ganttShowArchived && o.date_usinage_debut ? o.date_usinage_debut : o.date;
      const startDate = startRaw ? new Date(startRaw+'T00:00:00') : null;
      const endRaw = ganttShowArchived ? o.archivedAt : (o.date_usinage_fin || dates.usinage);
      const endDate = endRaw ? new Date(endRaw+'T00:00:00') : (startDate?new Date(startDate.getTime()+86400000*2):null);
      if (!startDate||!endDate) return '';
      const late = !ganttShowArchived && (deadlineStatus(dates[o.stage], o.stage)==='late' || endDate < today);
      const lateDays = late ? Math.max(0, Math.round((today - endDate)/86400000)) : 0;
      const prog = ganttShowArchived ? 100 : Math.max(0, Math.min(100, (today - startDate)/Math.max(86400000, endDate - startDate)*100));
      const left  = dateToPx(startDate, cols, colW, labelW, ganttZoom) - labelW;
      const right = dateToPx(endDate,   cols, colW, labelW, ganttZoom) - labelW;
      const width = Math.max(colW*0.8, right-left);
      const q = Number(o.qty)||0, qk = q>=1000 ? (q/1000).toFixed(q%1000?1:0).replace('.',',')+'k' : q;
      const startLbl = typeof fmtDate === 'function' ? fmtDate(startDate.toISOString().slice(0,10)) : startDate.toLocaleDateString('fr-FR');
      const endLbl = typeof fmtDate === 'function' ? fmtDate(endDate.toISOString().slice(0,10)) : endDate.toLocaleDateString('fr-FR');
      return `<div class="gantt-bar${late?' late':''}" data-id="${o.id}"
        title="${o.id} — ${o.produit} (${q.toLocaleString('fr')} u.)&#10;${startLbl} → ${endLbl}${late?'&#10;Date de fin dépassée'+(lateDays?' de '+lateDays+' j':''):''}"
        style="left:${left}px;width:${width}px;top:7px;height:${rowH-14}px;--c:${cs.dot};--bg:${cs.bg};--tx:${cs.text}"
        onclick="if(!ganttDragging)openDetail('${o.id}')"
        onmousedown="ganttMoveStart(event,'${o.id}')"
        ontouchstart="ganttMoveStart(event,'${o.id}')">
        <i class="gb-prog" style="width:${prog}%"></i>
        <span class="gb-t"><b>${o.id.replace('OF-','')}</b><em>${o.produit}</em><u>${qk}</u>${lateDays?`<s>+${lateDays} j</s>`:''}</span>
        <span class="gantt-resize-handle gb-h l" onmousedown="event.stopPropagation();ganttResizeStart(event,'${o.id}','left')" ontouchstart="event.stopPropagation();ganttResizeStart(event,'${o.id}','left')"><span class="gantt-resize-grip"></span></span>
        <span class="gantt-resize-handle gb-h r" onmousedown="event.stopPropagation();ganttResizeStart(event,'${o.id}','right')" ontouchstart="event.stopPropagation();ganttResizeStart(event,'${o.id}','right')"><span class="gantt-resize-grip"></span></span>
      </div>`;
    }).join('');

    if (!machineOfs.length) return ''; // cacher les machines sans OF

    return `
      <div class="gt-row ${rowIdx%2?'odd':''}" style="height:${rowH}px">
        <div class="gt-lab" style="width:${labelW}px">
          <b class="${isPanne?'down':''}">${machine}</b>
          ${isPanne?'<em>⚠ En panne</em>':`<small>${machineOfs.length} OF · ${mQty>=1000?Math.round(mQty/1000)+'k':mQty}</small>`}
          <i style="--w:${Math.round(mQty/maxQ*100)}%"></i>
        </div>
        <div class="gt-track">
          ${bgCells}
          ${bars}
        </div>
      </div>`;
  }).filter(Boolean).join('');

  const legendClients = [];
  { const seen = new Set(); Object.values(byMachine).flat().forEach(o => { const c = (typeof detectClientFull==='function' && detectClientFull(o.produit)) || 'Autre'; if (seen.has(c)) return; seen.add(c); legendClients.push([c, clientStyle(o.produit).dot]); }); }
  const nBars = Object.values(byMachine).reduce((s,l)=>s+l.length,0);
  el.innerHTML = `
    <div class="gt-scroll" id="gantt-scroll">
      <div class="gt-top">
        <div class="gt-seg">
          <button class="${ganttZoom==='day'?'on':''}" onclick="setGanttZoom('day')">Jour</button>
          <button class="${ganttZoom==='week'?'on':''}" onclick="setGanttZoom('week')">Semaine</button>
        </div>
        <span class="gt-count"><b>${ofsActifs.length}</b> OF · <b>${machineOrder.filter(m=>byMachine[m]?.length).length}</b> machines</span>
        <div class="gt-leg">${legendClients.slice(0,8).map(c=>`<span><s style="background:${c[1]}"></s>${c[0]}</span>`).join('')}<span><s class="late"></s>En retard</span></div>
        <div class="gt-btns">
          <button class="${ganttShowArchived?'on':''}" onclick="toggleGanttArchived()"><i class="ti ti-archive"></i>${ganttShowArchived ? 'OF archivés' : 'OF en cours'}</button>
          <button class="gt-today-btn" onclick="ganttScrollToday()"><i class="ti ti-calendar"></i>Aujourd'hui</button>
        </div>
      </div>
      <div class="gt-canvas" style="width:${totalW}px;min-width:100%">
        <div class="gt-h1"><div class="gt-corner" style="width:${labelW}px"></div><div class="gt-hrow" style="height:24px">${monthHeader}</div></div>
        <div class="gt-h2"><div class="gt-corner" style="width:${labelW}px">Machine</div><div class="gt-hrow" style="height:34px">${dayHeader}</div></div>
        <div class="gt-todayline" style="left:${todayX}px"></div>
        ${rows || '<div class="gt-none"><i class="ti ti-calendar-off"></i>Aucun OF avec machine assignée</div>'}
      </div>
    </div>`;

  // Scroller vers aujourd'hui automatiquement
  setTimeout(() => ganttScrollToday(), 50);
}


function toggleGanttArchived() {
  ganttShowArchived = !ganttShowArchived;
  renderGantt();
}

function ganttScrollToday() {
  const scroll = document.getElementById('gantt-scroll');
  if (!scroll) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const x = dateToPx(today, _ganttCols, ganttColW(), GANTT_LABEL_W, ganttZoom);
  // Centre aujourd'hui au milieu de la zone visible (en tenant compte de la
  // colonne "Machine" collée à gauche, qui reste toujours visible grâce à
  // position:sticky et ne doit donc pas être comptée dans l'espace dispo).
  const viewportW = scroll.clientWidth || 800;
  scroll.scrollLeft = Math.max(0, x - GANTT_LABEL_W - (viewportW - GANTT_LABEL_W) / 2);
  // Si aucune barre n'est visible autour d'aujourd'hui (OF anciens), on se place sur la première barre
  try {
    const sr = scroll.getBoundingClientRect();
    const bars = [...scroll.querySelectorAll('.gantt-bar')];
    const vis = bars.some(b => { const r = b.getBoundingClientRect(); return r.right > sr.left + GANTT_LABEL_W && r.left < sr.right; });
    if (bars.length && !vis) {
      const first = bars.reduce((m, b) => b.getBoundingClientRect().left < m.getBoundingClientRect().left ? b : m);
      scroll.scrollLeft += first.getBoundingClientRect().left - sr.left - GANTT_LABEL_W - 40;
    }
  } catch (e) {}
}


function dateToPx(date, cols, colW, labelW, zoom) {
  if (!date) return labelW;
  for (let i=0; i<cols.length; i++) {
    const c = cols[i];
    const next = new Date(c);
    if (zoom==='day') next.setDate(next.getDate()+1);
    else next.setDate(next.getDate()+7);
    if (date >= c && date < next) {
      const frac = (date-c)/(next-c);
      return labelW + i*colW + frac*colW;
    }
  }
  if (date < cols[0]) return labelW;
  return labelW + cols.length * colW;
}

function getWeekNum(d) {
  const date = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const dayNum = date.getUTCDay()||7;
  date.setUTCDate(date.getUTCDate()+4-dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date-yearStart)/86400000)+1)/7);
}

function setGanttZoom(z) {
  ganttZoom = z;
  renderGantt();
}


// ─── GANTT MOVE (déplacement horizontal) ─────────────────────────────────────
let ganttMoveState = null;

function ganttMoveStart(e, ofId) {
  if (e.target.closest && e.target.closest('.gantt-resize-handle')) return;
  e.preventDefault(); e.stopPropagation();
  ganttDragging = true;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const o = ofs.find(x => x.id === ofId); if (!o) return;
  ganttMoveState = {ofId, startX: clientX, originalDate: o.date, origDebut: o.date_usinage_debut||null, origFin: o.date_usinage_fin||null, lastDelta: 0};

  // Feedback visuel + désactive la sélection de texte pendant le drag (sinon
  // un mousedown/mousemove rapide sélectionne le texte de la page autour de
  // la tuile, ce qui casse la fluidité du glisser-déposer).
  const bars = document.querySelectorAll(`.gantt-bar[data-id="${ofId}"]`);
  bars.forEach(b => { b.style.opacity = '.7'; b.style.cursor = 'grabbing'; });
  document.body.style.userSelect = 'none';

  const onMove = ev => {
    const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
    ganttMoveMove(cx);
  };
  const onUp = () => {
    ganttMoveEnd();
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    document.body.style.userSelect = '';
    setTimeout(() => { ganttDragging = false; }, 100);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, {passive: false});
  document.addEventListener('touchend', onUp);
}

function ganttMoveMove(clientX) {
  if (!ganttMoveState) return;
  const {ofId, startX, originalDate} = ganttMoveState;
  const colW = ganttColW();
  const dx = clientX - startX;
  const daysDelta = Math.round(dx / colW * (ganttZoom === 'day' ? 1 : 7));

  if (daysDelta === ganttMoveState.lastDelta) return;
  ganttMoveState.lastDelta = daysDelta;

  const o = ofs.find(x => x.id === ofId); if (!o) return;
  const newDate = addDays(originalDate, daysDelta);
  if (!newDate) return;

  // Mise à jour visuelle de la barre sans re-render
  const {dates: newDates} = calcDates({...o, date: newDate});
  const cols = ganttGetCols();
  const labelW = GANTT_LABEL_W;
  // Si des dates d'usinage planifiées existent, ce sont elles que la barre affiche : on les décale aussi
  const pDeb = ganttMoveState.origDebut ? addDays(ganttMoveState.origDebut, daysDelta) : newDate;
  const pFin = ganttMoveState.origFin ? addDays(ganttMoveState.origFin, daysDelta) : (newDates.usinage||newDate);
  const s = dateToPx(new Date(pDeb+'T00:00:00'), cols, colW, labelW, ganttZoom);
  const e2 = dateToPx(new Date(pFin+'T00:00:00'), cols, colW, labelW, ganttZoom);

  const bars = document.querySelectorAll(`.gantt-bar[data-id="${ofId}"]`);
  bars.forEach(b => {
    b.style.left = (s - labelW) + 'px';
    b.style.width = Math.max(20, e2 - s) + 'px';
  });

  // Indicateur de date en tooltip (même format lisible que le tooltip statique)
  const newStartLbl = typeof fmtDate === 'function' ? fmtDate(newDate) : newDate;
  const newEndLbl = typeof fmtDate === 'function' ? fmtDate(newDates.usinage||newDate) : (newDates.usinage||newDate);
  bars.forEach(b => { b.title = `${ofId} → ${newStartLbl} → ${newEndLbl}`; });
}

function ganttMoveEnd() {
  if (!ganttMoveState) return;
  const {ofId, startX, originalDate} = ganttMoveState;
  const daysDelta = ganttMoveState.lastDelta;
  const o = ofs.find(x => x.id === ofId);

  if (o && daysDelta !== 0) {
    const newDate = addDays(originalDate, daysDelta);
    if (newDate) {
      o.date = newDate;
      if (ganttMoveState.origDebut) o.date_usinage_debut = addDays(ganttMoveState.origDebut, daysDelta);
      if (ganttMoveState.origFin) o.date_usinage_fin = addDays(ganttMoveState.origFin, daysDelta);
      scheduleSave();
      renderGantt();
      render(); // met à jour le kanban
      showToast(`${ofId} déplacé au ${fmtDate(newDate)}`);
    }
  } else {
    // Annuler visuellement si pas de déplacement
    const bars = document.querySelectorAll(`.gantt-bar[data-id="${ofId}"]`);
    bars.forEach(b => { b.style.opacity = '1'; b.style.cursor = 'grab'; b.title = `${ofId} — ${o?.produit||''}`; });
  }
  ganttMoveState = null;
}

// ─── GANTT RESIZE ─────────────────────────────────────────────────────────────
let ganttDragging = false;
let ganttResizeState = null;

function ganttResizeStart(e, ofId, side) {
  e.preventDefault(); e.stopPropagation();
  ganttDragging = true;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  ganttResizeState = {ofId, side, startX: clientX};
  document.body.style.userSelect = 'none';

  const onMove = (ev) => {
    const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
    ganttResizeMove(cx);
  };
  const onUp = () => {
    ganttResizeEnd();
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    document.body.style.userSelect = '';
    setTimeout(() => { ganttDragging = false; }, 100);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, {passive:false});
  document.addEventListener('touchend', onUp);
}

function ganttResizeMove(clientX) {
  if (!ganttResizeState) return;
  const {ofId, side, startX} = ganttResizeState;
  const o = ofs.find(x => x.id === ofId); if (!o) return;
  const colW = ganttColW();
  const dx = clientX - startX;
  const daysDelta = Math.round(dx / colW * (ganttZoom === 'day' ? 1 : 7));
  if (daysDelta === (ganttResizeState.lastDelta||0)) return;
  ganttResizeState.lastDelta = daysDelta;

  if (o.date_usinage_debut || o.date_usinage_fin) {
    // Dates d'usinage planifiées : on déplace directement la borne tirée
    const d0 = o.date_usinage_debut || o.date, d1 = o.date_usinage_fin || calcDates(o).dates.usinage || o.date;
    if (side === 'right') { const ne = addDays(d1, daysDelta); if (ne > d0) { o._previewFin = ne; updateGanttBarPreview(ofId, d0, ne); } }
    else { const ns = addDays(d0, daysDelta); if (ns < d1) { o._previewDeb = ns; updateGanttBarPreview(ofId, ns, d1); } }
  } else if (side === 'right') {
    // Étirer à droite = changer la quantité pour correspondre à plus de jours
    const {dates} = calcDates(o);
    const baseEnd = dates.usinage || o.date;
    const newEnd = addDays(baseEnd, daysDelta);
    // Recalculer la quantité depuis la nouvelle durée — newEnd doit rester
    // strictement après le début (au moins 1 jour), sinon on ignore le geste.
    const tc = lookupTC(o.produit);
    if (tc && newEnd > o.date) {
      const startD = new Date(o.date+'T00:00:00');
      const endD   = new Date(newEnd+'T00:00:00');
      const heures = ((endD-startD)/3600000) * (HEURES_PAR_JOUR/24);
      const newQty = Math.round(heures * 3600 / tc);
      if (newQty > 0) {
        o._previewQty = newQty;
        // Mise à jour visuelle de la barre
        updateGanttBarPreview(ofId, o.date, newEnd);
      }
    }
  } else {
    // Étirer à gauche = décaler la date de début. Bornes : la nouvelle date de
    // début doit rester strictement avant la fin (au moins 1 jour de marge),
    // sans limite basse arbitraire côté passé.
    const endDate = calcDates(o).dates.usinage || o.date;
    const newStart = addDays(o.date, daysDelta);
    if (newStart < endDate) {
      o._previewStart = newStart;
      updateGanttBarPreview(ofId, newStart, endDate);
    }
  }
}

function ganttResizeEnd() {
  if (!ganttResizeState) return;
  const {ofId} = ganttResizeState;
  const o = ofs.find(x => x.id === ofId);
  if (o) {
    if (o._previewFin) { o.date_usinage_fin = o._previewFin; delete o._previewFin; }
    if (o._previewDeb) { o.date_usinage_debut = o._previewDeb; delete o._previewDeb; }
    if (o._previewQty) { o.qty = o._previewQty; delete o._previewQty; }
    if (o._previewStart) { o.date = o._previewStart; delete o._previewStart; }
    scheduleSave();
    renderGantt();
    render(); // met aussi à jour le kanban
  }
  ganttResizeState = null;
}

function updateGanttBarPreview(ofId, startStr, endStr) {
  // Mise à jour visuelle sans re-render complet
  const bars = document.querySelectorAll(`.gantt-bar[data-id="${ofId}"]`);
  bars.forEach(bar => {
    const cols = ganttGetCols();
    const colW = ganttColW();
    const labelW = GANTT_LABEL_W;
    const s = dateToPx(new Date(startStr+'T00:00:00'), cols, colW, labelW, ganttZoom);
    const e2 = dateToPx(new Date(endStr+'T00:00:00'), cols, colW, labelW, ganttZoom);
    bar.style.left  = (s-labelW)+'px';
    bar.style.width = Math.max(20, e2-s)+'px';
  });
}

function addDays(dateStr, days) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr+'T12:00:00');
  d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}

// Exposer les colonnes courantes du Gantt pour le preview
let _ganttCols = [];
function ganttGetCols() { return _ganttCols; }
