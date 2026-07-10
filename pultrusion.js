// ═══════════════════════════════════════════════════════════
// pultrusion.js — Planning & stock de pultrusion (joncs bruts)
// Dépend de : showToast, render, currentView (index.html)
//
// C'est la toute première étape de fabrication, en amont des tenons bruts :
// des fibres + résine sont pultrudées en joncs continus, stockés en "lots"
// (une longueur fixe de jonc, ex: 450 ou 900 ml selon la référence), qui sont
// ensuite débités en tenons. Données intégrées par défaut extraites du fichier
// "Planning_de_pultrusion.xlsm" fourni par Stéphane (feuilles "Planning
// Pultrusion" + "CALCUL MOY").
//
// IMPORTANT : le planning hebdomadaire pré-rempli du fichier source (jusqu'à
// ~4,7 ans, colonnes "SEM 30" à "SEM 31") n'a PAS été importé — la
// correspondance exacte entre un numéro "SEM XX" et une vraie semaine
// calendaire n'a pas pu être établie avec certitude, et se tromper aurait
// affiché de mauvaises quantités sur de mauvaises semaines. Le planning
// ci-dessous démarre donc vide, sur les semaines réelles à partir
// d'aujourd'hui — à remplir au fur et à mesure.
// ═══════════════════════════════════════════════════════════

