// ═══════════════════════════════════════════════════════════
// commandes.js — Onglet Commandes (groupées par client)
// Dépend de : pcData, PDP_CORRESPONDANCES, nomenclatures, showToast (définis ailleurs)
// ═══════════════════════════════════════════════════════════

let cdeSelectedClient = null;
let cdeSelectedFinalClient = null; // niveau intermédiaire, uniquement pour RTD
let cdeSearchFilter = '';
let _cdeSearchTimer = null;
let _cdeCurrentRows = []; // lignes du tableau actuellement affiché, pour cdeShowOrderDetail()

// Résout une référence WIP vers son code FG final via la nomenclature.
// IMPORTANT : passer code_client quand on l'a (il vient de PDP_CORRESPONDANCES et
// est déjà le bon code FG, fiable à 100%) — ne pas se reposer sur la nomenclature
// seule, qui ne permet pas de distinguer deux références partageant un même WIP
// (ex: standard vs variante L27) et dont le repli par ratio pouvait renvoyer le
// tenon de départ au lieu du FG pour une chaîne à ratios tous vides (ex: AXIS).
function cdeResolveToFG(ref, code_client) {
  if (code_client) return code_client;
  if (typeof nomenclatures === 'undefined') return ref;
  const nom = (typeof findNomenclatureByCodart === 'function') ? findNomenclatureByCodart(ref) : null;
  if (!nom) return ref;
  // Dernière étape à ratio nul = le FG terminal, pas la première (voir commentaire ci-dessus)
  const fgEtape = nom.etapes.slice().reverse().find(e => e.ratio === null);
  return fgEtape ? fgEtape.codart : ref;
}

// Toutes les commandes ouvertes (LIGNE_CDE_='N') pour un code FG donné
function cdeGetForRef(fgCode) {
  return (pcData.commandes||[])
    .filter(r => String(r.REF_RTD||'').trim() === fgCode && String(r.LIGNE_CDE_||'').trim() === 'N')
    .map(r => ({
      numCmd:  String(r.NUM_COM||''),
      client:  String(r.LIBFOU||r.CODCLI||''),
      codcli:  String(r.CODCLI||'').trim(), // code client exact (ex: "CCH1228") — plus fiable que le nom affiché pour identifier une zone de stock dédiée
      ref:     fgCode,
      qteCde:  Number(r.QTE_CDE)||0,
      qteLiv:  Number(r.QTE_LIVREE)||0,
      qteRest: (Number(r.QTE_CDE)||0) - (Number(r.QTE_LIVREE)||0),
      datDem:  cdeToISODate(r.DATDEM),
      datDel:  cdeToISODate(r.DATDEL),
    }))
    .filter(r => r.qteRest > 0);
}

// Convertit une valeur date (string ISO, objet Date, ou format FR) en "YYYY-MM-DD"
function cdeToISODate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear(), m = String(val.getMonth()+1).padStart(2,'0'), d = String(val.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+d;
  }
  const s = String(val).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[1]+'-'+isoMatch[2]+'-'+isoMatch[3];
  const frMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frMatch) return frMatch[3]+'-'+frMatch[2].padStart(2,'0')+'-'+frMatch[1].padStart(2,'0');
  return null;
}

function cdeFmtDate(iso) {
  if (!iso) return '\u2014';
  const [y,m,d] = iso.split('-');
  return d+'/'+m+'/'+y.slice(2);
}

// ── Clic délégué
document.addEventListener('click', function(e) {
  const action = e.target.closest('[data-cde-action]');
  if (action) {
    e.stopPropagation();
    const act = action.getAttribute('data-cde-action');
    const arg = action.getAttribute('data-cde-arg');
    if (act === 'select-client') {
      cdeSelectedClient = arg || null;
      cdeSelectedFinalClient = null;
      cdeSearchFilter = '';
      renderCommandesPage();
    } else if (act === 'select-final-client') {
      cdeSelectedFinalClient = arg || null;
      cdeSearchFilter = '';
      renderCommandesPage();
    } else if (act === 'back-to-final-clients') {
      cdeSelectedFinalClient = null;
      cdeSearchFilter = '';
      renderCommandesPage();
    } else if (act === 'show-order') {
      cdeShowOrderDetail(arg);
    }
    return;
  }
});

