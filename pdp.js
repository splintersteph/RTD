// ═══════════════════════════════════════════════════════════
// pdp.js — Plan Directeur de Production
// ═══════════════════════════════════════════════════════════

const PDP_CORRESPONDANCES = [{"client": "3M", "famille": "3M", "code_client": "7100319078", "libelle_fg": "RelyX Fiber Post Size 1 / 1.3mm", "codart_wip": "TENON_W1_JTO"}, {"client": "3M", "famille": "3M", "code_client": "7100318549", "libelle_fg": "RelyX Fiber Post Size 3 1.9mm", "codart_wip": "TENON_W3_JTO"}, {"client": "3M", "famille": "3M", "code_client": "7100318947", "libelle_fg": "RelyX Fiber Post Size 2 1.6mm", "codart_wip": "TENON_W2_JTO"}, {"client": "3M", "famille": "3M", "code_client": "7100318946", "libelle_fg": "RelyX Fiber Post Size 0 1.1mm", "codart_wip": "TENON_W0_JTO"}, {"client": "3M", "famille": "3M", "code_client": "7100288478", "libelle_fg": "RelyX Fiber Post 3D Size 2 1.6mm", "codart_wip": "BLISTER_W2_MDR"}, {"client": "3M", "famille": "3M", "code_client": "7100288480", "libelle_fg": "RelyX Fiber Post 3D Size 0 1.1mm", "codart_wip": "BLISTER_W0_MDR"}, {"client": "3M", "famille": "3M", "code_client": "7100288485", "libelle_fg": "RelyX Fiber Post 3D Intro Kit", "codart_wip": "BLISTER_W1_MDR"}, {"client": "3M", "famille": "3M", "code_client": "W40_FG", "libelle_fg": "RelyX Fiber Post 3D W40 XRO", "codart_wip": "TENON_W40_JTO_XRO3%"}, {"client": "3M", "famille": "3M", "code_client": "W41_FG", "libelle_fg": "RelyX Fiber Post 3D W41 XRO", "codart_wip": "TENON_W41_JTO_XRO3%"}, {"client": "3M", "famille": "3M", "code_client": "W42_FG", "libelle_fg": "RelyX Fiber Post 3D W42 XRO", "codart_wip": "TENON_W42_JTO_XRO3%"}, {"client": "3M", "famille": "3M", "code_client": "W43_FG", "libelle_fg": "RelyX Fiber Post 3D W43 XRO", "codart_wip": "TENON_W43_JTO_XRO3%"}, {"client": "BRASSELER", "code_client": "XG0520001", "libelle_fg": "Tenon K 300 JNT-XRO", "codart_wip": "K_300_JNT_XRO", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0520002", "libelle_fg": "Tenon K 1.2 ROD JNT-XRO", "codart_wip": "K_1.2_ROD_JNT_XRO", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0620001", "libelle_fg": "Tenon K 0,5 JNT-XRO", "codart_wip": "K05_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0620002", "libelle_fg": "Tenon K 0,9 JNT-XRO", "codart_wip": "K09_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0620003", "libelle_fg": "Tenon K 1,1 JNT-XRO", "codart_wip": "K11L27_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0620004", "libelle_fg": "Tenon K 0,7 JNT-XRO", "codart_wip": "K07_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0630001", "libelle_fg": "Tenon K 0,5 L 27 JNT-XRO", "codart_wip": "TENON_K05_L27_C_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0630002", "libelle_fg": "Tenon K 0,9  L27 JNT-XRO", "codart_wip": "K09_L27_JNTXRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0630003", "libelle_fg": "Tenon K 1,1  L27 JNT-XRO", "codart_wip": "K11L27_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G0630004", "libelle_fg": "Tenon K 0,7  L27 JNT-XRO", "codart_wip": "K07L27_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1500004", "libelle_fg": "Tenon K135 JNT XRO", "codart_wip": "K_135_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1500005", "libelle_fg": "tenon K145 JNT XRO", "codart_wip": "K_145_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1500006", "libelle_fg": "Tenon K155 JNT XRO", "codart_wip": "K_155_JNT_XRO", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1820001", "libelle_fg": "TENON K-101 JNT-XRO", "codart_wip": "K_101_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1820003", "libelle_fg": "TENON K-104 JNT-XRO", "codart_wip": "K_104_JNT_XRO_IND_C", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1820004", "libelle_fg": "TENON K-105 JNT-XRO", "codart_wip": "K_105_JNT_XRO", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1820005", "libelle_fg": "TENON K-107 JNT-XRO", "codart_wip": "K_107_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1820006", "libelle_fg": "TENON K-108 JNT-XRO", "codart_wip": "K_108_JNT_XRO_INDC", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1820007", "libelle_fg": "TENON K-110 JNT-XRO", "codart_wip": "K_110_JNT_XRO", "famille": "BRASSELER"}, {"client": "BRASSELER", "code_client": "G1820008", "libelle_fg": "TENON K-111 JNT-XRO", "codart_wip": "K_111_JNT_XRO_1", "famille": "BRASSELER"}, {"client": "APOL", "code_client": "2010311", "libelle_fg": "TENON RS 1275", "codart_wip": "RS_1275_ROSE", "famille": "APOL"}, {"client": "APOL", "code_client": "2010312", "libelle_fg": "TENON RS 1208", "codart_wip": "RS_1208_ROSE", "famille": "APOL"}, {"client": "APOL", "code_client": "2010313", "libelle_fg": "TENON RS 1209", "codart_wip": "RS_1209_ROSE", "famille": "APOL"}, {"client": "APOL", "code_client": "2010314", "libelle_fg": "TENON RS 1210", "codart_wip": "RS_1210_ROSE", "famille": "APOL"}, {"client": "APOL", "code_client": "2010315", "libelle_fg": "TENON RS 1495", "codart_wip": "RS_1495_BLEU", "famille": "APOL"}, {"client": "APOL", "code_client": "2010316", "libelle_fg": "TENON RS 1410", "codart_wip": "RS_1410_BLEU", "famille": "APOL"}, {"client": "APOL", "code_client": "2010317", "libelle_fg": "TENON RS 1411", "codart_wip": "RS_1411_BLEU", "famille": "APOL"}, {"client": "APOL", "code_client": "2010318", "libelle_fg": "TENON RS 1412", "codart_wip": "RS_1412_BLEU", "famille": "APOL"}, {"client": "APOL", "code_client": "2010319", "libelle_fg": "TENON RS 1610", "codart_wip": "RS_1610_JAUNE", "famille": "APOL"}, {"client": "APOL", "code_client": "2010320", "libelle_fg": "TENON RS 1611", "codart_wip": "RS_1611_JAUNE", "famille": "APOL"}, {"client": "APOL", "code_client": "2010321", "libelle_fg": "TENON RS 1612", "codart_wip": "RS_1612_JAUNE", "famille": "APOL"}, {"client": "APOL", "code_client": "2010322", "libelle_fg": "TENON RS 1613", "codart_wip": "RS_1613_JAUNE", "famille": "APOL"}, {"client": "MAILLEFER", "code_client": "E1020001", "libelle_fg": "EASY POST # 1", "codart_wip": "S1_JTO_BLANC", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "E1020002", "libelle_fg": "EASY POST # 2", "codart_wip": "S2_JTO_BLANC", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "E1020003", "libelle_fg": "EASY POST # 3", "codart_wip": "S3_JTO_BLANC", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "E1020004", "libelle_fg": "EASY POST # 4", "codart_wip": "S4_JTO_BLANC", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "E1020005", "libelle_fg": "EASY POST # 5", "codart_wip": "S5_JTO_BLANC", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "E1020006", "libelle_fg": "EASY POST # 6", "codart_wip": "S6_JTO_BLANC", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "F1020001", "libelle_fg": "RADIX FIBER POST # 1", "codart_wip": "S1_JTO", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "F1020002", "libelle_fg": "RADIX FIBER POST # 2", "codart_wip": "S2_JTO", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "F1020003", "libelle_fg": "RADIX FIBER POST # 3", "codart_wip": "S3_JTO", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "F1020004", "libelle_fg": "RADIX FIBER POST # 4", "codart_wip": "S4_JTO", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "F1020005", "libelle_fg": "RADIX FIBER POST # 5", "codart_wip": "S5_JTO", "famille": "MAILLEFER"}, {"client": "MAILLEFER", "code_client": "F1020006", "libelle_fg": "RADIX FIBER POST # 6", "codart_wip": "S6_JTO", "famille": "MAILLEFER"}, {"client": "ULTRADENT", "code_client": "G1120000", "libelle_fg": "FIBER POST # 0 JNT XRO", "codart_wip": "TENON_N0_IND_E_1", "famille": "ULTRADENT"}, {"client": "ULTRADENT", "code_client": "G1120001", "libelle_fg": "FIBER POST # 1 JNT XRO", "codart_wip": "TENON_N1_IND_E_1", "famille": "ULTRADENT"}, {"client": "ULTRADENT", "code_client": "G1120002", "libelle_fg": "FIBER POST # 2 JNT XRO", "codart_wip": "TENON_N2_IND_E_1", "famille": "ULTRADENT"}, {"client": "ULTRADENT", "code_client": "G1120003", "libelle_fg": "FIBER POST # 3 JNT XRO", "codart_wip": "TENON_N3_IND_E_1", "famille": "ULTRADENT"}, {"client": "ULTRADENT", "code_client": "G1120004", "libelle_fg": "FIBER POST # 4 JNT XRO", "codart_wip": "TENON_N4_IND_E_1", "famille": "ULTRADENT"}, {"client": "VDW VRAC", "code_client": "X2110301", "libelle_fg": "2110301", "codart_wip": "L01_JTR", "famille": "VDW VRAC"}, {"client": "VDW VRAC", "code_client": "2110302", "libelle_fg": "TENON L POSTS 02", "codart_wip": "L02_JTR", "famille": "VDW VRAC"}, {"client": "VDW VRAC", "code_client": "2110303", "libelle_fg": "TENON L POSTS 03", "codart_wip": "L03_JTR", "famille": "VDW VRAC"}, {"client": "AXIS", "code_client": "F320CKIT", "libelle_fg": "F320CKIT", "codart_wip": "BLISTER_AI1", "famille": "AXIS"}, {"client": "AXIS", "code_client": "F320CKIT", "libelle_fg": "F320CKIT", "codart_wip": "BLISTER_AI2", "famille": "AXIS"}, {"client": "AXIS", "code_client": "F320CKIT", "libelle_fg": "F320CKIT", "codart_wip": "BLISTER_AI3", "famille": "AXIS"}, {"client": "AXIS", "code_client": "F320CKIT", "libelle_fg": "F320CKIT", "codart_wip": "BLISTER_AI4", "famille": "AXIS"}, {"client": "RTD", "famille": "Macro Ill XRO", "code_client": "4590311B", "libelle_fg": "10 MACRO-LOCK POST ILLUSION #1", "codart_wip": "AE1_ILLUSION_X-RO"}, {"client": "RTD", "famille": "Macro Ill XRO", "code_client": "4590312B", "libelle_fg": "10 MACRO-LOCK POST ILLUSION #2", "codart_wip": "AE2_ILLUSION_X-RO"}, {"client": "RTD", "famille": "Macro Ill XRO", "code_client": "4590313B", "libelle_fg": "10 MACRO-LOCK POST ILLUSION #3", "codart_wip": "AE3_ILLUSION_X-RO"}, {"client": "RTD", "famille": "Macro Ill XRO", "code_client": "4590314B", "libelle_fg": "10 MACRO-LOCK POST ILLUSION #4", "codart_wip": "AE4_ILLUSION_X-RO"}, {"client": "RTD", "famille": "Macro Ill XRO", "code_client": "4590315B", "libelle_fg": "10 MACRO-LOCK POST ILLUSION #5", "codart_wip": "AE5_ILLUSION_X-RO"}, {"client": "RTD", "famille": "Macro Ill XRO", "code_client": "4590316B", "libelle_fg": "10 MACRO-LOCK POST ILLUSION #6", "codart_wip": "AE6_ILLUSION_X-RO"}, {"client": "RTD", "famille": "Macrolock", "code_client": "4510311B", "libelle_fg": "10 MACRO-LOCK POST #1", "codart_wip": "AE1_JTR"}, {"client": "RTD", "famille": "Macrolock", "code_client": "4510312B", "libelle_fg": "10 MACRO-LOCK POST #2", "codart_wip": "AE2_JTR"}, {"client": "RTD", "famille": "Macrolock", "code_client": "4510313B", "libelle_fg": "10 MACRO-LOCK POST #3", "codart_wip": "AE3_JTR"}, {"client": "RTD", "famille": "Macrolock", "code_client": "4510314B", "libelle_fg": "10 MACRO-LOCK POST #4", "codart_wip": "AE4_JTR"}, {"client": "RTD", "famille": "Macro Oval", "code_client": "46900501", "libelle_fg": "5 MACRO-LOCK OVAL POSTS #1", "codart_wip": "ML_OVALE_1"}, {"client": "RTD", "famille": "Macro Oval", "code_client": "46900502", "libelle_fg": "5 MACRO-LOCK OVAL POSTS #2", "codart_wip": "ML_OVALE_2"}, {"client": "RTD", "famille": "Macro Oval", "code_client": "46900503", "libelle_fg": "5 MACRO-LOCK OVAL POSTS #3", "codart_wip": "ML_OVALE_3"}, {"client": "RTD", "famille": "Macro Oval", "code_client": "46900504", "libelle_fg": "5 MACRO-LOCK OVAL POSTS #4", "codart_wip": "ML_OVALE_4"}, {"client": "RTD", "famille": "Matchpost", "code_client": "4810010B", "libelle_fg": "10 MATCHPOST #1.0", "codart_wip": "AD1_JTR"}, {"client": "RTD", "famille": "Matchpost", "code_client": "4810012B", "libelle_fg": "10 MATCHPOST #1.2", "codart_wip": "AD2_JTR"}, {"client": "RTD", "famille": "Matchpost", "code_client": "4810014B", "libelle_fg": "10 MATCHPOST #1.4", "codart_wip": "AD3_JTR"}, {"client": "RTD", "famille": "Matchpost", "code_client": "4810016B", "libelle_fg": "10 MATCHPOST #1.6", "codart_wip": "AD4_JTR"}, {"client": "RTD", "famille": "DT Light", "code_client": "1510310B", "libelle_fg": "10 D.T. LIGHT-POST #0.5", "codart_wip": "80.04SG_JTR"}, {"client": "RTD", "famille": "DT Light", "code_client": "1510311B", "libelle_fg": "10 D.T. LIGHT-POST #0.9", "codart_wip": "90.06SG_JTR"}, {"client": "RTD", "famille": "DT Light", "code_client": "1510312B", "libelle_fg": "10 D.T. LIGHT-POST #1.0", "codart_wip": "100.08SG_JTR"}, {"client": "RTD", "famille": "DT Light", "code_client": "1510313B", "libelle_fg": "10 D.T. LIGHT-POST #1.2", "codart_wip": "120.10SG_JTR"}, {"client": "RTD", "famille": "DT Ill XRO", "code_client": "1590310B", "libelle_fg": "10 D.T. LIGHT-POST ILLUSION #0.5", "codart_wip": "80.04_ILLU_XRO_NOIR"}, {"client": "RTD", "famille": "DT Ill XRO", "code_client": "1590311B", "libelle_fg": "10 D.T. LIGHT POST ILLUSION #0.9", "codart_wip": "90.06_ILLU_XRO_ROUGE"}, {"client": "RTD", "famille": "DT Ill XRO", "code_client": "1590312B", "libelle_fg": "10 D.T. LIGHT POST ILLUSION #1.0", "codart_wip": "100.08_ILLU_XRO_JAUN"}, {"client": "RTD", "famille": "DT Ill XRO", "code_client": "1590313B", "libelle_fg": "10 D.T. LIGHT POST ILLUSION #1.2", "codart_wip": "120.10_ILLU_XRO_BLEU"}, {"client": "RTD", "famille": "Endo", "code_client": "1110311B", "libelle_fg": "10 ENDO LIGHT-POST #90", "codart_wip": "90SG_JTR"}, {"client": "RTD", "famille": "Endo", "code_client": "1110312B", "libelle_fg": "10 ENDO LIGHT-POST #100", "codart_wip": "100SG_JTR"}, {"client": "RTD", "famille": "Endo", "code_client": "1110313B", "libelle_fg": "10 ENDO LIGHT-POST #120", "codart_wip": "120SG_JTR"}, {"client": "RTD", "famille": "NTI", "code_client": "H1510310B", "libelle_fg": "10 FIBERMASTER POST #0", "codart_wip": "80.04SG_JTR"}, {"client": "RTD", "famille": "NTI", "code_client": "H1510311B", "libelle_fg": "10 FIBERMASTER POST #0.9", "codart_wip": "90.06SG_JTR"}, {"client": "RTD", "famille": "NTI", "code_client": "H1510312B", "libelle_fg": "10 FIBERMASTER POST #1.0", "codart_wip": "100.08SG_JTR"}, {"client": "3M", "famille": "3M", "code_client": "7100288476", "libelle_fg": "RelyX Fiber Post Drill UNI", "codart_wip": "FINITION_DRILL_W#UNI"}, {"client": "3M", "famille": "3M", "code_client": "7100288475", "libelle_fg": "RelyX Fiber Post Drill Size 0", "codart_wip": "FINITION_DRILL_W#0"}, {"client": "3M", "famille": "3M", "code_client": "7100288474", "libelle_fg": "RelyX Fiber Post Drill Size 1", "codart_wip": "FINITION_DRILL_W#1"}, {"client": "3M", "famille": "3M", "code_client": "7100288473", "libelle_fg": "RelyX Fiber Post Drill Size 2", "codart_wip": "FINITION_DRILL_W#2"}, {"client": "3M", "famille": "3M", "code_client": "7100288472", "libelle_fg": "RelyX Fiber Post Drill Size 3", "codart_wip": "FINITION_DRILL_W#3"}];

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
  'Macro Ill XRO':  {bg:'#FFF4E6',dot:'#F59E0B',text:'#92400E'},
  'Macrolock':      {bg:'#F0FDF4',dot:'#16A34A',text:'#14532D'},
  'Macro Oval':     {bg:'#F5F3FF',dot:'#7C3AED',text:'#4C1D95'},
  'Matchpost':      {bg:'#FFF1F2',dot:'#E11D48',text:'#881337'},
  'DT Light':       {bg:'#EFF6FF',dot:'#3B82F6',text:'#1E3A8A'},
  'DT Ill XRO':     {bg:'#F0FFFE',dot:'#0891B2',text:'#164E63'},
  'Endo':           {bg:'#FDF4FF',dot:'#A855F7',text:'#581C87'},
  'NTI':            {bg:'#ECFDF5',dot:'#10B981',text:'#064E3B'},
  'DRILL DT':       {bg:'#FEF3C7',dot:'#D97706',text:'#78350F'},
};