const PULTRUSION_REFS_DEFAULT = [{"client": "3M", "code": "JTO3_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 35.12, "stockMezzMl": 15804, "stockRtdLots": 5.51, "stockRtdMl": 2478, "lotsAttente": 3, "lotsQuarantaine": 0, "limiteBasse": 11.14, "limiteHaute": 267.38, "mlParLot": 450, "consoLotsMois": 9.536}, {"client": "Maillefer", "code": "JTO_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 2.27, "stockMezzMl": 2043, "stockRtdLots": 4.42, "stockRtdMl": 3982, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.42, "limiteHaute": 10.16, "mlParLot": 900, "consoLotsMois": 0.439}, {"client": "DT / MATCHPOST", "code": "JTR_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M300", "stockMezzLots": 6.23, "stockMezzMl": 5610, "stockRtdLots": 1.24, "stockRtdMl": 1113, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 1.75, "limiteHaute": 41.91, "mlParLot": 900, "consoLotsMois": 1.813}, {"client": "GC", "code": "JAR_2.5", "fibre": "AR600TEX", "rowing": "", "resine": "BIS GMA SR239", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0, "stockRtdMl": 0, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": null, "limiteHaute": null, "mlParLot": 900, "consoLotsMois": 1.785}, {"client": "Tokuyamma/shofu", "code": "JAR_2.5", "fibre": "AR600TEX", "rowing": "", "resine": "BIS GMA SR239", "stockMezzLots": 7.19, "stockMezzMl": 6468, "stockRtdLots": 1.71, "stockRtdMl": 1539, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 2.52, "limiteHaute": 60.6, "mlParLot": 900, "consoLotsMois": 1.785}, {"client": "3M", "code": "JTO_XRO_3%", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 7.08, "stockMezzMl": 3186, "stockRtdLots": 1.85, "stockRtdMl": 834, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 2.35, "limiteHaute": 56.37, "mlParLot": 450, "consoLotsMois": 1.723}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_ROUGEØ3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.05, "stockMezzMl": 942, "stockRtdLots": 0.24, "stockRtdMl": 219, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.08, "limiteHaute": 1.95, "mlParLot": 500, "consoLotsMois": 0.042}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_BLEU_Ø3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.13, "stockMezzMl": 1020, "stockRtdLots": 0.49, "stockRtdMl": 441, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.47, "mlParLot": 500, "consoLotsMois": 0.035}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_JAUNEØ3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.1, "stockMezzMl": 990, "stockRtdLots": 0.33, "stockRtdMl": 300, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.05, "limiteHaute": 1.16, "mlParLot": 500, "consoLotsMois": 0.024}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_VERT_Ø3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 0.61, "stockMezzMl": 549, "stockRtdLots": 0.32, "stockRtdMl": 285, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.36, "mlParLot": 500, "consoLotsMois": 0.042}, {"client": "Macrolock", "code": "JTO_XRO", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.0, "stockMezzMl": 903, "stockRtdLots": 0.93, "stockRtdMl": 836, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.01, "limiteHaute": 0.14, "mlParLot": 900, "consoLotsMois": 0.156}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_ROUGE", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.16, "stockMezzMl": 1044, "stockRtdLots": 0.51, "stockRtdMl": 456, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.69, "limiteHaute": 16.62, "mlParLot": 900, "consoLotsMois": 0.754}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_NOIR", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.3, "stockRtdMl": 266, "lotsAttente": 2, "lotsQuarantaine": 0, "limiteBasse": 0.25, "limiteHaute": 6.04, "mlParLot": 900, "consoLotsMois": 0.271}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_JAUNE", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.8, "stockMezzMl": 1623, "stockRtdLots": 0.38, "stockRtdMl": 339, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.6, "limiteHaute": 14.45, "mlParLot": 900, "consoLotsMois": 0.528}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_BLEU", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.83, "stockRtdMl": 747, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.34, "limiteHaute": 8.13, "mlParLot": 900, "consoLotsMois": 0.327}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_VERT", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.55, "stockRtdMl": 1394, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.1, "limiteHaute": 2.35, "mlParLot": 900, "consoLotsMois": 0.097}, {"client": "Komet / ULTRADENT", "code": "JNT_XRO_2.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 2.04, "stockMezzMl": 1020, "stockRtdLots": 1.39, "stockRtdMl": 693, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 1.81, "limiteHaute": 43.43, "mlParLot": 500, "consoLotsMois": 1.682}, {"client": "Komet", "code": "JNT_XRO_3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.08, "stockRtdMl": 324, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.5, "limiteHaute": 11.89, "mlParLot": 300, "consoLotsMois": 0.463}, {"client": "Apol", "code": "JTO_ROUGE_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0.4, "stockMezzMl": 360, "stockRtdLots": 0.3, "stockRtdMl": 272, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.03, "limiteHaute": 0.62, "mlParLot": 900, "consoLotsMois": 0.036}, {"client": "Apol", "code": "JTO_BLEU_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.81, "stockRtdMl": 731, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.05, "limiteHaute": 1.31, "mlParLot": 900, "consoLotsMois": 0.036}, {"client": "Apol", "code": "JTO_JAUNE_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.34, "stockRtdMl": 1205, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.49, "mlParLot": 900, "consoLotsMois": 0.02}, {"client": "Maillefer", "code": "JTO_2.5_BLANC", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.62, "stockRtdMl": 558, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.33, "limiteHaute": 7.97, "mlParLot": 900, "consoLotsMois": 0.339}];

// ── Calculs de base ─────────────────────────────────────────────────────────
function pultTotalStock(ref) {
  return (ref.stockMezzLots||0) + (ref.stockRtdLots||0) + (ref.lotsAttente||0);
}

// Couverture en mois = stock total ÷ limite basse (déjà "1 mois de conso" dans
// le fichier source) — ne PAS recalculer via une autre consommation moyenne,
// ça donnait un résultat légèrement différent du "MOIS DE STOCK" d'origine.
function pultCouvertureMois(ref) {
  if (!ref.limiteBasse || ref.limiteBasse <= 0) return null;
  return pultTotalStock(ref) / ref.limiteBasse;
}

function pultFmtMois(mois) {
  if (mois === null || mois === undefined || !isFinite(mois)) return '—';
  if (mois >= 10) return Math.round(mois) + ' mois';
  return mois.toFixed(1) + ' mois';
}

function pultCouvertureStyle(mois) {
  if (mois === null || mois === undefined) return {bg:'var(--bg)', text:'var(--text-faint)', dot:'var(--text-faint)'};
  if (mois < 1)  return {bg:'#FCEBEB', text:'#A32D2D', dot:'#A32D2D'};
  if (mois < 3)  return {bg:'#FEF5E7', text:'#633806', dot:'#D4880A'};
  return {bg:'#EAF3DE', text:'#27500A', dot:'#1D9E75'};
}

// ── Import d'un export plus récent (remplace PULTRUSION_REFS_DEFAULT) ──────
// Réutilise la même mécanique que les autres imports xlsx de l'app (lazy-load
// SheetJS via loadXLSXForPdp, défini dans pdp.js).
let pultRefsImported = null;
function pultGetActiveRefs() { return pultRefsImported || PULTRUSION_REFS_DEFAULT; }

function pultImportFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (typeof showToast === 'function') showToast('Chargement ' + file.name + '…');
  const reader = new FileReader();
  reader.onload = (e) => {
    const doImport = () => {
      try {
        const wb = XLSX.read(e.target.result, {type:'array', cellDates:true});
        const sheetName = wb.SheetNames.find(n => /planning.*pultrusion/i.test(n)) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:null});
        const refs = [];
        for (let i = 3; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          refs.push({
            client: String(row[0]||'').trim(),
            code: String(row[1]||'').trim(),
            fibre: String(row[3]||'').trim(),
            rowing: String(row[4]||'').trim(),
            resine: String(row[5]||'').replace(/\n/g,' ').trim(),
            stockMezzLots: Number(row[6])||0,
            stockMezzMl: Math.round(Number(row[7])||0),
            stockRtdLots: Number(row[8])||0,
            stockRtdMl: Math.round(Number(row[9])||0),
            lotsAttente: Number(row[10])||0,
            lotsQuarantaine: Number(row[11])||0,
            limiteBasse: Number(row[13])||null,
            limiteHaute: Number(row[14])||null,
            mlParLot: null,
            consoLotsMois: null,
          });
        }
        if (!refs.length) { if (typeof showToast === 'function') showToast('Aucune référence reconnue dans ce fichier.'); return; }
        pultRefsImported = refs;
        if (typeof showToast === 'function') showToast(`Pultrusion : ${refs.length} références importées`);
        if (typeof currentView !== 'undefined' && currentView === 'pultrusion' && typeof renderPultrusionPage === 'function') renderPultrusionPage();
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Erreur import pultrusion : ' + err.message);
      }
    };
    if (typeof loadXLSXForPdp === 'function') loadXLSXForPdp(doImport);
    else if (typeof XLSX !== 'undefined') doImport();
  };
  reader.readAsArrayBuffer(file);
}

