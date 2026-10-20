// ═══════════════════════════════════════════════════════════
// forets.js — Kanban "Forets" (mèches/drills), sous le Kanban tenons
// Filière de fabrication distincte (décolletage → rollomatic →
// électro-polissage → mise en joint → contrôle → réception qualité),
// donc modèle de données et étapes séparés de STAGES/ofs (tenons).
// Dépend de : readExcelFile/loadXLSX, closeOverlay, showToast,
// scheduleSave, fmtDate (définis dans index.html, chargé avant ce fichier).
// ═══════════════════════════════════════════════════════════

let ofsForets = [];
let _foretsNextId = 1;

const FORETS_STAGES = [
  { id: 'decolletage', label: 'Décolletage',        color: '#4C8EDA' },
  { id: 'rollomatic',  label: 'Rollomatic',          color: '#D4880A' },
  { id: 'polissage',   label: 'Électro-polissage',   color: '#7B6EE8' },
  { id: 'joint',       label: 'Mise en joint',        color: '#1D9E75' },
  { id: 'controle',    label: 'Contrôle',             color: '#A32D2D' },
];
const FORETS_STAGE_IDS = FORETS_STAGES.map(s => s.id);

// Machines connues du fichier de suivi (12/08/2026) — liste extensible, un
// champ libre reste possible dans le formulaire pour toute autre machine.
const FORETS_MACHINES = ['Gamma20/Roll1', 'GT13/Roll2'];

function foretsNewId() {
  return 'OFR-' + (_foretsNextId++);
}

// Convertit une valeur date (objet Date, chaîne ISO avec horodatage, chaîne
// YYYY-MM-DD, ou DD/MM/YYYY) en "YYYY-MM-DD" — même logique ("truc du midi")
// que cdeToISODate (commandes.js) et pdpToISODate (pdp.js), dupliquée ici en
// autonome pour ne pas dépendre de l'ordre de chargement des scripts.
function foretsToISODate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const noon = new Date(val.getTime() + 12 * 60 * 60 * 1000);
    const y = noon.getUTCFullYear(), m = String(noon.getUTCMonth() + 1).padStart(2, '0'), d = String(noon.getUTCDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  const s = String(val).trim();
  if (!s) return null;
  const isoDateTime = s.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  if (isoDateTime) {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
      const noon = new Date(dt.getTime() + 12 * 60 * 60 * 1000);
      const y = noon.getUTCFullYear(), m = String(noon.getUTCMonth() + 1).padStart(2, '0'), d = String(noon.getUTCDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    }
  }
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return isoMatch[1] + '-' + isoMatch[2] + '-' + isoMatch[3];
  const frMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frMatch) return frMatch[3] + '-' + frMatch[2].padStart(2, '0') + '-' + frMatch[1].padStart(2, '0');
  return null;
}

function foretsEmptyEtapes() {
  const e = {};
  FORETS_STAGE_IDS.forEach(id => { e[id] = { qty: null, date: null }; });
  return e;
}

// Étape "active" d'un OF Foret = la première étape dont la quantité n'est pas
// encore renseignée (même logique que le fichier de suivi source : les
// quantités se remplissent progressivement colonne par colonne). Si les 5
// étapes sont renseignées, l'OF est considéré Terminé.
function foretsStageOf(o) {
  for (const id of FORETS_STAGE_IDS) {
    const e = o.etapes && o.etapes[id];
    if (!e || !e.qty) return id;
  }
  return 'termine';
}

function foretsRatio(o, stageId) {
  const e = o.etapes && o.etapes[stageId];
  if (!e || !e.qty || !o.qtyOF) return null;
  return e.qty / o.qtyOF;
}

// ─── INTÉGRATION PDP / BESOINS (en-cours de production) ───────────────────
// Les OF Forets utilisent une référence courte (W0, W1, DT1…) alors que les
// nomenclatures PDP identifient le premier niveau WIP par un codart du type
// "FINITION_DRILL_W#0" / "FINITION_DRILL_DT1" (voir PDP_CORRESPONDANCES /
// nomenclatures dans pdp.js) — demandé par Stéphane, 18/08/2026, pour que les
// OF Forets en cours comptent dans le stock équivalent FG (comme le fait déjà
// l'en-cours tenons) et apparaissent dans les badges "En prod" du PDP/Besoins.
function foretsReferenceToCodartWip(ref) {
  const r = String(ref || '').trim().toUpperCase();
  if (!r) return null;
  if (r === 'WU' || r === 'W#UNI' || r === 'WUNI') return 'FINITION_DRILL_W#UNI';
  const mW = r.match(/^W(\d+)$/);
  if (mW) return 'FINITION_DRILL_W#' + mW[1];
  const mDT = r.match(/^DT(\d+(?:[.,]\d+)?)$/);
  if (mDT) return 'FINITION_DRILL_DT' + mDT[1].replace(',', '.');
  return null;
}