let pdpSelectedClient = null;
let pdpSearchFilter = '';
let _pdpSearchTimer = null;
let pdpCustomNames = {};
let pdpCustomOrder = {};
let pdpDeletedRefs = []; // codes clients supprimés définitivement
let byClientGlobal = {};
let byFamilleGlobal = {};

// Clic délégué sur les tuiles et boutons PDP (évite les soucis d'apostrophes en onclick inline)
document.addEventListener('click', function(e) {
  const actionBtn = e.target.closest('[data-pdp-action]');
  if (actionBtn) {
    e.stopPropagation();
    const action = actionBtn.getAttribute('data-pdp-action');
    const arg = actionBtn.getAttribute('data-pdp-arg');
    if (action === 'rename') pdpRenameRef(arg);
    else if (action === 'delete') pdpDeleteRef(arg);
    else if (action === 'moveup') pdpMoveRef(arg, -1);
    else if (action === 'movedown') pdpMoveRef(arg, 1);
    else if (action === 'goto-stock') pdpGotoStock(arg);
    else if (action === 'show-detail') pdpShowDetail(arg);
    return;
  }
  const card = e.target.closest('[data-pdp-key]');
  if (card) {
    const key = card.getAttribute('data-pdp-key');
    pdpSelectClient(key || null);
  }
});



