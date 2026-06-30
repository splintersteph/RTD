// ═══════════════════════════════════════════════════════════════════════════════
// stock.js — Onglet Stock & Commandes
// Dépend de : getStock, getEnCours, getCdes, pcData, nomenclatures (core, dans index.html)
// ═══════════════════════════════════════════════════════════════════════════════

let stockFilter = '';
let stockSelectedRef = null;
let _stockSearchTimer = null;

// ── Helpers données
function stockGetAllRefs() {
  const refs = new Set();
  (pcData.stock||[]).forEach(r => { if (r.CODART) refs.add(String(r.CODART).trim()); });
  return [...refs].sort();
}

function stockGetCmdsDetail(codart) {
  const cStr = String(codart||'').trim();
  return (pcData.commandes||[])
    .filter(r => String(r.REF_RTD||'').trim() === cStr && String(r.LIGNE_CDE_||'').trim() === 'N')
    .map(r => ({
      numCmd:  String(r.NUM_COM||''),
      client:  String(r.LIBFOU||r.CODCLI||''),
      qteCde:  Number(r.QTE_CDE)||0,
      qteLiv:  Number(r.QTE_LIVREE)||0,
      qteRest: (Number(r.QTE_CDE)||0) - (Number(r.QTE_LIVREE)||0),
      datDel:  r.DATDEL ? String(r.DATDEL).slice(0,10) : null,
    }))
    .filter(r => r.qteRest > 0);
}

// ── Recherche avec debounce (évite la perte de focus à chaque frappe)
function debounceStockSearch(val) {
  stockFilter = val;
  clearTimeout(_stockSearchTimer);
  _stockSearchTimer = setTimeout(() => {
    renderStockPage();
    const inp = document.getElementById('stock-search-input');
    if (inp) { inp.focus(); inp.setSelectionRange(val.length, val.length); }
  }, 220);
}

function stockSelectRef(ref) {
  stockSelectedRef = ref;
  const scRef = document.getElementById('sc-ref');
  if (scRef) scRef.value = ref;
  renderStockPage();
}

function scRefChanged() {
  const ref = document.getElementById('sc-ref')?.value?.trim();
  if (ref && (pcData.stock||[]).some(r => String(r.CODART||'').trim() === ref)) {
    stockSelectedRef = ref;
    renderStockPage();
  }
  const result = document.getElementById('sc-result');
  if (result) result.style.display = 'none';
}

function scCalc() {
  const ref = document.getElementById('sc-ref')?.value?.trim();
  const qty = parseInt(document.getElementById('sc-qty')?.value) || 0;
  const result = document.getElementById('sc-result');
  if (!result) return;
  if (!ref || !qty) { result.style.display = 'none'; return; }

  const dispo    = getStock(ref);
  const enCours  = getEnCours(ref);
  const total    = dispo + enCours;
  const totalCde = getCdes(ref);
  const solde    = total - totalCde;
  const peutServir = solde >= qty;
  const manque   = qty - solde;

  const bg  = peutServir ? '#EAF3DE' : '#FCEBEB';
  const col = peutServir ? '#27500A' : '#A32D2D';
  const icn = peutServir ? 'circle-check' : 'circle-x';

  result.style.display = 'block';
  result.innerHTML =
    '<div style="background:' + bg + ';border:1px solid ' + (peutServir ? '#C0DD97' : '#F5BDBD') + ';border-radius:var(--radius);padding:14px 16px">'
    + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
    + '<i class="ti ti-' + icn + '" style="font-size:22px;color:' + col + '"></i>'
    + '<span style="font-size:14px;font-weight:700;color:' + col + '">'
    + (peutServir
        ? '✓ Commande servable sans relancer la production'
        : '✗ Production nécessaire — manque ' + Math.abs(manque).toLocaleString('fr') + ' pièces')
    + '</span></div>'
    + '<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:12px">'
    + '<span style="color:var(--text-muted)">Stock fini : <strong style="color:var(--text)">' + Math.round(dispo).toLocaleString('fr') + '</strong></span>'
    + '<span style="color:var(--text-muted)">En production : <strong style="color:var(--text)">' + Math.round(enCours).toLocaleString('fr') + '</strong></span>'
    + '<span style="color:var(--text-muted)">Cdes en cours : <strong style="color:#A32D2D">' + Math.round(totalCde).toLocaleString('fr') + '</strong></span>'
    + '<span style="color:var(--text-muted)">Solde net : <strong style="color:' + col + '">' + Math.round(solde).toLocaleString('fr') + '</strong></span>'
    + '<span style="color:var(--text-muted)">Demandé : <strong style="color:var(--text)">' + qty.toLocaleString('fr') + '</strong></span>'
    + '</div>'
    + (peutServir ? '' :
        '<div style="margin-top:8px;padding:8px 12px;background:rgba(163,45,45,.08);border-radius:6px;font-size:12px;color:#A32D2D">'
        + '<i class="ti ti-alert-triangle" style="vertical-align:-2px;margin-right:6px"></i>'
        + 'Il manque <strong>' + Math.abs(manque).toLocaleString('fr') + ' pièces</strong> pour servir cette commande. '
        + 'Un OF de production est nécessaire.</div>')
    + '</div>';
}

