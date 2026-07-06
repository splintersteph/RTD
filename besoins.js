// ═══════════════════════════════════════════════════════════
// besoins.js — Onglet Besoins en tenons (ruptures à venir)
// Dépend de : pcData, nomenclatures, PDP_CORRESPONDANCES,
//             pdpGetActiveCorrespondances, pdpResolveFG,
//             pdpToISODate, pdpFmtDate, pdpCalcRupture,
//             stockGetDisponible, stockGetEnCoursProd (définis dans stock.js / pdp.js)
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

  // ── Pour chaque référence, calculer stock FG total + commandes + rupture
  const items = [];

  corrs.forEach(r => {
    if (typeof pdpDeletedRefs !== 'undefined' && pdpDeletedRefs.includes(r.code_client)) return;

    // Trouver la nomenclature de cette référence
    const nom = (typeof nomenclatures !== 'undefined')
      ? nomenclatures.find(n => n && n.etapes && n.etapes.some(e => e.codart === r.codart_wip))
      : null;

    // Calculer le stock total en FG équivalent (tous niveaux)
    // Calcul du stock total en FG équivalent — même logique que pdpShowDetail :
    // chaque niveau est divisé par son ratio cumulatif jusqu'au FG, puis on prend le MAX
    // (le niveau le plus limitant détermine le stock FG réel)
    // Exception : produit simple (1 seule étape ou ratio=null sur premier niveau) →
    // on retourne directement le stock du FG final
    let totalFG = 0;
    if (nom && nom.etapes.length > 1 && nom.etapes[0].ratio !== null) {
      // Produit multi-niveaux : prendre le MAX des équivalents FG par niveau
      const fgEquivs = nom.etapes.map((e, i) => {
        let cumRatio = 1;
        for (let j = i; j < nom.etapes.length - 1; j++) {
          if (nom.etapes[j].ratio) cumRatio *= nom.etapes[j].ratio;
        }
        const stk = (typeof stockGetDisponible === 'function') ? stockGetDisponible(e.codart) : 0;
        const enc = (typeof stockGetEnCoursProd === 'function') ? stockGetEnCoursProd(e.codart) : 0;
        return cumRatio > 1 ? Math.floor((stk + enc) / cumRatio) : (stk + enc);
      });
      totalFG = fgEquivs.reduce((s, v) => s + v, 0);
    } else {
      // Produit simple (un seul niveau ou premier ratio=null) : stock direct du FG
      const fgEtape = nom ? (nom.etapes.find(e => e.ratio === null) || nom.etapes[nom.etapes.length - 1]) : null;
      const fgCodart = fgEtape ? fgEtape.codart : r.codart_wip;
      const stk = (typeof stockGetDisponible === 'function') ? stockGetDisponible(fgCodart) : 0;
      const enc = (typeof stockGetEnCoursProd === 'function') ? stockGetEnCoursProd(fgCodart) : 0;
      totalFG = stk + enc;
    }

    // Commandes ouvertes (sur le code FG final)
    const fgCode = r.code_client;
    const cmds = (typeof pcData !== 'undefined' ? (pcData.commandes || []) : [])
      .filter(c => String(c.REF_RTD || '').trim() === fgCode && String(c.LIGNE_CDE_ || '').trim() === 'N')
      .map(c => ({
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
    const stkWip = (typeof stockGetDisponible === 'function') ? stockGetDisponible(wipBrut.codart) : 0;
    const encWip = (typeof stockGetEnCoursProd === 'function') ? stockGetEnCoursProd(wipBrut.codart) : 0;

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
    + '<th style="text-align:right">Déficit</th>'
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
      <td style="text-align:right">
        <span style="font-size:12px;font-weight:700;padding:3px 8px;border-radius:20px;background:${urg.bg};color:${urg.text}">
          −${deficit.toLocaleString('fr')}
        </span>
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
