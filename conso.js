// ═══════════════════════════════════════════════════════════
// conso.js — Rythme de vente & couverture de stock (PRODUIT FINI uniquement)
// Dépend de : pdpGetActiveCorrespondances, pdpGetTotalFGForRef, pdpShowDetail
//             (pdp.js), showToast, render, currentView (index.html),
//             loadXLSXForPdp/XLSX (pdp.js, réutilisé)
//
// IMPORTANT : la couverture se calcule au niveau CODE_CLIENT (FG, ex: "4590312B"),
// PAS au niveau codart_wip (le tenon brut). Le rythme de PRODUCTION (consommation
// de tenons) n'est pas le rythme de VENTE — seules les livraisons réelles au
// niveau produit fini représentent la demande client. Source : COMMANDELIST.XLSX,
// colonne QTE_LIVREE (quantité livrée) agrégée par REF_RTD sur les livraisons
// dont DATE_BL tombe dans les 2 dernières années glissantes.
// ═══════════════════════════════════════════════════════════

const CONSO_PERIOD_DAYS_DEFAULT = 730; // 2 ans glissants jusqu'au 2026-07-08 (COMMANDELIST.XLSX, DATE_BL)
// [code_client (REF_RTD), libellé, qté livrée sur la période, nb lignes de livraison]
const CONSO_DEFAULT_RAW = [["1110311B", "10 ENDO LIGHT-POST #90", 2300, 9], ["1110312B", "10 ENDO LIGHT-POST #100", 3888, 13], ["1110313B", "10 ENDO LIGHT-POST #120", 950, 6], ["1340001", "PORT // FREIGHT", 3, 3], ["1410050", "50 CORECEM MINIMIX CANNULAS", 645, 30], ["1410110", "100 CORECEM ROOT CANAL TIPS", 744, 35], ["1410120", "1 CORECEM MINIMIX 9g/5ml", 32092, 122], ["1410121", "1 CORECEM ILLUSION MINIMIX", 55, 5], ["1510310B", "10 D.T. LIGHT-POST #0.5", 9960, 159], ["1510311B", "10 D.T. LIGHT-POST #1", 12781, 171], ["1510312B", "10 D.T. LIGHT-POST #2", 11126, 178], ["1510313B", "10 D.T. LIGHT-POST #3", 3247, 107], ["1520110", "1 UNIVERSAL DRILL DT LIGHT 0.5", 9117, 221], ["1520111", "1 FINISHING DRILL", 7788, 217], ["1520112", "1 FINISHING DRILL", 5474, 174], ["1520113", "1 FINISHING DRILL", 3000, 130], ["1590301", "D.T. LIGHT-POST", 1494, 10], ["1590310B", "10 D.T. LIGHT-POST ILLUSION", 36945, 222], ["1590311B", "10 D.T. LIGHT POST ILLUSION", 25860, 228], ["1590312B", "10 D.T. LIGHT-POST ILLUSION", 9906, 196], ["1590313B", "10 D.T. LIGHT-POST ILLUSION", 4336, 158], ["1590320", "D.T. LIGHT-POST", 1365, 116], ["1590350B", "5 D.T. LIGHT-POST ILLUSION", 5900, 21], ["1590351B", "5 D.T. LIGHT-POST ILLUSION", 4340, 14], ["1590352B", "5 D.T. LIGHT-POST ILLUSION", 1150, 10], ["1590353B", "5 DT LIGHT ILLU.XRO POST #3", 580, 10], ["2010311", "TENON RS 1275", 8500, 14], ["2010312", "TENON RS 1208", 11350, 15], ["2010313", "TENON RS 1209", 12580, 16], ["2010314", "TENON RS 1210", 13310, 16], ["2010315", "TENON RS 1495", 18650, 17], ["2010316", "TENON RS 1410", 23350, 17], ["2010317", "TENON RS 1411", 18262, 16], ["2010318", "TENON RS 1412", 16120, 16], ["2010319", "TENON RS 1610", 7900, 15], ["2010320", "TENON RS 1611", 6790, 14], ["2010321", "TENON RS 1612", 4700, 12], ["2010322", "TENON RS 1613", 6250, 12], ["2110301", "TENON L POSTS 01", 61000, 11], ["2110302", "TENON L POSTS 02", 42000, 8], ["2110303", "TENON L POSTS 03", 24804, 5], ["3410311B", "10 ENDO LIGHT-POST #90", 520, 9], ["3410312B", "10 ENDO LIGHT-POST #100", 440, 10], ["3410313B", "10 ENDO LIGHT-POST #120", 130, 5], ["3510310B", "10 D.T. LIGHT-POST #0.5", 4120, 19], ["3510311B", "10 D.T. LIGHT-POST #1", 5020, 23], ["3510312B", "10 D.T. LIGHT-POST #2", 3230, 23], ["3510313B", "10 D.T. LIGHT-POST #3", 1120, 12], ["3510330B", "30 D.T. LIGHT-POST #0.5", 700, 8], ["3510331B", "30 D.T. LIGHT-POST #1", 510, 7], ["3510332B", "30 D.T. LIGHT-POST #2", 120, 4], ["3510333B", "30 D.T. LIGHT-POST #3", 47, 4], ["3520110", "1 D.T. UNIVERSAL DRILL", 380, 7], ["3520111", "1 D.T. FINISHING DRILL", 330, 5], ["3520112", "1 D.T. FINISHING DRILL", 250, 5], ["3520113", "1 D.T. FINISHING DRILL", 103, 5], ["3590310B", "10 D.T. LIGHT-POST ILLUSION", 1260, 14], ["3590311B", "10 D.T. LIGHT-POST ILLUSION", 1170, 16], ["3590312B", "10 D.T. LIGHT-POST ILLUSION", 750, 6], ["3590313B", "10 D.T. LIGHT-POST ILLUSION", 340, 11], ["4510311B", "10 MACRO-LOCK POST #1", 3840, 30], ["4510312B", "10 MACRO-LOCK POST #2", 6942, 28], ["4510313B", "10 MACRO-LOCK POST #3", 2473, 24], ["4510314B", "10 MACRO-LOCK POST #4", 613, 12], ["4520119", "1 STARTER DRILL MACRO-LOCK #2", 3685, 117], ["4520120", "1 STARTER DRILL MACRO-LOCK #1", 6117, 161], ["4520121", "1 FINISHING DRILL MACRO-LOCK", 17022, 189], ["4520122", "1 FINISHING DRILL MACRO-LOCK", 15775, 167], ["4520123", "1 FINISHING DRILL MACRO-LOCK", 7663, 139], ["4520124", "1 FINISHING DRILL MACRO-LOCK", 3126, 108], ["4520125", "1 FINISHING DRILL MACRO-LOCK", 275, 41], ["4520126", "1 FINISHING DRILL MACRO-LOCK", 205, 32], ["4590302", "MACRO-LOCK ILLUSION X-RO", 831, 22], ["4590311B", "10 MACRO-LOCK POST ILLUSION", 59612, 254], ["4590312B", "10 MACRO-LOCK POST ILLUSION", 62631, 260], ["4590313B", "10 MACRO-LOCK POST ILLUSION", 28192, 210], ["4590314B", "10 MACRO-LOCK POST ILLUSION", 8984, 166], ["4590315B", "10 MACRO-LOCK POST ILLUSION", 1130, 69], ["4590316B", "10 MACRO-LOCK POST ILLUSION", 449, 51], ["4590320", "MACRO-LOCK ILLUSION X-RO", 4588, 131], ["4590351B", "5 MACRO-LOCK POST ILLUSION", 38474, 47], ["4590352B", "5 MACRO-LOCK POST ILLUSION", 31904, 39], ["4590353B", "5 MACRO-LOCK POST ILLUSION", 17416, 36], ["4590354B", "5 MACRO-LOCK POST ILLUSION", 6423, 29], ["4590355B", "5 MACRO-LOCK POST ILLUSION", 61, 8], ["46900003", "MACRO-LOCK OVAL INTROKIT", 21, 5], ["46900004", "MACRO-LOCK OVAL INTROKIT", 32, 8], ["46900501", "5 MACRO-LOCK OVAL POSTS #1", 3935, 98], ["46900502", "5 MACRO-LOCK OVAL POSTS #2", 3776, 99], ["46900503", "5 MACRO-LOCK OVAL POSTS #3", 1748, 78], ["46900504", "5 MACRO-LOCK OVAL POSTS #4", 849, 63], ["4690320", "UNIVERSAL KIT MACRO-LOCK OVAL", 166, 20], ["4800001", "MATCHPOST INTROKIT A", 2405, 76], ["4800002", "MATCHPOST INTROKIT B", 1030, 50], ["4810010B", "10 MATCHPOST #1.0", 64881, 179], ["4810012B", "10 MATCHPOST #1.2", 78373, 176], ["4810014B", "10 MATCHPOST #1.4", 27804, 139], ["4810016B", "10 MATCHPOST #1.6", 7637, 102], ["4820101", "1 STARTER DRILL MATCHPOST #1", 1971, 52], ["4820102", "1 STARTER DRILL MATCHPOST #2", 852, 43], ["4820210", "1 FINISHING DRILL MATCHPOST", 9316, 93], ["4820212", "1 FINISHING DRILL MATCHPOST", 9246, 90], ["4820214", "1 FINISHING DRILL MATCHPOST", 4627, 67], ["4820216", "1 FINISHING DRILL MATCHPOST", 1371, 45], ["5000323", "Kit QUARTZ SPLINT", 155, 11], ["5000325", "Kit QUARTZ SPLINT", 2641, 24], ["5010001", "2 QUARTZ SPLINT RESIN 1.5g", 4119, 47], ["5010048", "5 QUARTZ SPLINT UD Ø1.0-L80mm", 973, 38], ["5010049", "5 QUARTZ SPLINT UD Ø1.5-L80mm", 3874, 108], ["5010053", "5 QUARTZ SPLINT WOVEN 2.5x80mm", 19381, 158], ["5010081", "Refill QUARTZ SPLINT MESH", 120, 5], ["5010083", "2 QUARTZ SPLINT MESH 55x80mm", 5173, 65], ["70201138800", "RelyX Fiber Post Size 1", 65520, 13], ["70201138818", "RelyX Fiber Post Size 2", 55231, 11], ["70201138834", "RelyX Fiber Post Size 0", 2517, 3], ["70201144238", "RelyX™ Fiber Post Drill", 14970, 10], ["70201144253", "RelyX™ Fiber Post Drill", 2500, 5], ["70201144261", "RelyX™ Fiber Post Drill", 8000, 9], ["7100254820", "RelyX Fiber Post Intro Kit", 13230, 47], ["7100288472", "RelyX™ Fiber Post Drill", 28180, 56], ["7100288473", "RelyX™ Fiber Post Drill", 53443, 98], ["7100288474", "RelyX™ Fiber Post Drill", 70598, 126], ["7100288475", "RelyX™ Fiber Post Drill", 33200, 64], ["7100288476", "RelyX™ Fiber Post Drill", 39102, 69], ["7100288477", "RelyX Fiber Post 3D Size 3", 32760, 39], ["7100288478", "RelyX Fiber Post 3D Size 2", 53291, 65], ["7100288479", "RelyX Fiber Post 3D Size 1", 64511, 76], ["7100288480", "RelyX Fiber Post 3D Size 0", 17640, 55], ["7100288485", "RelyX Fiber Post 3D Intro Kit", 22036, 103], ["7100318549", "RelyX Fiber Post Size 3", 183693, 84], ["7100318946", "RelyX Fiber Post Size 0", 62639, 76], ["7100318947", "RelyX Fiber Post Size 2", 534126, 243], ["7100319078", "RelyX Fiber Post Size 1", 457073, 238], ["AHSH0001", "SHOFU POSTS SIZE 1", 29500, 23], ["AHSH0002", "SHOFU POSTS SIZE 2", 53000, 26], ["AHSH0003", "SHOFU POSTS SIZE 3", 19000, 18], ["AHSH0004", "SHOFU POSTS SIZE 4", 16000, 16], ["B1510310B", "10 Double Taper LIGHT-POST", 230, 14], ["B1510311B", "10 Double Taper LIGHT-POST", 305, 11], ["B1510312B", "10 Double Taper LIGHT-POST", 206, 11], ["B1510313B", "10 Double Taper LIGHT-POST", 85, 7], ["B1510330B", "30 Double Taper LIGHT-POST", 50, 9], ["B1510331B", "30 Double Taper LIGHT-POST", 178, 13], ["B1510332B", "30 Double Taper LIGHT-POST", 35, 6], ["B1510333B", "30 Double Taper LIGHT-POST", 40, 4], ["B1590301", "Double Taper LIGHT-POST", 1, 1], ["B1590310B", "10 Double Taper LIGHT-POST", 615, 15], ["B1590311B", "10 Double Taper LIGHT-POST", 872, 22], ["B1590312B", "10 Double Taper LIGHT-POST", 635, 16], ["B1590313B", "10 Double Taper LIGHT-POST", 230, 14], ["B1590320", "DOUBLE TAPER LIGHT-POST", 100, 10], ["E1020001", "EASY POST # 1", 169966, 17], ["E1020002", "EASY POST # 2", 117000, 14], ["E1020003", "EASY POST # 3", 40000, 8], ["E1020004", "EASY POST # 4", 15000, 3], ["E1020005", "EASY POST # 5", 1191, 4], ["F021C050B", "BLISTER OF 5 POST 1.0", 16400, 30], ["F021C050BUS", "BLISTER OF 5 POST 1.0", 600, 2], ["F021C051B", "BLISTER OF 5 POST 1.2", 139400, 55], ["F021C051BUS", "BLISTER OF 5 POST 1.2", 1500, 3], ["F021C052B", "BLISTER OF 5 POST 1.4", 59500, 39], ["F021C052BUS", "BLISTER OF 5 POST 1.4", 800, 2], ["F021C053B", "BLISTER OF 5 POST 1.6", 52093, 36], ["F021C053BUS", "BLISTER OF 5 POST 1.6", 450, 3], ["F021C05XB", "BLISTER OF 5 POST 0.8", 9500, 19], ["F021C05XBUS", "BLISTER OF 5 POST 0.8", 320, 2], ["F080C100", "BLISTER OF 5 POST 0.80-10MM", 1862, 5], ["F080C200", "BLISTER OF 5 POST 0.80-12MM", 1300, 4], ["F100C300", "BLISTER OF 5 POST 1.00-10MM", 600, 2], ["F100C400", "BLISTER OF 5 POST 1.00-12MM", 600, 3], ["F1020001", "RADIX FIBER POST # 1", 185000, 20], ["F1020002", "RADIX FIBER POST # 2", 200000, 20], ["F1020003", "RADIX FIBER POST # 3", 80000, 9], ["F1020004", "RADIX FIBER POST # 4", 40000, 8], ["F171C101", "TUBE OF 10 POST #1 mm (#16)", 31000, 7], ["F171C102", "TUBE OF 10 POST #1.2 mm (#17)", 203271, 29], ["F171C103", "TUBE OF 10 POST #1.4 mm (#18)", 60130, 13], ["F171C104", "TUBE OF 10 POST #1.6 mm (#19)", 36357, 10], ["F320CKIT", "FIBERPOST SET", 100, 1], ["G0620001", "Tenon K 0,5 JNT-XRO", 23929, 8], ["G0620002", "Tenon K 0,9 JNT-XRO", 93000, 18], ["G0620003", "Tenon K 1,1 JNT-XRO", 21269, 7], ["G0620004", "Tenon K 0,7 JNT-XRO", 41004, 12], ["G0630001", "Tenon K 0,5 L 27 JNT-XRO", 50663, 17], ["G0630002", "Tenon K 0,9  L27 JNT-XRO", 226571, 23], ["G0630003", "Tenon K 1,1  L27 JNT-XRO", 43296, 15], ["G0630004", "Tenon K 0,7  L27 JNT-XRO", 129936, 23], ["G1120000", "FIBER POST # 0 JNT XRO", 45000, 9], ["G1120001", "FIBER POST # 1 JNT XRO", 180000, 19], ["G1120002", "FIBER POST # 2 JNT XRO", 150000, 15], ["G1120003", "FIBER POST # 3 JNT XRO", 35000, 9], ["G1120004", "FIBER POST # 4 JNT XRO", 15500, 8], ["G1500004", "Tenon K135 JNT XRO", 64270, 16], ["G1500005", "tenon K145 JNT XRO", 75029, 19], ["G1500006", "Tenon K155 JNT XRO", 6953, 6], ["G1820001", "TENON K-101 JNT-XRO", 8000, 8], ["G1820002", "TENON K-102 JNT-XRO", 1397, 2], ["G1820003", "TENON K-104 JNT-XRO", 16386, 7], ["G1820004", "TENON K-105 JNT-XRO", 2000, 3], ["G1820005", "TENON K-107 JNT-XRO", 14268, 5], ["G1820006", "TENON K-108 JNT-XRO", 3046, 3], ["G1820007", "TENON K-110 JNT-XRO", 4000, 4], ["G1820008", "TENON K-111 JNT-XRO", 1000, 1], ["H15000002", "FIBERMASTER BIG STARTER PACK", 600, 4], ["H15000300", "FIBERMASTER SMALL", 50, 1], ["H15000301", "FIBERMASTER SMALL", 200, 4], ["H15000302", "FIBERMASTER SMALL", 50, 1], ["H1510310B", "10 FIBERMASTER POST #0", 100, 1], ["H1510311B", "10 FIBERMASTER POST #1", 400, 4], ["H1510312B", "10 FIBERMASTER POST #2", 100, 1], ["H1520110", "1 FIBERMASTER UNIVERSAL DRILL", 400, 6], ["H1520111", "1 FIBERMASTER FINISHING DRILL1", 200, 4], ["H1520112", "1 FIBERMASTER FINISHING DRILL2", 200, 4], ["REG46XXXX00-201601", "REGLETTE MACRO-LOCK OVAL", 100, 1]];

