// ═══════════════════════════════════════════════════════════
// besoins.js — Onglet Besoins en tenons (ruptures à venir)
// Dépend de : pcData, nomenclatures, PDP_CORRESPONDANCES,
//             pdpGetActiveCorrespondances, pdpFindNomenclature, pdpGetTotalFGForRef,
//             pdpGetStockForWip, pdpGetEnCoursForWip (définis dans pdp.js / index.html),
//             consoGetCouvertureMois, consoCouvertureStyle, consoFmtMois (conso.js),
//             pdpResolveFG, pdpToISODate, pdpFmtDate, pdpCalcRupture, pdpGetOFsForRef
// ═══════════════════════════════════════════════════════════

function renderBesoinsPage() {
  const el = document.getElementById('view-besoins');
  if (!el) return;

  const corrs = (typeof pdpGetActiveCorrespondances === 'function')
    ? pdpGetActiveCorrespondances()
    : (typeof PDP_CORRESPONDANCES !== 'undefined' ? PDP_CORRESPONDANCES : []);

  if (!corrs.length) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--text-faint)">'
      + '<i class="ti ti-alert-triangle" style="font-size:40px;display:block;margin-bottom:12px"></i>'
      + 'Importez les correspondances depuis l\'onglet PDP pour afficher les besoins.</div>';
    return;
  }

  // Dédup par ligne de commande (NUM_COM+LIGNE_COM) — même correctif que dans
  // cdeGetAllOpenLines/cdeGetForRef (commandes.js) et pdpShowDetail/pdpCalcRupture
  // (pdp.js) : une ligne de commande livrée en plusieurs bons de livraison
  // partiels apparaît plusieurs fois dans l'export ERP avec les mêmes
  // QTE_CDE/QTE_LIVREE (des totaux de LIGNE, pas des quantités par BL). Calculé
  // une seule fois ici et réutilisé pour toutes les références de la page.
  const seenLignesBesoins = new Set();
  const dedupedCommandesBesoins = (typeof pcData !== 'undefined' ? (pcData.commandes||[]) : []).filter(c => {
    const key = String(c.NUM_COM||'') + '|' + String(c.LIGNE_COM||'');
    if (seenLignesBesoins.has(key)) return false;
    seenLignesBesoins.add(key);
    return true;
  });

  // ── Pour chaque référence, calculer stock FG total + commandes + rupture
  const items = [];

  corrs.forEach(r => {
    if (typeof pdpDeletedRefs !== 'undefined' && pdpDeletedRefs.includes(r.code_client)) return;

    // Trouver la nomenclature de cette référence — via pdpFindNomenclature (pdp.js),
    // qui matche en PRIORITÉ sur le FG (code_client, unique) plutôt que sur le
    // codart_wip (souvent partagé entre un standard et sa variante, ex K09/K09 L27).
    // Ne pas réimplémenter cette recherche ici : voir la correction faite dans pdp.js.
    const nom = (typeof pdpFindNomenclature === 'function')
      ? pdpFindNomenclature(r.codart_wip, r.code_client)
      : ((typeof findNomenclatureByCodart === 'function')
          ? findNomenclatureByCodart(r.codart_wip)
          : null);

    // Calcul du stock total en FG équivalent (tous niveaux) — DÉLÉGUÉ à
    // pdpGetTotalFGForRef (pdp.js), qui utilise pdpGetStockForWip/pdpGetEnCoursForWip
    // (index.html, filtre d'emplacement correct par liste noire) et gère déjà
    // correctement le cas d'une chaîne multi-niveaux avec ratios vides (1:1),
    // sans ignorer le stock amont (tenons, blisters vrac). Ne pas recalculer ce
    // total séparément ici : ça a déjà causé une divergence (stock affiché à 0
    // alors que la tuile PDP montrait le bon total pour la même référence).
    const totalFG = (typeof pdpGetTotalFGForRef === 'function')
      ? pdpGetTotalFGForRef(r.codart_wip, r.code_client)
      : 0;

    // Commandes ouvertes (sur le code FG final) — à partir des lignes déjà
    // dédupliquées plus haut (dedupedCommandesBesoins).
    const fgCode = r.code_client;
    const cmds = dedupedCommandesBesoins
      .filter(c => String(c.REF_RTD || '').trim() === fgCode && String(c.COMMANDE_S||'').trim() !== 'O')
      .map(c => ({
        numCmd: String(c.NUM_COM || ''),
        qteRest: (Number(c.QTE_CDE) || 0) - (Number(c.QTE_LIVREE) || 0),
        datDel: (typeof pdpToISODate === 'function') ? pdpToISODate(c.DATDEL) : null,
      }))
      .filter(c => c.qteRest > 0)
      .sort((a, b) => (a.datDel || '9999').localeCompare(b.datDel || '9999'));

    const totalCde = cmds.reduce((s, c) => s + c.qteRest, 0);
    const solde = totalFG - totalCde;

    // Calcul rupture FIFO
    const rupture = (typeof pdpCalcRupture === 'function')
      ? pdpCalcRupture(fgCode, totalFG)
      : null;

    // N'inclure que les références avec une date de rupture connue
    if (!rupture) return;

    // Nom court de la référence
    const displayName = (typeof pdpCustomNames !== 'undefined' && pdpCustomNames[r.code_client])
      ? pdpCustomNames[r.code_client]
      : ((typeof pdpAutoShortName === 'function') ? pdpAutoShortName(r) : r.libelle_fg);

    // Niveau WIP brut (premier niveau = tenon)
    const wipBrut = nom ? nom.etapes[0] : { codart: r.codart_wip, label: r.codart_wip };
    // pdpGetStockForWip (index.html) applique le bon filtre d'emplacement (liste noire
    // des zones non-conforme/quarantaine/rebut) — stockGetDisponible (stock.js) utilise
    // encore l'ancienne liste blanche à 2 emplacements, incomplète pour la plupart des
    // références. Ne pas revenir à stockGetDisponible ici.
    const stkWip = (typeof pdpGetStockForWip === 'function') ? pdpGetStockForWip(wipBrut.codart) : 0;
    const encWip = (typeof pdpGetEnCoursForWip === 'function') ? pdpGetEnCoursForWip(wipBrut.codart) : 0;

    // OFs en cours sur ce WIP
    // OFs en cours du Kanban liés à ce WIP — tenons ET Forets (foretsGetOFsForRef,
    // voir forets.js ; demandé par Stéphane, 18/08/2026, pour que les OF Forets en
    // cours apparaissent aussi ici, pas seulement dans le calcul de stock).
    const ofsLies = ((typeof ofs !== 'undefined')
      ? ofs.filter(o => {
          if (typeof pdpGetOFsForRef === 'function') {
            return pdpGetOFsForRef(wipBrut.codart, displayName).some(ox => ox.id === o.id);
          }
          return false;
        })
      : []
    ).concat(typeof foretsGetOFsForRef === 'function' ? foretsGetOFsForRef(wipBrut.codart) : []);
    const qtyEnProd = ofsLies.reduce((s, o) => s + (o.qty || 0), 0);

    items.push({
      r, nom, displayName, wipBrut,
      totalFG, totalCde, solde,
      stkWip, encWip, qtyEnProd, ofsLies,
      rupture, cmds,
      // Prochaine date de livraison
      nextDel: cmds.length ? cmds[0].datDel : null,
    });
  });

  // Trier par date de rupture croissante
  items.sort((a, b) => (a.rupture.date || '9999').localeCompare(b.rupture.date || '9999'));

  if (!items.length) {
    el.innerHTML = '<div style="flex:1;overflow-y:auto;padding:20px 24px">'
      + '<div style="text-align:center;padding:60px;color:var(--text-faint)">'
      + '<i class="ti ti-circle-check" style="font-size:48px;display:block;margin-bottom:16px;color:#1D9E75"></i>'
      + '<div style="font-size:16px;font-weight:600;color:#1D9E75;margin-bottom:8px">Aucune rupture en vue</div>'
      + '<div style="font-size:13px">Toutes les références ont un stock suffisant pour couvrir leurs commandes ouvertes.</div>'
      + '</div></div>';
    return;
  }

  window._besItems = items;
  besoinsRenderUI();
}

