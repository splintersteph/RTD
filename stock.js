// ═══════════════════════════════════════════════════════════
// stock.js — Onglet Stock & Commandes
// ═══════════════════════════════════════════════════════════

let stockFilter = '';
let stockSelectedRef = null;
let _stockSearchTimer = null;



function stockGetDisponible(codart) {
  // Liste noire officielle (Stéphane, 07/07/2026) — synchronisée avec
  // pdpGetStockForWip (index.html) et pcCalcStock (index.html, Planning Composite).
  // Tout emplacement non listé ici compte comme stock disponible par défaut.
  const EMPL_EXCLUS = [
    'CHARNC','ECONC','KATNC','NC','NCBLIS','QUALNC',
    'QUARCR','QUARCV','QUARKP','QUARLG','QUARLU','QUARPS','QUARQL','QUARSR',
    'SARNC','ZQUAL','ZREBUT',
  ];
  return (pcData.stock||[])
    .filter(r => {
      const art  = String(r.CODART||'').trim();
      const empl = String(r.EMPLAC||'').trim();
      return art === codart && !EMPL_EXCLUS.includes(empl);
    })
    .reduce((s,r) => s + (Number(r.QTEEMP)||0), 0);
}

function stockGetEnCoursProd(codart) {
  return (pcData.ofEnCours||[])
    .filter(r => String(r.CODART||'').trim() === codart)
    .reduce((s,r) => s + (Number(r.QTEPRE)||0), 0);
}


// Résout une référence (potentiellement WIP) vers son code FG final via la nomenclature
// — les commandes clients portent toujours sur le produit fini, jamais sur un niveau WIP
function resolveToFG(ref) {
  if (typeof nomenclatures === 'undefined') return ref;
  const nom = (typeof findNomenclatureByCodart === 'function') ? findNomenclatureByCodart(ref) : null;
  if (!nom) return ref;
  // Prendre la DERNIÈRE étape à ratio nul (le FG terminal), pas la première : dans une
  // chaîne où tous les ratios sont vides (ex: AXIS tenon→blister vrac→blister fini),
  // la première étape à ratio===null est le tenon de départ lui-même, pas le FG —
  // .find() renverrait alors le mauvais code pour le rapprochement des commandes.
  const fgEtape = nom.etapes.slice().reverse().find(e => e.ratio === null);
  return fgEtape ? fgEtape.codart : ref;
}

function stockGetCommandes(codart) {
  // Toutes les commandes ouvertes (LIGNE_CDE_='N') pour ce produit
  return pcData.commandes
    .filter(r => String(r.REF_RTD||'').trim() === codart && String(r.LIGNE_CDE_||'').trim() === 'N')
    .map(r => ({
      numCmd:   String(r.NUM_COM||''),
      client:   String(r.LIBFOU||r.CODCLI||''),
      ref:      String(r.REF_RTD||''),
      qteCde:   Number(r.QTE_CDE)||0,
      qteLiv:   Number(r.QTE_LIVREE)||0,
      qteRest:  (Number(r.QTE_CDE)||0) - (Number(r.QTE_LIVREE)||0),
      datDem:   r.DATDEM ? String(r.DATDEM).slice(0,10) : null,
      datDel:   r.DATDEL ? String(r.DATDEL).slice(0,10) : null,
    }))
    .filter(r => r.qteRest > 0);
}

function debounceStockSearch(val) {
  stockFilter = val;
  clearTimeout(_stockSearchTimer);
  _stockSearchTimer = setTimeout(() => {
    renderStockPage();
    const inp = document.getElementById('stock-search-input');
    if (inp) { inp.focus(); inp.setSelectionRange(val.length, val.length); }
  }, 220);
}


function stockGetAllRefs() {
  const refs = new Set();
  pcData.stock.forEach(r => { if (r.CODART) refs.add(String(r.CODART).trim()); });
  return [...refs].sort();
}