// Données par défaut converties en objets {ref, libelle, qte, nb}. Remplacées par
// consoImported si l'utilisateur importe un export COMMANDELIST plus récent.
const CONSO_DEFAULT = CONSO_DEFAULT_RAW.map(([ref, libelle, qte, nb]) => ({ref, libelle, qte, nb}));

let consoImported = null;           // null = utilise CONSO_DEFAULT
let consoImportedPeriodDays = null; // idem, en jours
let consoImportedAsOf = null;       // date de référence ("aujourd'hui") utilisée au moment de l'import

function consoGetActive() {
  return {
    items: consoImported || CONSO_DEFAULT,
    periodDays: consoImportedPeriodDays || CONSO_PERIOD_DAYS_DEFAULT,
  };
}

// code_client = la référence FG (ex: "4590312B", "E1020002"), PAS codart_wip.
function consoGetEntry(code_client) {
  if (!code_client) return null;
  const { items } = consoGetActive();
  return items.find(x => x.ref === code_client) || null;
}

// Moyenne mensuelle de VENTES (livraisons réelles), sur la fenêtre de 2 ans
// glissants (recalculée à chaque import par rapport à la date du jour à ce
// moment-là — voir consoImportFile).
function consoGetMoyenneMensuelle(code_client) {
  const entry = consoGetEntry(code_client);
  if (!entry) return null;
  const { periodDays } = consoGetActive();
  const moisPeriode = periodDays / 30.4375;
  return moisPeriode > 0 ? entry.qte / moisPeriode : null;
}