// ─── Interface « radar + cartes » ───────────────────────────────────────────
let besFilter = 'all', besQuery = '', besMode = 'month';
const besCollapsed = {};
function besoinsSet(k, v) {
  if (k === 'f') besFilter = v; else if (k === 'q') besQuery = v; else if (k === 'm') besMode = v;
  if (k === 'q') besoinsRenderBody(); else besoinsRenderUI();
}
function besDays(iso) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return iso ? Math.round((new Date(iso + 'T12:00:00') - t) / 86400000) : 9999;
}
function besLevel(iso) { const j = besDays(iso); return j <= 14 ? 'crit' : j <= 45 ? 'warn' : 'calm'; }
const BES_LVL = {
  crit: { lab: 'Critique', col: '#D9453A', bg: '#FDE6E4', tx: '#B02A22' },
  warn: { lab: 'Urgent', col: '#E19A1A', bg: '#FFF0D3', tx: '#8A5200' },
  calm: { lab: 'À surveiller', col: '#1D9E75', bg: '#E4F4EA', tx: '#17653A' },
};
function besFmtJ(iso) {
  const j = besDays(iso);
  return j < 0 ? 'dépassée depuis ' + (-j) + ' j' : j === 0 ? 'aujourd\'hui' : j === 1 ? 'demain' : 'dans ' + j + ' j';
}