// Retourne les OF Forets non terminés liés à un codart_wip donné, au même
// format que pdpGetOFsForRef (pdp.js) — {id, qty} — pour pouvoir les
// concaténer directement aux OF tenons dans les badges "En prod".
function foretsGetOFsForRef(codart_wip) {
  if (typeof ofsForets === 'undefined' || !codart_wip) return [];
  const target = String(codart_wip).trim().toUpperCase();
  const STAGE_LABELS = { decolletage: 'Décolletage', rollomatic: 'Rollomatic', polissage: 'Électro-polissage', joint: 'Mise en joint', controle: 'Contrôle', termine: 'Terminé' };
  return ofsForets
    .filter(o => !o.archived && foretsReferenceToCodartWip(o.reference) === target)
    .map(o => ({
      id: 'OFR-' + o.numOF,
      qty: o.qtyOF || 0,
      // produit/stage : la modale de détail PDP (pdpShowDetail) affiche ces
      // champs pour chaque OF lié quel qu'il soit (tenon ou Foret) — sans
      // eux elle afficherait "undefined".
      produit: o.reference || '',
      stage: STAGE_LABELS[foretsStageOf(o)] || '',
    }));
}

// ─── RENDU (onglet dédié) ──────────────────────────────────────────────────
// ─── VISUELS « WAOUH » : entonnoir de production + cartes d'OF ───────────────
function foretsFunnelHtml(active) {
  const N = FORETS_STAGES.length;
  const tot = FORETS_STAGES.map(s => active.reduce((a, o) => a + ((o.etapes && o.etapes[s.id] && o.etapes[s.id].qty) || 0), 0));
  const lances = active.reduce((a, o) => a + (Number(o.qtyOF) || 0), 0);
  const max = Math.max(1, lances, ...tot);
  // perte entre deux étapes consécutives, mesurée uniquement sur les OF qui ont les deux renseignées
  const perte = FORETS_STAGES.map((s, i) => {
    if (i === 0) return null;
    const p = FORETS_STAGES[i - 1].id;
    let a = 0, b = 0;
    active.forEach(o => { const qa = o.etapes && o.etapes[p] && o.etapes[p].qty, qb = o.etapes && o.etapes[s.id] && o.etapes[s.id].qty; if (qa && qb) { a += qa; b += qb; } });
    return a ? 1 - b / a : null;
  });
  const W = 1000, H = 250, X0 = 90, DX = (W - 2 * X0) / (N - 1), MID = 132, HMAX = 84;
  const hh = v => Math.max(5, HMAX * v / max);
  let defs = '', shapes = '', nodes = '';
  for (let i = 0; i < N - 1; i++) {
    const x1 = X0 + i * DX, x2 = x1 + DX, a = hh(tot[i]), b = hh(tot[i + 1]), mx = (x1 + x2) / 2;
    defs += `<linearGradient id="fg${i}" x1="0" x2="1"><stop offset="0" stop-color="${FORETS_STAGES[i].color}"/><stop offset="1" stop-color="${FORETS_STAGES[i + 1].color}"/></linearGradient>`;
    shapes += `<path class="ff-flow" style="animation-delay:${i * 120}ms" fill="url(#fg${i})" d="M${x1},${MID - a} C${mx},${MID - a} ${mx},${MID - b} ${x2},${MID - b} L${x2},${MID + b} C${mx},${MID + b} ${mx},${MID + a} ${x1},${MID + a} Z"/>`
      + `<path class="ff-line" d="M${x1},${MID} C${mx},${MID} ${mx},${MID} ${x2},${MID}"/>`;
    if (perte[i + 1] != null && perte[i + 1] > 0.005) {
      const p = Math.round(perte[i + 1] * 100);
      shapes += `<g class="ff-loss" style="animation-delay:${600 + i * 120}ms"><rect x="${mx - 33}" y="${MID - HMAX - 30}" width="66" height="22" rx="11"/><text x="${mx}" y="${MID - HMAX - 15}" text-anchor="middle">−${p} %</text></g>`;
    }
  }
  FORETS_STAGES.forEach((s, i) => {
    const x = X0 + i * DX, h = hh(tot[i]);
    const pc = lances ? Math.round(tot[i] / lances * 100) : 0;
    nodes += `<g class="ff-node" style="animation-delay:${300 + i * 90}ms">
      <line x1="${x}" x2="${x}" y1="${MID - h - 4}" y2="${MID + h + 4}" stroke="${s.color}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${x}" cy="${MID}" r="5.5" fill="#0F1A24" stroke="${s.color}" stroke-width="3"/>
      <text x="${x}" y="${MID + HMAX + 30}" text-anchor="middle" class="ff-q">${tot[i].toLocaleString('fr')}</text>
      <text x="${x}" y="${MID + HMAX + 48}" text-anchor="middle" class="ff-l">${s.label}</text>
      <text x="${x}" y="${MID + HMAX + 64}" text-anchor="middle" class="ff-p" fill="${s.color}">${pc} % des pièces lancées</text></g>`;
  });
  return `<div class="ff-card">
    <div class="ff-head"><h3>Le flux, étape par étape</h3><p>Pièces ayant passé chaque étape, tous OF confondus. Les pastilles rouges montrent la perte mesurée entre deux étapes.</p></div>
    <svg class="ff-svg" viewBox="0 0 ${W} ${H + 40}" role="img" aria-label="Entonnoir de production des forets"><defs>${defs}</defs>${shapes}${nodes}</svg>
  </div>`;
}