// Calcule le stock disponible ET l'en-cours de production en équivalent FG pour une
// référence, en tenant compte de TOUTE la nomenclature si elle existe (tenon →
// blister → FG…), chaque niveau divisé par son ratio CUMULÉ jusqu'au FG — pas la
// simple somme brute des quantités de chaque étape (un tenon brut et une boîte
// finie ne valent pas "1 unité" chacun). Utilisée à la fois par le panneau détail
// et par le calculateur de commande (scCalc) : NE PAS réimplémenter ailleurs, ça a
// déjà causé plusieurs divergences (stock/en-cours gonflés, calculateur ignorant
// le stock amont).
// IMPORTANT : cette fonction doit rester au niveau racine du fichier (pas imbriquée
// dans renderStockPage) — scCalc() est définie plus loin comme fonction indépendante
// et ne pourrait pas y accéder sinon (c'est exactement ce qui a cassé le calculateur
// une première fois : la fonction était collée à l'intérieur de renderStockPage).
function stockGetDispoEtEnCours(ref) {
  const nomForRef = (typeof findNomenclatureByCodart === 'function') ? findNomenclatureByCodart(ref) : null;

  if (!nomForRef) {
    return { dispo: stockGetDisponible(ref), enCours: stockGetEnCoursProd(ref) };
  }

  let dispoSum = 0, encSum = 0;
  nomForRef.etapes.forEach((e, i) => {
    let cumRatio = 1;
    for (let j = i; j < nomForRef.etapes.length - 1; j++) {
      if (nomForRef.etapes[j].ratio) cumRatio *= nomForRef.etapes[j].ratio;
    }
    const stk = stockGetDisponible(e.codart);
    // En-cours compté UNIQUEMENT au premier niveau (tenon brut) — voir commentaire
    // dans pdpGetTotalFGForRef (pdp.js) : un même lot suivi comme "en cours" à
    // travers ses transformations successives ne représente qu'une seule quantité
    // physique, le compter à chaque étape la doublerait/triplerait artificiellement.
    const enc = i === 0 ? stockGetEnCoursProd(e.codart) : 0;
    dispoSum += cumRatio > 1 ? Math.floor(stk / cumRatio) : stk;
    encSum   += cumRatio > 1 ? Math.floor(enc / cumRatio) : enc;
  });
  return { dispo: dispoSum, enCours: encSum };
}