// Couverture en mois = stock FG actuel (déjà calculé par l'appelant, TOUS niveaux
// confondus via pdpGetTotalFGForRef — pas juste le stock du tenon brut) ÷ rythme
// de vente moyen mensuel. Retourne null si aucune vente connue sur la référence
// (pas de donnée fiable → on affiche "—", pas un chiffre inventé).
function consoGetCouvertureMois(code_client, stockActuel) {
  const moyenne = consoGetMoyenneMensuelle(code_client);
  if (!moyenne || moyenne <= 0) return null;
  return (stockActuel || 0) / moyenne;
}

function consoFmtMois(mois) {
  if (mois === null || mois === undefined) return '—';
  if (mois >= 10) return Math.round(mois) + ' mois';
  return mois.toFixed(1) + ' mois';
}

// Style cohérent (couleur/fond) réutilisé partout : tuiles PDP, onglet dédié,
// onglet Besoins. Seuils : <1 mois = critique, <3 mois = à surveiller, sinon
// couvert. Pas de vente connue = neutre (gris).
function consoCouvertureStyle(mois) {
  if (mois === null || mois === undefined) return {bg:'var(--bg)', text:'var(--text-faint)', dot:'var(--text-faint)'};
  if (mois < 1)  return {bg:'#FCEBEB', text:'#A32D2D', dot:'#A32D2D'};
  if (mois < 3)  return {bg:'#FEF5E7', text:'#633806', dot:'#D4880A'};
  return {bg:'#EAF3DE', text:'#27500A', dot:'#1D9E75'};
}