function foretsCardsHtml(sorted) {
  const R = 30, C = 2 * Math.PI * R;
  return `<div class="fc-grid">` + sorted.map((o, idx) => {
    let last = null, lastStage = null, reached = 0;
    FORETS_STAGES.forEach((s, i) => { const r = foretsRatio(o, s.id); if (r != null) { last = r; lastStage = s; reached = i + 1; } });
    const st = foretsRatioStyle(last);
    const pct = last == null ? null : Math.round(last * 100);
    const dash = last == null ? 0 : Math.min(1, last) * C;
    const dots = FORETS_STAGES.map((s, i) => `<span class="${i < reached ? 'on' : ''} ${i === reached - 1 ? 'cur' : ''}" style="--c:${s.color}" title="${s.label}"></span>`).join('<b></b>');
    return `<button class="fc-card" style="animation-delay:${idx * 70}ms;--c:${st.bar}" onclick="foretsOpenDetail('${o.id}')">
      <div class="fc-ring"><svg viewBox="0 0 76 76"><circle class="t" cx="38" cy="38" r="${R}"/><circle class="v" cx="38" cy="38" r="${R}" style="stroke-dasharray:${dash.toFixed(1)} ${C.toFixed(1)}"/></svg>
        <div><b>${pct == null ? '—' : pct + '%'}</b><small>rendement</small></div></div>
      <div class="fc-body">
        <div class="fc-top"><span class="fc-ref">${o.reference || '—'}</span><span class="fr-of">${o.numOF}</span></div>
        <div class="fc-meta">${(o.qtyOF || 0).toLocaleString('fr')} pièces${o.machine ? ' · ' + o.machine : ''}</div>
        <div class="fc-track">${dots}</div>
        <div class="fc-state">${lastStage ? 'Dernière étape : <b>' + lastStage.label + '</b>' : 'Pas encore démarré'}</div>
      </div></button>`;
  }).join('') + `</div>`;
}