function renderStockPage() {
  const el = document.getElementById('view-stock');
  if (!el) return;

  const hasStock     = pcData.stock.length > 0;
  const hasCommandes = pcData.commandes.length > 0;
  const hasOF        = pcData.ofEnCours.length > 0;

  function importBadge(label, count, date, type, accept) {
    const ok = count > 0;
    return '<div style="display:flex;align-items:center;gap:8px;padding:9px 14px;background:'+(ok?'#EAF3DE':'var(--bg)')+';border:1px solid '+(ok?'#C0DD97':'var(--border)')+';border-radius:var(--radius);flex:1;min-width:150px">'
      +'<i class="ti ti-'+(ok?'circle-check':'upload')+'" style="color:'+(ok?'#27500A':'var(--text-faint)')+';font-size:16px;flex-shrink:0"></i>'
      +'<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:'+(ok?'#27500A':'var(--text-muted)')+'">'+label+'</div>'
      +'<div style="font-size:10px;color:var(--text-faint)">'+(ok?count+' lignes · '+date:'Non importé')+'</div></div>'
      +'<label style="cursor:pointer;background:var(--accent);color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;white-space:nowrap">'
      +(ok?'↺':'↑')+' Import'
      +'<input type="file" accept=".xlsx,.xls" style="display:none" onchange="pcImport(\''+type+'\',this)"></label></div>';
  }

  // Refs disponibles pour la liste
  const allRefs = stockGetAllRefs();
  const filteredRefs = stockFilter
    ? allRefs.filter(r => r.toLowerCase().includes(stockFilter.toLowerCase()))
    : allRefs;

  // Détail de la référence sélectionnée
  let detailHtml = '';
  if (stockSelectedRef && hasStock) {
    const { dispo, enCours } = stockGetDispoEtEnCours(stockSelectedRef);
    const total    = dispo + enCours;
    const cmds     = stockGetCommandes(resolveToFG(stockSelectedRef));
    const totalCde = cmds.reduce((s,c) => s+c.qteRest, 0);
    const solde    = total - totalCde;
    const soldeBg  = solde >= 0 ? '#EAF3DE' : '#FCEBEB';
    const soldeC   = solde >= 0 ? '#27500A' : '#A32D2D';

    const kpi = (icon, label, val, color, big) =>
      '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;flex:1;min-width:120px">'
      +'<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px"><i class="ti ti-'+icon+'" style="vertical-align:-2px;margin-right:5px"></i>'+label+'</div>'
      +'<div style="font-size:'+(big?'22':'18')+'px;font-weight:700;color:'+(color||'var(--text)')+'">'+Math.round(val).toLocaleString('fr')+'</div>'
      +'</div>';

    // Barre de visualisation
    const barMax = Math.max(total, totalCde, 1);
    const barDispo  = Math.round(dispo / barMax * 100);
    const barEnCours= Math.round(enCours / barMax * 100);
    const barCde    = Math.round(totalCde / barMax * 100);

    detailHtml =
      '<div style="display:flex;flex-direction:column;gap:14px">'

      // En-tête ref
      +'<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      +'<h3 style="font-size:18px;font-weight:700;color:var(--accent);font-family:monospace">'+stockSelectedRef+'</h3>'
      +'<span style="font-size:12px;background:'+soldeBg+';color:'+soldeC+';padding:4px 12px;border-radius:20px;font-weight:600">'
      +(solde>=0?'✓ Servable sans production':'✗ Production nécessaire')+'</span>'
      +'</div>'

      // Arborescence nomenclature
      +(typeof renderNomenclatureTree==='function'?renderNomenclatureTree(stockSelectedRef):'')

      // KPIs
      +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
      +kpi('package','Stock fini (WIP)', dispo, '#185FA5')
      +kpi('tool','En cours prod', enCours, '#D4880A')
      +kpi('stack-2','Total disponible', total, '#27500A')
      +kpi('shopping-cart','Total commandé', totalCde, '#A32D2D')
      +'<div style="background:'+soldeBg+';border:2px solid '+soldeC+';border-radius:var(--radius);padding:14px 16px;flex:1;min-width:120px">'
      +'<div style="font-size:11px;color:'+soldeC+';margin-bottom:6px"><i class="ti ti-scale" style="vertical-align:-2px;margin-right:5px"></i>Solde</div>'
      +'<div style="font-size:22px;font-weight:700;color:'+soldeC+'">'+Math.round(solde).toLocaleString('fr')+'</div>'
      +'</div>'
      +'</div>'

      // Barre visuelle
      +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px">'
      +'<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Visualisation des flux</div>'
      +'<div style="margin-bottom:8px">'
      +'<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Stock disponible</div>'
      +'<div style="height:20px;background:var(--bg);border-radius:10px;overflow:hidden">'
      +'<div style="height:100%;width:'+barDispo+'%;background:#4C8EDA;border-radius:10px;transition:width .4s"></div></div>'
      +'<div style="font-size:10px;color:var(--text-faint);margin-top:2px">'+Math.round(dispo).toLocaleString('fr')+' pièces fini</div></div>'
      +'<div style="margin-bottom:8px">'
      +'<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">En cours de production</div>'
      +'<div style="height:20px;background:var(--bg);border-radius:10px;overflow:hidden">'
      +'<div style="height:100%;width:'+barEnCours+'%;background:#D4880A;border-radius:10px;transition:width .4s"></div></div>'
      +'<div style="font-size:10px;color:var(--text-faint);margin-top:2px">'+Math.round(enCours).toLocaleString('fr')+' pièces en prod</div></div>'
      +'<div>'
      +'<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Commandes à servir</div>'
      +'<div style="height:20px;background:var(--bg);border-radius:10px;overflow:hidden">'
      +'<div style="height:100%;width:'+barCde+'%;background:#A32D2D;border-radius:10px;transition:width .4s"></div></div>'
      +'<div style="font-size:10px;color:var(--text-faint);margin-top:2px">'+Math.round(totalCde).toLocaleString('fr')+' pièces demandées</div></div>'
      +'</div>'

      // Lien vers le détail des commandes (déplacé dans son propre onglet)
      +(cmds.length > 0
        ? '<button class="btn" onclick="setView(\'commandes\')" style="align-self:flex-start">'
          +'<i class="ti ti-shopping-cart"></i> Voir les '+cmds.length+' commande(s) ouverte(s) dans l\'onglet Commandes</button>'
        : '<div style="text-align:center;padding:16px;color:var(--text-faint);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);font-size:12px">'
          +'<i class="ti ti-circle-check" style="vertical-align:-2px;margin-right:5px;color:#27500A"></i>Aucune commande ouverte pour cette référence</div>')

      +'</div>';
  } else if (!stockSelectedRef && hasStock) {
    detailHtml = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-faint);font-size:13px;gap:10px">'
      +'<i class="ti ti-arrow-left" style="font-size:18px"></i>Sélectionnez une référence</div>';
  } else {
    detailHtml = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-faint);font-size:13px;flex-direction:column;gap:8px">'
      +'<i class="ti ti-upload" style="font-size:32px"></i>Importez le stock (PTSTOCKSIMPLE) pour commencer</div>';
  }

  // Lignes liste refs
  const refRows = filteredRefs.map(ref => {
    const dispo   = stockGetDisponible(ref);
    const enCours = stockGetEnCoursProd(ref);
    const cmds    = stockGetCommandes(resolveToFG(ref));
    const totalCde= cmds.reduce((s,c)=>s+c.qteRest,0);
    const solde   = (dispo + enCours) - totalCde;
    const isSel   = ref === stockSelectedRef;
    const soldeC  = solde >= 0 ? '#27500A' : '#A32D2D';
    return '<div onclick="stockSelectRef(\''+ref+'\')" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);background:'+(isSel?'var(--accent-light)':'transparent')+';display:flex;align-items:center;gap:8px;transition:background .1s" onmouseenter="if(\''+ref+'\'!==stockSelectedRef)this.style.background=\'var(--surface2)\'" onmouseleave="if(\''+ref+'\'!==stockSelectedRef)this.style.background=\'transparent\'">'
      +'<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:'+(isSel?'var(--accent)':'var(--text)')+';font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+ref+'</div>'
      +'<div style="font-size:10px;color:var(--text-faint)">'+Math.round(dispo+enCours).toLocaleString('fr')+' dispo · '+cmds.length+' cde</div></div>'
      +'<span style="font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;background:'+(solde>=0?'#EAF3DE':'#FCEBEB')+';color:'+soldeC+';white-space:nowrap">'+Math.round(solde).toLocaleString('fr')+'</span>'
      +'</div>';
  }).join('') || '<div style="padding:20px;text-align:center;color:var(--text-faint);font-size:12px">Aucune référence trouvée</div>';

  el.innerHTML =
    '<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">'

    // En-tête
    +'<div style="padding:16px 20px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
    +'<h2 style="font-size:17px;font-weight:600"><i class="ti ti-package" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Stock & Commandes</h2>'
    +'<button class="btn" onclick="openNomList()" style="margin-left:8px"><i class="ti ti-hierarchy-2"></i> Nomenclatures</button>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +importBadge('Stock (PTSTOCKSIMPLE)', pcData.stock.length, pcData.lastImport.stock||'—', 'stock')
    +importBadge('Commandes', pcData.commandes.length, pcData.lastImport.commandes||'—', 'commandes')
    +importBadge('OF En Cours', pcData.ofEnCours.length, pcData.lastImport.of||'—', 'of')
    +'</div></div>'

    // Corps : liste + détail
    +'<div style="flex:1;overflow:hidden;display:flex;gap:0">'

    // Panneau gauche : liste refs
    +'<div style="width:260px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">'
    +'<div style="padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg)">'
    +'<input id="stock-search-input" placeholder="Filtrer les références…" value="'+stockFilter+'" oninput="debounceStockSearch(this.value)"'
    +' style="width:100%;padding:7px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--surface);color:var(--text);font-size:12px;font-family:var(--font);outline:none">'
    +'<div style="font-size:10px;color:var(--text-faint);margin-top:5px">'+filteredRefs.length+' références'+(!hasStock?' — Importez le stock':'')+'</div>'
    +'</div>'
    +'<div style="flex:1;overflow-y:auto">'+refRows+'</div>'
    +'</div>'

    // Panneau droit : détail + calculateur
    +'<div style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:14px">'

    // Calculateur de commande
    +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px">'
    +'<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">'
    +'<i class="ti ti-calculator" style="vertical-align:-2px;margin-right:6px;color:var(--accent)"></i>Calculateur de commande</div>'
    +'<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">'
    +'<div style="flex:2;min-width:140px;position:relative">'
    +'<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Référence produit</div>'
    +'<input id="sc-ref" placeholder="ex: W40, K09…" value="'+(stockSelectedRef||'')+'" oninput="scRefChanged()" onfocus="scRefChanged()" onblur="setTimeout(scHideSuggestions,150)" autocomplete="off"'
    +' style="width:100%;padding:8px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:13px;font-family:var(--font);outline:none">'
    +'<div id="sc-suggestions" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:20;background:var(--surface);border:1px solid var(--border-med);border-radius:var(--radius);max-height:240px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.15);margin-top:3px"></div>'
    +'</div>'
    +'<div style="flex:1;min-width:100px">'
    +'<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Quantité demandée</div>'
    +'<input id="sc-qty" type="number" min="1" placeholder="ex: 10000" oninput="scCalc()"'
    +' style="width:100%;padding:8px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:13px;font-family:var(--font);outline:none">'
    +'</div>'
    +'<button class="btn btn-primary" onclick="scCalc()" style="padding:8px 16px;white-space:nowrap"><i class="ti ti-search"></i> Vérifier</button>'
    +'</div>'
    +'<div id="sc-result" style="display:none;margin-top:10px"></div>'
    +'</div>'

    // Détail référence
    +detailHtml
    +'</div></div></div>';
}