// ── Import d'un export COMMANDELIST plus récent (remplace CONSO_DEFAULT) ───────
// Filtre sur les 2 dernières années glissantes par rapport à AUJOURD'HUI au moment
// de l'import (pas une date figée) — colonnes attendues : REF_RTD, QTE_LIVREE,
// DATE_BL, LIBELL (mêmes noms que l'export ERP "COMMANDELIST").
function consoImportFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (typeof showToast === 'function') showToast('Chargement ' + file.name + '…');

  const reader = new FileReader();
  reader.onload = (e) => {
    const doImport = () => {
      try {
        const wb = XLSX.read(e.target.result, {type:'array', cellDates:true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, {defval:''});

        const today = new Date(); today.setHours(0,0,0,0);
        const cutoff = new Date(today.getTime() - 730*86400000); // 2 ans glissants

        const agg = {};
        let nbLignesRetenues = 0;
        json.forEach(r => {
          let d = r.DATE_BL;
          if (d && !(d instanceof Date)) d = new Date(d);
          if (!(d instanceof Date) || isNaN(d) || d < cutoff || d > today) return;
          const ref = String(r.REF_RTD||'').trim();
          const qte = Number(r.QTE_LIVREE)||0;
          if (!ref || qte <= 0) return;
          const libelle = String(r.LIBELL||'').trim();
          if (!agg[ref]) agg[ref] = {ref, libelle, qte:0, nb:0};
          agg[ref].qte += qte;
          agg[ref].nb += 1;
          nbLignesRetenues++;
        });

        const nbRefs = Object.keys(agg).length;
        if (!nbRefs) { if (typeof showToast === 'function') showToast('Aucune ligne REF_RTD/QTE_LIVREE/DATE_BL reconnue sur les 2 dernières années dans ce fichier.'); return; }

        consoImported = Object.values(agg);
        consoImportedPeriodDays = 730;
        consoImportedAsOf = today.toISOString().slice(0,10);

        if (typeof showToast === 'function') showToast(`Ventes importées : ${nbRefs} références, ${nbLignesRetenues} livraisons (2 ans glissants jusqu'au ${consoImportedAsOf})`);

        if (typeof render === 'function') render();
        if (typeof currentView !== 'undefined' && currentView === 'conso' && typeof renderConsoPage === 'function') renderConsoPage();
        if (typeof scheduleSave === 'function') scheduleSave();
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Erreur import ventes : ' + err.message);
      }
    };
    if (typeof loadXLSXForPdp === 'function') loadXLSXForPdp(doImport);
    else if (typeof XLSX !== 'undefined') doImport();
    else console.error('XLSX non disponible et loadXLSXForPdp introuvable');
  };
  reader.readAsArrayBuffer(file);
}