function renderPdpPage() {
  const el = document.getElementById('view-pdp');
  if (!el) return;

  // Grouper : OEM par client, RTD par famille
  const byClient = {};
  const byFamille = {};
  byClientGlobal = byClient;
  byFamilleGlobal = byFamille;
  pdpGetActiveCorrespondances().forEach(c => {
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

  const hasData = (pcData.stock||[]).length > 0 || (pcData.ofEnCours||[]).length > 0;

  // Filtrer les refs selon recherche
  const search = pdpSearchFilter.toLowerCase();

  // ── Sélecteur de clients (tabs)
  function makeTab(key, count, dict, prefix) {
    const col = dict[key] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
    const isSel = pdpSelectedClient === prefix+key;
    return '<button data-pdp-key="' + prefix+key + '" style="'
      +'display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:var(--radius);'
      +'border:1.5px solid ' + (isSel ? col.dot : 'var(--border)') + ';'
      +'background:' + (isSel ? col.bg : 'var(--surface)') + ';'
      +'color:' + (isSel ? col.text : 'var(--text-muted)') + ';'
      +'font-size:11px;font-weight:' + (isSel ? '700' : '500') + ';cursor:pointer;'
      +'font-family:var(--font);transition:all .15s;white-space:nowrap">'
      +'<span style="width:7px;height:7px;border-radius:50%;background:' + col.dot + ';flex-shrink:0"></span>'
      + key
      +'<span style="font-size:9px;background:' + (isSel?col.dot:'var(--border-med)') + ';color:' + (isSel?'#fff':'var(--text-faint)') + ';padding:1px 5px;border-radius:20px">' + count + '</span>'
      +'</button>';
  }
  const clientTabs =
    '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
    +'<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint);white-space:nowrap">Clients</span>'
    +clients.map(cl => makeTab(cl, byClient[cl].length, PDP_CLIENT_COLORS, '')).join('')
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px">'
    +'<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint);white-space:nowrap">Familles RTD</span>'
    +familles.map(f => makeTab(f, byFamille[f].length, RTD_FAM_COLORS, 'RTD_')).join('')
    +'</div>';

  // ── Contenu principal
  let mainContent = '';

  if (!pdpSelectedClient) {
    // Vue d'ensemble : tous les clients, cartes KPI
    mainContent = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">';
    clients.forEach(cl => {
      const col = PDP_CLIENT_COLORS[cl] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
      const refs = byClient[cl];
      let totalStock=0, totalEnCours=0, totalCdes=0;
      refs.forEach(r => {
        totalStock   += pdpGetStockForWip(r.codart_wip);
        totalEnCours += pdpGetEnCoursForWip(r.codart_wip);
        totalCdes    += pdpGetCommandesForRef(r.codart_wip);
      });
      const solde = totalStock + totalEnCours - totalCdes;
      const soldeOk = solde >= 0;

      mainContent +=
        '<div data-pdp-key="' + cl + '" style="'
        +'background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);'
        +'padding:16px;cursor:pointer;transition:all .15s;border-top:3px solid '+col.dot+'"'
        +' onmouseenter="this.style.borderColor=\''+col.dot+'\';this.style.background=\''+col.bg+'\'"'
        +' onmouseleave="this.style.borderColor=\'var(--border)\';this.style.borderTopColor=\''+col.dot+'\';this.style.background=\'var(--surface)\'">'
        // Header client
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
        +'<span style="font-size:13px;font-weight:700;color:'+col.text+';flex:1">'+cl+'</span>'
        +'<span style="font-size:10px;color:var(--text-faint);background:var(--bg);padding:2px 7px;border-radius:20px">'+refs.length+' réf.</span>'
        +'</div>'
        // KPIs
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
        +'<div style="background:var(--bg);border-radius:6px;padding:8px 10px">'
        +'<div style="font-size:10px;color:var(--text-faint);margin-bottom:2px">Stock + en cours</div>'
        +'<div style="font-size:16px;font-weight:700;color:'+col.text+'">'+(totalStock+totalEnCours).toLocaleString('fr')+'</div>'
        +'</div>'
        +'<div style="background:var(--bg);border-radius:6px;padding:8px 10px">'
        +'<div style="font-size:10px;color:var(--text-faint);margin-bottom:2px">Commandes</div>'
        +'<div style="font-size:16px;font-weight:700;color:#A32D2D">'+totalCdes.toLocaleString('fr')+'</div>'
        +'</div>'
        +'</div>'
        // Solde
        +'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;'
        +'background:'+(soldeOk?'#EAF3DE':'#FCEBEB')+';border-radius:6px">'
        +'<span style="font-size:11px;color:'+(soldeOk?'#27500A':'#A32D2D')+';">'+(soldeOk?'✓ Couvert':'✗ Insuffisant')+'</span>'
        +'<span style="font-size:14px;font-weight:700;color:'+(soldeOk?'#27500A':'#A32D2D')+'">'+solde.toLocaleString('fr')+'</span>'
        +'</div>'
        +'</div>';
    });
    mainContent += '</div>';

    // Section familles RTD
    if (familles.length > 0) {
      mainContent += '<div style="margin-top:20px;margin-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)">Familles produits RTD</div>';
      mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">';
      familles.forEach(f => {
        const col = RTD_FAM_COLORS[f] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
        const refs = byFamille[f];
        let totalStock=0, totalEnCours=0, totalCdes=0;
        refs.forEach(r => {
          totalStock   += pdpGetStockForWip(r.codart_wip);
          totalEnCours += pdpGetEnCoursForWip(r.codart_wip);
          totalCdes    += pdpGetCommandesForRef(r.codart_wip);
        });
        const solde = totalStock + totalEnCours - totalCdes;
        const ok = solde >= 0;
        mainContent +=
          '<div data-pdp-key="RTD_' + f + '" style="'
          +'background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);'
          +'padding:12px 14px;cursor:pointer;transition:all .15s;border-top:3px solid '+col.dot+'">'
          +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'
          +'<span style="font-size:12px;font-weight:700;color:'+col.text+';flex:1">'+f+'</span>'
          +'<span style="font-size:9px;color:var(--text-faint);background:var(--bg);padding:1px 6px;border-radius:20px">'+refs.length+' réf.</span>'
          +'</div>'
          +'<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">'
          +'<span>Stock <strong style="color:'+col.text+'">'+(totalStock+totalEnCours).toLocaleString('fr')+'</strong></span>'
          +'<span>Cdes <strong style="color:#A32D2D">'+totalCdes.toLocaleString('fr')+'</strong></span>'
          +'</div>'
          +'<div style="padding:5px 10px;background:'+(ok?'#EAF3DE':'#FCEBEB')+';border-radius:6px;text-align:center">'
          +'<span style="font-size:12px;font-weight:700;color:'+(ok?'#27500A':'#A32D2D')+'">'+(ok?'✓ ':'✗ ')+solde.toLocaleString('fr')+'</span>'
          +'</div></div>';
      });
      mainContent += '</div>';
    }

    if (!hasData) {
      mainContent += '<div style="margin-top:16px;padding:16px;background:var(--bg);border:1px dashed var(--border-med);border-radius:var(--radius);font-size:12px;color:var(--text-faint);text-align:center">'
        +'<i class="ti ti-upload" style="font-size:24px;display:block;margin-bottom:6px"></i>'
        +'Importez vos fichiers ERP depuis l\'onglet Stock & Commandes pour voir les niveaux de stock</div>';
    }

  } else {
    // Vue client sélectionné
    const isRTDFam2 = pdpSelectedClient && pdpSelectedClient.startsWith('RTD_');
    const lookupKey2 = isRTDFam2 ? pdpSelectedClient.slice(4) : pdpSelectedClient;
    const colDict2 = isRTDFam2 ? RTD_FAM_COLORS : PDP_CLIENT_COLORS;
    const col = colDict2[lookupKey2] || PDP_CLIENT_COLORS[pdpSelectedClient] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
    const sourcePool = isRTDFam2 ? (byFamille[lookupKey2]||[]) : (byClient[pdpSelectedClient]||[]);
    byClientGlobal = byClient; byFamilleGlobal = byFamille;
    const refsRaw = sourcePool.map((r, i) => Object.assign({}, r, {
      _shortName: pdpCustomNames[r.code_client] || null,
      _order: pdpCustomOrder[pdpSelectedClient]
        ? pdpCustomOrder[pdpSelectedClient].indexOf(r.code_client)
        : i,
    }));
    const refs = refsRaw.filter(r =>
      !search || (r._shortName||r.libelle_fg).toLowerCase().includes(search)
        || r.code_client.toLowerCase().includes(search)
        || r.codart_wip.toLowerCase().includes(search)
    );

    // Totaux client
    let totalStock=0, totalEnCours=0, totalCdes=0;
    refs.forEach(r => {
      totalStock   += pdpGetStockForWip(r.codart_wip);
      totalEnCours += pdpGetEnCoursForWip(r.codart_wip);
      totalCdes    += pdpGetCommandesForRef(r.codart_wip);
    });

    // KPIs client
    mainContent +=
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'
      +'<div style="background:'+col.bg+';border:1px solid '+col.dot+'22;border-radius:var(--radius);padding:12px 16px;flex:1;min-width:120px">'
      +'<div style="font-size:10px;color:'+col.text+';font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Références</div>'
      +'<div style="font-size:22px;font-weight:700;color:'+col.text+'">'+refs.length+'</div></div>'
      +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;flex:1;min-width:120px">'
      +'<div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Stock disponible</div>'
      +'<div style="font-size:22px;font-weight:700;color:#185FA5">'+totalStock.toLocaleString('fr')+'</div></div>'
      +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;flex:1;min-width:120px">'
      +'<div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">En production</div>'
      +'<div style="font-size:22px;font-weight:700;color:#D4880A">'+totalEnCours.toLocaleString('fr')+'</div></div>'
      +'<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;flex:1;min-width:120px">'
      +'<div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Commandes</div>'
      +'<div style="font-size:22px;font-weight:700;color:#A32D2D">'+totalCdes.toLocaleString('fr')+'</div></div>'
      +'</div>';

    // Grille de cartes références
    // Tri : par ordre personnalisé si défini, sinon libelle_fg
    const sortedRefs = [...refs].sort((a,b) => {
      if (a._order !== undefined && b._order !== undefined) return a._order - b._order;
      return (a._shortName||a.libelle_fg).localeCompare(b._shortName||b.libelle_fg);
    });

    mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">';
    sortedRefs.forEach(r => {
      const nom = (typeof nomenclatures !== 'undefined') ? nomenclatures.find(n => n.etapes.some(e => e.codart === r.codart_wip)) : null;

      // Calculer les niveaux avec conversion en FG
      let levels = [];
      if (nom) {
        // Calculer le ratio cumulatif vers le FG depuis chaque étape
        const etapes = nom.etapes;
        levels = etapes.map((e, i) => {
          // Ratio cumulatif : produit des ratios de l'étape i jusqu'à la fin
          let cumRatio = 1;
          for (let j = i; j < etapes.length - 1; j++) {
            if (etapes[j].ratio) cumRatio *= etapes[j].ratio;
          }
          const stk = (typeof nomGetStock !== 'undefined') ? nomGetStock(e.codart) : 0;
          const enc = (typeof nomGetEnCours !== 'undefined') ? nomGetEnCours(e.codart) : 0;
          return {
            label: e.label, codart: e.codart,
            stk, enc,
            total: stk + enc,
            fgEquiv: cumRatio > 1 ? Math.floor((stk + enc) / cumRatio) : (stk + enc),
            isFG: e.ratio === null,
            cumRatio,
          };
        });
      } else {
        const stk = pdpGetStockForWip(r.codart_wip);
        const enc = pdpGetEnCoursForWip(r.codart_wip);
        levels = [{label: r.codart_wip, codart: r.codart_wip, stk, enc, total: stk+enc, fgEquiv: stk+enc, isFG: false, cumRatio: 1}];
      }

      // Total FG = somme des équivalents FG de chaque niveau
      const totalFG = levels.reduce((s,l) => s + l.fgEquiv, 0);
      const cde = pdpGetCommandesForRef(r.codart_wip);
      const solde = totalFG - cde;
      const ok = solde >= 0;
      const barMax = Math.max(levels.reduce((s,l)=>Math.max(s,l.fgEquiv),0), cde, 1);
      const COLORS = ['#4C8EDA','#1D9E75','#D4880A','#7C3AED'];
      const rupture = pdpCalcRupture(r.codart_wip, totalFG);

      // Nom personnalisé > nom court auto-détecté (W0, W1, K101...) > libellé complet
      const autoShort = pdpAutoShortName(r);
      const displayName = r._shortName || autoShort;
      const ofsEnCours = pdpGetOFsForRef(r.codart_wip, autoShort);

      mainContent +=
        '<div data-pdp-action="show-detail" data-pdp-arg="' + r.code_client + '" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;transition:box-shadow .15s;display:flex;flex-direction:column;gap:8px;cursor:pointer"'
        +' onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.1)\'" onmouseleave="this.style.boxShadow=\'none\'">'

        // En-tête : nom + code + badge total FG + bouton édition
        +'<div style="display:flex;align-items:flex-start;gap:8px">'
        +'<div style="flex:1;min-width:0">'
        +'<div style="display:flex;align-items:center;gap:6px">'
        +'<span style="font-size:17px;font-weight:700;color:'+col.text+'">'+displayName+'</span>'
        +'<button data-pdp-action="rename" data-pdp-arg="'+r.code_client+'" title="Renommer" style="background:none;border:none;cursor:pointer;padding:2px;color:var(--text-faint);font-size:12px;line-height:1"><i class="ti ti-pencil"></i></button>'
        +'<button data-pdp-action="moveup" data-pdp-arg="'+r.code_client+'" title="Monter" style="background:none;border:none;cursor:pointer;padding:2px;color:var(--text-faint);font-size:12px;line-height:1"><i class="ti ti-arrow-up"></i></button>'
        +'<button data-pdp-action="movedown" data-pdp-arg="'+r.code_client+'" title="Descendre" style="background:none;border:none;cursor:pointer;padding:2px;color:var(--text-faint);font-size:12px;line-height:1"><i class="ti ti-arrow-down"></i></button>'
        +'<button data-pdp-action="delete" data-pdp-arg="'+r.code_client+'" title="Supprimer" style="background:none;border:none;cursor:pointer;color:#A32D2D;font-size:12px;padding:2px;opacity:.7"><i class="ti ti-trash"></i></button>'
        +'</div>'
        +'<div style="font-size:10px;color:var(--text-faint);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+r.libelle_fg+'">'+r.libelle_fg+'</div>'
        +'</div>'
        +'<span style="font-size:13px;font-weight:700;padding:4px 10px;border-radius:20px;flex-shrink:0;'
        +'background:'+(ok?'#EAF3DE':'#FCEBEB')+';color:'+(ok?'#27500A':'#A32D2D')+'">'
        +(ok?'\u2713 ':'\u2717 ')+totalFG.toLocaleString('fr')+' FG</span>'
        +'</div>'

        // Barres par niveau (en équivalent FG)
        +'<div style="display:flex;flex-direction:column;gap:3px">'
        +levels.map((lv, i) => {
          if (lv.total === 0) return '';
          const pct = Math.round(lv.fgEquiv / barMax * 100);
          const color = lv.isFG ? '#7C3AED' : COLORS[Math.min(i, COLORS.length-1)];
          const lbl = lv.label.length > 18 ? lv.label.slice(0,18)+'\u2026' : lv.label;
          const tooltip = lv.cumRatio > 1
            ? lv.total.toLocaleString('fr')+' \u00F7 '+lv.cumRatio+' = '+lv.fgEquiv.toLocaleString('fr')+' FG'
            : lv.total.toLocaleString('fr')+' FG';
          return '<div style="display:flex;align-items:center;gap:6px" title="'+tooltip+'">'
            +'<span style="font-size:9px;color:var(--text-faint);width:72px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+lbl+'</span>'
            +'<div style="flex:1;height:10px;background:var(--bg);border-radius:5px;overflow:hidden">'
            +'<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:5px;min-width:'+(lv.total>0?'2':'0')+'px"></div></div>'
            +'<span style="font-size:10px;font-weight:600;color:'+color+';width:52px;text-align:right;flex-shrink:0">'+lv.fgEquiv.toLocaleString('fr')+' FG</span>'
            +'</div>';
        }).join('')
        +(cde>0
          ? '<div style="display:flex;align-items:center;gap:6px;margin-top:3px;padding-top:4px;border-top:1px dashed var(--border-med)">'
            +'<span style="font-size:9px;color:#A32D2D;width:72px;flex-shrink:0">Commandes</span>'
            +'<div style="flex:1;height:10px;background:#FEE2E2;border-radius:5px;overflow:hidden">'
            +'<div style="height:100%;width:'+Math.round(cde/barMax*100)+'%;background:#F87171;border-radius:5px"></div></div>'
            +'<span style="font-size:10px;font-weight:600;color:#A32D2D;width:52px;text-align:right">'+cde.toLocaleString('fr')+' FG</span>'
            +'</div>'
          : '')
        +'</div>'

        // Mini bandeau résumé (cliquer sur la carte ouvre le détail complet)
        +'<div style="display:flex;align-items:center;gap:8px;margin-top:4px;padding-top:8px;border-top:1px solid var(--border)">'
        +'<span style="font-size:10px;color:var(--text-faint)">Stock <strong style="color:'+col.text+'">'+totalFG.toLocaleString('fr')+'</strong></span>'
        +'<span style="font-size:10px;color:var(--text-faint)">\u00B7</span>'
        +'<span style="font-size:10px;color:var(--text-faint)">Cdes <strong style="color:#A32D2D">'+cde.toLocaleString('fr')+'</strong></span>'
        +(rupture
          ? '<span style="margin-left:auto;font-size:10px;font-weight:700;color:#A32D2D;background:#FCEBEB;padding:2px 8px;border-radius:20px;white-space:nowrap"><i class="ti ti-alert-triangle" style="font-size:10px;vertical-align:-1px"></i> '+pdpFmtDate(rupture.date)+'</span>'
          : '<span style="margin-left:auto;font-size:10px;font-weight:600;color:#27500A;background:#EAF3DE;padding:2px 8px;border-radius:20px;white-space:nowrap">\u2713 Couvert</span>')
        +'</div>'

        // OFs en cours sur cette référence (Kanban)
        +(ofsEnCours.length > 0
          ? '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding-top:6px">'
            +'<span style="font-size:9px;color:var(--text-faint);white-space:nowrap"><i class="ti ti-tool" style="font-size:10px;vertical-align:-1px"></i> En prod</span>'
            +ofsEnCours.slice(0,3).map(o =>
              '<span style="font-size:9px;font-weight:600;padding:2px 7px;border-radius:20px;background:#FFF4E6;color:#92400E;white-space:nowrap" title="'+o.id+' — '+o.produit+' ('+o.qty.toLocaleString('fr')+' u.) — '+o.stage+'">'
              +o.id.replace('OF-','')+' \u00B7 '+Math.round(o.qty/1000)+'k</span>'
            ).join('')
            +(ofsEnCours.length > 3 ? '<span style="font-size:9px;color:var(--text-faint)">+'+(ofsEnCours.length-3)+'</span>' : '')
            +'</div>'
          : '')



        +'</div>';
    });

    mainContent += '</div>';
    if (!refs.length) {
      mainContent = '<div style="text-align:center;padding:40px;color:var(--text-faint)"><i class="ti ti-search" style="font-size:28px;display:block;margin-bottom:8px"></i>Aucune référence trouvée</div>';
    }
  }

  el.innerHTML =
    '<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">'

    // Header
    +'<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface)">'
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">'
    +'<h2 style="font-size:17px;font-weight:600"><i class="ti ti-chart-gantt" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Plan Directeur de Production</h2>'
    +(pdpSelectedClient
      ? '<button class="btn" data-pdp-key="" style="font-size:11px;padding:4px 10px"><i class="ti ti-arrow-left"></i> Tous les clients</button>'
      : '')
    +'<label class="btn" style="margin-left:auto;font-size:11px;padding:4px 10px;cursor:pointer">'
    +'<i class="ti ti-file-import"></i> '+(pdpImportedCorrespondances?'Réimporter':'Importer les correspondances')
    +'<input type="file" accept=".xlsx,.xls" style="display:none" onchange="pdpImportCorrespondances(this)"></label>'
    +(pdpImportedCorrespondances
      ? '<span style="font-size:10px;color:#27500A;background:#EAF3DE;padding:3px 9px;border-radius:20px"><i class="ti ti-circle-check" style="vertical-align:-1px"></i> '+pdpGetActiveCorrespondances().length+' réf. · '+pdpLastImportDate+'</span>'
      : '<span style="font-size:10px;color:var(--text-faint)">'+pdpGetActiveCorrespondances().length+' réf. par défaut</span>')
    +'</div>'

    // Tabs clients
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
    +(pdpSelectedClient
      ? '<button class="btn" onclick="pdpSortAZ()" style="font-size:11px;padding:5px 10px" title="Trier A \u2192 Z"><i class="ti ti-sort-a-z"></i></button>'
        +'<button class="btn" onclick="pdpResetOrder()" style="font-size:11px;padding:5px 10px" title="Ordre par d\u00e9faut"><i class="ti ti-refresh"></i></button>'
        +'<input id="pdp-search" placeholder="Filtrer les r\u00e9f\u00e9rences\u2026" value="'+pdpSearchFilter+'" oninput="pdpSearch(this.value)"'
        +' style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none;width:200px">'
      : '<span style="font-size:11px;color:var(--text-faint)">Cliquez sur un client pour voir le d\u00e9tail</span>')
    +'</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'
    +clientTabs
    +'</div>'
    +'</div>'

    // Contenu
    +'<div style="flex:1;overflow-y:auto;padding:16px 20px">'
    +mainContent
    +'</div>'
    +'</div>';
}


function pdpSelectClient(client) {
  pdpSelectedClient = client;
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
  if (newName === null) return; // annulé
  if (newName.trim()) pdpCustomNames[code_client] = newName.trim();
  else delete pdpCustomNames[code_client];
  renderPdpPage();
}


function pdpMoveRef(code_client, dir) {
  const isRTDFam = pdpSelectedClient && pdpSelectedClient.startsWith('RTD_');
  const lookupKey = isRTDFam ? pdpSelectedClient.slice(4) : pdpSelectedClient;
  const sourceMap = isRTDFam ? byFamilleGlobal : byClientGlobal;
  const refs = (sourceMap && sourceMap[lookupKey]) || [];
  // Initialiser l'ordre si nécessaire
  if (!pdpCustomOrder[pdpSelectedClient]) {
    pdpCustomOrder[pdpSelectedClient] = refs.map(r => r.code_client);
  }
  const order = pdpCustomOrder[pdpSelectedClient];
  const idx = order.indexOf(code_client);
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= order.length) return;
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  renderPdpPage();
}


// Calcule la date de rupture de stock par consommation FIFO des commandes ouvertes
// triées par date de livraison croissante, à partir du stock total disponible (FG équivalent)

// Convertit une valeur date (string ISO, objet Date, ou Excel serial) en "YYYY-MM-DD"
function pdpToISODate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear(), m = String(val.getMonth()+1).padStart(2,'0'), d = String(val.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+d;
  }
  const s = String(val).trim();
  // Déjà au format YYYY-MM-DD (ou avec heure ISO)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[1]+'-'+isoMatch[2]+'-'+isoMatch[3];
  // Format DD/MM/YYYY
  const frMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frMatch) return frMatch[3]+'-'+frMatch[2].padStart(2,'0')+'-'+frMatch[1].padStart(2,'0');
  return null;
}

