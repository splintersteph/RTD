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

// ─── RENDU KANBAN ──────────────────────────────────────────────────────────
function renderKanbanForets() {
  const el = document.getElementById('kanban-view-forets');
  if (!el) return;
  const active = ofsForets.filter(o => !o.archived);

  const header = `
    <div style="display:flex;align-items:center;gap:10px;margin:22px 0 10px;padding-top:14px;border-top:1px solid var(--border)">
      <h2 style="font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px">
        <i class="ti ti-circle-dot" style="color:#D4880A"></i>Kanban Forets
        <span style="font-size:11px;font-weight:500;color:var(--text-faint)">(${active.length} OF)</span>
      </h2>
      <div style="flex:1"></div>
      <label class="btn" style="font-size:12px;padding:5px 10px;cursor:pointer">
        <i class="ti ti-upload"></i> Importer suivi
        <input type="file" accept=".xlsx,.xls,.xlsb" style="display:none" onchange="foretsImportFile(this)">
      </label>
      <button class="btn btn-primary" style="font-size:12px;padding:5px 10px" onclick="foretsOpenNew()"><i class="ti ti-plus"></i>Nouvel OF Foret</button>
    </div>`;

  const cols = FORETS_STAGES.map(s => {
    const cards = active.filter(o => foretsStageOf(o) === s.id);
    return `<div class="kanban-col">
      <div class="kanban-head">
        <div class="kanban-head-title"><span class="stage-dot" style="background:${s.color}"></span>${s.label}</div>
        <div class="kanban-head-count">${cards.length} ordre${cards.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="kanban-body">${cards.length ? cards.map(foretsCardHtml).join('') : '<div style="font-size:12px;color:var(--text-faint);text-align:center;padding:20px 0">Aucun OF</div>'}</div>
    </div>`;
  }).join('');

  const termines = active.filter(o => foretsStageOf(o) === 'termine');
  const colTermine = `<div class="kanban-col">
    <div class="kanban-head">
      <div class="kanban-head-title"><span class="stage-dot" style="background:#5A5A5A"></span>Terminé</div>
      <div class="kanban-head-count">${termines.length} ordre${termines.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="kanban-body">${termines.length ? termines.map(foretsCardHtml).join('') : '<div style="font-size:12px;color:var(--text-faint);text-align:center;padding:20px 0">Aucun OF</div>'}</div>
  </div>`;

  el.innerHTML = header + '<div class="kanban">' + cols + colTermine + '</div>';
}

function foretsCardHtml(o) {
  const stageId = foretsStageOf(o);
  const stage = FORETS_STAGES.find(s => s.id === stageId);
  const ratio = stage ? foretsRatio(o, stageId) : null;
  const lastDoneStage = [...FORETS_STAGE_IDS].reverse().find(id => o.etapes[id] && o.etapes[id].qty);
  const lastDate = lastDoneStage ? o.etapes[lastDoneStage].date : o.dateOF;
  return `<div class="of-card" style="background:var(--surface);border-left:3px solid ${stage ? stage.color : '#5A5A5A'}" onclick="foretsOpenDetail('${o.id}')">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <span class="of-ref">OF ${o.numOF}</span>
      ${o.info ? '<i class="ti ti-message-circle-2" style="font-size:12px;color:var(--text-faint)" title="' + o.info.replace(/"/g, '&quot;') + '"></i>' : ''}
    </div>
    <div class="of-produit">${o.reference || '—'}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:5px;gap:6px">
      <span style="font-size:10px;color:var(--text-faint)"><i class="ti ti-stack-2" style="font-size:10px;vertical-align:-1px"></i> ${(o.qtyOF || 0).toLocaleString('fr')}</span>
      ${o.machine ? `<span style="font-size:10px;color:var(--text-faint)"><i class="ti ti-tool" style="font-size:10px;vertical-align:-1px"></i> ${o.machine}</span>` : ''}
      ${ratio != null ? `<span style="font-size:9px;color:${ratio < 0.98 ? '#A32D2D' : 'var(--text-faint)'}">rdt ${Math.round(ratio * 1000) / 10}%</span>` : ''}
    </div>
    ${lastDate ? `<div style="margin-top:4px;font-size:9px;color:var(--text-faint)"><i class="ti ti-calendar" style="font-size:9px"></i> ${fmtDate(lastDate)}</div>` : ''}
  </div>`;
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

        let nbCrees = 0, nbMaj = 0, nbIgnores = 0;
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
          if (existing) { Object.assign(existing, data); nbMaj++; }
          else { ofsForets.push(Object.assign({ id: foretsNewId(), archived: false }, data)); nbCrees++; }
        }

        showToast(`✓ Import Forets : ${nbCrees} créé(s), ${nbMaj} mis à jour${nbIgnores ? ', ' + nbIgnores + ' ligne(s) ignorée(s)' : ''}`);
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