// ── Planning hebdomadaire (session uniquement — voir note en tête de fichier) ──
// Clé : "codeRef_YYYY-Www" -> nombre de jours de production planifiés.
let pultPlanning = {};
let pultWeekOffset = 0; // décalage (en semaines) par rapport à la semaine actuelle, pour naviguer

function pultGetISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

function pultWeekKey(baseDate, offsetWeeks) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetWeeks * 7);
  const { year, week } = pultGetISOWeek(d);
  return year + '-W' + String(week).padStart(2, '0');
}

function pultNavWeeks(delta) {
  pultWeekOffset += delta;
  renderPultrusionPage();
}

function pultSetPlanning(code, weekKey, value) {
  const key = code + '_' + weekKey;
  const n = parseInt(value);
  if (!n || n <= 0) delete pultPlanning[key];
  else pultPlanning[key] = n;
  renderPultrusionPage();
}


// ── Rendu principal ──────────────────────────────────────────────────────────
let pultSearchFilter = '';
let _pultSearchTimer = null;
function pultSearch(val) {
  pultSearchFilter = val;
  clearTimeout(_pultSearchTimer);
  _pultSearchTimer = setTimeout(() => {
    renderPultrusionPage();
    const inp = document.getElementById('pult-search');
    if (inp) { inp.focus(); inp.value = val; }
  }, 200);
}