function cdeSearch(val) {
  cdeSearchFilter = val;
  clearTimeout(_cdeSearchTimer);
  _cdeSearchTimer = setTimeout(() => {
    renderCommandesPage();
    const inp = document.getElementById('cde-search-input');
    if (inp) { inp.focus(); inp.value = val; }
  }, 200);
}

// Ouvre une modale avec le détail ligne-à-ligne d'une commande, et le stock
// disponible en face de chaque référence (via pdpGetTotalFGForRef, pdp.js).
function cdeShowOrderDetail(numCmd) {
  const lines = _cdeCurrentRows.filter(r => r.numCmd === numCmd);
  if (!lines.length) return;
  const client = lines[0].client;

  const rowsHtml = lines.map((r, idx) => {
    const zones = (typeof pdpGetZonesForClient === 'function') ? pdpGetZonesForClient(r.codcli) : null;
    const breakdown = (typeof pdpGetLevelsBreakdown === 'function')
      ? pdpGetLevelsBreakdown(r.codart_wip, r.code_client, zones)
      : null;
    const stock = breakdown ? breakdown.totalFG : null;
    const ok = stock !== null && stock >= r.qteRest;

    // Encadré détaillé au survol : un vrai bloc HTML (pas la bulle native du
    // navigateur), regroupé en 3 catégories lisibles — tenons, blisters, FG — en
    // quantités BRUTES disponibles (pas l'équivalent FG, qui est déjà le total
    // affiché sur le badge). Les étapes avant le blister (tenon brut, tenon
    // jointé...) sont cumulées sur une seule ligne "Tenons".
    const tooltipId = 'cde-lv-' + numCmd.replace(/[^a-zA-Z0-9]/g,'') + '-' + idx;
    let tooltipHtml = '';
    if (breakdown) {
      const { levels, blisterIdx, totalFG } = breakdown;
      const hasBlisterLevel = levels.length > 1 && blisterIdx >= 0 && blisterIdx < levels.length - 1;
      const tenons   = levels.filter((l,i) => i < blisterIdx).reduce((s,l) => s + l.stk, 0);
      const blisters = hasBlisterLevel ? levels.filter((l,i) => i === blisterIdx).reduce((s,l) => s + l.stk, 0) : 0;
      const fg       = levels.filter((l,i) => hasBlisterLevel ? i > blisterIdx : i >= blisterIdx).reduce((s,l) => s + l.stk, 0);

      const zoneTagBlister = zones ? ' <span style="color:var(--text-faint);font-weight:400">('+zones.blister.join('+')+')</span>' : '';
      const zoneTagFG = zones ? ' <span style="color:var(--text-faint);font-weight:400">('+zones.fg.join('+')+')</span>' : '';

      const ligne = (label, valeur, tag) =>
        '<div style="display:flex;justify-content:space-between;gap:16px;padding:4px 0;font-size:12px">'
        + '<span>'+label+(tag||'')+'</span>'
        + '<span style="font-weight:600;white-space:nowrap">'+valeur.toLocaleString('fr')+'</span>'
        + '</div>';

      tooltipHtml = '<div id="'+tooltipId+'" style="display:none;position:absolute;right:0;top:100%;z-index:80;background:var(--surface);border:1px solid var(--border-med);border-radius:var(--radius);box-shadow:0 10px 34px rgba(0,0,0,.22);padding:12px 14px;min-width:230px;text-align:left;margin-top:6px">'
        + '<div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px">Stock disponible par niveau</div>'
        + ligne('Tenons', tenons, '')
        + (hasBlisterLevel ? ligne('Blisters', blisters, zoneTagBlister) : '')
        + ligne('FG', fg, zoneTagFG)
        + '<div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:12px;font-weight:700">'
        + '<span>Total (équiv. FG)</span><span>'+totalFG.toLocaleString('fr')+'</span>'
        + '</div></div>';
    }

    const stockBadge = stock === null
      ? '<span style="font-size:11px;color:var(--text-faint)">—</span>'
      : '<span onmouseenter="var t=document.getElementById(\''+tooltipId+'\');if(t)t.style.display=\'block\'" onmouseleave="var t=document.getElementById(\''+tooltipId+'\');if(t)t.style.display=\'none\'"'
        + ' style="position:relative;display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+(ok?'#EAF3DE':'#FCEBEB')+';color:'+(ok?'#27500A':'#A32D2D')+';cursor:help">'
        + '<i class="ti '+(ok?'ti-check':'ti-x')+'" style="vertical-align:-1px;margin-right:3px;font-size:10px"></i>'+stock.toLocaleString('fr')
        + (zones?' <i class="ti ti-map-pin" style="font-size:9px;vertical-align:1px;opacity:.6"></i>':'')
        + tooltipHtml
        + '</span>';
    return '<tr onclick="'+(typeof pdpShowDetail==='function'?'closeOverlay();pdpShowDetail(\''+r.code_client+'\')':'')+'" style="cursor:'+(typeof pdpShowDetail==='function'?'pointer':'default')+'">'
      + '<td style="font-size:12px">'+r.libelle+'<div style="font-size:9px;color:var(--text-faint);font-family:monospace">'+r.codart_wip+'</div></td>'
      + '<td style="text-align:right;font-size:12px">'+r.qteCde.toLocaleString('fr')+'</td>'
      + '<td style="text-align:right;font-size:12px;color:var(--text-muted)">'+r.qteLiv.toLocaleString('fr')+'</td>'
      + '<td style="text-align:right"><span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#FAEEDA;color:#633806">'+r.qteRest.toLocaleString('fr')+'</span></td>'
      + '<td style="text-align:right">'+stockBadge+'</td>'
      + '<td style="font-size:11px;color:var(--text-muted)">'+cdeFmtDate(r.datDel)+'</td>'
      + '</tr>';
  }).join('');

  const totalRestant = lines.reduce((s,r)=>s+r.qteRest,0);

  const modalEl = document.getElementById('modal');
  modalEl.style.width = '900px'; // plus large que le défaut (580px) pour éviter le scroll horizontal du tableau ; CSS .modal garde max-width:95vw pour les petits écrans
  modalEl.innerHTML = `
    <div class="modal-header">
      <h2><i class="ti ti-shopping-cart" style="color:var(--accent);margin-right:8px"></i>Commande ${numCmd}
        <span style="font-size:12px;font-weight:500;margin-left:10px;padding:3px 10px;border-radius:20px;background:var(--bg);color:var(--text-muted)">${client}</span>
      </h2>
      <button class="close-btn" onclick="closeOverlay()"><i class="ti ti-x"></i></button>
    </div>
    <div class="modal-body">
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <div style="background:var(--bg);border-radius:var(--radius);padding:10px 14px;flex:1">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Lignes</div>
          <div style="font-size:18px;font-weight:700">${lines.length}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius);padding:10px 14px;flex:1">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Total restant</div>
          <div style="font-size:18px;font-weight:700;color:#A32D2D">${totalRestant.toLocaleString('fr')}</div>
        </div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)">
        <table class="cat-table" style="width:100%;table-layout:fixed">
          <colgroup>
            <col style="width:34%"><col style="width:11%"><col style="width:11%">
            <col style="width:13%"><col style="width:16%"><col style="width:15%">
          </colgroup>
          <thead><tr><th>Référence</th><th style="text-align:right">Cdé</th><th style="text-align:right">Livré</th>
          <th style="text-align:right">Restant</th><th style="text-align:right">Stock dispo.</th><th>Livraison</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div style="font-size:10px;color:var(--text-faint);margin-top:8px">Cliquer sur une ligne ouvre le détail de la référence dans le PDP.</div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeOverlay()">Fermer</button>
    </div>`;
  document.getElementById('overlay').classList.add('open');
}