function besoinsRenderUI() {
  const el = document.getElementById('view-besoins');
  if (!el) return;
  const items = window._besItems || [];
  const hero = (el.firstElementChild && el.firstElementChild.classList.contains('dz-hero')) ? el.firstElementChild.outerHTML : '';
  const n = l => items.filter(i => besLevel(i.rupture.date) === l).length;
  const chip = (k, lab, cnt, cls) => `<button class="bes-chip ${cls || ''} ${besFilter === k ? 'on' : ''}" onclick="besoinsSet('f','${k}')">${lab}<b>${cnt}</b></button>`;
  el.innerHTML = hero + `
    <div class="bes-bar">
      <div class="bes-chips">
        ${chip('all', 'Toutes', items.length)}
        ${chip('crit', 'Critiques · moins de 2 sem.', n('crit'), 'crit')}
        ${chip('warn', 'Urgentes · 2 à 6 sem.', n('warn'), 'warn')}
        ${chip('calm', 'À surveiller', n('calm'), 'calm')}
      </div>
      <div class="bes-tools">
        <label class="bes-search"><i class="ti ti-search"></i><input type="search" placeholder="Filtrer par référence ou nom…" value="${String(besQuery).replace(/"/g, '&quot;')}" oninput="besoinsSet('q',this.value)"></label>
        <div class="bes-seg">${[['month', 'Par mois'], ['client', 'Par client'], ['cards', 'Cartes'], ['table', 'Tableau']].map(m => `<button class="${besMode === m[0] ? 'on' : ''}" onclick="besoinsSet('m','${m[0]}')">${m[1]}</button>`).join('')}</div>
        <button class="bes-export" onclick="besoinsExport()" title="Télécharger la liste affichée (ouvre dans Excel)"><i class="ti ti-download"></i>Exporter</button>
      </div>
    </div>
    <div id="bes-body"></div>`;
  besoinsRenderBody();
}