function renderPultrusionPage() {
  const el = document.getElementById('view-pultrusion');
  if (!el) return;

  let refs = pultGetActiveRefs();
  const search = pultSearchFilter.toLowerCase();
  if (search) {
    refs = refs.filter(r =>
      r.client.toLowerCase().includes(search) ||
      r.code.toLowerCase().includes(search) ||
      r.fibre.toLowerCase().includes(search)
    );
  }

  const withCouverture = refs.map(r => ({ r, couverture: pultCouvertureMois(r), stock: pultTotalStock(r) }));
  withCouverture.sort((a,b) => {
    const na = a.couverture===null, nb = b.couverture===null;
    if (na && nb) return 0;
    if (na) return 1;
    if (nb) return -1;
    return a.couverture - b.couverture;
  });

  const nbCritique = withCouverture.filter(x => x.couverture !== null && x.couverture < 1).length;
  const nbSurveiller = withCouverture.filter(x => x.couverture !== null && x.couverture >= 1 && x.couverture < 3).length;

  // ── Cartes de références ────────────────────────────────────────────────
  const cardsHtml = withCouverture.map(({r, couverture, stock}) => {
    const style = pultCouvertureStyle(couverture);
    const composition = [r.fibre, r.rowing, r.resine].filter(Boolean).join(' · ');
    return `<div style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid ${style.dot};border-radius:var(--radius);padding:14px">
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${r.code}</div>
          <div style="font-size:10px;color:var(--text-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${composition}">${composition}</div>
        </div>
        <span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;background:${style.bg};color:${style.text};flex-shrink:0">${pultFmtMois(couverture)}</span>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px"><i class="ti ti-building-factory" style="font-size:11px;vertical-align:-1px;margin-right:3px"></i>${r.client}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
        <div style="background:var(--bg);border-radius:6px;padding:6px 8px">
          <div style="color:var(--text-faint);font-size:9px;text-transform:uppercase">Stock lots</div>
          <div style="font-weight:700">${stock.toLocaleString('fr',{maximumFractionDigits:1})}</div>
        </div>
        <div style="background:var(--bg);border-radius:6px;padding:6px 8px">
          <div style="color:var(--text-faint);font-size:9px;text-transform:uppercase">Stock mètres</div>
          <div style="font-weight:700">${(r.stockMezzMl+r.stockRtdMl).toLocaleString('fr')}</div>
        </div>
      </div>
      ${r.lotsAttente > 0 ? `<div style="margin-top:6px;font-size:10px;color:var(--text-muted)"><i class="ti ti-clock" style="font-size:11px;vertical-align:-1px;margin-right:3px"></i>${r.lotsAttente.toLocaleString('fr',{maximumFractionDigits:1})} lot(s) en attente de contrôle</div>` : ''}
      ${r.limiteBasse!==null && stock < r.limiteBasse ? `<div style="margin-top:6px;font-size:10px;font-weight:600;color:#A32D2D"><i class="ti ti-alert-triangle" style="font-size:11px;vertical-align:-1px;margin-right:3px"></i>Sous la limite basse (${r.limiteBasse.toLocaleString('fr',{maximumFractionDigits:1})})</div>` : ''}
    </div>`;
  }).join('');

  // ── Planning hebdomadaire : fenêtre de 10 semaines glissantes ──────────────
  const today = new Date(); today.setHours(0,0,0,0);
  const NB_SEM = 10;
  const weekCols = [];
  for (let i = 0; i < NB_SEM; i++) {
    const offset = pultWeekOffset + i;
    const d = new Date(today); d.setDate(d.getDate() + offset*7);
    const { year, week } = pultGetISOWeek(d);
    weekCols.push({ key: pultWeekKey(today, offset), label: 'S' + week, isCurrent: offset === 0 });
  }

  const planningRows = refs.map(r => {
    const cells = weekCols.map(w => {
      const key = r.code + '_' + w.key;
      const val = pultPlanning[key] || '';
      return `<td style="padding:2px;text-align:center;${w.isCurrent?'background:var(--accent-light)':''}">
        <input type="number" min="0" max="5" value="${val}" placeholder="—" onchange="pultSetPlanning('${r.code.replace(/'/g,"\\'")}','${w.key}',this.value)"
          style="width:34px;padding:4px 2px;text-align:center;border:1px solid var(--border-med);border-radius:4px;background:var(--bg);color:var(--text);font-size:11px;font-family:var(--font);outline:none">
      </td>`;
    }).join('');
    return `<tr><td style="font-size:11px;font-weight:600;white-space:nowrap;padding-right:10px">${r.code}<div style="font-size:9px;color:var(--text-faint);font-weight:400">${r.client}</div></td>${cells}</tr>`;
  }).join('');

  const weekHeaderHtml = weekCols.map(w =>
    `<th style="text-align:center;font-size:10px;${w.isCurrent?'color:var(--accent);font-weight:700':''}">${w.label}</th>`
  ).join('');

  let html = '<div style="flex:1;overflow-y:auto;padding:0;display:flex;flex-direction:column">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<h2 style="font-size:17px;font-weight:600"><i class="ti ti-columns-2" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Pultrusion</h2>'
    + '<input id="pult-search" placeholder="Filtrer (référence, client, fibre)…" value="'+pultSearchFilter+'" oninput="pultSearch(this.value)" style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none;width:240px">'
    + '<div style="display:flex;gap:8px;margin-left:auto;flex-wrap:wrap;align-items:center">'
    + (nbCritique ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FCEBEB;color:#A32D2D"><i class="ti ti-alert-circle" style="vertical-align:-2px;margin-right:4px"></i>${nbCritique} &lt; 1 mois</span>` : '')
    + (nbSurveiller ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FEF5E7;color:#633806"><i class="ti ti-clock" style="vertical-align:-2px;margin-right:4px"></i>${nbSurveiller} &lt; 3 mois</span>` : '')
    + '<label class="btn" style="font-size:11px;padding:5px 12px;cursor:pointer"><i class="ti ti-upload"></i> Importer<input type="file" accept=".xlsx,.xls,.xlsm" style="display:none" onchange="pultImportFile(this)"></label>'
    + '</div></div>';

  html += '<div style="flex:1;overflow-y:auto;padding:16px 20px">';

  html += '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:10px">Stock de joncs ('+refs.length+' références)</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-bottom:24px">' + (cardsHtml || '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-faint)">Aucune référence</div>') + '</div>';

  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
    + '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em">Planning hebdomadaire (jours de prod)</div>'
    + '<button class="btn" onclick="pultNavWeeks(-'+NB_SEM+')" style="font-size:11px;padding:3px 8px"><i class="ti ti-chevron-left"></i></button>'
    + '<button class="btn" onclick="pultWeekOffset=0;renderPultrusionPage()" style="font-size:11px;padding:3px 8px">Aujourd\'hui</button>'
    + '<button class="btn" onclick="pultNavWeeks('+NB_SEM+')" style="font-size:11px;padding:3px 8px"><i class="ti ti-chevron-right"></i></button>'
    + '<span style="font-size:10px;color:var(--text-faint)">Saisie manuelle (0 à 5 jours/semaine) — conservée pendant la session</span>'
    + '</div>';

  html += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;font-size:10px;color:var(--text-faint);padding-right:10px">Référence</th>'
    + weekHeaderHtml + '</tr></thead><tbody>'
    + (planningRows || '<tr><td colspan="'+(NB_SEM+1)+'" style="text-align:center;padding:20px;color:var(--text-faint)">Aucune référence</td></tr>')
    + '</tbody></table></div>';

  html += '</div></div>';
  el.innerHTML = html;
}