function renderKanbanForets() {
  const el = document.getElementById('view-forets');
  if (!el) return;
  const active = ofsForets.filter(o => !o.archived);
  // Tri par n° OF croissant, comme le fichier de suivi source.
  const sorted = [...active].sort((a, b) => (Number(a.numOF) || 0) - (Number(b.numOF) || 0));

  // Indicateurs : rendement = dernière étape renseignée / quantité de l'OF
  const lastRatio = o => {
    for (let i = FORETS_STAGES.length - 1; i >= 0; i--) {
      const r = foretsRatio(o, FORETS_STAGES[i].id);
      if (r != null) return { r, stage: FORETS_STAGES[i] };
    }
    return null;
  };
  const lances = active.reduce((s, o) => s + (Number(o.qtyOF) || 0), 0);
  const rend = active.map(lastRatio).filter(Boolean);
  const rendMoy = rend.length ? rend.reduce((s, x) => s + x.r, 0) / rend.length : null;
  const faibles = rend.filter(x => x.r < 0.5).length;
  const enControle = active.filter(o => o.etapes && o.etapes.controle && o.etapes.controle.qty).length;
  const machines = new Set(active.map(o => o.machine).filter(Boolean)).size;
  const k = (ico, num, lab, tone) => `<div class="fr-kpi ${tone || ''}"><i class="ti ${ico}"></i><div><b data-cu="${String(num).replace(/\s/g, '')}">${num}</b><span>${lab}</span></div></div>`;

  el.innerHTML = `
    <div class="fr-wrap">
      <div class="fr-hero">
        <div class="fr-hero-title">
          <h2>Forets</h2>
          <p>Suivi des OF de l'atelier forets : quantité et rendement à chaque étape, du décolletage au contrôle.</p>
        </div>
        <div class="fr-hero-actions">
          <label class="btn fr-ghost"><i class="ti ti-upload"></i> Importer suivi
            <input type="file" accept=".xlsx,.xls,.xlsb" style="display:none" onchange="foretsImportFile(this)"></label>
          <button class="btn btn-primary" onclick="foretsOpenNew()"><i class="ti ti-plus"></i>Nouvel OF Foret</button>
        </div>
      </div>
      <div class="fr-kpis">
        ${k('ti-clipboard-list', active.length, 'OF en cours')}
        ${k('ti-stack-2', lances.toLocaleString('fr'), 'pièces lancées')}
        ${k('ti-gauge', rendMoy == null ? '—' : Math.round(rendMoy * 100) + ' %', 'rendement moyen', rendMoy != null && rendMoy < 0.8 ? 'warn' : '')}
        ${k('ti-alert-triangle', faibles, 'OF sous 50 % de rendement', faibles ? 'warn' : '')}
        ${k('ti-zoom-check', enControle, 'OF arrivés au contrôle')}
        ${k('ti-building-factory-2', machines, 'machines utilisées')}
      </div>
      ${sorted.length ? foretsFunnelHtml(active) + foretsCardsHtml(sorted) : ''}
      <h3 class="fr-h3">Détail par OF</h3>
      <div class="fr-card">
        <table class="fr-table">
          <thead><tr>
            <th>OF</th><th>Référence</th><th class="num">Quantité</th><th>Avancement</th>
            ${FORETS_STAGES.map(s => `<th class="stg"><span class="dot" style="background:${s.color}"></span>${s.label}</th>`).join('')}
            <th>Réception</th><th>Informations</th>
          </tr></thead>
          <tbody>${sorted.length ? sorted.map(foretsRowHtml).join('')
            : `<tr><td colspan="${FORETS_STAGES.length + 6}" class="fr-empty"><i class="ti ti-circle-dot"></i>Aucun OF Foret. Importez le fichier de suivi ou créez un OF.</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
  // Compteurs animés (valeurs numériques uniquement ; « 21 % » garde son suffixe)
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    el.querySelectorAll('[data-cu]').forEach(n => {
      const raw = n.dataset.cu, num = parseFloat(raw.replace(',', '.'));
      if (isNaN(num) || !/^\d/.test(raw)) return;
      const suffix = raw.replace(/^[\d.,]+/, ''), t0 = performance.now();
      (function step(now) { const p = Math.min(1, (now - t0) / 1000), e = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(num * e).toLocaleString('fr') + (suffix ? ' ' + suffix.replace('%', '%').trim() : '');
        if (p < 1) requestAnimationFrame(step); })(t0);
    });
  }
}

// Couleurs de rendement — mêmes seuils que la mise en forme conditionnelle du
// fichier source : vert proche de 100 %, orange en dessous, rouge sous 50 %.
function foretsRatioStyle(ratio) {
  if (ratio == null) return { bg: 'transparent', text: 'var(--text-faint)', bar: '#C9D1D8' };
  if (ratio >= 0.95) return { bg: '#EAF3DE', text: '#17653A', bar: '#1D9E75' };
  if (ratio >= 0.5) return { bg: '#FAEEDA', text: '#8A5200', bar: '#E19A1A' };
  return { bg: '#FCEBEB', text: '#B02A22', bar: '#D9453A' };
}