// ── Calculateur de commande ─────────────────────────────────────────────────
// Simule la disponibilité de stock pour UN client donné (avec sa zone dédiée
// appliquée si configurée — voir CLIENT_STOCK_ZONES, index.html) et une quantité
// demandée. Rendu ciblé (pas de renderCommandesPage() complet à chaque saisie)
// pour ne pas perdre le focus des champs pendant la frappe.
let cdeCalcSelectedRef = null; // {codart_wip, code_client, libelle_fg, client}
let _cdeCalcSearchTimer = null;

function cdeCalcRenderSection() {
  const zonesConfig = (typeof CLIENT_STOCK_ZONES !== 'undefined') ? CLIENT_STOCK_ZONES : {};
  const clientLabels = { 'CCH1228': 'Chaoran (CCH1228)', 'ICE1103': 'DS DNA (ICE1103)' };
  const clientOptions = '<option value="">Client standard (stock général)</option>'
    + Object.keys(zonesConfig).map(code =>
        '<option value="'+code+'">'+(clientLabels[code]||code)+'</option>'
      ).join('');

  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px">'
    + '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:12px"><i class="ti ti-calculator" style="vertical-align:-2px;margin-right:6px"></i>Calculateur de commande</div>'
    + '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">'
    + '<div style="flex:2;min-width:200px;position:relative">'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Référence produit</div>'
    + '<input id="cde-calc-ref" placeholder="ex: W41, DT Illusion…" oninput="cdeCalcRefChanged()" onfocus="cdeCalcRefChanged()" onblur="setTimeout(cdeCalcHideSuggestions,150)" autocomplete="off"'
    + ' style="width:100%;padding:8px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:13px;font-family:var(--font);outline:none">'
    + '<div id="cde-calc-suggestions" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:30;background:var(--surface);border:1px solid var(--border-med);border-radius:var(--radius);max-height:240px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.15);margin-top:3px"></div>'
    + '</div>'
    + '<div style="flex:1.4;min-width:190px">'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Client</div>'
    + '<select id="cde-calc-client" onchange="cdeCalc()" style="width:100%;padding:8px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:13px;font-family:var(--font);outline:none">'
    + clientOptions
    + '</select>'
    + '</div>'
    + '<div style="flex:1;min-width:130px">'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Quantité demandée</div>'
    + '<input id="cde-calc-qty" type="number" min="1" placeholder="ex: 10000" oninput="cdeCalc()"'
    + ' style="width:100%;padding:8px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:13px;font-family:var(--font);outline:none">'
    + '</div>'
    + '</div>'
    + '<div id="cde-calc-result" style="margin-top:14px"></div>'
    + '</div>';
}

