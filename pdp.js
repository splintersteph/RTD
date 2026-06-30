// ═══════════════════════════════════════════════════════════════════════════════
// pdp.js — Plan Directeur de Production
// ═══════════════════════════════════════════════════════════════════════════════

const PDP_CORRESPONDANCES = [{"client":"3M","famille":"3M","code_client":"7100319078","libelle_fg":"W1 — RelyX Fiber Post Size 1 / 1.3mm","codart_wip":"TENON_W1_JTO"},{"client":"3M","famille":"3M","code_client":"7100318549","libelle_fg":"W3 — RelyX Fiber Post Size 3 / 1.9mm","codart_wip":"TENON_W3_JTO"},{"client":"3M","famille":"3M","code_client":"7100318947","libelle_fg":"W2 — RelyX Fiber Post Size 2 / 1.6mm","codart_wip":"TENON_W2_JTO"},{"client":"3M","famille":"3M","code_client":"7100318946","libelle_fg":"W0 — RelyX Fiber Post Size 0 / 1.1mm","codart_wip":"TENON_W0_JTO"},{"client":"3M","famille":"3M","code_client":"7100288478","libelle_fg":"W42 — RelyX Fiber Post 3D Size 2 / 1.6mm","codart_wip":"BLISTER_W2_MDR"},{"client":"3M","famille":"3M","code_client":"7100288480","libelle_fg":"W40 — RelyX Fiber Post 3D Size 0 / 1.1mm","codart_wip":"BLISTER_W0_MDR"},{"client":"3M","famille":"3M","code_client":"7100288485","libelle_fg":"W1 3D — RelyX Fiber Post 3D Intro Kit","codart_wip":"BLISTER_W1_MDR"},{"client":"3M","famille":"3M","code_client":"7100288480","libelle_fg":"W40 — RelyX Fiber Post 3D XRO","codart_wip":"TENON_W40_JTO_XRO3%"},{"client":"3M","famille":"3M","code_client":"7100288479","libelle_fg":"W41 — RelyX Fiber Post 3D XRO","codart_wip":"TENON_W41_JTO_XRO3%"},{"client":"3M","famille":"3M","code_client":"7100288478","libelle_fg":"W42 — RelyX Fiber Post 3D XRO","codart_wip":"TENON_W42_JTO_XRO3%"},{"client":"3M","famille":"3M","code_client":"7100288477","libelle_fg":"W43 — RelyX Fiber Post 3D XRO","codart_wip":"TENON_W43_JTO_XRO3%"},{"client":"3M","famille":"3M","code_client":"7100288476","libelle_fg":"RelyX Fiber Post Drill UNI","codart_wip":"FINITION_DRILL_W#UNI"},{"client":"3M","famille":"3M","code_client":"7100288475","libelle_fg":"RelyX Fiber Post Drill Size 0","codart_wip":"FINITION_DRILL_W#0"},{"client":"3M","famille":"3M","code_client":"7100288474","libelle_fg":"RelyX Fiber Post Drill Size 1","codart_wip":"FINITION_DRILL_W#1"},{"client":"3M","famille":"3M","code_client":"7100288473","libelle_fg":"RelyX Fiber Post Drill Size 2","codart_wip":"FINITION_DRILL_W#2"},{"client":"3M","famille":"3M","code_client":"7100288472","libelle_fg":"RelyX Fiber Post Drill Size 3","codart_wip":"FINITION_DRILL_W#3"},{"client":"APOL","famille":"APOL","code_client":"2010311","libelle_fg":"TENON RS 1275","codart_wip":"RS_1275_ROSE"},{"client":"APOL","famille":"APOL","code_client":"2010312","libelle_fg":"TENON RS 1208","codart_wip":"RS_1208_ROSE"},{"client":"APOL","famille":"APOL","code_client":"2010313","libelle_fg":"TENON RS 1209","codart_wip":"RS_1209_ROSE"},{"client":"APOL","famille":"APOL","code_client":"2010314","libelle_fg":"TENON RS 1210","codart_wip":"RS_1210_ROSE"},{"client":"APOL","famille":"APOL","code_client":"2010315","libelle_fg":"TENON RS 1495","codart_wip":"RS_1495_BLEU"},{"client":"APOL","famille":"APOL","code_client":"2010316","libelle_fg":"TENON RS 1410","codart_wip":"RS_1410_BLEU"},{"client":"APOL","famille":"APOL","code_client":"2010317","libelle_fg":"TENON RS 1411","codart_wip":"RS_1411_BLEU"},{"client":"APOL","famille":"APOL","code_client":"2010318","libelle_fg":"TENON RS 1412","codart_wip":"RS_1412_BLEU"},{"client":"APOL","famille":"APOL","code_client":"2010319","libelle_fg":"TENON RS 1610","codart_wip":"RS_1610_JAUNE"},{"client":"APOL","famille":"APOL","code_client":"2010320","libelle_fg":"TENON RS 1611","codart_wip":"RS_1611_JAUNE"},{"client":"APOL","famille":"APOL","code_client":"2010321","libelle_fg":"TENON RS 1612","codart_wip":"RS_1612_JAUNE"},{"client":"APOL","famille":"APOL","code_client":"2010322","libelle_fg":"TENON RS 1613","codart_wip":"RS_1613_JAUNE"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"E1020001","libelle_fg":"EASY POST # 1","codart_wip":"S1_JTO_BLANC"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"E1020002","libelle_fg":"EASY POST # 2","codart_wip":"S2_JTO_BLANC"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"E1020003","libelle_fg":"EASY POST # 3","codart_wip":"S3_JTO_BLANC"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"E1020004","libelle_fg":"EASY POST # 4","codart_wip":"S4_JTO_BLANC"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"E1020005","libelle_fg":"EASY POST # 5","codart_wip":"S5_JTO_BLANC"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"E1020006","libelle_fg":"EASY POST # 6","codart_wip":"S6_JTO_BLANC"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"F1020001","libelle_fg":"RADIX FIBER POST # 1","codart_wip":"S1_JTO"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"F1020002","libelle_fg":"RADIX FIBER POST # 2","codart_wip":"S2_JTO"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"F1020003","libelle_fg":"RADIX FIBER POST # 3","codart_wip":"S3_JTO"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"F1020004","libelle_fg":"RADIX FIBER POST # 4","codart_wip":"S4_JTO"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"F1020005","libelle_fg":"RADIX FIBER POST # 5","codart_wip":"S5_JTO"},{"client":"MAILLEFER","famille":"MAILLEFER","code_client":"F1020006","libelle_fg":"RADIX FIBER POST # 6","codart_wip":"S6_JTO"},{"client":"ULTRADENT","famille":"ULTRADENT","code_client":"G1120000","libelle_fg":"FIBER POST # 0 JNT XRO","codart_wip":"TENON_N0_IND_E_1"},{"client":"ULTRADENT","famille":"ULTRADENT","code_client":"G1120001","libelle_fg":"FIBER POST # 1 JNT XRO","codart_wip":"TENON_N1_IND_E_1"},{"client":"ULTRADENT","famille":"ULTRADENT","code_client":"G1120002","libelle_fg":"FIBER POST # 2 JNT XRO","codart_wip":"TENON_N2_IND_E_1"},{"client":"ULTRADENT","famille":"ULTRADENT","code_client":"G1120003","libelle_fg":"FIBER POST # 3 JNT XRO","codart_wip":"TENON_N3_IND_E_1"},{"client":"ULTRADENT","famille":"ULTRADENT","code_client":"G1120004","libelle_fg":"FIBER POST # 4 JNT XRO","codart_wip":"TENON_N4_IND_E_1"},{"client":"VDW VRAC","famille":"VDW VRAC","code_client":"X2110301","libelle_fg":"2110301","codart_wip":"L01_JTR"},{"client":"VDW VRAC","famille":"VDW VRAC","code_client":"2110302","libelle_fg":"TENON L POSTS 02","codart_wip":"L02_JTR"},{"client":"VDW VRAC","famille":"VDW VRAC","code_client":"2110303","libelle_fg":"TENON L POSTS 03","codart_wip":"L03_JTR"},{"client":"AXIS","famille":"AXIS","code_client":"F320CKIT","libelle_fg":"F320CKIT","codart_wip":"BLISTER_AI1"},{"client":"AXIS","famille":"AXIS","code_client":"F320CKIT","libelle_fg":"F320CKIT","codart_wip":"BLISTER_AI2"},{"client":"AXIS","famille":"AXIS","code_client":"F320CKIT","libelle_fg":"F320CKIT","codart_wip":"BLISTER_AI3"},{"client":"AXIS","famille":"AXIS","code_client":"F320CKIT","libelle_fg":"F320CKIT","codart_wip":"BLISTER_AI4"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"XG0520001","libelle_fg":"Tenon K 300 JNT-XRO","codart_wip":"K_300_JNT_XRO"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0520002","libelle_fg":"Tenon K 1.2 ROD JNT-XRO","codart_wip":"K_1.2_ROD_JNT_XRO"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0620001","libelle_fg":"Tenon K 0,5 JNT-XRO","codart_wip":"K05_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0620002","libelle_fg":"Tenon K 0,9 JNT-XRO","codart_wip":"K09_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0620003","libelle_fg":"Tenon K 1,1 JNT-XRO","codart_wip":"K11_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0620004","libelle_fg":"Tenon K 0,7 JNT-XRO","codart_wip":"K07_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0630001","libelle_fg":"Tenon K 0,5 L 27 JNT-XRO","codart_wip":"K09_L27_JNTXRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0630002","libelle_fg":"Tenon K 0,9  L27 JNT-XRO","codart_wip":"K09_L27_JNTXRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0630003","libelle_fg":"Tenon K 1,1  L27 JNT-XRO","codart_wip":"K11L27_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G0630004","libelle_fg":"Tenon K 0,7  L27 JNT-XRO","codart_wip":"K07L27_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1500004","libelle_fg":"Tenon K135 JNT XRO","codart_wip":"K_135_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1500005","libelle_fg":"tenon K145 JNT XRO","codart_wip":"K_145_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1500006","libelle_fg":"Tenon K155 JNT XRO","codart_wip":"K_155_JNT_XRO"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1820001","libelle_fg":"TENON K-101 JNT-XRO","codart_wip":"K_101_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1820003","libelle_fg":"TENON K-104 JNT-XRO","codart_wip":"K_104_JNT_XRO_IND_C"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1820004","libelle_fg":"TENON K-105 JNT-XRO","codart_wip":"K_105_JNT_XRO"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1820005","libelle_fg":"TENON K-107 JNT-XRO","codart_wip":"K_107_JNT_XRO_1"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1820006","libelle_fg":"TENON K-108 JNT-XRO","codart_wip":"K_108_JNT_XRO_INDC"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1820007","libelle_fg":"TENON K-110 JNT-XRO","codart_wip":"K_110_JNT_XRO"},{"client":"BRASSELER","famille":"BRASSELER","code_client":"G1820008","libelle_fg":"TENON K-111 JNT-XRO","codart_wip":"K_111_JNT_XRO_1"},{"client":"RTD","famille":"Macro Ill XRO","code_client":"4590311B","libelle_fg":"10 MACRO-LOCK POST ILLUSION #1","codart_wip":"AE1_ILLUSION_X-RO"},{"client":"RTD","famille":"Macro Ill XRO","code_client":"4590312B","libelle_fg":"10 MACRO-LOCK POST ILLUSION #2","codart_wip":"AE2_ILLUSION_X-RO"},{"client":"RTD","famille":"Macro Ill XRO","code_client":"4590313B","libelle_fg":"10 MACRO-LOCK POST ILLUSION #3","codart_wip":"AE3_ILLUSION_X-RO"},{"client":"RTD","famille":"Macro Ill XRO","code_client":"4590314B","libelle_fg":"10 MACRO-LOCK POST ILLUSION #4","codart_wip":"AE4_ILLUSION_X-RO"},{"client":"RTD","famille":"Macro Ill XRO","code_client":"4590315B","libelle_fg":"10 MACRO-LOCK POST ILLUSION #5","codart_wip":"AE5_ILLUSION_X-RO"},{"client":"RTD","famille":"Macro Ill XRO","code_client":"4590316B","libelle_fg":"10 MACRO-LOCK POST ILLUSION #6","codart_wip":"AE6_ILLUSION_X-RO"},{"client":"RTD","famille":"Macrolock","code_client":"4510311B","libelle_fg":"10 MACRO-LOCK POST #1","codart_wip":"AE1_JTR"},{"client":"RTD","famille":"Macrolock","code_client":"4510312B","libelle_fg":"10 MACRO-LOCK POST #2","codart_wip":"AE2_JTR"},{"client":"RTD","famille":"Macrolock","code_client":"4510313B","libelle_fg":"10 MACRO-LOCK POST #3","codart_wip":"AE3_JTR"},{"client":"RTD","famille":"Macrolock","code_client":"4510314B","libelle_fg":"10 MACRO-LOCK POST #4","codart_wip":"AE4_JTR"},{"client":"RTD","famille":"Macro Oval","code_client":"46900501","libelle_fg":"5 MACRO-LOCK OVAL POSTS #1","codart_wip":"ML_OVALE_1"},{"client":"RTD","famille":"Macro Oval","code_client":"46900502","libelle_fg":"5 MACRO-LOCK OVAL POSTS #2","codart_wip":"ML_OVALE_2"},{"client":"RTD","famille":"Macro Oval","code_client":"46900503","libelle_fg":"5 MACRO-LOCK OVAL POSTS #3","codart_wip":"ML_OVALE_3"},{"client":"RTD","famille":"Macro Oval","code_client":"46900504","libelle_fg":"5 MACRO-LOCK OVAL POSTS #4","codart_wip":"ML_OVALE_4"},{"client":"RTD","famille":"Matchpost","code_client":"4810010B","libelle_fg":"10 MATCHPOST #1.0","codart_wip":"AD1_JTR"},{"client":"RTD","famille":"Matchpost","code_client":"4810012B","libelle_fg":"10 MATCHPOST #1.2","codart_wip":"AD2_JTR"},{"client":"RTD","famille":"Matchpost","code_client":"4810014B","libelle_fg":"10 MATCHPOST #1.4","codart_wip":"AD3_JTR"},{"client":"RTD","famille":"Matchpost","code_client":"4810016B","libelle_fg":"10 MATCHPOST #1.6","codart_wip":"AD4_JTR"},{"client":"RTD","famille":"DT Light","code_client":"1510310B","libelle_fg":"10 D.T. LIGHT-POST #0.5","codart_wip":"80.04SG_JTR"},{"client":"RTD","famille":"DT Light","code_client":"1510311B","libelle_fg":"10 D.T. LIGHT-POST #0.9","codart_wip":"90.06SG_JTR"},{"client":"RTD","famille":"DT Light","code_client":"1510312B","libelle_fg":"10 D.T. LIGHT-POST #1.0","codart_wip":"100.08SG_JTR"},{"client":"RTD","famille":"DT Light","code_client":"1510313B","libelle_fg":"10 D.T. LIGHT-POST #1.2","codart_wip":"120.10SG_JTR"},{"client":"RTD","famille":"DT Ill XRO","code_client":"1590310B","libelle_fg":"10 D.T. LIGHT-POST ILLUSION #0.5","codart_wip":"80.04_ILLU_XRO_NOIR"},{"client":"RTD","famille":"DT Ill XRO","code_client":"1590311B","libelle_fg":"10 D.T. LIGHT POST ILLUSION #0.9","codart_wip":"90.06_ILLU_XRO_ROUGE"},{"client":"RTD","famille":"DT Ill XRO","code_client":"1590312B","libelle_fg":"10 D.T. LIGHT POST ILLUSION #1.0","codart_wip":"100.08_ILLU_XRO_JAUN"},{"client":"RTD","famille":"DT Ill XRO","code_client":"1590313B","libelle_fg":"10 D.T. LIGHT POST ILLUSION #1.2","codart_wip":"120.10_ILLU_XRO_BLEU"},{"client":"RTD","famille":"Endo","code_client":"1110311B","libelle_fg":"10 ENDO LIGHT-POST #90","codart_wip":"90SG_JTR"},{"client":"RTD","famille":"Endo","code_client":"1110312B","libelle_fg":"10 ENDO LIGHT-POST #100","codart_wip":"100SG_JTR"},{"client":"RTD","famille":"Endo","code_client":"1110313B","libelle_fg":"10 ENDO LIGHT-POST #120","codart_wip":"120SG_JTR"},{"client":"RTD","famille":"NTI","code_client":"H1510310B","libelle_fg":"10 FIBERMASTER POST #0","codart_wip":"80.04SG_JTR"},{"client":"RTD","famille":"NTI","code_client":"H1510311B","libelle_fg":"10 FIBERMASTER POST #0.9","codart_wip":"90.06SG_JTR"},{"client":"RTD","famille":"NTI","code_client":"H1510312B","libelle_fg":"10 FIBERMASTER POST #1.0","codart_wip":"100.08SG_JTR"},{"client":"RTD","famille":"DRILL DT","code_client":"1520110","libelle_fg":"1 UNIVERSAL DRILL DT LIGHT 0.5","codart_wip":"FINITION_DRILL_DT0.5"},{"client":"RTD","famille":"DRILL DT","code_client":"1520111","libelle_fg":"1 FINISHING DRILL","codart_wip":"FINITION_DRILL_DT_FIN"}];

const PDP_CLIENT_COLORS = {
  '3M':        {bg:'#E0F2FE', dot:'#0EA5E9', text:'#0C4A6E'},
  'BRASSELER': {bg:'#E8F0FE', dot:'#4C8EDA', text:'#185FA5'},
  'APOL':      {bg:'#FCE8F3', dot:'#C026D3', text:'#86198F'},
  'MAILLEFER': {bg:'#FEF3C7', dot:'#D97706', text:'#92400E'},
  'ULTRADENT': {bg:'#D1FAE5', dot:'#059669', text:'#065F46'},
  'VDW VRAC':  {bg:'#FEE2E2', dot:'#DC2626', text:'#991B1B'},
  'AXIS':      {bg:'#EDE9FE', dot:'#7C3AED', text:'#4C1D95'},
  'SHOFU':     {bg:'#F0FDF4', dot:'#16A34A', text:'#14532D'},
  'RTD':       {bg:'#FFF7ED', dot:'#EA580C', text:'#7C2D12'},
};

const RTD_FAM_COLORS = {
  'Macro Ill XRO': {bg:'#FFF4E6',dot:'#F59E0B',text:'#92400E'},
  'Macrolock':     {bg:'#F0FDF4',dot:'#16A34A',text:'#14532D'},
  'Macro Oval':    {bg:'#F5F3FF',dot:'#7C3AED',text:'#4C1D95'},
  'Matchpost':     {bg:'#FFF1F2',dot:'#E11D48',text:'#881337'},
  'DT Light':      {bg:'#EFF6FF',dot:'#3B82F6',text:'#1E3A8A'},
  'DT Ill XRO':    {bg:'#F0FFFE',dot:'#0891B2',text:'#164E63'},
  'Endo':          {bg:'#FDF4FF',dot:'#A855F7',text:'#581C87'},
  'NTI':           {bg:'#ECFDF5',dot:'#10B981',text:'#064E3B'},
  'DRILL DT':      {bg:'#FEF3C7',dot:'#D97706',text:'#78350F'},
};

let pdpSelectedClient = null;
let pdpSearchFilter = '';
let _pdpSearchTimer = null;
let pdpCustomNames = {};
let pdpCustomOrder = {};
let byClientGlobal = {};
let byFamilleGlobal = {};

// ── Clic délégué sur les cartes
document.addEventListener('click', function(e) {
  // Actions sur les boutons (renommer, monter, descendre) — prioritaires
  const actionBtn = e.target.closest('[data-pdp-action]');
  if (actionBtn) {
    e.stopPropagation();
    const action = actionBtn.getAttribute('data-pdp-action');
    const arg = actionBtn.getAttribute('data-pdp-arg');
    if (action === 'rename') pdpRenameRef(arg);
    else if (action === 'moveup') pdpMoveRef(arg, -1);
    else if (action === 'movedown') pdpMoveRef(arg, 1);
    return;
  }
  // Navigation sur les cartes
  const card = e.target.closest('[data-pdp-key]');
  if (card) {
    pdpSelectClient(card.getAttribute('data-pdp-key'));
  }
});

// ── Helpers nomenclature
function pdpGetNom(codart_wip) {
  if (typeof nomenclatures === 'undefined') return null;
  return nomenclatures.find(n => n && n.etapes && n.etapes.some(e => e.codart === codart_wip)) || null;
}

function pdpGetLevels(codart_wip) {
  const nom = pdpGetNom(codart_wip);
  if (!nom) {
    const stk = getStock(codart_wip);
    const enc = getEnCours(codart_wip);
    return [{ label: codart_wip, codart: codart_wip, stk, enc, total: stk+enc, fgEquiv: stk+enc, isFG: true, cumRatio: 1 }];
  }
  return nom.etapes.map((e, i) => {
    let cumRatio = 1;
    for (let j = i; j < nom.etapes.length - 1; j++) {
      if (nom.etapes[j].ratio) cumRatio *= nom.etapes[j].ratio;
    }
    const stk = getStock(e.codart);
    const enc = getEnCours(e.codart);
    const total = stk + enc;
    return { label: e.label, codart: e.codart, stk, enc, total, fgEquiv: Math.floor(total / cumRatio), isFG: e.ratio === null, cumRatio };
  });
}

function pdpTotalFG(levels) {
  return levels.reduce((s, l) => s + l.fgEquiv, 0);
}

// ── Rendu d'une carte référence (vue détaillée)
function pdpRenderCard(r, col) {
  const levels = pdpGetLevels(r.codart_wip);
  const totalFG = pdpTotalFG(levels);
  const cde = getCdes(r.codart_wip);
  const solde = totalFG - cde;
  const ok = solde >= 0;
  const barMax = Math.max(...levels.map(l => l.fgEquiv), cde, 1);
  const COLORS = ['#4C8EDA', '#1D9E75', '#D4880A', '#7C3AED'];

  const nom = r._shortName || r.libelle_fg;
  const hasData = levels.some(l => l.total > 0) || cde > 0;

  let barsHtml = levels.map((lv, i) => {
    const pct = Math.round(lv.fgEquiv / barMax * 100);
    const color = lv.isFG ? '#7C3AED' : COLORS[Math.min(i, COLORS.length - 1)];
    const lbl = lv.label.length > 20 ? lv.label.slice(0, 18) + '\u2026' : lv.label;
    const tip = lv.cumRatio > 1
      ? lv.total.toLocaleString('fr') + ' \u00F7 ' + lv.cumRatio + ' = ' + lv.fgEquiv.toLocaleString('fr') + ' FG'
      : lv.total.toLocaleString('fr') + ' FG';
    return '<div style="display:flex;align-items:center;gap:6px" title="' + tip + '">'
      + '<span style="font-size:9px;color:var(--text-faint);width:72px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + lbl + '</span>'
      + '<div style="flex:1;height:10px;background:var(--bg);border-radius:5px;overflow:hidden">'
      + '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:5px;min-width:' + (lv.total > 0 ? '2' : '0') + 'px;transition:width .4s"></div></div>'
      + '<span style="font-size:10px;font-weight:600;color:' + color + ';width:52px;text-align:right;flex-shrink:0">' + lv.fgEquiv.toLocaleString('fr') + ' FG</span>'
      + '</div>';
  }).join('');

  if (cde > 0) {
    const pct = Math.round(cde / barMax * 100);
    barsHtml += '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;padding-top:4px;border-top:1px dashed var(--border-med)">'
      + '<span style="font-size:9px;color:#A32D2D;width:72px;flex-shrink:0">Commandes</span>'
      + '<div style="flex:1;height:10px;background:#FEE2E2;border-radius:5px;overflow:hidden">'
      + '<div style="height:100%;width:' + pct + '%;background:#F87171;border-radius:5px"></div></div>'
      + '<span style="font-size:10px;font-weight:600;color:#A32D2D;width:52px;text-align:right">' + cde.toLocaleString('fr') + ' FG</span>'
      + '</div>';
  }

  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;display:flex;flex-direction:column;gap:8px">'
    // En-tête
    + '<div style="display:flex;align-items:flex-start;gap:8px">'
    + '<div style="flex:1;min-width:0">'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + '<span style="font-size:16px;font-weight:700;color:' + col.text + '">' + nom + '</span>'
    + '<button data-pdp-action="rename" data-pdp-arg="' + r.code_client + '" title="Renommer" style="background:none;border:none;cursor:pointer;color:var(--text-faint);font-size:12px;padding:2px"><i class="ti ti-pencil"></i></button>'
    + '</div>'
    + '<div style="font-size:10px;color:var(--text-faint);font-family:monospace">' + r.code_client + ' \u2192 ' + r.codart_wip + '</div>'
    + '</div>'
    + '<span style="font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;flex-shrink:0;background:' + (ok ? '#EAF3DE' : '#FCEBEB') + ';color:' + (ok ? '#27500A' : '#A32D2D') + '">'
    + (ok ? '\u2713 ' : '\u2717 ') + solde.toLocaleString('fr') + ' FG</span>'
    + '</div>'
    // Barres
    + '<div style="display:flex;flex-direction:column;gap:3px">' + barsHtml + '</div>'
    // Flèches réordonnancement
    + '<div style="display:flex;justify-content:flex-end;gap:2px;margin-top:2px">'
    + '<button data-pdp-action="moveup" data-pdp-arg="' + r.code_client + '" style="background:none;border:none;cursor:pointer;color:var(--text-faint);font-size:11px;padding:2px 5px" title="Monter"><i class="ti ti-arrow-up"></i></button>'
    + '<button data-pdp-action="movedown" data-pdp-arg="' + r.code_client + '" style="background:none;border:none;cursor:pointer;color:var(--text-faint);font-size:11px;padding:2px 5px" title="Descendre"><i class="ti ti-arrow-down"></i></button>'
    + '</div>'
    + '</div>';
}

// ── Rendu principal
function renderPdpPage() {
  const el = document.getElementById('view-pdp');
  if (!el) return;

  const byClient = {}, byFamille = {};
  byClientGlobal = byClient; byFamilleGlobal = byFamille;
  PDP_CORRESPONDANCES.forEach(c => {
    if (c.client === 'RTD' && c.famille && c.famille !== 'RTD') {
      byFamille[c.famille] = byFamille[c.famille] || [];
      byFamille[c.famille].push(c);
    } else {
      byClient[c.client] = byClient[c.client] || [];
      byClient[c.client].push(c);
    }
  });
  const clients = Object.keys(byClient).sort();
  const familles = Object.keys(byFamille).sort();
  const hasData = (pcData.stock||[]).length > 0;

  // ── Tabs
  function makeTab(key, count, dict, prefix) {
    const col = dict[key] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
    const isSel = pdpSelectedClient === prefix + key;
    return '<button data-pdp-key="' + prefix + key + '" style="'
      + 'display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:var(--radius);'
      + 'border:1.5px solid ' + (isSel ? col.dot : 'var(--border)') + ';'
      + 'background:' + (isSel ? col.bg : 'var(--surface)') + ';'
      + 'color:' + (isSel ? col.text : 'var(--text-muted)') + ';'
      + 'font-size:11px;font-weight:' + (isSel ? '700' : '500') + ';cursor:pointer;'
      + 'font-family:var(--font);transition:all .15s;white-space:nowrap">'
      + '<span style="width:7px;height:7px;border-radius:50%;background:' + col.dot + ';flex-shrink:0"></span>'
      + key
      + '<span style="font-size:9px;background:' + (isSel ? col.dot : 'var(--border-med)') + ';color:' + (isSel ? '#fff' : 'var(--text-faint)') + ';padding:1px 5px;border-radius:20px">' + count + '</span>'
      + '</button>';
  }

  const tabsHtml =
    '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
    + '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint)">Clients</span>'
    + clients.map(cl => makeTab(cl, byClient[cl].length, PDP_CLIENT_COLORS, '')).join('')
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px">'
    + '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint)">Familles RTD</span>'
    + familles.map(f => makeTab(f, byFamille[f].length, RTD_FAM_COLORS, 'RTD_')).join('')
    + '</div>';

  // ── Contenu principal
  let mainContent = '';

  if (!pdpSelectedClient) {
    // Vue d'ensemble
    mainContent += '<div style="margin-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)">Clients OEM</div>';
    mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">';
    clients.forEach(cl => {
      const col = PDP_CLIENT_COLORS[cl] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
      const refs = byClient[cl];
      let totalFG = 0, totalCdes = 0;
      refs.forEach(r => {
        const levels = pdpGetLevels(r.codart_wip);
        totalFG += pdpTotalFG(levels);
        totalCdes += getCdes(r.codart_wip);
      });
      const solde = totalFG - totalCdes;
      const ok = solde >= 0;
      mainContent += '<div data-pdp-key="' + cl + '" style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid ' + col.dot + ';border-radius:var(--radius);padding:14px;cursor:pointer;transition:all .15s"'
        + ' onmouseenter="this.style.background=\'' + col.bg + '\'" onmouseleave="this.style.background=\'var(--surface)\'">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
        + '<span style="font-size:14px;font-weight:700;color:' + col.text + ';flex:1">' + cl + '</span>'
        + '<span style="font-size:10px;color:var(--text-faint);background:var(--bg);padding:2px 7px;border-radius:20px">' + refs.length + ' réf.</span>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:8px">'
        + '<span>Disponible <strong style="color:' + col.text + '">' + totalFG.toLocaleString('fr') + ' FG</strong></span>'
        + '<span>Cdes <strong style="color:#A32D2D">' + totalCdes.toLocaleString('fr') + '</strong></span>'
        + '</div>'
        + '<div style="padding:6px 10px;background:' + (ok ? '#EAF3DE' : '#FCEBEB') + ';border-radius:6px;display:flex;justify-content:space-between;align-items:center">'
        + '<span style="font-size:11px;color:' + (ok ? '#27500A' : '#A32D2D') + '">' + (ok ? '✓ Couvert' : '✗ Insuffisant') + '</span>'
        + '<span style="font-size:14px;font-weight:700;color:' + (ok ? '#27500A' : '#A32D2D') + '">' + solde.toLocaleString('fr') + '</span>'
        + '</div></div>';
    });
    mainContent += '</div>';

    // Familles RTD
    if (familles.length > 0) {
      mainContent += '<div style="margin-top:20px;margin-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)">Familles produits RTD</div>';
      mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">';
      familles.forEach(f => {
        const col = RTD_FAM_COLORS[f] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
        const refs = byFamille[f];
        let totalFG = 0, totalCdes = 0;
        refs.forEach(r => { totalFG += pdpTotalFG(pdpGetLevels(r.codart_wip)); totalCdes += getCdes(r.codart_wip); });
        const solde = totalFG - totalCdes;
        const ok = solde >= 0;
        const fKey = 'RTD_' + f;
        mainContent += '<div data-pdp-key="' + fKey + '" style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid ' + col.dot + ';border-radius:var(--radius);padding:12px;cursor:pointer;transition:all .15s"'
          + ' onmouseenter="this.style.background=\'' + col.bg + '\'" onmouseleave="this.style.background=\'var(--surface)\'">'
          + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'
          + '<span style="font-size:12px;font-weight:700;color:' + col.text + ';flex:1">' + f + '</span>'
          + '<span style="font-size:9px;color:var(--text-faint);background:var(--bg);padding:1px 6px;border-radius:20px">' + refs.length + '</span>'
          + '</div>'
          + '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">'
          + '<span><strong style="color:' + col.text + '">' + totalFG.toLocaleString('fr') + '</strong> FG</span>'
          + '<span>Cdes <strong style="color:#A32D2D">' + totalCdes.toLocaleString('fr') + '</strong></span>'
          + '</div>'
          + '<div style="padding:4px 8px;background:' + (ok ? '#EAF3DE' : '#FCEBEB') + ';border-radius:6px;text-align:center">'
          + '<span style="font-size:11px;font-weight:700;color:' + (ok ? '#27500A' : '#A32D2D') + '">' + (ok ? '✓ ' : '✗ ') + solde.toLocaleString('fr') + '</span>'
          + '</div></div>';
      });
      mainContent += '</div>';
    }

    if (!hasData) {
      mainContent += '<div style="margin-top:14px;padding:12px 16px;background:var(--bg);border:1px dashed var(--border-med);border-radius:var(--radius);font-size:12px;color:var(--text-faint);text-align:center">'
        + '<i class="ti ti-upload" style="font-size:20px;display:block;margin-bottom:6px"></i>'
        + 'Importez vos fichiers ERP depuis Stock &amp; Commandes pour voir les niveaux de stock</div>';
    }

  } else {
    // Vue client/famille sélectionné
    const isRTD = pdpSelectedClient.startsWith('RTD_');
    const key = isRTD ? pdpSelectedClient.slice(4) : pdpSelectedClient;
    const col = (isRTD ? RTD_FAM_COLORS : PDP_CLIENT_COLORS)[key] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
    const pool = isRTD ? (byFamille[key] || []) : (byClient[pdpSelectedClient] || []);

    const search = pdpSearchFilter.toLowerCase();
    const rawRefs = pool.map((r, i) => Object.assign({}, r, {
      _shortName: pdpCustomNames[r.code_client] || null,
      _order: pdpCustomOrder[pdpSelectedClient] !== undefined
        ? (pdpCustomOrder[pdpSelectedClient].indexOf(r.code_client) >= 0 ? pdpCustomOrder[pdpSelectedClient].indexOf(r.code_client) : i)
        : i,
    }));
    const refs = rawRefs
      .filter(r => !search || (r._shortName||r.libelle_fg).toLowerCase().includes(search) || r.code_client.toLowerCase().includes(search) || r.codart_wip.toLowerCase().includes(search))
      .sort((a, b) => a._order - b._order);

    // KPIs totaux
    let totalFG = 0, totalStock = 0, totalEnCours = 0, totalCdes = 0;
    refs.forEach(r => {
      const levels = pdpGetLevels(r.codart_wip);
      totalFG += pdpTotalFG(levels);
      totalStock += getStock(r.codart_wip);
      totalEnCours += getEnCours(r.codart_wip);
      totalCdes += getCdes(r.codart_wip);
    });

    mainContent += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">'
      + '<div style="background:' + col.bg + ';border:1px solid ' + col.dot + '33;border-radius:var(--radius);padding:12px 16px;flex:1;min-width:100px">'
      + '<div style="font-size:10px;color:' + col.text + ';font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Références</div>'
      + '<div style="font-size:22px;font-weight:700;color:' + col.text + '">' + refs.length + '</div></div>'
      + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;flex:1;min-width:100px">'
      + '<div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Total FG disponible</div>'
      + '<div style="font-size:22px;font-weight:700;color:#185FA5">' + totalFG.toLocaleString('fr') + '</div></div>'
      + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;flex:1;min-width:100px">'
      + '<div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Commandes</div>'
      + '<div style="font-size:22px;font-weight:700;color:#A32D2D">' + totalCdes.toLocaleString('fr') + '</div></div>'
      + '</div>';

    mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">';
    refs.forEach(r => { mainContent += pdpRenderCard(r, col); });
    mainContent += '</div>';

    if (!refs.length) {
      mainContent = '<div style="text-align:center;padding:40px;color:var(--text-faint)"><i class="ti ti-search" style="font-size:28px;display:block;margin-bottom:8px"></i>Aucune référence</div>';
    }
  }

  // ── Injecter dans le DOM
  el.innerHTML = '<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface)">'
    + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">'
    + '<h2 style="font-size:17px;font-weight:600"><i class="ti ti-chart-gantt" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Plan Directeur de Production</h2>'
    + (pdpSelectedClient ? '<button class="btn" data-pdp-key="" style="font-size:11px;padding:4px 10px"><i class="ti ti-arrow-left"></i> Tous les clients</button>' : '')
    + '</div>'
    + (pdpSelectedClient
        ? '<input id="pdp-search" placeholder="Filtrer les références\u2026" value="' + pdpSearchFilter + '" oninput="pdpSearch(this.value)" style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none;width:220px;margin-bottom:10px">'
        : '')
    + tabsHtml
    + '</div>'
    + '<div style="flex:1;overflow-y:auto;padding:16px 20px">' + mainContent + '</div>'
    + '</div>';
}

function pdpSelectClient(key) {
  pdpSelectedClient = key || null;
  pdpSearchFilter = '';
  renderPdpPage();
}

function pdpSearch(val) {
  pdpSearchFilter = val;
  clearTimeout(_pdpSearchTimer);
  _pdpSearchTimer = setTimeout(() => {
    renderPdpPage();
    const inp = document.getElementById('pdp-search');
    if (inp) { inp.focus(); inp.value = val; }
  }, 200);
}

function pdpRenameRef(code_client) {
  const current = pdpCustomNames[code_client] || '';
  const newName = prompt('Nom à afficher pour cette référence :', current);
  if (newName === null) return;
  if (newName.trim()) pdpCustomNames[code_client] = newName.trim();
  else delete pdpCustomNames[code_client];
  renderPdpPage();
}

function pdpMoveRef(code_client, dir) {
  const isRTD = pdpSelectedClient && pdpSelectedClient.startsWith('RTD_');
  const key = isRTD ? pdpSelectedClient.slice(4) : pdpSelectedClient;
  const pool = isRTD ? (byFamilleGlobal[key]||[]) : (byClientGlobal[pdpSelectedClient]||[]);
  if (!pdpCustomOrder[pdpSelectedClient]) {
    pdpCustomOrder[pdpSelectedClient] = pool.map(r => r.code_client);
  }
  const order = pdpCustomOrder[pdpSelectedClient];
  const idx = order.indexOf(code_client);
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= order.length) return;
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  renderPdpPage();
}