function pdpCalcRupture(fgCodeOrWip, stockDispo) {
  if (typeof pcData === 'undefined' || !pcData.commandes) return null;

  // Résoudre vers le code FG si c'est un niveau WIP
  let fgCode = fgCodeOrWip;
  if (typeof nomenclatures !== 'undefined') {
    const nom = nomenclatures.find(n => n.etapes && n.etapes.some(e => e.codart === fgCodeOrWip));
    if (nom) {
      const fgEtape = nom.etapes.find(e => e.ratio === null);
      if (fgEtape) fgCode = fgEtape.codart;
    }
  }

  const cmdsOuvertes = pcData.commandes
    .filter(r => String(r.REF_RTD||'').trim() === fgCode && String(r.LIGNE_CDE_||'').trim() === 'N')
    .map(r => ({
      qteRest: (Number(r.QTE_CDE)||0) - (Number(r.QTE_LIVREE)||0),
      datDel: pdpToISODate(r.DATDEL),
    }))
    .filter(r => r.qteRest > 0 && r.datDel)
    .sort((a,b) => a.datDel.localeCompare(b.datDel));

  if (!cmdsOuvertes.length) return null;

  let stockRestant = stockDispo;
  for (const cmd of cmdsOuvertes) {
    stockRestant -= cmd.qteRest;
    if (stockRestant < 0) {
      return { date: cmd.datDel, manque: Math.abs(stockRestant) };
    }
  }
  return null; // Stock suffisant pour toutes les commandes connues
}

