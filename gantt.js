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
  // En vue "en cours" : uniquement les étapes avant contrôle (usinage, attente, création)
  const STAGES_GANTT = ['creation', 'attente', 'usinage'];
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
  const monthHeader = months.map(m =>
    `<div style="position:absolute;left:${m.startIdx*colW}px;width:${m.count*colW}px;text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);padding:3px 0;text-transform:capitalize;border-right:1px solid var(--border);overflow:hidden;box-sizing:border-box">${m.label}</div>`
  ).join('');

  // En-tête jours
  const dayHeader = cols.map((d,i) => {
    const isWeekend = d.getDay()===0||d.getDay()===6;
    const isToday   = d.toDateString()===today.toDateString();
    const isMonday  = d.getDay()===1&&ganttZoom==='day';
    const label = ganttZoom==='day'
      ? `<span style="font-size:8px;opacity:.7">${['D','L','M','M','J','V','S'][d.getDay()]}</span><br>${d.getDate()}`
      : `S${getWeekNum(d)}<br>${d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}`;
    return `<div style="position:absolute;left:${i*colW}px;width:${colW}px;text-align:center;font-size:10px;font-weight:${isToday||isMonday?700:400};color:${isToday?'var(--accent)':isMonday?'var(--accent-text)':'var(--text-faint)'};background:${isToday?'rgba(186,117,23,.08)':isWeekend?'rgba(0,0,0,.025)':'transparent'};border-left:${isMonday?'2px solid rgba(186,117,23,.4)':'1px solid var(--border)'};padding:2px 0;line-height:1.3;box-sizing:border-box">${label}</div>`;
  }).join('');

  // Ligne de today
  const todayX = dateToPx(today, cols, colW, labelW, ganttZoom);

  // Lignes par machine
  const rows = machineOrder.filter(m => byMachine[m]?.length > 0 || true).map((machine, rowIdx) => {
    const machineOfs = byMachine[machine] || [];
    const machineInfo = machines.find(m=>m.name===machine);
    const isPanne = machineInfo?.status==='panne';
    const rowBg = rowIdx%2===0 ? 'var(--surface)' : 'var(--bg)';

    // Fond avec weekends
    const bgCells = cols.map((d,i) => {
      const isWeekend = d.getDay()===0||d.getDay()===6;
      const isToday   = d.toDateString()===today.toDateString();
      const isMonday  = d.getDay()===1&&ganttZoom==='day';
      return `<div style="position:absolute;left:${i*colW}px;width:${colW}px;top:0;bottom:0;background:${isToday?'rgba(186,117,23,.06)':isWeekend?'rgba(0,0,0,.03)':'transparent'};border-left:${isMonday?'2px solid rgba(186,117,23,.2)':'1px solid var(--border)'};box-sizing:border-box"></div>`;
    }).join('');

    // Barres des OF
    const bars = machineOfs.map(o => {
      const {dates} = calcDates(o);
      const cs = clientStyle(o.produit);
      const isBlocked = !ganttShowArchived && deadlineStatus(dates[o.stage], o.stage)==='late';
      const startRaw = !ganttShowArchived && o.date_usinage_debut ? o.date_usinage_debut : o.date;
      const startDate = startRaw ? new Date(startRaw+'T00:00:00') : null;
      const endRaw = ganttShowArchived ? o.archivedAt : (o.date_usinage_fin || dates.usinage);
      const endDate = endRaw ? new Date(endRaw+'T00:00:00') : (startDate?new Date(startDate.getTime()+86400000*2):null);
      if (!startDate||!endDate) return '';
      const left  = dateToPx(startDate, cols, colW, labelW, ganttZoom) - labelW;
      const right = dateToPx(endDate,   cols, colW, labelW, ganttZoom) - labelW;
      const width = Math.max(colW*0.8, right-left);
      const label = `${o.id.replace('OF-','')} — ${o.produit} · ${(o.qty/1000).toFixed(0)}k`;
      const startLbl = typeof fmtDate === 'function' ? fmtDate(startDate.toISOString().slice(0,10)) : startDate.toLocaleDateString('fr-FR');
      const endLbl = typeof fmtDate === 'function' ? fmtDate(endDate.toISOString().slice(0,10)) : endDate.toLocaleDateString('fr-FR');
      return `<div class="gantt-bar" data-id="${o.id}"
        title="${o.id} — ${o.produit} (${o.qty.toLocaleString('fr')} u.)&#10;${startLbl} → ${endLbl}"
        style="position:absolute;left:${left}px;width:${width}px;top:6px;height:${rowH-12}px;
          background:${isBlocked?'#FCEBEB':cs.bg};
          border:1px solid ${isBlocked?'#F0BABA':cs.dot};
          border-left:3px solid ${cs.dot};
          color:${cs.text};font-size:10px;font-weight:600;
          border-radius:5px;cursor:grab;display:flex;align-items:center;
          padding:0 8px;white-space:nowrap;overflow:hidden;z-index:1;
          box-shadow:0 1px 4px rgba(0,0,0,.08)"
        onclick="if(!ganttDragging)openDetail('${o.id}')"
        onmousedown="ganttMoveStart(event,'${o.id}')"
        ontouchstart="ganttMoveStart(event,'${o.id}')">
        <span style="overflow:hidden;text-overflow:ellipsis;pointer-events:none">${label}</span>
        <span class="gantt-resize-handle" style="position:absolute;left:0;top:0;bottom:0;width:10px;cursor:w-resize;z-index:2;display:flex;align-items:center;justify-content:flex-start;padding-left:1px"
          onmousedown="event.stopPropagation();ganttResizeStart(event,'${o.id}','left')"
          ontouchstart="event.stopPropagation();ganttResizeStart(event,'${o.id}','left')">
          <span style="width:3px;height:60%;border-radius:2px;background:rgba(0,0,0,.18);opacity:0;transition:opacity .12s" class="gantt-resize-grip"></span>
        </span>
        <span class="gantt-resize-handle" style="position:absolute;right:0;top:0;bottom:0;width:10px;cursor:e-resize;z-index:2;display:flex;align-items:center;justify-content:flex-end;padding-right:1px"
          onmousedown="event.stopPropagation();ganttResizeStart(event,'${o.id}','right')"
          ontouchstart="event.stopPropagation();ganttResizeStart(event,'${o.id}','right')">
          <span style="width:3px;height:60%;border-radius:2px;background:rgba(0,0,0,.18);opacity:0;transition:opacity .12s" class="gantt-resize-grip"></span>
        </span>
      </div>`;
    }).join('');

    if (!machineOfs.length) return ''; // cacher les machines sans OF

    return `
      <div style="display:flex;height:${rowH}px;background:${rowBg};border-bottom:1px solid var(--border)">
        <div style="width:${labelW}px;flex-shrink:0;padding:0 10px;display:flex;align-items:center;border-right:2px solid var(--border);position:sticky;left:0;background:${rowBg};z-index:2">
          <div>
            <div style="font-size:12px;font-weight:600;color:${isPanne?'var(--text-faint)':'var(--text)'}${isPanne?';text-decoration:line-through':''}">${machine}</div>
            ${isPanne?'<div style="font-size:9px;color:#A32D2D;font-weight:600">⚠ EN PANNE</div>':''}
            <div style="font-size:9px;color:var(--text-faint)">${machineOfs.length} OF</div>
          </div>
        </div>
        <div style="flex:1;position:relative;overflow:hidden">
          ${bgCells}
          ${bars}
        </div>
      </div>`;
  }).filter(Boolean).join('');

  el.innerHTML = `
    <style>.gantt-bar:hover .gantt-resize-grip{opacity:1 !important}</style>
    <div style="flex:1;overflow:auto" id="gantt-scroll">
      <div style="display:flex;gap:8px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:10;flex-shrink:0">
        <div style="display:flex;border:1px solid var(--border-med);border-radius:var(--radius);overflow:hidden">
          <button style="background:${ganttZoom==='day'?'var(--accent)':'transparent'};color:${ganttZoom==='day'?'#fff':'var(--text-muted)'};border:none;padding:5px 14px;cursor:pointer;font-size:12px;font-family:var(--font)" onclick="setGanttZoom('day')">Jour</button>
          <button style="background:${ganttZoom==='week'?'var(--accent)':'transparent'};color:${ganttZoom==='week'?'#fff':'var(--text-muted)'};border:none;padding:5px 14px;cursor:pointer;font-size:12px;font-family:var(--font)" onclick="setGanttZoom('week')">Semaine</button>
        </div>
        <span style="font-size:12px;color:var(--text-muted)">${ofsActifs.length} OF · ${machineOrder.filter(m=>byMachine[m]?.length).length} machines actives</span>
        <div style="display:flex;gap:6px;margin-left:auto;align-items:center">
          <button style="background:${ganttShowArchived?'var(--accent)':'var(--surface)'};border:1px solid ${ganttShowArchived?'var(--accent)':'var(--border-med)'};border-radius:var(--radius);padding:4px 12px;cursor:pointer;font-size:11px;color:${ganttShowArchived?'#fff':'var(--text-muted)'};font-family:var(--font);font-weight:500;transition:all .15s" onclick="toggleGanttArchived()">
            <i class="ti ti-archive" style="font-size:12px;vertical-align:-2px"></i>
            ${ganttShowArchived ? 'OFs archivés' : 'OFs en cours'}
          </button>
          <button style="background:var(--accent-light);border:1px solid var(--accent);border-radius:var(--radius);padding:4px 12px;cursor:pointer;font-size:11px;color:var(--accent-text);font-family:var(--font);font-weight:500" onclick="ganttScrollToday()"><i class="ti ti-calendar" style="font-size:12px;vertical-align:-2px"></i> Aujourd'hui</button>
        </div>
      </div>
      <div style="position:relative;width:${totalW}px;min-width:100%">
        <div style="position:sticky;top:41px;z-index:9;height:22px;background:var(--surface);border-bottom:1px solid var(--border);display:flex">
          <div style="width:${labelW}px;flex-shrink:0;border-right:2px solid var(--border);background:var(--surface);position:sticky;left:0;z-index:10"></div>
          <div style="flex:1;position:relative;height:22px">${monthHeader}</div>
        </div>
        <div style="position:sticky;top:63px;z-index:9;height:28px;background:var(--surface);border-bottom:2px solid var(--border);display:flex">
          <div style="width:${labelW}px;flex-shrink:0;border-right:2px solid var(--border);background:var(--surface);position:sticky;left:0;z-index:10;font-size:9px;font-weight:600;color:var(--text-faint);display:flex;align-items:center;padding:0 10px">Machine</div>
          <div style="flex:1;position:relative;height:28px">${dayHeader}</div>
        </div>
        <div style="position:absolute;left:${todayX}px;top:0;bottom:0;width:2px;background:var(--accent);opacity:.5;z-index:5;pointer-events:none"></div>
        ${rows || '<div style="padding:40px;text-align:center;color:var(--text-faint)">Aucun OF avec machine assignée</div>'}
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
  ganttMoveState = {ofId, startX: clientX, originalDate: o.date, lastDelta: 0};

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
  const s = dateToPx(new Date(newDate+'T00:00:00'), cols, colW, labelW, ganttZoom);
  const e2 = dateToPx(new Date((newDates.usinage||newDate)+'T00:00:00'), cols, colW, labelW, ganttZoom);

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

  if (side === 'right') {
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