function stockSelectRef(ref) {
  stockSelectedRef = ref;
  const scRef = document.getElementById('sc-ref');
  if (scRef) scRef.value = ref;
  renderStockPage();
}


function scRefChanged() {
  const inp = document.getElementById('sc-ref');
  const ref = inp?.value?.trim() || '';
  const result = document.getElementById('sc-result');
  if (result) result.style.display = 'none';

  const box = document.getElementById('sc-suggestions');
  if (!box) return;

  if (!ref) { box.style.display = 'none'; return; }

  const upper = ref.toUpperCase();
  const matches = stockGetAllRefs().filter(c => c.toUpperCase().includes(upper)).slice(0, 8);

  if (!matches.length) { box.style.display = 'none'; return; }

  box.innerHTML = matches.map(c => {
    const row = pcData.stock.find(r => String(r.CODART||'').trim() === c);
    const libelle = row ? String(row.LIBART||'').trim() : '';
    return '<div onmousedown="scPickSuggestion(\''+c.replace(/'/g,"\\'")+'\')" '
      + 'style="padding:7px 10px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border)" '
      + 'onmouseenter="this.style.background=\'var(--accent-light)\'" onmouseleave="this.style.background=\'\'">'
      + '<div style="font-weight:600;font-family:monospace;color:var(--text)">'+c+'</div>'
      + (libelle ? '<div style="font-size:10px;color:var(--text-faint)">'+libelle+'</div>' : '')
      + '</div>';
  }).join('');
  box.style.display = 'block';
}

// Choix explicite d'une suggestion dans le dropdown (clic) : on utilise onmousedown
// côté HTML plutôt qu'onclick pour que ça se déclenche AVANT le blur du champ texte
// (qui masquerait sinon le dropdown avant que le clic ne soit pris en compte).
function scPickSuggestion(ref) {
  scHideSuggestions();
  stockSelectRef(ref); // met à jour stockSelectedRef, remplit le champ et recharge le panneau détail
  const qty = document.getElementById('sc-qty');
  if (qty && qty.value) scCalc(); // relance le calcul si une quantité était déjà saisie
}

function scHideSuggestions() {
  const box = document.getElementById('sc-suggestions');
  if (box) box.style.display = 'none';
}


function scCalc() {
  const ref = document.getElementById('sc-ref')?.value?.trim();
  const qty = parseInt(document.getElementById('sc-qty')?.value) || 0;
  const result = document.getElementById('sc-result');
  if (!result) return;
  if (!ref || !qty) { result.style.display='none'; return; }

  const { dispo, enCours } = stockGetDispoEtEnCours(ref);
  const total    = dispo + enCours;
  const cmds     = stockGetCommandes(resolveToFG(ref));
  const totalCde = cmds.reduce((s,c)=>s+c.qteRest, 0);
  const solde    = total - totalCde;
  const peutServir = solde >= qty;
  const manque   = qty - solde;

  const bg  = peutServir ? '#EAF3DE' : '#FCEBEB';
  const col = peutServir ? '#27500A' : '#A32D2D';
  const icn = peutServir ? 'circle-check' : 'circle-x';

  result.style.display = 'block';
  result.innerHTML =
    '<div style="background:'+bg+';border:1px solid '+(peutServir?'#C0DD97':'#F5BDBD')+';border-radius:var(--radius);padding:14px 16px">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
    +'<i class="ti ti-'+icn+'" style="font-size:22px;color:'+col+'"></i>'
    +'<span style="font-size:14px;font-weight:700;color:'+col+'">'
    +(peutServir
      ? '✓ Commande servable sans relancer la production'
      : '✗ Production nécessaire — manque '+Math.abs(manque).toLocaleString('fr')+' pièces')
    +'</span></div>'
    +'<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:12px">'
    +'<span style="color:var(--text-muted)">Stock fini : <strong style="color:var(--text)">'+Math.round(dispo).toLocaleString('fr')+'</strong></span>'
    +'<span style="color:var(--text-muted)">En production : <strong style="color:var(--text)">'+Math.round(enCours).toLocaleString('fr')+'</strong></span>'
    +'<span style="color:var(--text-muted)">Cdes en cours : <strong style="color:#A32D2D">'+Math.round(totalCde).toLocaleString('fr')+'</strong></span>'
    +'<span style="color:var(--text-muted)">Solde net : <strong style="color:'+col+'">'+Math.round(solde).toLocaleString('fr')+'</strong></span>'
    +'<span style="color:var(--text-muted)">Demandé : <strong style="color:var(--text)">'+qty.toLocaleString('fr')+'</strong></span>'
    +'</div>'
    +(peutServir ? '' :
      '<div style="margin-top:8px;padding:8px 12px;background:rgba(163,45,45,.08);border-radius:6px;font-size:12px;color:#A32D2D">'
      +'<i class="ti ti-alert-triangle" style="vertical-align:-2px;margin-right:6px"></i>'
      +'Il manque <strong>'+Math.abs(manque).toLocaleString('fr')+' pièces</strong> pour servir cette commande. '
      +'Un OF de production est nécessaire.</div>')
    +'</div>';
}