function foretsRowHtml(o, idx) {
  const reached = FORETS_STAGES.reduce((n, s, i) => (o.etapes && o.etapes[s.id] && o.etapes[s.id].qty ? i + 1 : n), 0);
  const steps = FORETS_STAGES.map((s, i) =>
    `<i class="${i < reached ? 'on' : ''}" style="${i < reached ? 'background:' + s.color : ''}" title="${s.label}"></i>`).join('');
  const stageCells = FORETS_STAGES.map(s => {
    const e = (o.etapes && o.etapes[s.id]) || { qty: null, date: null };
    const ratio = foretsRatio(o, s.id);
    const st = foretsRatioStyle(ratio);
    if (!e.qty) return `<td class="stg vide"><span>—</span>${e.date ? `<small>${fmtDate(e.date)}</small>` : ''}</td>`;
    const pct = ratio != null ? Math.round(ratio * 1000) / 10 : null;
    return `<td class="stg"><div class="fr-cell" style="--c:${st.bar}">
        <div class="fr-cell-top"><b>${e.qty.toLocaleString('fr')}</b>${pct != null ? `<em style="background:${st.bg};color:${st.text}">${pct} %</em>` : ''}</div>
        <div class="fr-bar"><i style="width:${Math.min(100, (ratio || 0) * 100)}%"></i></div>
        ${e.date ? `<small>${fmtDate(e.date)}</small>` : ''}</div></td>`;
  }).join('');
  return `<tr class="fr-row" style="animation-delay:${Math.min(idx || 0, 12) * 40}ms" onclick="foretsOpenDetail('${o.id}')">
    <td><span class="fr-of">${o.numOF}</span><small>${o.dateOF ? fmtDate(o.dateOF) : '—'}${o.machine ? ' · ' + o.machine : ''}</small></td>
    <td class="fr-ref">${o.reference || '—'}</td>
    <td class="num">${(o.qtyOF || 0).toLocaleString('fr')}</td>
    <td><div class="fr-steps" title="${reached} étape(s) sur ${FORETS_STAGES.length}">${steps}</div></td>
    ${stageCells}
    <td class="fr-muted">${o.dateReception ? fmtDate(o.dateReception) : '—'}</td>
    <td class="fr-info">${o.info || ''}</td>
  </tr>`;
}

// ─── FORMULAIRE / DÉTAIL ───────────────────────────────────────────────────
let _foretsEditingId = null;

function foretsOpenNew() {
  _foretsEditingId = null;
  foretsShowForm(null);
}

function foretsOpenDetail(id) {
  const o = ofsForets.find(x => x.id === id);
  if (!o) return;
  _foretsEditingId = id;
  foretsShowForm(o);
}

function foretsMachineOptions(selected) {
  const list = FORETS_MACHINES.includes(selected) || !selected ? FORETS_MACHINES : [selected, ...FORETS_MACHINES];
  return '<option value="">— Sélectionner —</option>' + list.map(m => `<option value="${m}" ${selected === m ? 'selected' : ''}>${m}</option>`).join('');
}