// ── Clic délégué (cohérent avec pdp.js — évite les soucis d'apostrophes en onclick inline)
document.addEventListener('click', function(e) {
  const actionEl = e.target.closest('[data-stock-action]');
  if (actionEl) {
    e.stopPropagation();
    const action = actionEl.getAttribute('data-stock-action');
    const arg = actionEl.getAttribute('data-stock-arg');
    if (action === 'select-ref') stockSelectRef(arg);
    return;
  }
});

// ── Rendu principal
function renderStockPage() {
  const el = document.getElementById('view-stock');
  if (!el) return;

  const hasStock     = (pcData.stock||[]).length > 0;
  const hasCommandes = (pcData.commandes||[]).length > 0;
  const hasOF        = (pcData.ofEnCours||[]).length > 0;

  function importBadge(label, count, date, type) {
    const ok = count > 0;
    return '<div style="display:flex;align-items:center;gap:8px;padding:9px 14px;background:' + (ok?'#EAF3DE':'var(--bg)') + ';border:1px solid ' + (ok?'#C0DD97':'var(--border)') + ';border-radius:var(--radius);flex:1;min-width:150px">'
      + '<i class="ti ti-' + (ok?'circle-check':'upload') + '" style="color:' + (ok?'#27500A':'var(--text-faint)') + ';font-size:16px;flex-shrink:0"></i>'
      + '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:' + (ok?'#27500A':'var(--text-muted)') + '">' + label + '</div>'
      + '<div style="font-size:10px;color:var(--text-faint)">' + (ok ? count+' lignes · '+date : 'Non importé') + '</div></div>'
      + '<label style="cursor:pointer;background:var(--accent);color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;white-space:nowrap">'
      + (ok?'↺':'↑') + ' Import'
      + '<input type="file" accept=".xlsx,.xls" style="display:none" onchange="pcImport(\'' + type + '\',this)"></label></div>';
  }

  const allRefs = stockGetAllRefs();
  const filteredRefs = stockFilter
    ? allRefs.filter(r => r.toLowerCase().includes(stockFilter.toLowerCase()))
    : allRefs;

  // ── Détail de la référence sélectionnée
  let detailHtml = '';
  if (stockSelectedRef && hasStock) {
    const dispo    = getStock(stockSelectedRef);
    const enCours  = getEnCours(stockSelectedRef);
    const total    = dispo + enCours;
    const cmds     = stockGetCmdsDetail(stockSelectedRef);
    const totalCde = cmds.reduce((s,c) => s + (c.qteRest||0), 0);
    const solde    = total - totalCde;
    const soldeBg  = solde >= 0 ? '#EAF3DE' : '#FCEBEB';
    const soldeC   = solde >= 0 ? '#27500A' : '#A32D2D';
    const nomTree  = (typeof renderNomenclatureTree === 'function') ? renderNomenclatureTree(stockSelectedRef) : '';

    const kpi = (icon, label, val, color) =>
      '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;flex:1;min-width:120px">'
      + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px"><i class="ti ti-' + icon + '" style="vertical-align:-2px;margin-right:5px"></i>' + label + '</div>'
      + '<div style="font-size:18px;font-weight:700;color:' + (color||'var(--text)') + '">' + Math.round(val).toLocaleString('fr') + '</div>'
      + '</div>';

    const cmdRows = cmds.map(c =>
      '<tr>'
      + '<td style="font-size:11px;font-weight:600;font-family:monospace;color:var(--accent)">' + c.numCmd + '</td>'
      + '<td style="font-size:12px">' + c.client + '</td>'
      + '<td style="text-align:right;font-size:12px">' + c.qteCde.toLocaleString('fr') + '</td>'
      + '<td style="text-align:right;font-size:12px;color:var(--text-muted)">' + c.qteLiv.toLocaleString('fr') + '</td>'
      + '<td style="text-align:right"><span style="font-size:12px;font-weight:600;padding:2px 8px;border-radius:20px;background:#FAEEDA;color:#633806">' + c.qteRest.toLocaleString('fr') + '</span></td>'
      + '<td style="font-size:11px;color:var(--text-muted)">' + (c.datDel||'—') + '</td>'
      + '</tr>'
    ).join('');

    const barMax = Math.max(total, totalCde, 1);
    const barDispo   = Math.round(dispo / barMax * 100);
    const barEnCours = Math.round(enCours / barMax * 100);
    const barCde     = Math.round(totalCde / barMax * 100);

    detailHtml =
      '<div style="display:flex;flex-direction:column;gap:14px">'
      + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<h3 style="font-size:18px;font-weight:700;color:var(--accent);font-family:monospace">' + stockSelectedRef + '</h3>'
      + '<span style="font-size:12px;background:' + soldeBg + ';color:' + soldeC + ';padding:4px 12px;border-radius:20px;font-weight:600">'
      + (solde>=0?'✓ Servable sans production':'✗ Production nécessaire') + '</span>'
      + '</div>'
      + (nomTree ? nomTree + '<div style="height:4px"></div>' : '')
      + '<div style="display:flex;gap:10px;flex-wrap:wrap">'
      + kpi('package','Stock fini (WIP)', dispo, '#185FA5')
      + kpi('tool','En cours prod', enCours, '#D4880A')
      + kpi('stack-2','Total disponible', total, '#27500A')
      + kpi('shopping-cart','Total commandé', totalCde, '#A32D2D')
      + '<div style="background:' + soldeBg + ';border:2px solid ' + soldeC + ';border-radius:var(--radius);padding:14px 16px;flex:1;min-width:120px">'
      + '<div style="font-size:11px;color:' + soldeC + ';margin-bottom:6px"><i class="ti ti-scale" style="vertical-align:-2px;margin-right:5px"></i>Solde</div>'
      + '<div style="font-size:22px;font-weight:700;color:' + soldeC + '">' + Math.round(solde).toLocaleString('fr') + '</div>'
      + '</div>'
      + '</div>'
      + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px">'
      + '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Visualisation des flux</div>'
      + '<div style="margin-bottom:8px">'
      + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Stock disponible</div>'
      + '<div style="height:20px;background:var(--bg);border-radius:10px;overflow:hidden">'
      + '<div style="height:100%;width:' + barDispo + '%;background:#4C8EDA;border-radius:10px;transition:width .4s"></div></div>'
      + '<div style="font-size:10px;color:var(--text-faint);margin-top:2px">' + Math.round(dispo).toLocaleString('fr') + ' pièces fini</div></div>'
      + '<div style="margin-bottom:8px">'
      + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">En cours de production</div>'
      + '<div style="height:20px;background:var(--bg);border-radius:10px;overflow:hidden">'
      + '<div style="height:100%;width:' + barEnCours + '%;background:#D4880A;border-radius:10px;transition:width .4s"></div></div>'
      + '<div style="font-size:10px;color:var(--text-faint);margin-top:2px">' + Math.round(enCours).toLocaleString('fr') + ' pièces en prod</div></div>'
      + '<div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Commandes à servir</div>'
      + '<div style="height:20px;background:var(--bg);border-radius:10px;overflow:hidden">'
      + '<div style="height:100%;width:' + barCde + '%;background:#A32D2D;border-radius:10px;transition:width .4s"></div></div>'
      + '<div style="font-size:10px;color:var(--text-faint);margin-top:2px">' + Math.round(totalCde).toLocaleString('fr') + ' pièces demandées</div></div>'
      + '</div>'
      + (cmds.length > 0
          ? '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'
            + '<div style="padding:10px 14px;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)">'
            + '<i class="ti ti-shopping-cart" style="vertical-align:-2px;margin-right:6px"></i>' + cmds.length + ' commandes ouvertes</div>'
            + '<div style="overflow-x:auto"><table class="cat-table" style="min-width:500px">'
            + '<thead><tr><th>N° Cde</th><th>Client</th><th style="text-align:right">Qté cde</th><th style="text-align:right">Livrée</th><th style="text-align:right">Restant</th><th>Date livr.</th></tr></thead>'
            + '<tbody>' + cmdRows + '</tbody></table></div></div>'
          : '<div style="text-align:center;padding:24px;color:var(--text-faint);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)">'
            + '<i class="ti ti-circle-check" style="font-size:28px;display:block;margin-bottom:8px;color:#27500A"></i>'
            + 'Aucune commande ouverte pour cette référence</div>')
      + '</div>';
  } else if (!stockSelectedRef && hasStock) {
    detailHtml = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-faint);font-size:13px;gap:10px">'
      + '<i class="ti ti-arrow-left" style="font-size:18px"></i>Sélectionnez une référence</div>';
  } else {
    detailHtml = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-faint);font-size:13px;flex-direction:column;gap:8px">'
      + '<i class="ti ti-upload" style="font-size:32px"></i>Importez le stock (PTSTOCKSIMPLE) pour commencer</div>';
  }

  // ── Liste des références (panneau gauche)
  const refRows = filteredRefs.map(ref => {
    const dispo    = getStock(ref);
    const enCours  = getEnCours(ref);
    const totalCde = getCdes(ref);
    const nbCdes   = (pcData.commandes||[]).filter(r => String(r.REF_RTD||'').trim()===ref && String(r.LIGNE_CDE_||'').trim()==='N').length;
    const solde    = (dispo + enCours) - totalCde;
    const isSel    = ref === stockSelectedRef;
    const soldeC   = solde >= 0 ? '#27500A' : '#A32D2D';
    return '<div data-stock-action="select-ref" data-stock-arg="' + ref + '" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);background:' + (isSel?'var(--accent-light)':'transparent') + ';display:flex;align-items:center;gap:8px;transition:background .1s">'
      + '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:' + (isSel?'var(--accent)':'var(--text)') + ';font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + ref + '</div>'
      + '<div style="font-size:10px;color:var(--text-faint)">' + Math.round(dispo+enCours).toLocaleString('fr') + ' dispo · ' + nbCdes + ' cde</div></div>'
      + '<span style="font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;background:' + (solde>=0?'#EAF3DE':'#FCEBEB') + ';color:' + soldeC + ';white-space:nowrap">' + Math.round(solde).toLocaleString('fr') + '</span>'
      + '</div>';
  }).join('') || '<div style="padding:20px;text-align:center;color:var(--text-faint);font-size:12px">Aucune référence trouvée</div>';

  el.innerHTML =
    '<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">'
    + '<div style="padding:16px 20px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
    + '<h2 style="font-size:17px;font-weight:600"><i class="ti ti-package" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Stock & Commandes</h2>'
    + '<button class="btn" onclick="openNomList()" style="margin-left:8px"><i class="ti ti-hierarchy-2"></i> Nomenclatures</button>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + importBadge('Stock (PTSTOCKSIMPLE)', (pcData.stock||[]).length, pcData.lastImport.stock||'—', 'stock')
    + importBadge('Commandes', (pcData.commandes||[]).length, pcData.lastImport.commandes||'—', 'commandes')
    + importBadge('OF En Cours', (pcData.ofEnCours||[]).length, pcData.lastImport.of||'—', 'of')
    + '</div></div>'
    + '<div style="flex:1;overflow:hidden;display:flex;gap:0">'
    + '<div style="width:260px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">'
    + '<div style="padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg)">'
    + '<input id="stock-search-input" placeholder="Filtrer les références…" value="' + stockFilter + '" oninput="debounceStockSearch(this.value)"'
    + ' style="width:100%;padding:7px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--surface);color:var(--text);font-size:12px;font-family:var(--font);outline:none">'
    + '<div style="font-size:10px;color:var(--text-faint);margin-top:5px">' + filteredRefs.length + ' références' + (!hasStock?' — Importez le stock':'') + '</div>'
    + '</div>'
    + '<div style="flex:1;overflow-y:auto">' + refRows + '</div>'
    + '</div>'
    + '<div style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:14px">'
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px">'
    + '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">'
    + '<i class="ti ti-calculator" style="vertical-align:-2px;margin-right:6px;color:var(--accent)"></i>Calculateur de commande</div>'
    + '<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">'
    + '<div style="flex:2;min-width:140px">'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Référence produit</div>'
    + '<input id="sc-ref" placeholder="ex: W40, K09…" value="' + (stockSelectedRef||'') + '" oninput="scRefChanged()" autocomplete="off"'
    + ' style="width:100%;padding:8px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:13px;font-family:var(--font);outline:none">'
    + '</div>'
    + '<div style="flex:1;min-width:100px">'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Quantité demandée</div>'
    + '<input id="sc-qty" type="number" min="1" placeholder="ex: 10000" oninput="scCalc()"'
    + ' style="width:100%;padding:8px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:13px;font-family:var(--font);outline:none">'
    + '</div>'
    + '<button class="btn btn-primary" onclick="scCalc()" style="padding:8px 16px;white-space:nowrap"><i class="ti ti-search"></i> Vérifier</button>'
    + '</div>'
    + '<div id="sc-result" style="display:none;margin-top:10px"></div>'
    + '</div>'
    + detailHtml
    + '</div></div></div>';
}