function pdpFmtDate(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  return d+'/'+m+'/'+y.slice(2);
}


// Extrait un nom court automatique (W0, W1, K09...) depuis le libellé ou le codart_wip
function pdpAutoShortName(r) {
  // 1. Chercher un segment Wxx isolé par des séparateurs (_, -, espace, début/fin) dans le codart_wip
  //    ex: TENON_W1_JTO → W1 ; TENON_W40_JTO_XRO3% → W40
  const segs = r.codart_wip.split(/[_\-\s]+/);
  const wSeg = segs.find(s => /^W\d{1,2}$/i.test(s));
  if (wSeg) return wSeg.toUpperCase();

  // 2. Chercher un segment type "K-101", "K101", "K_105" → on reconstruit "K105"/"K-101"
  //    en repérant une lettre seule suivie d'un segment numérique
  for (let i = 0; i < segs.length - 1; i++) {
    if (/^[A-Z]{1,3}$/i.test(segs[i]) && /^\d/.test(segs[i+1])) {
      return segs[i].toUpperCase() + segs[i+1];
    }
  }
  // Variante : un seul segment du type "K101" ou "RS1208" déjà collé
  const collé = segs.find(s => /^[A-Z]{1,3}\d{2,4}(\.\d+)?$/i.test(s));
  if (collé) return collé.toUpperCase();

  // 3. Chercher dans le libellé un nombre après "Size"/"#" (ex: "Size 1", "#1.2")
  const sizeMatch = r.libelle_fg.match(/(?:Size|#)\s*([\d.,]+)/i);
  if (sizeMatch) {
    const prefix = segs[0] && /^[A-Z]{1,4}$/i.test(segs[0]) ? segs[0].toUpperCase() : '';
    return prefix + sizeMatch[1];
  }

  // 4. Repli : premier segment du codart_wip s'il est court, sinon tronqué
  const firstWord = segs[0] || r.codart_wip;
  return firstWord.length <= 12 ? firstWord.toUpperCase() : r.codart_wip.slice(0, 10).toUpperCase();
}

// Trouve les OFs en cours (Kanban) correspondant à une référence WIP
// Recherche souple : le produit de l'OF contient le codart_wip (ou inversement),
// en ignorant la casse et les séparateurs _ - espace
function pdpGetOFsForRef(codart_wip, shortName) {
  if (typeof ofs === 'undefined') return [];
  const norm = s => String(s||'').toUpperCase().replace(/[_\-\s%]/g, '');
  const target = norm(codart_wip);
  const targetShort = shortName ? norm(shortName) : null;

  return ofs.filter(o => {
    const prod = norm(o.produit);
    if (!prod) return false;
    // 1. Correspondance directe sur le code complet (cas le plus fiable)
    if (target && (prod.includes(target) || target.includes(prod))) return true;
    // 2. Repli : correspondance sur le nom court (W1, K101...) en tant que segment isolé,
    //    pas juste une sous-chaîne, pour éviter que W1 matche W10/W11 par erreur
    if (targetShort) {
      const segs = String(o.produit||'').toUpperCase().split(/[_\-\s]+/).map(norm);
      if (segs.includes(targetShort)) return true;
    }
    return false;
  });
}

function pdpGotoStock(codart_wip) {
  if (typeof setView === 'function') setView('stock');
  // Laisser le temps à la vue de se charger avant de sélectionner la référence
  setTimeout(() => {
    if (typeof stockSelectRef === 'function') stockSelectRef(codart_wip);
  }, 50);
}

function pdpShowDetail(code_client) {
  const ref = pdpGetActiveCorrespondances().find(r => r.code_client === code_client);
  if (!ref) return;

  const nom = (typeof nomenclatures !== 'undefined')
    ? nomenclatures.find(n => n.etapes && n.etapes.some(e => e.codart === ref.codart_wip))
    : null;

  // Niveaux de stock
  let levels = [];
  if (nom) {
    levels = nom.etapes.map((e, i) => {
      let cumRatio = 1;
      for (let j = i; j < nom.etapes.length - 1; j++) {
        if (nom.etapes[j].ratio) cumRatio *= nom.etapes[j].ratio;
      }
      const stk = (typeof nomGetStock !== 'undefined') ? nomGetStock(e.codart) : 0;
      const enc = (typeof nomGetEnCours !== 'undefined') ? nomGetEnCours(e.codart) : 0;
      const total = stk + enc;
      return { label: e.label, codart: e.codart, stk, enc, total, fgEquiv: cumRatio > 1 ? Math.floor(total/cumRatio) : total, isFG: e.ratio === null };
    });
  } else {
    const stk = pdpGetStockForWip(ref.codart_wip);
    const enc = pdpGetEnCoursForWip(ref.codart_wip);
    levels = [{ label: ref.codart_wip, codart: ref.codart_wip, stk, enc, total: stk+enc, fgEquiv: stk+enc, isFG: true }];
  }
  const totalFG = levels.reduce((s,l) => s + l.fgEquiv, 0);

  // Code FG pour les commandes
  const fgCode = nom ? ((nom.etapes.find(e => e.ratio === null) || {}).codart || ref.codart_wip) : ref.codart_wip;
  const cmds = (typeof pcData !== 'undefined' ? (pcData.commandes||[]) : [])
    .filter(r => String(r.REF_RTD||'').trim() === fgCode && String(r.LIGNE_CDE_||'').trim() === 'N')
    .map(r => ({
      numCmd: String(r.NUM_COM||''),
      client: String(r.LIBFOU||r.CODCLI||''),
      qteCde: Number(r.QTE_CDE)||0,
      qteLiv: Number(r.QTE_LIVREE)||0,
      qteRest: (Number(r.QTE_CDE)||0) - (Number(r.QTE_LIVREE)||0),
      datDel: pdpToISODate(r.DATDEL),
    }))
    .filter(r => r.qteRest > 0)
    .sort((a,b) => (a.datDel||'9999').localeCompare(b.datDel||'9999'));

  const totalCde = cmds.reduce((s,c) => s+c.qteRest, 0);
  const solde = totalFG - totalCde;
  const ok = solde >= 0;
  const rupture = pdpCalcRupture(ref.codart_wip, totalFG);

  // OFs en cours du Kanban liés à cette référence
  const autoShortM = pdpAutoShortName(ref);
  const ofsModal = pdpGetOFsForRef(ref.codart_wip, autoShortM);

  const displayName = pdpCustomNames[code_client] || ref.libelle_fg;
  const col = PDP_CLIENT_COLORS[ref.client] || RTD_FAM_COLORS[ref.famille] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};

  const COLORS = ['#4C8EDA','#1D9E75','#D4880A','#7C3AED'];
  const barMax = Math.max(...levels.map(l => l.fgEquiv), totalCde, 1);

  const levelsHtml = levels.map((lv,i) => {
    const color = lv.isFG ? '#7C3AED' : COLORS[Math.min(i,COLORS.length-1)];
    const pct = Math.round(lv.fgEquiv/barMax*100);
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'
      + '<span style="width:24px;height:24px;border-radius:50%;background:'+color+';color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+(i+1)+'</span>'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:13px;font-weight:600;color:var(--text)">'+lv.label+'</div>'
      + '<div style="font-size:10px;color:var(--text-faint);font-family:monospace">'+lv.codart+'</div>'
      + '<div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden;margin-top:4px">'
      + '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:4px"></div></div>'
      + '</div>'
      + '<div style="text-align:right;flex-shrink:0">'
      + '<div style="font-size:14px;font-weight:700;color:'+color+'">'+lv.total.toLocaleString('fr')+'</div>'
      + '<div style="font-size:10px;color:var(--text-faint)">'+lv.fgEquiv.toLocaleString('fr')+' FG</div>'
      + '</div></div>';
  }).join('');

  const cmdsHtml = cmds.length
    ? '<table class="cat-table" style="width:100%"><thead><tr><th>N° Cde</th><th>Client</th><th style="text-align:right">Cdé</th><th style="text-align:right">Livré</th><th style="text-align:right">Restant</th><th>Livraison</th></tr></thead><tbody>'
      + cmds.map(c => '<tr>'
        + '<td style="font-size:11px;font-family:monospace;color:var(--accent)">'+c.numCmd+'</td>'
        + '<td style="font-size:12px">'+c.client+'</td>'
        + '<td style="text-align:right;font-size:12px">'+c.qteCde.toLocaleString('fr')+'</td>'
        + '<td style="text-align:right;font-size:12px;color:var(--text-muted)">'+c.qteLiv.toLocaleString('fr')+'</td>'
        + '<td style="text-align:right"><span style="font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;background:#FAEEDA;color:#633806">'+c.qteRest.toLocaleString('fr')+'</span></td>'
        + '<td style="font-size:11px;color:var(--text-muted)">'+(c.datDel?pdpFmtDate(c.datDel):'\u2014')+'</td>'
        + '</tr>').join('')
      + '</tbody></table>'
    : '<div style="text-align:center;padding:24px;color:var(--text-faint)"><i class="ti ti-circle-check" style="font-size:24px;display:block;margin-bottom:6px;color:#27500A"></i>Aucune commande ouverte</div>';

  const modal = document.getElementById('modal');
  if (!modal) return;

  modal.innerHTML =
    '<div class="modal-header"><h2><i class="ti ti-package" style="color:'+col.text+';margin-right:8px"></i>'+displayName+'</h2>'
    + '<button class="close-btn" onclick="closeOverlay()"><i class="ti ti-x"></i></button></div>'
    + '<div class="modal-body" style="display:flex;flex-direction:column;gap:16px">'

    // En-tête code + solde
    + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    + '<span style="font-size:11px;font-family:monospace;color:var(--text-faint)">'+ref.code_client+' \u2192 '+ref.codart_wip+'</span>'
    + '<span style="margin-left:auto;font-size:13px;font-weight:700;padding:5px 12px;border-radius:20px;background:'+(ok?'#EAF3DE':'#FCEBEB')+';color:'+(ok?'#27500A':'#A32D2D')+'">'
    + (ok?'\u2713 ':'\u2717 ')+solde.toLocaleString('fr')+' FG disponibles'+'</span>'
    + '</div>'

    // KPIs
    + '<div style="display:flex;gap:10px;flex-wrap:wrap">'
    + '<div style="flex:1;min-width:100px;background:var(--bg);border-radius:var(--radius);padding:12px;text-align:center">'
    + '<div style="font-size:10px;color:var(--text-faint);text-transform:uppercase">Stock total</div>'
    + '<div style="font-size:20px;font-weight:700;color:'+col.text+'">'+totalFG.toLocaleString('fr')+'</div></div>'
    + '<div style="flex:1;min-width:100px;background:var(--bg);border-radius:var(--radius);padding:12px;text-align:center">'
    + '<div style="font-size:10px;color:var(--text-faint);text-transform:uppercase">Commandé</div>'
    + '<div style="font-size:20px;font-weight:700;color:#A32D2D">'+totalCde.toLocaleString('fr')+'</div></div>'
    + '<div style="flex:1.3;min-width:130px;background:'+(rupture?'#FCEBEB':'#EAF3DE')+';border-radius:var(--radius);padding:12px;text-align:center">'
    + '<div style="font-size:10px;color:'+(rupture?'#A32D2D':'#27500A')+';text-transform:uppercase">Date de rupture</div>'
    + '<div style="font-size:18px;font-weight:700;color:'+(rupture?'#A32D2D':'#27500A')+'">'+(rupture?pdpFmtDate(rupture.date):'Aucune')+'</div>'
    + (rupture?'<div style="font-size:10px;color:#A32D2D">manque '+rupture.manque.toLocaleString('fr')+' pièces</div>':'')
    + '</div></div>'

    // Niveaux de stock (arborescence)
    + '<div>'
    + '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Niveaux de stock</div>'
    + levelsHtml
    + '</div>'


    // OFs en cours Kanban
    + (ofsModal.length > 0
      ? '<div style="margin-bottom:0">'
        + '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">'
        + '<i class="ti ti-tool" style="vertical-align:-2px;margin-right:5px"></i>'+ofsModal.length+' OF(s) en cours de production</div>'
        + '<div style="display:flex;flex-direction:column;gap:6px">'
        + ofsModal.map(o => {
            const sLbls = {creation:'Création',attente:'Attente',usinage:'Usinage',controle:'Contrôle',joint:'Mise en joint',blister:'Blisterage',boite:'Mise en boîte'};
            const COLORS = ['#4C8EDA','#1D9E75','#D4880A','#7C3AED'];
            const nrm = s => String(s||'').toUpperCase().replace(/[_\-\s%]/g,'');
            const matchedEtape = nom ? nom.etapes.find(e => {
              const en = nrm(e.codart), pn = nrm(o.produit);
              return en && pn && (en.includes(pn) || pn.includes(en));
            }) : null;
            const levelLabel = matchedEtape ? matchedEtape.label : null;
            const etapeIdx = matchedEtape && nom ? nom.etapes.indexOf(matchedEtape) : -1;
            const levelColor = etapeIdx >= 0 ? (nom.etapes[etapeIdx].ratio === null ? '#7C3AED' : COLORS[Math.min(etapeIdx, COLORS.length-1)]) : 'var(--text-faint)';
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg);border-radius:var(--radius)">'              + '<span style="font-size:11px;font-weight:700;font-family:monospace;color:var(--accent)">'+o.id+'</span>'              + '<div style="flex:1;min-width:0">'              + '<div style="font-size:12px;color:var(--text);font-weight:500">'+o.produit+'</div>'              + (levelLabel ? '<div style="font-size:10px;font-weight:600;color:'+levelColor+'">→ '+levelLabel+'</div>' : '')              + '</div>'              + '<span style="font-size:12px;font-weight:600;color:var(--text)">'+o.qty.toLocaleString('fr')+' u.</span>'              + '<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:#FFF4E6;color:#92400E">'+(sLbls[o.stage]||o.stage)+'</span>'              + '</div>';
          }).join('')
        + '</div></div>'
      : '')

    // Commandes
    + '<div>'
    + '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">'
    + '<i class="ti ti-shopping-cart" style="vertical-align:-2px;margin-right:5px"></i>'+cmds.length+' commande(s) ouverte(s)</div>'
    + cmdsHtml
    + '</div>'

    + '</div>'
    + '<div class="modal-footer">'
    + '<button class="btn" data-pdp-action="goto-stock" data-pdp-arg="'+ref.codart_wip+'" onclick="closeOverlay()"><i class="ti ti-arrow-right"></i> Voir dans Stock & Commandes</button>'
    + '<button class="btn" onclick="closeOverlay();setTimeout(()=>pdpRenameRef(\''+code_client+'\'),100)"><i class="ti ti-pencil"></i> Renommer</button>'
    + '<button class="btn" style="color:#A32D2D;border-color:#A32D2D" onclick="closeOverlay();setTimeout(()=>pdpDeleteRef(\''+code_client+'\'),100)"><i class="ti ti-trash"></i> Supprimer</button>'
    + '<button class="btn" onclick="closeOverlay()">Fermer</button>'
    + '</div>';

  document.getElementById('overlay').classList.add('open');
}