function foretsShowForm(o) {
  const etapesHtml = FORETS_STAGES.map(s => {
    const e = (o && o.etapes && o.etapes[s.id]) || { qty: null, date: null };
    return `<div class="fr-etape">
      <div class="fr-etape-lab"><span class="dot" style="background:${s.color}"></span>${s.label}</div>
      <div class="form-group"><label>Quantité</label><input id="fr-qty-${s.id}" type="number" min="0" value="${e.qty ?? ''}"></div>
      <div class="form-group"><label>Date</label><input id="fr-date-${s.id}" type="date" value="${e.date || ''}"></div>
    </div>`;
  }).join('');

  document.getElementById('modal').innerHTML = `
    <div class="modal-header"><h2>${o ? 'OF Foret ' + o.numOF : 'Nouvel OF Foret'}</h2>
    <button class="close-btn" onclick="closeOverlay()"><i class="ti ti-x"></i></button></div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group" style="flex:0 0 140px"><label>N° OF</label><input id="fr-numof" value="${o ? o.numOF : ''}" placeholder="ex: 74816"></div>
        <div class="form-group full"><label>Référence</label><input id="fr-ref" value="${o ? o.reference : ''}" placeholder="ex: DT1, W2, WU…"></div>
      </div>
      <div class="form-row" style="margin-top:12px">
        <div class="form-group"><label>Quantité OF</label><input id="fr-qtyof" type="number" min="0" value="${o ? o.qtyOF : ''}"></div>
        <div class="form-group"><label>Date OF</label><input id="fr-dateof" type="date" value="${o && o.dateOF ? o.dateOF : new Date().toISOString().slice(0, 10)}"></div>
        <div class="form-group"><label>Machine</label><select id="fr-machine">${foretsMachineOptions(o ? o.machine : '')}</select></div>
      </div>
      <div style="margin-top:14px;padding:12px 14px;background:var(--bg);border-radius:var(--radius);border:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
          <i class="ti ti-list-check" style="vertical-align:-2px;margin-right:6px"></i>Étapes
        </div>
        ${etapesHtml}
      </div>
      <div class="form-row" style="margin-top:12px">
        <div class="form-group"><label>Réception qualité</label><input id="fr-reception" type="date" value="${o && o.dateReception ? o.dateReception : ''}"></div>
        <div class="form-group full"><label>Informations</label><textarea id="fr-info">${o ? (o.info || '') : ''}</textarea></div>
      </div>
    </div>
    <div class="modal-footer">
      ${o ? `<button class="btn" style="color:#A32D2D" onclick="foretsDeleteOf('${o.id}')"><i class="ti ti-trash"></i> Supprimer</button>` : ''}
      <div style="flex:1"></div>
      <button class="btn" onclick="closeOverlay()">Annuler</button>
      <button class="btn btn-primary" onclick="foretsSaveForm()"><i class="ti ti-check"></i> ${o ? 'Enregistrer' : 'Créer'}</button>
    </div>`;
  document.getElementById('overlay').classList.add('open');
}

function foretsSaveForm() {
  const numOF = document.getElementById('fr-numof').value.trim();
  if (!numOF) { showToast('N° OF requis'); return; }
  const etapes = foretsEmptyEtapes();
  FORETS_STAGE_IDS.forEach(id => {
    const qtyEl = document.getElementById('fr-qty-' + id);
    const dateEl = document.getElementById('fr-date-' + id);
    const qty = qtyEl && qtyEl.value !== '' ? Number(qtyEl.value) : null;
    etapes[id] = { qty: qty || null, date: (dateEl && dateEl.value) || null };
  });

  const data = {
    numOF,
    reference: document.getElementById('fr-ref').value.trim(),
    qtyOF: Number(document.getElementById('fr-qtyof').value) || 0,
    dateOF: document.getElementById('fr-dateof').value || null,
    machine: document.getElementById('fr-machine').value || '',
    etapes,
    dateReception: document.getElementById('fr-reception').value || null,
    info: document.getElementById('fr-info').value.trim(),
  };

  if (_foretsEditingId) {
    const o = ofsForets.find(x => x.id === _foretsEditingId);
    Object.assign(o, data);
  } else {
    ofsForets.push(Object.assign({ id: foretsNewId(), archived: false }, data));
  }
  closeOverlay();
  renderKanbanForets();
  scheduleSave();
  showToast(_foretsEditingId ? 'OF Foret mis à jour' : 'OF Foret créé');
}

function foretsDeleteOf(id) {
  if (!confirm('Supprimer cet OF Foret ?')) return;
  ofsForets = ofsForets.filter(o => o.id !== id);
  closeOverlay();
  renderKanbanForets();
  scheduleSave();
  showToast('OF Foret supprimé');
}

// ─── IMPORT DU FICHIER DE SUIVI ────────────────────────────────────────────
// Le fichier source (ex: "Planification Production Forets") a une ligne de
// titre puis les en-têtes réels un peu plus bas, avec des colonnes décalées
// (colonne A vide). Plutôt que de figer des indices de colonnes fragiles, on
// repère la cellule d'en-tête "Référence" et on déduit toutes les autres
// colonnes par décalage relatif — stable tant que l'ordre des colonnes ne
// change pas dans le fichier ERP.
const FORETS_COL_OFFSETS = {
  machine: -3, dateOF: -2, numOF: -1, /* référence: 0 */
  qtyOF: 1, dateLanc: 2,
  decolletageQty: 3, decolletageRatio: 4, decolletageDate: 5,
  rollomaticQty: 6, rollomaticRatio: 7, rollomaticDate: 8,
  polissageQty: 9, polissageRatio: 10, polissageDate: 11,
  jointQty: 12, jointRatio: 13, jointDate: 14,
  controleQty: 15, controleRatio: 16,
  reception: 17, info: 18,
};

function foretsImportFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  showToast('Chargement ' + file.name + '…');
  const reader = new FileReader();
  reader.onload = e => {
    loadXLSX(() => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

        // Repérer la ligne d'en-tête + colonne "Référence"
        let headerRow = -1, colRef = -1;
        for (let r = 0; r < Math.min(rows.length, 20); r++) {
          const row = rows[r] || [];
          const c = row.findIndex(cell => cell != null && /^r[ée]f[ée]rence$/i.test(String(cell).trim()));
          if (c !== -1) { headerRow = r; colRef = c; break; }
        }
        if (headerRow === -1) {
          showToast('Colonne "Référence" introuvable dans le fichier');
          input.value = '';
          return;
        }

        const get = (row, key) => row[colRef + FORETS_COL_OFFSETS[key]];

        let nbCrees = 0, nbMaj = 0, nbIgnores = 0, nbTermines = 0;
        for (let r = headerRow + 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const numOFraw = get(row, 'numOF');
          const numOF = numOFraw != null ? String(numOFraw).trim() : '';
          if (!numOF || !/^\d+$/.test(numOF)) { nbIgnores++; continue; }

          const etapes = foretsEmptyEtapes();
          etapes.decolletage = { qty: Number(get(row, 'decolletageQty')) || null, date: foretsToISODate(get(row, 'decolletageDate')) };
          etapes.rollomatic  = { qty: Number(get(row, 'rollomaticQty'))  || null, date: foretsToISODate(get(row, 'rollomaticDate')) };
          etapes.polissage   = { qty: Number(get(row, 'polissageQty'))   || null, date: foretsToISODate(get(row, 'polissageDate')) };
          etapes.joint       = { qty: Number(get(row, 'jointQty'))       || null, date: foretsToISODate(get(row, 'jointDate')) };
          // Pas de colonne de date dédiée pour Contrôle dans le fichier source
          // (juste avant Réception qualité) — on retombe sur la date de
          // réception si elle existe, à défaut la date de mise en joint.
          const receptionISO = foretsToISODate(get(row, 'reception'));
          etapes.controle = { qty: Number(get(row, 'controleQty')) || null, date: receptionISO || etapes.joint.date };

          const data = {
            numOF,
            reference: row[colRef] != null ? String(row[colRef]).trim() : '',
            qtyOF: Number(get(row, 'qtyOF')) || 0,
            dateOF: foretsToISODate(get(row, 'dateOF')),
            machine: get(row, 'machine') != null ? String(get(row, 'machine')).trim() : '',
            etapes,
            dateReception: receptionISO,
            info: get(row, 'info') != null ? String(get(row, 'info')).trim() : '',
          };

          const existing = ofsForets.find(o => o.numOF === numOF);
          // Ne pas prendre en compte les OF déjà terminés (les 5 étapes
          // renseignées) — demandé par Stéphane, 18/08/2026, pour ne garder
          // dans le tableau que les OF encore en cours. Si un OF déjà importé
          // (en cours) se termine dans ce nouvel import, on le retire plutôt
          // que de laisser un état "en cours" périmé.
          if (foretsStageOf({ etapes, qtyOF: data.qtyOF }) === 'termine') {
            if (existing) { ofsForets = ofsForets.filter(o => o.numOF !== numOF); nbTermines++; }
            else nbTermines++;
            continue;
          }

          if (existing) { Object.assign(existing, data); nbMaj++; }
          else { ofsForets.push(Object.assign({ id: foretsNewId(), archived: false }, data)); nbCrees++; }
        }

        showToast(`✓ Import Forets : ${nbCrees} créé(s), ${nbMaj} mis à jour, ${nbTermines} terminé(s) ignoré(s)${nbIgnores ? ', ' + nbIgnores + ' ligne(s) ignorée(s)' : ''}`);
        renderKanbanForets();
        scheduleSave();
      } catch (err) {
        console.error('[Forets] Erreur import', err);
        showToast('Erreur import Forets : ' + err.message);
      }
      input.value = '';
    });
  };
  reader.readAsArrayBuffer(file);
}