function besRadarHtml(list) {
  const SPAN = 84, X0 = 36, SC = 62, FW = 1250;           // X0 : position d'« aujourd'hui » (en %), SC : largeur de l'échelle future
  const maxDef = Math.max(1, ...list.map(i => i.rupture.manque));
  const pts = list.map(it => {
    const j = besDays(it.rupture.date);
    const x = j <= 0 ? X0 - 2 - Math.min(1, Math.abs(j) / 120) * (X0 - 5) : X0 + Math.min(1, j / SPAN) * SC;   // plus c'est ancien, plus c'est à gauche
    const d = 16 + 24 * Math.sqrt(it.rupture.manque / maxDef);
    return { it, x, d, px: x / 100 * FW };
  }).sort((p, q) => p.x - q.x);
  const LANES = 5, last = Array.from({ length: LANES }, () => ({ px: -1e9, d: 0 }));
  const dots = pts.map((p, k) => {
    let lane = -1, best = 0, bestGap = -1e9;
    for (let l = 0; l < LANES; l++) {
      const gap = p.px - last[l].px - (p.d + last[l].d) / 2;
      if (gap > bestGap) { bestGap = gap; best = l; }
      if (gap >= 6) { lane = l; break; }
    }
    if (lane < 0) lane = best;
    const labelOk = bestGap >= 46 || lane === best && bestGap >= 46;
    last[lane] = { px: p.px, d: p.d };
    const lvl = BES_LVL[besLevel(p.it.rupture.date)];
    return `<button class="bes-dot" style="left:${p.x.toFixed(2)}%;top:${(lane * 17 + 3).toFixed(0)}%;width:${p.d.toFixed(0)}px;height:${p.d.toFixed(0)}px;--c:${lvl.col};animation-delay:${Math.min(k, 36) * 22}ms"
      title="${p.it.displayName} — manque ${p.it.rupture.manque.toLocaleString('fr')} pièces, rupture ${besFmtJ(p.it.rupture.date)}"
      onclick="pdpShowDetail('${p.it.r.code_client}')">${bestGap >= 40 ? `<span>${p.it.displayName}</span>` : ''}</button>`;
  }).join('');
  const tick = (pct, lab) => `<div class="bes-tick" style="left:${pct}%"><i></i><span>${lab}</span></div>`;
  const dz = d => (d / SPAN * SC).toFixed(1);
  return `<div class="bes-radar">
    <div class="bes-radar-head"><h3>Le radar des ruptures</h3><p>Chaque bulle est une référence : plus elle est grosse, plus il manque de pièces. À gauche d'« aujourd'hui », les ruptures déjà dépassées (les plus anciennes tout à gauche). Cliquez une bulle pour ouvrir sa tuile.</p></div>
    <div class="bes-field">
      <div class="bes-zone past" style="width:${X0 - 1}%"><span>Déjà dépassé</span></div>
      <div class="bes-zone crit" style="left:${X0}%;width:${dz(14)}%"></div>
      <div class="bes-zone warn" style="left:${(X0 + 14 / SPAN * SC).toFixed(1)}%;width:${dz(31)}%"></div>
      ${tick(X0, 'Aujourd\'hui')}${tick(X0 + 14 / SPAN * SC, '2 sem.')}${tick(X0 + 45 / SPAN * SC, '6 sem.')}${tick(X0 + SC, '12 sem.')}
      ${dots}
    </div></div>`;
}

function besCardHtml(it, idx) {
  const lvl = BES_LVL[besLevel(it.rupture.date)];
  const cde = Math.max(1, it.totalCde), manque = it.rupture.manque;
  const enProd = Math.min(it.qtyEnProd || 0, manque), reste = Math.max(0, manque - enProd);
  const stock = Math.max(0, cde - manque);
  const pc = v => (v / cde * 100).toFixed(1);
  const ofs = it.ofsLies.length ? it.ofsLies.slice(0, 3).map(o => `<span class="bes-pill of">${String(o.id).replace(/^OF-|^OFR-/, '')} · ${Math.round(o.qty / 1000)}k</span>`).join('') + (it.ofsLies.length > 3 ? `<em>+${it.ofsLies.length - 3}</em>` : '') : '<span class="bes-none">Aucun OF en cours</span>';
  const cmds = it.cmds.slice(0, 3).map(c => `<span class="bes-pill cmd">${c.numCmd}</span>`).join('') + (it.cmds.length > 3 ? `<em>+${it.cmds.length - 3}</em>` : '');
  let couv = '';
  if (typeof consoGetCouvertureMois === 'function') {
    const mois = consoGetCouvertureMois(it.r.code_client, it.totalFG);
    const cs = (typeof consoCouvertureStyle === 'function') ? consoCouvertureStyle(mois) : null;
    if (cs && typeof consoFmtMois === 'function') couv = `<span class="bes-pill" style="background:${cs.bg};color:${cs.text}" title="Stock actuel exprimé en mois de ventes">${consoFmtMois(mois)} de stock</span>`;
  }
  return `<article class="bes-card ${besLevel(it.rupture.date)}" style="animation-delay:${Math.min(idx, 14) * 45}ms" onclick="pdpShowDetail('${it.r.code_client}')">
    <header>
      <div class="bes-title"><h4>${it.displayName}</h4><small>${it.r.code_client} · ${it.r.libelle_fg || ''}</small></div>
      <div class="bes-when" style="background:${lvl.bg};color:${lvl.tx}"><b>${(typeof pdpFmtDate === 'function') ? pdpFmtDate(it.rupture.date) : it.rupture.date}</b><span>${besFmtJ(it.rupture.date)}</span></div>
    </header>
    <div class="bes-def"><b>−${manque.toLocaleString('fr')}</b><span>pièces manquantes sur ${it.totalCde.toLocaleString('fr')} commandées</span></div>
    <div class="bes-stack" title="Stock ${stock.toLocaleString('fr')} · en production ${enProd.toLocaleString('fr')} · reste à lancer ${reste.toLocaleString('fr')}">
      <i class="s" style="width:${pc(stock)}%"></i><i class="p" style="width:${pc(enProd)}%"></i><i class="r" style="width:${pc(reste)}%"></i></div>
    <div class="bes-legend"><span><s class="s"></s>Stock <b>${stock.toLocaleString('fr')}</b></span><span><s class="p"></s>En production <b>${enProd.toLocaleString('fr')}</b></span><span><s class="r"></s>Reste à lancer <b>${reste.toLocaleString('fr')}</b></span></div>
    <footer>
      <div class="bes-row"><span class="bes-k">Tenon brut</span><span class="bes-v">${it.wipBrut.label || it.wipBrut.codart}<small>stock ${Math.round(it.stkWip || 0).toLocaleString('fr')} · en cours ${Math.round(it.encWip || 0).toLocaleString('fr')}</small></span></div>
      <div class="bes-row"><span class="bes-k">OF</span><span class="bes-v">${ofs}</span></div>
      <div class="bes-row"><span class="bes-k">Commandes</span><span class="bes-v">${cmds || '<span class="bes-none">—</span>'}${couv}</span></div>
    </footer>
  </article>`;
}

