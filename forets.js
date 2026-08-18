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
  return ofsForets
    .filter(o => !o.archived && foretsReferenceToCodartWip(o.reference) === target)
    .map(o => ({ id: 'OFR-' + o.numOF, qty: o.qtyOF || 0 }));
}

// ─── RENDU (onglet dédié) ──────────────────────────────────────────────────
function renderKanbanForets() {
  const el = document.getElementById('view-forets');
  if (!el) return;
  const active = ofsForets.filter(o => !o.archived);

  const header = `
    <div style="display:flex;align-items:center;gap:10px;padding:14px 24px;border-bottom:1px solid var(--border);background:var(--surface)">
      <h2 style="font-size:17px;font-weight:600;display:flex;align-items:center;gap:8px">
        <i class="ti ti-circle-dot" style="color:#D4880A"></i>Forets
        <span style="font-size:13px;font-weight:500;color:var(--text-faint)">(${active.length} OF)</span>
      </h2>
      <div style="flex:1"></div>
      <label class="btn" style="font-size:12px;padding:5px 10px;cursor:pointer">
        <i class="ti ti-upload"></i> Importer suivi
        <input type="file" accept=".xlsx,.xls,.xlsb" style="display:none" onchange="foretsImportFile(this)">
      </label>
      <button class="btn btn-primary" style="font-size:12px;padding:5px 10px" onclick="foretsOpenNew()"><i class="ti ti-plus"></i>Nouvel OF Foret</button>
    </div>`;

  // Tri par n° OF croissant, comme le fichier de suivi source.
  const sorted = [...active].sort((a, b) => (Number(a.numOF) || 0) - (Number(b.numOF) || 0));

  el.innerHTML = header
    + '<div style="flex:1;overflow:auto;padding:16px 24px">'
    + '<table class="cat-table" style="min-width:1500px;white-space:nowrap">'
    + '<thead><tr>'
    + '<th>Machine</th><th>Date OF</th><th>N° OF</th><th>Référence</th><th style="text-align:right">Qté OF</th>'
    + FORETS_STAGES.map(s => `<th colspan="2" style="text-align:center;border-left:2px solid var(--border)"><span class="stage-dot" style="background:${s.color}"></span>${s.label}</th>`).join('')
    + '<th>Réception qualité</th><th>Informations</th>'
    + '</tr></thead><tbody>'
    + (sorted.length ? sorted.map(foretsRowHtml).join('') : '<tr><td colspan="20" style="text-align:center;color:var(--text-faint);padding:24px">Aucun OF Foret</td></tr>')
    + '</tbody></table></div>';
}

// Couleurs de rendement — mêmes codes que la mise en forme conditionnelle du
// fichier source (vert proche de 100%, orange en dessous, rouge en-dessous
// de 50% ou étape à l'arrêt), et palette déjà utilisée ailleurs dans l'appli
// (of-deadline.late / .soon / stat vert).
function foretsRatioStyle(ratio) {
  if (ratio == null) return { bg: 'transparent', text: 'var(--text-faint)' };
  if (ratio >= 0.95) return { bg: '#EAF3DE', text: '#27500A' };
  if (ratio >= 0.5) return { bg: '#FAEEDA', text: '#633806' };
  return { bg: '#FCEBEB', text: '#A32D2D' };
}

function foretsRowHtml(o) {
  const stageCells = FORETS_STAGES.map(s => {
    const e = (o.etapes && o.etapes[s.id]) || { qty: null, date: null };
    const ratio = foretsRatio(o, s.id);
    const style = foretsRatioStyle(ratio);
    return `<td style="border-left:2px solid var(--border);font-size:12px;color:var(--text-muted)">${e.date ? fmtDate(e.date) : '—'}</td>`
      + `<td style="text-align:right;font-size:12px;font-weight:600;background:${style.bg};color:${style.text}">`
      + (e.qty ? e.qty.toLocaleString('fr') + (ratio != null ? ' <span style="font-weight:500;opacity:.85">(' + (Math.round(ratio * 1000) / 10) + '%)</span>' : '') : '—')
      + '</td>';
  }).join('');
  return `<tr style="cursor:pointer" onclick="foretsOpenDetail('${o.id}')">
    <td style="font-size:12px">${o.machine || '—'}</td>
    <td style="font-size:12px;color:var(--text-muted)">${o.dateOF ? fmtDate(o.dateOF) : '—'}</td>
    <td style="font-size:12px;font-weight:600;font-family:monospace;color:var(--accent)">${o.numOF}</td>
    <td style="font-size:12px;font-weight:600">${o.reference || '—'}</td>
    <td style="text-align:right;font-size:12px">${(o.qtyOF || 0).toLocaleString('fr')}</td>
    ${stageCells}
    <td style="font-size:12px;color:var(--text-muted)">${o.dateReception ? fmtDate(o.dateReception) : '—'}</td>
    <td style="font-size:11px;color:var(--text-faint);white-space:normal;max-width:260px">${o.info || ''}</td>
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
    return `<div class="form-row" style="margin-top:8px;align-items:flex-end">
      <div class="form-group" style="flex:0 0 auto"><label style="color:${s.color}"><span class="stage-dot" style="background:${s.color};margin-right:4px"></span>${s.label}</label></div>
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