// ── Onglet dédié : tableau de toutes les références FG avec ventes/couverture ──
let consoSortField = 'couverture'; // couverture croissante par défaut = risques de rupture en premier
let consoSearchFilter = '';
let consoSelectedClient = null;
let consoSelectedFamille = null; // niveau intermédiaire, uniquement pour RTD (Macro Ill XRO, Matchpost...)

function consoSelectClient(client) {
  consoSelectedClient = client;
  consoSelectedFamille = null;
  consoSearchFilter = '';
  renderConsoPage();
}

// Sélectionne directement une famille RTD depuis la vue d'ensemble (équivalent,
// pour la couverture de stock, de "client final" côté Commandes — mais ici c'est
// la famille de produits RTD qui a du sens, pas qui achète, puisqu'une même
// référence peut être commandée par plusieurs clients finaux différents).
function consoSelectFamille(famille) {
  consoSelectedClient = 'RTD';
  consoSelectedFamille = famille;
  consoSearchFilter = '';
  renderConsoPage();
}

function consoSort(field) {
  consoSortField = (consoSortField === field) ? field + '_desc' : field;
  renderConsoPage();
}

let _consoSearchTimer = null;
function consoSearch(val) {
  consoSearchFilter = val;
  clearTimeout(_consoSearchTimer);
  _consoSearchTimer = setTimeout(() => {
    renderConsoPage();
    const inp = document.getElementById('conso-search');
    if (inp) { inp.focus(); inp.value = val; }
  }, 200);
}

