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
    const ofsLies = (typeof ofs !== 'undefined')
      ? ofs.filter(o => {
          if (typeof pdpGetOFsForRef === 'function') {
            return pdpGetOFsForRef(wipBrut.codart, displayName).some(ox => ox.id === o.id);
          }
          return false;
        })
      : [];
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

  // ── Rendu ────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const urgenceColor = (dateIso) => {
    if (!dateIso) return { bg: '#FEF5E7', text: '#633806', dot: '#D4880A' };
    const j = Math.round((new Date(dateIso) - today) / 86400000);
    if (j <= 14)  return { bg: '#FCEBEB', text: '#A32D2D', dot: '#A32D2D' };  // rouge < 2 sem
    if (j <= 45)  return { bg: '#FEF5E7', text: '#633806', dot: '#D4880A' };  // orange < 6 sem
    return { bg: '#EAF3DE', text: '#27500A', dot: '#1D9E75' };                 // vert sinon
  };

  const fmtJ = (dateIso) => {
    if (!dateIso) return '—';
    const j = Math.round((new Date(dateIso) - today) / 86400000);
    if (j <= 0) return 'Déjà dépassé';
    if (j === 1) return 'Demain';
    return `dans ${j}j`;
  };

  const nbRouge   = items.filter(i => Math.round((new Date(i.rupture.date) - today) / 86400000) <= 14).length;
  const nbOrange  = items.filter(i => { const j = Math.round((new Date(i.rupture.date) - today) / 86400000); return j > 14 && j <= 45; }).length;
  const nbVert    = items.filter(i => Math.round((new Date(i.rupture.date) - today) / 86400000) > 45).length;

  // En-tête
  let html = '<div style="flex:1;overflow-y:auto;padding:0;display:flex;flex-direction:column">'
    // Bandeau titre
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<h2 style="font-size:17px;font-weight:600"><i class="ti ti-alert-triangle" style="color:#D4880A;margin-right:8px;vertical-align:-3px"></i>Besoins — Ruptures à venir</h2>'
    + '<div style="display:flex;gap:8px;margin-left:auto;flex-wrap:wrap">'
    + (nbRouge  ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FCEBEB;color:#A32D2D"><i class="ti ti-alert-circle" style="vertical-align:-2px;margin-right:4px"></i>${nbRouge} critique${nbRouge>1?'s':''} (&lt; 2 sem.)</span>` : '')
    + (nbOrange ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FEF5E7;color:#633806"><i class="ti ti-clock" style="vertical-align:-2px;margin-right:4px"></i>${nbOrange} urgent${nbOrange>1?'s':''} (&lt; 6 sem.)</span>` : '')
    + (nbVert   ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#EAF3DE;color:#27500A"><i class="ti ti-info-circle" style="vertical-align:-2px;margin-right:4px"></i>${nbVert} à surveiller</span>` : '')
    + '</div></div>';

  // Tableau
  html += '<div style="flex:1;overflow-y:auto;padding:16px 20px">'
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'
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

  html += '</tbody></table></div></div></div>';
  el.innerHTML = html;
}