function besFiltered() {
  const q = String(besQuery || '').trim().toLowerCase();
  let list = (window._besItems || []).filter(i => besFilter === 'all' || besLevel(i.rupture.date) === besFilter);
  if (q) list = list.filter(i => (i.displayName + ' ' + i.r.code_client + ' ' + (i.r.libelle_fg || '')).toLowerCase().includes(q));
  return list;
}
function besSplit(it) {
  const manque = it.rupture.manque, cde = Math.max(1, it.totalCde);
  const enProd = Math.min(it.qtyEnProd || 0, manque);
  return { manque, cde, enProd, reste: Math.max(0, manque - enProd), stock: Math.max(0, cde - manque) };
}

// Les 3 actions à mener d'abord : plus gros manque NON couvert par un OF en cours, parmi les urgences.
function besPriorityHtml(list) {
  const cand = list.map(it => ({ it, sp: besSplit(it) })).filter(x => x.sp.reste > 0)
    .sort((a, b) => (besLevel(a.it.rupture.date) === 'crit' ? 0 : 1) - (besLevel(b.it.rupture.date) === 'crit' ? 0 : 1) || b.sp.reste - a.sp.reste).slice(0, 3);
  if (!cand.length) return '<div class="bes-prio ok"><i class="ti ti-circle-check"></i><div><b>Rien à lancer en urgence</b><span>Tous les manques sont déjà couverts par des OF en cours.</span></div></div>';
  return '<div class="bes-prio-wrap"><div class="bes-prio-title">À lancer en priorité<small>les plus gros manques que ne couvre aucun OF en cours</small></div><div class="bes-prio-grid">'
    + cand.map((x, i) => `<button class="bes-prio" style="animation-delay:${i * 90}ms" onclick="pdpShowDetail('${x.it.r.code_client}')">
        <span class="n">${i + 1}</span><div><b>${x.it.displayName}</b><span>lancer ${x.sp.reste.toLocaleString('fr')} pièces</span></div>
        <em>${besFmtJ(x.it.rupture.date)}</em></button>`).join('') + '</div></div>';
}