// ── Import du fichier Excel de correspondances (remplace PDP_CORRESPONDANCES)
let pdpImportedCorrespondances = null; // null = utilise les données par défaut
let pdpLastImportDate = null;

function pdpGetActiveCorrespondances() {
  return pdpImportedCorrespondances || PDP_CORRESPONDANCES;
}

function pdpImportCorrespondances(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (typeof showToast === 'function') showToast('Chargement ' + file.name + '…');

  const reader = new FileReader();
  reader.onload = (e) => {
    loadXLSXForPdp(() => {
      try {
        const wb = XLSX.read(e.target.result, {type:'array', cellDates:true});

        // ── Lire l'onglet "Noms d'usage" si présent
        // Chercher par contenu : feuille ayant une colonne "Code Client (FG)" ET "Nom"
        let wsNoms = null;
        for (const sName of wb.SheetNames) {
          const ws = wb.Sheets[sName];
          const firstRows = XLSX.utils.sheet_to_json(ws, {defval:'', header:1});
          if (firstRows.length && firstRows[0].some(h => String(h||'').includes('Code Client'))) {
            // Vérifier que c'est bien la feuille noms (a une colonne Nom mais pas "Client" seul)
            const hasNom = firstRows[0].some(h => String(h||'').toLowerCase().includes('nom'));
            const hasClient = firstRows[0].some(h => String(h||'').trim() === 'Client');
            if (hasNom && !hasClient) { wsNoms = ws; break; }
          }
        }
        if (wsNoms) {
          const nomRows = XLSX.utils.sheet_to_json(wsNoms, {defval:''});
          nomRows.forEach(r => {
            const code = String(r['Code Client (FG)']||'').trim();
            // Chercher la colonne "Nom d'usage personnalisé" quelle que soit l'encodage exact
            const nomKey = Object.keys(r).find(k => k.toLowerCase().includes('personnalis') || k.toLowerCase().includes('usage'));
            const nom = nomKey ? String(r[nomKey]||'').trim() : '';
            if (code && nom) pdpCustomNames[code] = nom;
          });
        }

        // ── Lire l'onglet "Correspondances"
        // Chercher par nom exact, puis par contenu (feuille ayant une colonne "Client")
        let wsCorr = null;
        for (const sName of wb.SheetNames) {
          const ws = wb.Sheets[sName];
          const firstRows = XLSX.utils.sheet_to_json(ws, {defval:'', header:1});
          if (firstRows.length && firstRows[0].some(h => String(h||'').trim() === 'Client')) {
            wsCorr = ws; break;
          }
        }
        if (!wsCorr) wsCorr = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(wsCorr, {defval:''});

        // Format multi-lignes : une ligne par étape, regroupées par "Code Client (FG)"
        const lines = rawRows.map(r => ({
          client:      String(r['Client']||'').trim(),
          famille:     String(r['Famille']||r['Client']||'').trim(),
          code_client: String(r['Code Client (FG)']||r['Code Client']||'').trim(),
          libelle_fg:  String(r['Libellé FG']||r['Libelle FG']||'').trim(),
          ordre:       Number(r['Ordre'])||1,
          codart_wip:  String(r['CODART WIP']||'').trim(),
          label_etape: String(r['Libellé étape']||r['Libelle etape']||'').trim(),
          ratio:       (r['Ratio → étape suivante']!==''&&r['Ratio → étape suivante']!==undefined)
                        ? Number(r['Ratio → étape suivante'])
                        : ((r['Ratio']!==''&&r['Ratio']!==undefined) ? Number(r['Ratio']) : null),
        })).filter(r => r.client && r.codart_wip)
           .sort((a,b) => a.ordre - b.ordre);

        if (!lines.length) {
          if (typeof showToast === 'function') showToast('✗ Aucune ligne valide trouvée dans le fichier');
          return;
        }

        // Grouper par code_client (FG) pour reconstruire correspondances + nomenclatures
        const groups = {};
        lines.forEach(l => {
          groups[l.code_client] = groups[l.code_client] || [];
          groups[l.code_client].push(l);
        });

        const newCorrespondances = [];
        const newNomenclatures = [];

        Object.keys(groups).forEach(codeClient => {
          const etapes = groups[codeClient];
          const first = etapes[0];

          // Correspondance : pointe vers le PREMIER niveau WIP (comme avant)
          newCorrespondances.push({
            client: first.client,
            famille: first.famille,
            code_client: codeClient,
            libelle_fg: first.libelle_fg,
            codart_wip: first.codart_wip,
          });

          // Nomenclature uniquement si plusieurs étapes
          if (etapes.length > 1) {
            newNomenclatures.push({
              id: 'imp_' + codeClient.replace(/[^a-zA-Z0-9]/g,'_'),
              nom: first.client + ' — ' + first.libelle_fg + ' (' + codeClient + ')',
              etapes: etapes.map(e => ({
                codart: e.codart_wip,
                label: e.label_etape || e.codart_wip,
                ratio: (e.ratio === null || isNaN(e.ratio)) ? null : e.ratio,
              })),
            });
          }
        });

        pdpImportedCorrespondances = newCorrespondances;
        if (typeof nomenclatures !== 'undefined') {
          // Remplacer entièrement par les nomenclatures importées
          nomenclatures.length = 0;
          newNomenclatures.forEach(n => nomenclatures.push(n));
        }
        pdpLastImportDate = new Date().toLocaleDateString('fr-FR');
        if (typeof showToast === 'function') {
          const nbNoms = Object.keys(pdpCustomNames).length;
          showToast('✓ ' + newCorrespondances.length + ' références, ' + newNomenclatures.length + ' nomenclatures, ' + nbNoms + ' noms importés');
        }
        pdpSelectedClient = null;
        renderPdpPage();
      } catch(err) {
        if (typeof showToast === 'function') showToast('✗ Erreur de lecture du fichier : ' + err.message);
      }
    });
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

// Charge SheetJS (déjà potentiellement chargé par stock.js/planning) sans le recharger en double
let _pdpXlsxLoaded = false;
function loadXLSXForPdp(cb) {
  if (typeof XLSX !== 'undefined') { cb(); return; }
  if (_pdpXlsxLoaded) { setTimeout(() => loadXLSXForPdp(cb), 100); return; }
  _pdpXlsxLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// ── Tri alphabétique des tuiles par nom d'affichage
function pdpSortAZ() {
  if (!pdpSelectedClient) return;
  const isRTD = pdpSelectedClient.startsWith('RTD_');
  const key = isRTD ? pdpSelectedClient.slice(4) : pdpSelectedClient;
  const pool = isRTD ? (byFamilleGlobal[key]||[]) : (byClientGlobal[pdpSelectedClient]||[]);
  // Trier par nom d'affichage (nom personnalisé > nom court auto)
  const sorted = [...pool]
    .filter(r => !pdpDeletedRefs.includes(r.code_client))
    .sort((a, b) => {
      const na = pdpCustomNames[a.code_client] || pdpAutoShortName(a);
      const nb = pdpCustomNames[b.code_client] || pdpAutoShortName(b);
      return na.localeCompare(nb, 'fr', {numeric: true});
    });
  pdpCustomOrder[pdpSelectedClient] = sorted.map(r => r.code_client);
  schedulePdpSave();
  renderPdpPage();
}

// ── Réinitialiser l'ordre par défaut (supprimer l'ordre personnalisé)
function pdpResetOrder() {
  if (!pdpSelectedClient) return;
  delete pdpCustomOrder[pdpSelectedClient];
  schedulePdpSave();
  renderPdpPage();
}

// ── Supprimer définitivement une référence (avec confirmation)
function pdpDeleteRef(code_client) {
  const ref = pdpGetActiveCorrespondances().find(r => r.code_client === code_client);
  const name = (ref ? (pdpCustomNames[code_client] || pdpAutoShortName(ref)) : code_client);
  if (!confirm('Supprimer définitivement la référence "' + name + '" ?\n\nElle disparaîtra du PDP jusqu\'à ce que vous reimportiez les correspondances.')) return;
  if (!pdpDeletedRefs.includes(code_client)) pdpDeletedRefs.push(code_client);
  schedulePdpSave();
  renderPdpPage();
}

// ── Sauvegarde des préférences PDP sur Render (légère, sans les données ERP)
function schedulePdpSave() {
  if (typeof scheduleSave === 'function') scheduleSave();
}
