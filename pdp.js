// ═══════════════════════════════════════════════════════════════════════════════
// pdp.js — Plan Directeur de Production
// Dépend de : getStock, getEnCours, getCdes, nomenclatures (core)
// ═══════════════════════════════════════════════════════════════════════════════

/* global getStock, getEnCours, getCdes, nomenclatures, pcData,
          currentView, setView, showToast, render, closeOverlay */

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
let byClientGlobal = {};
let byFamilleGlobal = {};

// Clic délégué sur les cartes PDP
document.addEventListener('click', function(e) {
  const card = e.target.closest('[data-pdp-key]');
  if (card) {
    const key = card.getAttribute('data-pdp-key');
    if (key) pdpSelectClient(key);
  }
});


function renderPdpPage() {
  const el = document.getElementById('view-pdp');
  if (!el) return;

  const byClient = {};
  const byFamille = {};
  byClientGlobal = byClient;
  byFamilleGlobal = byFamille;
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

  const hasData = (pcData.stock||[]).length > 0 || (pcData.ofEnCours||[]).length > 0;

  const search = pdpSearchFilter.toLowerCase();

  function makeTab(key, count, dict, prefix) {
    const col = dict[key] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
    const isSel = pdpSelectedClient === prefix+key;
    return '<button onclick="pdpSelectClient(\'' + prefix+key + '\')" style="'+'display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:var(--radius);'
      +'border:1.5px solid ' + (isSel ? col.dot : 'var(--border)') + ';'+'background:' + (isSel ? col.bg : 'var(--surface)') + ';'
      +'color:' + (isSel ? col.text : 'var(--text-muted)') + ';'+'font-size:11px;font-weight:' + (isSel ? '700' : '500') + ';cursor:pointer;'
      +'font-family:var(--font);transition:all .15s;white-space:nowrap">'+'<span style="width:7px;height:7px;border-radius:50%;background:' + col.dot + ';flex-shrink:0"></span>'
      + key
      +'<span style="font-size:9px;background:' + (isSel?col.dot:'var(--border-med)') + ';color:' + (isSel?'#fff':'var(--text-faint)') + ';padding:1px 5px;border-radius:20px">' + count + '</span>'
      +'</button>';
  }
  const clientTabs =
    '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
    +'<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint);white-space:nowrap">Clients</span>'
    +clients.map(cl => makeTab(cl, byClient[cl].length, PDP_CLIENT_COLORS, '')).join('')
    +'</div>'+'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px">'
    +'<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint);white-space:nowrap">Familles RTD</span>'
    +familles.map(f => makeTab(f, byFamille[f].length, RTD_FAM_COLORS, 'RTD_')).join('')
    +'</div>';

  let mainContent = '';

  if (!pdpSelectedClient) {
    mainContent = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">';
    clients.forEach(cl => {
      const col = PDP_CLIENT_COLORS[cl] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
      const refs = byClient[cl];
      let totalStock=0, totalEnCours=0, totalCdes=0;
      refs.forEach(r => {
        totalStock   += getStock(r.codart_wip);
        totalEnCours += getEnCours(r.codart_wip);
        totalCdes    += getCdes(r.codart_wip);
      });
      const solde = totalStock + totalEnCours - totalCdes;
      const soldeOk = solde >= 0;

      mainContent +=
        '<div data-pdp-key="' + cl + '" style="'+'background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);'
        +'padding:16px;cursor:pointer;transition:all .15s;border-top:3px solid '+col.dot+'"'+' onmouseenter="this.style.borderColor=\''+col.dot+'\';this.style.background=\''+col.bg+'\'"'
        +' onmouseleave="this.style.borderColor=\'var(--border)\';this.style.borderTopColor=\''+col.dot+'\';this.style.background=\'var(--surface)\'">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+'<span style="font-size:13px;font-weight:700;color:'+col.text+';flex:1">'+cl+'</span>'
        +'<span style="font-size:10px;color:var(--text-faint);background:var(--bg);padding:2px 7px;border-radius:20px">'+refs.length+' réf.</span>'+'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+'<div style="background:var(--bg);border-radius:6px;padding:8px 10px">'
        +'<div style="font-size:10px;color:var(--text-faint);margin-bottom:2px">Stock + en cours</div>'
        +'<div style="font-size:16px;font-weight:700;color:'+col.text+'">'+(totalStock+totalEnCours).toLocaleString('fr')+'</div>'+'</div>'
        +'<div style="background:var(--bg);border-radius:6px;padding:8px 10px">'+'<div style="font-size:10px;color:var(--text-faint);margin-bottom:2px">Commandes</div>'
        +'<div style="font-size:16px;font-weight:700;color:#A32D2D">'+totalCdes.toLocaleString('fr')+'</div>'+'</div>'
        +'</div>'
        +'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;'+'background:'+(soldeOk?'#EAF3DE':'#FCEBEB')+';border-radius:6px">'
        +'<span style="font-size:11px;color:'+(soldeOk?'#27500A':'#A32D2D')+';">'+(soldeOk?'✓ Couvert':'✗ Insuffisant')+'</span>'
        +'<span style="font-size:14px;font-weight:700;color:'+(soldeOk?'#27500A':'#A32D2D')+'">'+solde.toLocaleString('fr')+'</span>'+'</div>'
        +'</div>';
    });
    mainContent += '</div>';

    if (familles.length > 0) {
      mainContent += '<div style="margin-top:20px;margin-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)">Familles produits RTD</div>';
      mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">';
      familles.forEach(f => {
        const col = RTD_FAM_COLORS[f] || {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
        const refs = byFamille[f];
        let totalStock=0, totalEnCours=0, totalCdes=0;
        refs.forEach(r => {
          totalStock   += getStock(r.codart_wip);
          totalEnCours += getEnCours(r.codart_wip);
          totalCdes    += getCdes(r.codart_wip);
        });
        const solde = totalStock + totalEnCours - totalCdes;
        const ok = solde >= 0;
        const fKey = 'RTD_' + f;
        mainContent +=
          '<div data-pdp-key="' + fKey + '" style="'+'background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);'
          +'padding:12px 14px;cursor:pointer;transition:all .15s;border-top:3px solid '+col.dot+'"'+' onmouseenter="this.style.borderColor=\''+col.dot+'\';this.style.background=\''+col.bg+'\'"'
          +' onmouseleave="this.style.borderColor=\'var(--border)\';this.style.borderTopColor=\''+col.dot+'\';this.style.background=\'var(--surface)\'">' 
          +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'+'<span style="font-size:12px;font-weight:700;color:'+col.text+';flex:1">'+f+'</span>'
          +'<span style="font-size:9px;color:var(--text-faint);background:var(--bg);padding:1px 6px;border-radius:20px">'+refs.length+' réf.</span>'+'</div>'
          +'<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">'
          +'<span>Stock <strong style="color:'+col.text+'">'+(totalStock+totalEnCours).toLocaleString('fr')+'</strong></span>'
          +'<span>Cdes <strong style="color:#A32D2D">'+totalCdes.toLocaleString('fr')+'</strong></span>'+'</div>'
          +'<div style="padding:5px 10px;background:'+(ok?'#EAF3DE':'#FCEBEB')+';border-radius:6px;text-align:center">'
          +'<span style="font-size:12px;font-weight:700;color:'+(ok?'#27500A':'#A32D2D')+'">'+(ok?'✓ ':'✗ ')+solde.toLocaleString('fr')+'</span>'+'</div></div>';
      });
      mainContent += '</div>';
    }

    if (!hasData) {
      mainContent += '<div style="margin-top:16px;padding:16px;background:var(--bg);border:1px dashed var(--border-med);border-radius:var(--radius);font-size:12px;color:var(--text-faint);text-align:center">'
        +'<i class="ti ti-upload" style="font-size:24px;display:block;margin-bottom:6px"></i>'+'Importez vos fichiers ERP depuis l\'onglet Stock & Commandes pour voir les niveaux de stock</div>';
    }

  } else {
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

    let totalStock=0, totalEnCours=0, totalCdes=0;
    refs.forEach(r => {
      totalStock   += getStock(r.codart_wip);
      totalEnCours += getEnCours(r.codart_wip);
      totalCdes    += getCdes(r.codart_wip);
    });

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
      +'<div style="font-size:22px;font-weight:700;color:#A32D2D">'+totalCdes.toLocaleString('fr')+'</div></div>'+'</div>';

    const sortedRefs = [...refs].sort((a,b) => {
      if (a._order !== undefined && b._order !== undefined) return a._order - b._order;
      return (a._shortName||a.libelle_fg).localeCompare(b._shortName||b.libelle_fg);
    });

    mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">';
    sortedRefs.forEach(r => {
      const nom = (typeof nomenclatures !== 'undefined') ? nomenclatures.find(n => n && n.etapes && n.etapes.some(e => e.codart === r.codart_wip)) : null;

      let levels = [];
      if (nom) {
        const etapes = nom.etapes;
        levels = etapes.map((e, i) => {
          let cumRatio = 1;
          for (let j = i; j < etapes.length - 1; j++) {
            if (etapes[j].ratio) cumRatio *= etapes[j].ratio;
          }
          const stk = (typeof nomGetStock !== 'undefined') ? getStock(e.codart) : 0;
          const enc = (typeof nomGetEnCours !== 'undefined') ? getEnCours(e.codart) : 0;
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
        const stk = getStock(r.codart_wip);
        const enc = getEnCours(r.codart_wip);
        levels = [{label: r.codart_wip, codart: r.codart_wip, stk, enc, total: stk+enc, fgEquiv: stk+enc, isFG: false, cumRatio: 1}];
      }

      const totalFG = levels.reduce((s,l) => s + l.fgEquiv, 0);
      const cde = getCdes(r.codart_wip);
      const solde = totalFG - cde;
      const ok = solde >= 0;
      const barMax = Math.max(levels.reduce((s,l)=>Math.max(s,l.fgEquiv),0), cde, 1);
      const COLORS = ['#4C8EDA','#1D9E75','#D4880A','#7C3AED'];

      const displayName = r._shortName || r.libelle_fg;

      mainContent +=
        '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;transition:box-shadow .15s;display:flex;flex-direction:column;gap:8px"'
        +' onmouseenter="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.1)\'" onmouseleave="this.style.boxShadow=\'none\'">'

        +'<div style="display:flex;align-items:flex-start;gap:8px">'+'<div style="flex:1;min-width:0">'
        +'<div style="display:flex;align-items:center;gap:6px">'+'<span style="font-size:17px;font-weight:700;color:'+col.text+'">'+displayName+'</span>'
        +'<button onclick="event.stopPropagation();pdpRenameRef(\''+r.code_client+'\')" title="Renommer" style="background:none;border:none;cursor:pointer;padding:2px;color:var(--text-faint);font-size:12px;line-height:1"><i class="ti ti-pencil"></i></button>'
        +'</div>'+'<div style="font-size:10px;color:var(--text-faint);font-family:monospace;margin-top:1px">'+r.code_client+' \u2192 '+r.codart_wip+'</div>'
        +'</div>'+'<span style="font-size:13px;font-weight:700;padding:4px 10px;border-radius:20px;flex-shrink:0;'
        +'background:'+(ok?'#EAF3DE':'#FCEBEB')+';color:'+(ok?'#27500A':'#A32D2D')+'">'
        +(ok?'\u2713 ':'\u2717 ')+totalFG.toLocaleString('fr')+' FG</span>'+'</div>'

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
            +'<span style="font-size:10px;font-weight:600;color:'+color+';width:52px;text-align:right;flex-shrink:0">'+lv.fgEquiv.toLocaleString('fr')+' FG</span>'+'</div>';
        }).join('')
        +(cde>0
          ? '<div style="display:flex;align-items:center;gap:6px;margin-top:3px;padding-top:4px;border-top:1px dashed var(--border-med)">'
            +'<span style="font-size:9px;color:#A32D2D;width:72px;flex-shrink:0">Commandes</span>'+'<div style="flex:1;height:10px;background:#FEE2E2;border-radius:5px;overflow:hidden">'
            +'<div style="height:100%;width:'+Math.round(cde/barMax*100)+'%;background:#F87171;border-radius:5px"></div></div>'
            +'<span style="font-size:10px;font-weight:600;color:#A32D2D;width:52px;text-align:right">'+cde.toLocaleString('fr')+' FG</span>'+'</div>'
          : '')
        +'</div>'

        +'<div style="display:flex;justify-content:flex-end;margin-top:2px">'
        +'<button onclick="event.stopPropagation();pdpMoveRef(\''+r.code_client+'\',-1)" style="background:none;border:none;cursor:pointer;padding:2px 5px;color:var(--text-faint);font-size:11px" title="Monter"><i class="ti ti-arrow-up"></i></button>'
        +'<button onclick="event.stopPropagation();pdpMoveRef(\''+r.code_client+'\',1)" style="background:none;border:none;cursor:pointer;padding:2px 5px;color:var(--text-faint);font-size:11px" title="Descendre"><i class="ti ti-arrow-down"></i></button>'
        +'</div>'

        +'</div>';
    });

    mainContent += '</div>';
    if (!refs.length) {
      mainContent = '<div style="text-align:center;padding:40px;color:var(--text-faint)"><i class="ti ti-search" style="font-size:28px;display:block;margin-bottom:8px"></i>Aucune référence trouvée</div>';
    }
  }

  el.innerHTML =
    '<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">'

    +'<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface)">'+'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">'
    +'<h2 style="font-size:17px;font-weight:600"><i class="ti ti-chart-gantt" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Plan Directeur de Production</h2>'
    +(pdpSelectedClient
      ? '<button class="btn" onclick="pdpSelectClient(null)" style="font-size:11px;padding:4px 10px"><i class="ti ti-arrow-left"></i> Tous les clients</button>'
      : '')
    +'</div>'

    +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
    +(pdpSelectedClient
      ? '<input id="pdp-search" placeholder="Filtrer les références…" value="'+pdpSearchFilter+'" oninput="pdpSearch(this.value)"'
        +' style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none;width:200px">'
      : '<span style="font-size:11px;color:var(--text-faint)">Cliquez sur un client pour voir le détail</span>')
    +'</div>'+'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'
    +clientTabs
    +'</div>'+'</div>'

    +'<div style="flex:1;overflow-y:auto;padding:16px 20px">'
    +mainContent
    +'</div>'+'</div>';
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