// Ligne compacte (vue « Par mois » / « Par client »)
function besRowHtml(it, idx) {
  const lvl = BES_LVL[besLevel(it.rupture.date)], sp = besSplit(it), pc = v => (v / sp.cde * 100).toFixed(1);
  const ofs = it.ofsLies.length ? it.ofsLies.slice(0, 2).map(o => `<span class="bes-pill of">${String(o.id).replace(/^OF-|^OFR-/, '')} · ${Math.round(o.qty / 1000)}k</span>`).join('') + (it.ofsLies.length > 2 ? `<em>+${it.ofsLies.length - 2}</em>` : '') : '';
  const cmds = it.cmds.slice(0, 2).map(c => `<span class="bes-pill cmd">${c.numCmd}</span>`).join('') + (it.cmds.length > 2 ? `<em>+${it.cmds.length - 2}</em>` : '');
  const etat = sp.reste === 0 ? '<span class="bes-tag ok">Couvert par OF</span>' : sp.enProd > 0 ? '<span class="bes-tag part">Couvert en partie</span>' : '<span class="bes-tag none">Aucun OF</span>';
  return `<div class="bes-line ${besLevel(it.rupture.date)}" style="animation-delay:${Math.min(idx, 12) * 30}ms" onclick="pdpShowDetail('${it.r.code_client}')">
    <div class="bl-name"><b>${it.displayName}</b><small>${it.r.code_client}${it.r.client ? ' · ' + it.r.client : ''}</small></div>
    <div class="bl-def"><b>−${sp.manque.toLocaleString('fr')}</b><small>sur ${it.totalCde.toLocaleString('fr')}</small></div>
    <div class="bl-bar" title="Stock ${sp.stock.toLocaleString('fr')} · en production ${sp.enProd.toLocaleString('fr')} · reste à lancer ${sp.reste.toLocaleString('fr')}">
      <div class="bes-stack"><i class="s" style="width:${pc(sp.stock)}%"></i><i class="p" style="width:${pc(sp.enProd)}%"></i><i class="r" style="width:${pc(sp.reste)}%"></i></div>
      <small>${etat}${sp.reste ? ' · reste à lancer <b>' + sp.reste.toLocaleString('fr') + '</b>' : ''}</small></div>
    <div class="bl-when" style="background:${lvl.bg};color:${lvl.tx}"><b>${(typeof pdpFmtDate === 'function') ? pdpFmtDate(it.rupture.date) : it.rupture.date}</b><span>${besFmtJ(it.rupture.date)}</span></div>
    <div class="bl-pills">${ofs || '<span class="bes-none">pas d\'OF</span>'}<span class="bl-sep"></span>${cmds}</div>
  </div>`;
}

function besSectionsHtml(list, mode) {
  const groups = new Map();
  list.forEach(it => {
    let key, label, sub;
    if (mode === 'client') { key = it.r.client || 'Sans client'; label = key; sub = ''; }
    else { key = (it.rupture.date || '9999').slice(0, 7); }
    if (!groups.has(key)) groups.set(key, { key, label, sub, items: [] });
    groups.get(key).items.push(it);
  });
  let arr = [...groups.values()];
  const t0 = new Date(); t0.setHours(0, 0, 0, 0); const curKey = t0.getFullYear() + '-' + String(t0.getMonth() + 1).padStart(2, '0');
  if (mode === 'month') {
    arr.sort((a, b) => a.key.localeCompare(b.key));
    arr.forEach(g => {
      const d = new Date(g.key + '-01T12:00:00');
      g.label = d.toLocaleDateString('fr', { month: 'long', year: 'numeric' });
      g.sub = g.key < curKey ? 'dépassé' : g.key === curKey ? 'ce mois-ci' : 'à venir';
      g.tone = g.key < curKey ? 'crit' : g.key === curKey ? 'warn' : 'calm';
    });
  } else {
    arr.sort((a, b) => b.items.reduce((s, i) => s + i.rupture.manque, 0) - a.items.reduce((s, i) => s + i.rupture.manque, 0));
    arr.forEach(g => { g.tone = g.items.some(i => besLevel(i.rupture.date) === 'crit') ? 'crit' : g.items.some(i => besLevel(i.rupture.date) === 'warn') ? 'warn' : 'calm'; });
  }
  return arr.map((g, gi) => {
    g.items.sort((a, b) => (a.rupture.date || '').localeCompare(b.rupture.date || '') || b.rupture.manque - a.rupture.manque);
    const sp = g.items.map(besSplit), T = x => sp.reduce((s, v) => s + v[x], 0);
    const manque = T('manque'), reste = T('reste'), enProd = T('enProd'), cde = Math.max(1, T('cde'));
    const ck = mode + ':' + g.key, closed = besCollapsed[ck] ? 'closed' : '';
    return `<section class="bes-sec ${g.tone} ${closed}" id="bs-${gi}" style="animation-delay:${Math.min(gi, 8) * 70}ms">
      <header onclick="besToggle('${ck.replace(/'/g, '')}','bs-${gi}')">
        <div class="bs-title"><i class="ti ti-chevron-down"></i><h3>${g.label}</h3>${g.sub ? `<span class="bs-tag ${g.tone}">${g.sub}</span>` : ''}</div>
        <div class="bs-stats">
          <div><b>${g.items.length}</b><span>référence${g.items.length > 1 ? 's' : ''}</span></div>
          <div><b class="neg">−${manque.toLocaleString('fr')}</b><span>pièces manquantes</span></div>
          <div><b>${enProd.toLocaleString('fr')}</b><span>déjà en production</span></div>
          <div><b class="${reste ? 'neg' : 'okc'}">${reste.toLocaleString('fr')}</b><span>reste à lancer</span></div>
        </div>
        <div class="bs-share" title="Part de ce groupe dans le manque total"><i style="width:${Math.min(100, manque / Math.max(1, list.reduce((s, i) => s + i.rupture.manque, 0)) * 100).toFixed(1)}%"></i></div>
      </header>
      <div class="bes-lines">${g.items.map(besRowHtml).join('')}</div>
    </section>`;
  }).join('');
}