function renderConsoPage() {
  const el = document.getElementById('view-conso');
  if (!el) return;

  const corrs = (typeof pdpGetActiveCorrespondances === 'function') ? pdpGetActiveCorrespondances() : [];
  const { periodDays } = consoGetActive();
  const moisPeriode = periodDays / 30.4375;

  // Calcul commun (vue d'ensemble ET vue détail en ont besoin)
  let allRows = corrs.map(r => {
    const stock = (typeof pdpGetTotalFGForRef === 'function') ? pdpGetTotalFGForRef(r.codart_wip, r.code_client) : 0;
    const entry = consoGetEntry(r.code_client);
    const moyenne = consoGetMoyenneMensuelle(r.code_client);
    const couverture = consoGetCouvertureMois(r.code_client, stock);
    return { r, entry, stock, moyenne, qteTotale: entry ? entry.qte : null, couverture };
  });

  const COL_DEFAULT = {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
  const CLIENT_COLORS = (typeof PDP_CLIENT_COLORS !== 'undefined') ? PDP_CLIENT_COLORS : {};

  let mainContent = '';
  let headerExtra = '';

  if (!consoSelectedClient) {
    // ── Vue d'ensemble : clients OEM d'abord, puis toutes les familles RTD
    // affichées directement (au lieu d'une seule carte "RTD" agrégée) — l'axe
    // pertinent ici est la famille de produits (Macro Ill XRO, Matchpost...),
    // pas le client final, car une même référence peut être vendue à plusieurs
    // clients finaux différents : la couverture de stock se raisonne par
    // référence/famille, pas par acheteur.
    const byClient = {};
    allRows.forEach(x => {
      const cl = x.r.client;
      (byClient[cl] = byClient[cl] || []).push(x);
    });
    const clients = Object.keys(byClient).sort();
    const oemClients = clients.filter(cl => cl !== 'RTD');
    const FAM_COLORS = (typeof RTD_FAM_COLORS !== 'undefined') ? RTD_FAM_COLORS : {};

    const sectionHeader = (label, count) =>
      '<div style="display:flex;align-items:center;gap:10px;margin:22px 0 12px 0">'
      + '<span style="font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--text-faint);text-transform:uppercase">'+label+'</span>'
      + (count!==undefined ? '<span style="font-size:10px;font-weight:700;background:var(--bg);color:var(--text-faint);padding:1px 7px;border-radius:20px;border:1px solid var(--border)">'+count+'</span>' : '')
      + '<span style="flex:1;height:1px;background:var(--border)"></span>'
      + '</div>';

    const renderClientCard = (cl, groupRows, col, onclickAttr) => {
      const nbCritique = groupRows.filter(x => x.couverture !== null && x.couverture < 1).length;
      const nbSurveiller = groupRows.filter(x => x.couverture !== null && x.couverture >= 1 && x.couverture < 3).length;
      return '<div '+onclickAttr+' style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid '+col.dot+';border-radius:var(--radius);padding:14px;cursor:pointer;transition:all .15s"'
        +' onmouseenter="this.style.background=\''+col.bg+'\'" onmouseleave="this.style.background=\'var(--surface)\'">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
        +'<span style="font-size:14px;font-weight:700;color:'+col.text+';flex:1">'+cl+'</span>'
        +'<span style="font-size:10px;font-weight:700;background:'+col.dot+';color:#fff;padding:2px 8px;border-radius:20px">'+groupRows.length+'</span>'
        +'</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
        +(nbCritique?'<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:#FCEBEB;color:#A32D2D">'+nbCritique+' &lt; 1 mois</span>':'')
        +(nbSurveiller?'<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:#FEF5E7;color:#633806">'+nbSurveiller+' &lt; 3 mois</span>':'')
        +(!nbCritique&&!nbSurveiller?'<span style="font-size:10px;color:var(--text-faint)">Couvert</span>':'')
        +'</div></div>';
    };

    if (oemClients.length) {
      mainContent += sectionHeader('Clients OEM', oemClients.length);
      mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">';
      oemClients.forEach(cl => {
        const col = CLIENT_COLORS[cl] || COL_DEFAULT;
        mainContent += renderClientCard(cl, byClient[cl], col, 'onclick="consoSelectClient(\''+cl+'\')"');
      });
      mainContent += '</div>';
    }

    if (byClient['RTD']) {
      const byFamille = {};
      byClient['RTD'].forEach(x => {
        const fam = x.r.famille || 'Autre';
        (byFamille[fam] = byFamille[fam] || []).push(x);
      });
      const familles = Object.keys(byFamille).sort();
      mainContent += sectionHeader('RTD — par famille', familles.length);
      mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">';
      familles.forEach(fam => {
        const col = FAM_COLORS[fam] || COL_DEFAULT;
        mainContent += renderClientCard(fam, byFamille[fam], col, 'onclick="consoSelectFamille(\''+fam.replace(/'/g,"\\'")+'\')"');
      });
      mainContent += '</div>';
    }

  } else {
    // ── Vue détail : références du client (ou de la famille RTD) sélectionné(e)
    const FAM_COLORS = (typeof RTD_FAM_COLORS !== 'undefined') ? RTD_FAM_COLORS : {};
    const col = consoSelectedFamille ? (FAM_COLORS[consoSelectedFamille] || COL_DEFAULT)
      : (CLIENT_COLORS[consoSelectedClient] || COL_DEFAULT);
    let rows = allRows.filter(x => x.r.client === consoSelectedClient
      && (!consoSelectedFamille || x.r.famille === consoSelectedFamille));

    const search = consoSearchFilter.toLowerCase();
    if (search) {
      rows = rows.filter(x =>
        x.r.libelle_fg.toLowerCase().includes(search) ||
        x.r.codart_wip.toLowerCase().includes(search)
      );
    }

    const desc = consoSortField.endsWith('_desc');
    const field = desc ? consoSortField.slice(0,-5) : consoSortField;
    const nullsLast = (v) => v === null || v === undefined;
    rows.sort((a,b) => {
      let va, vb;
      if (field === 'couverture') { va=a.couverture; vb=b.couverture; }
      else if (field === 'stock') { va=a.stock; vb=b.stock; }
      else if (field === 'conso') { va=a.qteTotale; vb=b.qteTotale; }
      else if (field === 'produit') { va=a.r.libelle_fg.toLowerCase(); vb=b.r.libelle_fg.toLowerCase(); }
      else { va=a.couverture; vb=b.couverture; }
      if (nullsLast(va) && nullsLast(vb)) return 0;
      if (nullsLast(va)) return 1;
      if (nullsLast(vb)) return -1;
      if (typeof va === 'string') return desc ? vb.localeCompare(va) : va.localeCompare(vb);
      return desc ? vb - va : va - vb;
    });

    const sortIcon = (f) => consoSortField === f ? '<i class="ti ti-chevron-down" style="font-size:11px"></i>'
      : consoSortField === f+'_desc' ? '<i class="ti ti-chevron-up" style="font-size:11px"></i>' : '';

    headerExtra = '<input id="conso-search" placeholder="Filtrer une référence…" value="'+consoSearchFilter+'" oninput="consoSearch(this.value)" style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none;width:220px">';

    mainContent += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'
      + '<table class="cat-table" style="width:100%">'
      + '<thead><tr>'
      + '<th style="cursor:pointer" onclick="consoSort(\'produit\')">Référence '+sortIcon('produit')+'</th>'
      + '<th style="text-align:right;cursor:pointer" onclick="consoSort(\'stock\')">Stock FG '+sortIcon('stock')+'</th>'
      + '<th style="text-align:right;cursor:pointer" onclick="consoSort(\'conso\')">Vendu '+moisPeriode.toFixed(0)+' mois '+sortIcon('conso')+'</th>'
      + '<th style="text-align:right">Moyenne/mois</th>'
      + '<th style="text-align:right;cursor:pointer" onclick="consoSort(\'couverture\')">Couverture '+sortIcon('couverture')+'</th>'
      + '</tr></thead><tbody>';

    if (rows.length) {
      rows.forEach(x => {
        const style = consoCouvertureStyle(x.couverture);
        mainContent += `<tr style="cursor:pointer" onclick="if(typeof pdpShowDetail==='function')pdpShowDetail('${x.r.code_client}')"
          onmouseenter="this.style.background='var(--accent-light)'" onmouseleave="this.style.background=''">
          <td><div style="font-size:13px;font-weight:600">${x.r.libelle_fg}</div><div style="font-size:10px;color:var(--text-faint);font-family:monospace">${x.r.code_client}</div></td>
          <td style="text-align:right;font-size:13px;font-weight:600">${x.stock.toLocaleString('fr')}</td>
          <td style="text-align:right;font-size:12px">${x.qteTotale!==null ? x.qteTotale.toLocaleString('fr') : '—'}</td>
          <td style="text-align:right;font-size:12px;color:var(--text-muted)">${x.moyenne!==null ? Math.round(x.moyenne).toLocaleString('fr') : '—'}</td>
          <td style="text-align:right"><span style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background:${style.bg};color:${style.text}">${consoFmtMois(x.couverture)}</span></td>
        </tr>`;
      });
    } else {
      mainContent += '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-faint)">Aucune référence</td></tr>';
    }
    mainContent += '</tbody></table></div>';
  }

  const nbCritiqueGlobal = allRows.filter(x => x.couverture !== null && x.couverture < 1).length;
  const nbSurveillerGlobal = allRows.filter(x => x.couverture !== null && x.couverture >= 1 && x.couverture < 3).length;

  let html = '<div style="flex:1;overflow-y:auto;padding:0;display:flex;flex-direction:column">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<h2 style="font-size:17px;font-weight:600"><i class="ti ti-trending-up" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Ventes &amp; couverture</h2>'
    + (consoSelectedClient ? '<button class="btn" onclick="consoSelectClient(null)" style="font-size:11px;padding:4px 10px"><i class="ti ti-arrow-left"></i> Tous les clients</button>' : '')
    + (consoSelectedClient ? '<span style="font-size:13px;font-weight:700;color:'+((typeof RTD_FAM_COLORS!=='undefined'&&consoSelectedFamille&&RTD_FAM_COLORS[consoSelectedFamille])?RTD_FAM_COLORS[consoSelectedFamille].text:((typeof PDP_CLIENT_COLORS!=='undefined'&&PDP_CLIENT_COLORS[consoSelectedClient])?PDP_CLIENT_COLORS[consoSelectedClient].text:'var(--accent)'))+'">'+(consoSelectedFamille || consoSelectedClient)+'</span>' : '')
    + headerExtra
    + '<div style="display:flex;gap:8px;margin-left:auto;flex-wrap:wrap;align-items:center">'
    + (nbCritiqueGlobal ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FCEBEB;color:#A32D2D"><i class="ti ti-alert-circle" style="vertical-align:-2px;margin-right:4px"></i>${nbCritiqueGlobal} &lt; 1 mois</span>` : '')
    + (nbSurveillerGlobal ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FEF5E7;color:#633806"><i class="ti ti-clock" style="vertical-align:-2px;margin-right:4px"></i>${nbSurveillerGlobal} &lt; 3 mois</span>` : '')
    + `<span style="font-size:11px;color:var(--text-faint)">Ventes sur ${moisPeriode.toFixed(1)} mois glissants${consoImported?(' (import personnalisé, jusqu\'au '+consoImportedAsOf+')'):' (par défaut, jusqu\'au 2026-07-08)'}</span>`
    + '<label class="btn" style="font-size:11px;padding:5px 12px;cursor:pointer"><i class="ti ti-upload"></i> Importer COMMANDELIST<input type="file" accept=".xlsx,.xls" style="display:none" onchange="consoImportFile(this)"></label>'
    + '</div></div>';

  html += '<div style="flex:1;overflow-y:auto;padding:16px 20px">' + mainContent + '</div></div>';
  el.innerHTML = html;
}