function cdeCalcRefChanged() {
  clearTimeout(_cdeCalcSearchTimer);
  const inp = document.getElementById('cde-calc-ref');
  const val = (inp?.value || '').trim().toLowerCase();
  const result = document.getElementById('cde-calc-result');
  if (result) result.innerHTML = '';
  const box = document.getElementById('cde-calc-suggestions');
  if (!box) return;
  if (!val) { box.style.display = 'none'; return; }

  _cdeCalcSearchTimer = setTimeout(() => {
    const corrs = (typeof pdpGetActiveCorrespondances === 'function') ? pdpGetActiveCorrespondances() : [];
    const matches = corrs.filter(r =>
      r.libelle_fg.toLowerCase().includes(val) ||
      r.codart_wip.toLowerCase().includes(val) ||
      r.code_client.toLowerCase().includes(val)
    ).slice(0, 8);

    if (!matches.length) { box.style.display = 'none'; return; }

    box.innerHTML = matches.map(r =>
      '<div onmousedown="cdeCalcPickSuggestion(\''+r.code_client.replace(/'/g,"\\'")+'\')" '
      + 'style="padding:7px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border)" '
      + 'onmouseenter="this.style.background=\'var(--accent-light)\'" onmouseleave="this.style.background=\'\'">'
      + '<div style="font-weight:600">'+r.libelle_fg+'</div>'
      + '<div style="font-size:10px;color:var(--text-faint)">'+r.client+' · '+r.codart_wip+'</div>'
      + '</div>'
    ).join('');
    box.style.display = 'block';
  }, 150);
}

function cdeCalcHideSuggestions() {
  const box = document.getElementById('cde-calc-suggestions');
  if (box) box.style.display = 'none';
}

function cdeCalcPickSuggestion(codeClient) {
  cdeCalcHideSuggestions();
  const corrs = (typeof pdpGetActiveCorrespondances === 'function') ? pdpGetActiveCorrespondances() : [];
  const ref = corrs.find(r => r.code_client === codeClient);
  if (!ref) return;
  cdeCalcSelectedRef = ref;
  const inp = document.getElementById('cde-calc-ref');
  if (inp) inp.value = ref.libelle_fg;
  cdeCalc();
}

function cdeCalc() {
  const result = document.getElementById('cde-calc-result');
  if (!result) return;
  if (!cdeCalcSelectedRef) { result.innerHTML = ''; return; }

  const qty = parseInt(document.getElementById('cde-calc-qty')?.value) || 0;
  const clientCode = document.getElementById('cde-calc-client')?.value || '';
  const zones = (clientCode && typeof pdpGetZonesForClient === 'function') ? pdpGetZonesForClient(clientCode) : null;

  const breakdown = (typeof pdpGetLevelsBreakdown === 'function')
    ? pdpGetLevelsBreakdown(cdeCalcSelectedRef.codart_wip, cdeCalcSelectedRef.code_client, zones)
    : null;
  if (!breakdown) { result.innerHTML = ''; return; }

  const { levels, blisterIdx, totalFG } = breakdown;
  const hasBlisterLevel = levels.length > 1 && blisterIdx >= 0 && blisterIdx < levels.length - 1;
  const tenons   = levels.filter((l,i) => i < blisterIdx).reduce((s,l) => s + l.stk, 0);
  const blisters = hasBlisterLevel ? levels.filter((l,i) => i === blisterIdx).reduce((s,l) => s + l.stk, 0) : 0;
  const fg       = levels.filter((l,i) => hasBlisterLevel ? i > blisterIdx : i >= blisterIdx).reduce((s,l) => s + l.stk, 0);

  let html = '<div style="background:var(--bg);border-radius:var(--radius);padding:12px 14px">'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;font-size:12px;margin-bottom:'+(qty>0?'10px':'0')+'">'
    + '<span>Tenons : <strong>'+tenons.toLocaleString('fr')+'</strong></span>'
    + (hasBlisterLevel ? '<span>Blisters : <strong>'+blisters.toLocaleString('fr')+'</strong>'+(zones?' <span style="color:var(--text-faint)">('+zones.blister.join('+')+')</span>':'')+'</span>' : '')
    + '<span>FG : <strong>'+fg.toLocaleString('fr')+'</strong>'+(zones?' <span style="color:var(--text-faint)">('+zones.fg.join('+')+')</span>':'')+'</span>'
    + '<span>Total équiv. FG : <strong>'+totalFG.toLocaleString('fr')+'</strong></span>'
    + '</div>';

  if (qty > 0) {
    const ok = totalFG >= qty;
    html += '<div style="padding:10px 12px;border-radius:var(--radius);background:'+(ok?'#EAF3DE':'#FCEBEB')+';color:'+(ok?'#27500A':'#A32D2D')+';font-size:13px;font-weight:600">'
      + '<i class="ti '+(ok?'ti-check':'ti-x')+'" style="vertical-align:-2px;margin-right:6px"></i>'
      + (ok ? 'Servable sans production' : 'Production nécessaire — manque '+(qty-totalFG).toLocaleString('fr')+' pièces')
      + '</div>';
  }
  html += '</div>';
  result.innerHTML = html;
}


// ── Rendu principal
function renderCommandesPage() {
  const el = document.getElementById('view-commandes');
  if (!el) return;

  const hasCommandes = (pcData.commandes||[]).length > 0;

  // Regrouper PDP_CORRESPONDANCES par client (comme dans le PDP)
  const byClient = {};
  if (typeof PDP_CORRESPONDANCES !== 'undefined') {
    PDP_CORRESPONDANCES.forEach(c => {
      const key = c.client;
      byClient[key] = byClient[key] || [];
      byClient[key].push(c);
    });
  }
  const clients = Object.keys(byClient).sort();

  // Pour chaque client, calculer le total de commandes ouvertes et le nombre
  function clientStats(cl) {
    let totalQte = 0, totalCmds = 0, refsAvecCdes = 0;
    byClient[cl].forEach(r => {
      const fg = cdeResolveToFG(r.codart_wip, r.code_client);
      const cmds = cdeGetForRef(fg);
      if (cmds.length) refsAvecCdes++;
      totalCmds += cmds.length;
      totalQte += cmds.reduce((s,c) => s+c.qteRest, 0);
    });
    return { totalQte, totalCmds, refsAvecCdes };
  }

  // "RTD" dans les correspondances désigne les gammes propres de RTD (DT Illusion,
  // Macro Ill XRO, etc.), vendues à de nombreux distributeurs différents — contrairement
  // à 3M/APOL/etc. qui SONT eux-mêmes le client final. Regrouper tout sous une seule
  // carte "RTD" masquerait qui achète réellement. On calcule donc, pour RTD uniquement,
  // un niveau intermédiaire par client final réel (LIBFOU/CODCLI de la commande).
  function cdeRTDFinalClientStats() {
    const perFinal = {}; // finalClientName -> {refs:Set(code_client), totalQte, totalCmds}
    (byClient['RTD']||[]).forEach(r => {
      const fg = cdeResolveToFG(r.codart_wip, r.code_client);
      cdeGetForRef(fg).forEach(c => {
        const fc = c.client || 'Client non renseigné';
        if (!perFinal[fc]) perFinal[fc] = { refs: new Set(), totalQte: 0, totalCmds: 0 };
        perFinal[fc].refs.add(r.code_client);
        perFinal[fc].totalQte += c.qteRest;
        perFinal[fc].totalCmds += 1;
      });
    });
    return perFinal;
  }

  const COL_DEFAULT = {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
  const CLIENT_COLORS = (typeof PDP_CLIENT_COLORS !== 'undefined') ? PDP_CLIENT_COLORS : {};

  let mainContent = '';
  let breadcrumb = '';
  const isRTD = cdeSelectedClient === 'RTD';

  if (!cdeSelectedClient) {
    // ── Calculateur de commande : simule le stock disponible pour un client donné,
    // en tenant compte de sa zone dédiée s'il en a une (Chaoran, DS DNA...).
    mainContent += cdeCalcRenderSection();

    // ── Vue d'ensemble : une carte par client ──────────────────────────────
    mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">';
    clients.forEach(cl => {
      const col = CLIENT_COLORS[cl] || COL_DEFAULT;
      const stats = clientStats(cl);
      mainContent +=
        '<div data-cde-action="select-client" data-cde-arg="'+cl+'" style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid '+col.dot+';border-radius:var(--radius);padding:14px;cursor:pointer;transition:all .15s"'
        +' onmouseenter="this.style.background=\''+col.bg+'\'" onmouseleave="this.style.background=\'var(--surface)\'">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
        +'<span style="font-size:14px;font-weight:700;color:'+col.text+';flex:1">'+cl+'</span>'
        +(stats.totalCmds>0?'<span style="font-size:10px;font-weight:700;background:'+col.dot+';color:#fff;padding:2px 8px;border-radius:20px">'+stats.totalCmds+'</span>':'')
        +'</div>'
        +'<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted)">'
        +'<span>'+stats.refsAvecCdes+' réf. concernées</span>'
        +'<span style="font-weight:700;color:'+(stats.totalQte>0?'#A32D2D':'var(--text-faint)')+'">'+stats.totalQte.toLocaleString('fr')+' pièces</span>'
        +(cl==='RTD'?'<span style="font-size:10px;color:var(--text-faint)"><i class="ti ti-chevron-right"></i></span>':'')
        +'</div></div>';
    });
    mainContent += '</div>';

    if (!hasCommandes) {
      mainContent += '<div style="margin-top:14px;padding:12px 16px;background:var(--bg);border:1px dashed var(--border-med);border-radius:var(--radius);font-size:12px;color:var(--text-faint);text-align:center">'
        +'<i class="ti ti-upload" style="font-size:20px;display:block;margin-bottom:6px"></i>'
        +'Importez vos commandes depuis l\'onglet Stock pour voir le détail ici</div>';
    }

  } else if (isRTD && !cdeSelectedFinalClient) {
    // ── Niveau intermédiaire RTD : une carte par client final réel ─────────
    const col = CLIENT_COLORS['RTD'] || COL_DEFAULT;
    const perFinal = cdeRTDFinalClientStats();
    const finalNames = Object.keys(perFinal).sort();

    breadcrumb = '<span style="font-size:11px;color:var(--text-faint)">RTD <i class="ti ti-chevron-right" style="font-size:10px;vertical-align:-1px"></i> clients finaux</span>';

    if (finalNames.length) {
      mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">';
      finalNames.forEach(fc => {
        const s = perFinal[fc];
        mainContent +=
          '<div data-cde-action="select-final-client" data-cde-arg="'+fc.replace(/"/g,'&quot;')+'" style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid '+col.dot+';border-radius:var(--radius);padding:14px;cursor:pointer;transition:all .15s"'
          +' onmouseenter="this.style.background=\''+col.bg+'\'" onmouseleave="this.style.background=\'var(--surface)\'">'
          +'<div style="font-size:13px;font-weight:700;color:'+col.text+';margin-bottom:10px">'+fc+'</div>'
          +'<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted)">'
          +'<span>'+s.refs.size+' réf.</span>'
          +'<span style="font-weight:700;color:#A32D2D">'+s.totalQte.toLocaleString('fr')+' pièces</span>'
          +'</div></div>';
      });
      mainContent += '</div>';
    } else {
      mainContent += '<div style="text-align:center;padding:40px;color:var(--text-faint)"><i class="ti ti-circle-check" style="font-size:28px;display:block;margin-bottom:8px;color:#27500A"></i>Aucune commande ouverte sur les références RTD</div>';
    }

  } else {
    // ── Vue détail : commandes d'un client (ou d'un client final RTD) ──────
    const col = CLIENT_COLORS[isRTD ? 'RTD' : cdeSelectedClient] || COL_DEFAULT;
    const search = cdeSearchFilter.toLowerCase();

    if (isRTD) {
      breadcrumb = '<span style="font-size:11px;color:var(--text-faint)">'
        + '<span data-cde-action="back-to-final-clients" style="color:var(--text-faint);text-decoration:underline;cursor:pointer">RTD</span>'
        + ' <i class="ti ti-chevron-right" style="font-size:10px;vertical-align:-1px"></i> '+cdeSelectedFinalClient+'</span>';
    }

    const refsForClient = byClient[cdeSelectedClient] || [];
    const rows = [];
    refsForClient.forEach(r => {
      const fg = cdeResolveToFG(r.codart_wip, r.code_client);
      let cmds = cdeGetForRef(fg);
      if (isRTD) cmds = cmds.filter(c => (c.client || 'Client non renseigné') === cdeSelectedFinalClient);
      cmds.forEach(c => rows.push(Object.assign({}, c, {
        libelle: r.libelle_fg,
        codart_wip: r.codart_wip,
        code_client: r.code_client,
      })));
    });

    rows.sort((a,b) => (a.datDel||'9999').localeCompare(b.datDel||'9999'));

    const filteredRows = rows.filter(r =>
      !search || r.libelle.toLowerCase().includes(search) || r.numCmd.toLowerCase().includes(search) || r.client.toLowerCase().includes(search)
    );

    // Conservées pour que cdeShowOrderDetail() puisse retrouver le détail complet
    // d'une commande au clic, sans recalculer le regroupement.
    _cdeCurrentRows = filteredRows;

    const totalQte = filteredRows.reduce((s,r) => s+r.qteRest, 0);

    // Regroupement par n° de commande : une ligne de tableau par commande,
    // le détail ligne-à-ligne (avec le stock disponible) s'ouvre au clic.
    const byOrder = {};
    filteredRows.forEach(r => {
      byOrder[r.numCmd] = byOrder[r.numCmd] || { numCmd:r.numCmd, client:r.client, lines:[], totalRestant:0, dates:new Set() };
      byOrder[r.numCmd].lines.push(r);
      byOrder[r.numCmd].totalRestant += r.qteRest;
      if (r.datDel) byOrder[r.numCmd].dates.add(r.datDel);
    });
    const orders = Object.values(byOrder).sort((a,b) => {
      const da = [...a.dates].sort()[0] || '9999';
      const db = [...b.dates].sort()[0] || '9999';
      return da.localeCompare(db);
    });

    mainContent += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">'
      + '<div style="background:'+col.bg+';border:1px solid '+col.dot+'33;border-radius:var(--radius);padding:12px 16px;flex:1;min-width:100px">'
      + '<div style="font-size:10px;color:'+col.text+';font-weight:600;text-transform:uppercase">Commandes</div>'
      + '<div style="font-size:22px;font-weight:700;color:'+col.text+'">'+orders.length+'</div></div>'
      + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;flex:1;min-width:100px">'
      + '<div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Total restant</div>'
      + '<div style="font-size:22px;font-weight:700;color:#A32D2D">'+totalQte.toLocaleString('fr')+'</div></div>'
      + '</div>';

    if (orders.length) {
      mainContent += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'
        + '<div style="overflow-x:auto"><table class="cat-table" style="min-width:700px">'
        + '<thead><tr><th>N° Cde</th><th>Client final</th><th style="text-align:right">Lignes</th>'
        + '<th style="text-align:right">Restant</th><th>Livraison</th><th></th></tr></thead><tbody>';
      orders.forEach(o => {
        const dates = [...o.dates].sort();
        const dateLabel = dates.length===0 ? '—'
          : dates.length===1 ? cdeFmtDate(dates[0])
          : cdeFmtDate(dates[0])+' → '+cdeFmtDate(dates[dates.length-1]);
        mainContent += '<tr data-cde-action="show-order" data-cde-arg="'+o.numCmd.replace(/"/g,'&quot;')+'" style="cursor:pointer" onmouseenter="this.style.background=\'var(--accent-light)\'" onmouseleave="this.style.background=\'\'">'
          + '<td style="font-size:11px;font-weight:600;font-family:monospace;color:var(--accent)">'+o.numCmd+'</td>'
          + '<td style="font-size:12px">'+o.client+'</td>'
          + '<td style="text-align:right;font-size:12px">'+o.lines.length+'</td>'
          + '<td style="text-align:right"><span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#FAEEDA;color:#633806">'+o.totalRestant.toLocaleString('fr')+'</span></td>'
          + '<td style="font-size:11px;color:var(--text-muted)">'+dateLabel+'</td>'
          + '<td style="text-align:right;color:var(--text-faint)"><i class="ti ti-chevron-right"></i></td>'
          + '</tr>';
      });
      mainContent += '</tbody></table></div></div>';
    } else {
      mainContent += '<div style="text-align:center;padding:40px;color:var(--text-faint)"><i class="ti ti-circle-check" style="font-size:28px;display:block;margin-bottom:8px;color:#27500A"></i>Aucune commande ouverte</div>';
    }
  }

  // Bouton retour : depuis le détail RTD → liste des clients finaux ; sinon → tous les clients
  const backAction = (isRTD && cdeSelectedFinalClient)
    ? 'data-cde-action="back-to-final-clients"'
    : 'data-cde-action="select-client" data-cde-arg=""';
  const backLabel = (isRTD && cdeSelectedFinalClient) ? 'Clients finaux RTD' : 'Tous les clients';
  const showSearch = !!cdeSelectedClient && !(isRTD && !cdeSelectedFinalClient);

  el.innerHTML =
    '<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface)">'
    + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">'
    + '<h2 style="font-size:17px;font-weight:600"><i class="ti ti-shopping-cart" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Commandes</h2>'
    + (cdeSelectedClient ? '<button class="btn" '+backAction+' style="font-size:11px;padding:4px 10px"><i class="ti ti-arrow-left"></i> '+backLabel+'</button>' : '')
    + (breadcrumb ? breadcrumb : '')
    + '</div>'
    + (showSearch
        ? '<input id="cde-search-input" placeholder="Filtrer (référence, n° commande, client)…" value="'+cdeSearchFilter+'" oninput="cdeSearch(this.value)" style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none;width:280px">'
        : '<span style="font-size:11px;color:var(--text-faint)">'+(!cdeSelectedClient ? 'Cliquez sur un client pour voir le détail de ses commandes' : 'Cliquez sur un client final pour voir le détail de ses commandes')+'</span>')
    + '</div>'
    + '<div style="flex:1;overflow-y:auto;padding:16px 20px">' + mainContent + '</div>'
    + '</div>';
}