function besToggle(key, id) {
  besCollapsed[key] = !besCollapsed[key];
  const el = document.getElementById(id); if (el) el.classList.toggle('closed', !!besCollapsed[key]);
}

function besoinsExport() {
  const rows = besFiltered().map(it => { const sp = besSplit(it); return [it.r.code_client, it.displayName, it.r.libelle_fg || '', it.r.client || '', it.rupture.date, sp.manque, it.totalCde, it.totalFG, sp.enProd, sp.reste, (it.cmds || []).map(c => c.numCmd).join(' ')]; });
  const head = ['Référence', 'Nom', 'Libellé', 'Client', 'Date de rupture', 'Manque', 'Commandé', 'Stock FG', 'En production', 'Reste à lancer', 'N° commandes'];
  const csv = '﻿' + [head, ...rows].map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'besoins_' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click(); a.remove();
}

function besoinsRenderBody() {
  const host = document.getElementById('bes-body');
  if (!host) return;
  const list = besFiltered();
  if (!list.length) { host.innerHTML = '<div class="bes-empty"><i class="ti ti-circle-check"></i><h3>Rien à afficher avec ce filtre</h3><p>Changez le niveau d\'urgence ou effacez la recherche.</p></div>'; return; }
  if (besMode === 'table') { host.innerHTML = '<div class="bes-tablewrap">' + besoinsTableHtml(list) + '</div>'; return; }
  if (besMode === 'cards') { host.innerHTML = besRadarHtml(list) + '<div class="bes-grid">' + list.map(besCardHtml).join('') + '</div>'; return; }
  host.innerHTML = besPriorityHtml(list) + besSectionsHtml(list, besMode);
}

// Ancienne vue tableau, conservée telle quelle (bouton « Tableau »).
function besoinsTableHtml(items) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const urgenceColor = (dateIso) => {
    if (!dateIso) return { bg: '#FEF5E7', text: '#633806', dot: '#D4880A' };
    const j = Math.round((new Date(dateIso) - today) / 86400000);
    if (j <= 14)  return { bg: '#FCEBEB', text: '#A32D2D', dot: '#A32D2D' };
    if (j <= 45)  return { bg: '#FEF5E7', text: '#633806', dot: '#D4880A' };
    return { bg: '#EAF3DE', text: '#27500A', dot: '#1D9E75' };
  };
  const fmtJ = (dateIso) => {
    if (!dateIso) return '—';
    const j = Math.round((new Date(dateIso) - today) / 86400000);
    if (j <= 0) return 'Déjà dépassé';
    if (j === 1) return 'Demain';
    return `dans ${j}j`;
  };
  let html = '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'
    + '<table class="cat-table" style="width:100%">'
    + '<thead><tr>'
    + '<th style="width:120px">Référence</th>'
    + '<th>Libellé</th>'
    + '<th>WIP (tenon brut)</th>'
    + '<th style="text-align:right">Stock FG</th>'
    + '<th style="text-align:right">Commandé</th>'
    + '<th>N° Cde</th>'
    + '<th style="text-align:right">Déficit</th>'
    + '<th style="text-align:right">Couverture</th>'
    + '<th style="text-align:center">Date rupture</th>'
    + '<th style="text-align:center">Délai</th>'
    + '<th>En production</th>'
    + '</tr></thead><tbody>';

  items.forEach(item => {
    const urg = urgenceColor(item.rupture.date);
    const deficit = item.rupture.manque;
    const ofsStr = item.ofsLies.length
      ? item.ofsLies.slice(0, 2).map(o => `<span style="font-size:10px;font-weight:600;padding:1px 6px;border-radius:20px;background:#FFF4E6;color:#92400E">${o.id.replace('OF-', '')}·${Math.round(o.qty / 1000)}k</span>`).join(' ')
        + (item.ofsLies.length > 2 ? `<span style="font-size:10px;color:var(--text-faint)"> +${item.ofsLies.length - 2}</span>` : '')
      : '<span style="font-size:11px;color:var(--text-faint)">—</span>';
    // N° de commande(s) à l'origine du besoin — même style que les badges OF, pour
    // pouvoir retrouver directement quelle(s) commande(s) génèrent cette rupture.
    const cmdsStr = item.cmds.length
      ? item.cmds.slice(0, 2).map(c => `<span style="font-size:10px;font-weight:600;padding:1px 6px;border-radius:20px;background:#FAEEDA;color:#633806">${c.numCmd}</span>`).join(' ')
        + (item.cmds.length > 2 ? `<span style="font-size:10px;color:var(--text-faint)"> +${item.cmds.length - 2}</span>` : '')
      : '<span style="font-size:11px;color:var(--text-faint)">—</span>';

    html += `<tr style="cursor:pointer" onclick="pdpShowDetail('${item.r.code_client}')"
      onmouseenter="this.style.background='var(--accent-light)'" onmouseleave="this.style.background=''">
      <td><span style="font-size:11px;font-weight:700;color:var(--accent)">${item.r.code_client}</span></td>
      <td>
        <div style="font-size:13px;font-weight:600">${item.displayName}</div>
        <div style="font-size:10px;color:var(--text-faint)">${item.r.libelle_fg}</div>
      </td>
      <td>
        <div style="font-size:11px;font-weight:500">${item.wipBrut.label || item.wipBrut.codart}</div>
        <div style="font-size:10px;color:var(--text-faint);font-family:monospace">${item.wipBrut.codart}</div>
      </td>
      <td style="text-align:right;font-size:13px;font-weight:600">${item.totalFG.toLocaleString('fr')}</td>
      <td style="text-align:right;font-size:13px;font-weight:600;color:#A32D2D">${item.totalCde.toLocaleString('fr')}</td>
      <td>${cmdsStr}</td>
      <td style="text-align:right">
        <span style="font-size:12px;font-weight:700;padding:3px 8px;border-radius:20px;background:${urg.bg};color:${urg.text}">
          −${deficit.toLocaleString('fr')}
        </span>
      </td>
      <td style="text-align:right">
        ${(() => {
          if (typeof consoGetCouvertureMois !== 'function') return '<span style="font-size:11px;color:var(--text-faint)">—</span>';
          const mois = consoGetCouvertureMois(item.r.code_client, item.totalFG);
          const cs = (typeof consoCouvertureStyle === 'function') ? consoCouvertureStyle(mois) : {bg:'var(--bg)',text:'var(--text-faint)'};
          const label = (typeof consoFmtMois === 'function') ? consoFmtMois(mois) : '—';
          return `<span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:${cs.bg};color:${cs.text}">${label}</span>`;
        })()}
      </td>
      <td style="text-align:center">
        <span style="font-size:12px;font-weight:700;color:${urg.text}">${(typeof pdpFmtDate === 'function') ? pdpFmtDate(item.rupture.date) : item.rupture.date}</span>
      </td>
      <td style="text-align:center">
        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:${urg.bg};color:${urg.text}">${fmtJ(item.rupture.date)}</span>
      </td>
      <td>${ofsStr}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  return html;
}
