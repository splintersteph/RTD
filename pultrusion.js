// ═══════════════════════════════════════════════════════════
// pultrusion.js — Planning & stock de pultrusion (joncs bruts)
// Dépend de : showToast, render, currentView (index.html)
//
// C'est la toute première étape de fabrication, en amont des tenons bruts :
// des fibres + résine sont pultrudées en joncs continus, stockés en "lots"
// (une longueur fixe de jonc, ex: 450 ou 900 ml selon la référence), qui sont
// ensuite débités en tenons. Données intégrées par défaut extraites du fichier
// "Planning_de_pultrusion.xlsm" fourni par Stéphane (feuilles "Planning
// Pultrusion" + "CALCUL MOY").
//
// IMPORTANT : le planning hebdomadaire pré-rempli du fichier source (jusqu'à
// ~4,7 ans, colonnes "SEM 30" à "SEM 31") n'a PAS été importé — la
// correspondance exacte entre un numéro "SEM XX" et une vraie semaine
// calendaire n'a pas pu être établie avec certitude, et se tromper aurait
// affiché de mauvaises quantités sur de mauvaises semaines. Le planning
// ci-dessous démarre donc vide, sur les semaines réelles à partir
// d'aujourd'hui — à remplir au fur et à mesure.
// ═══════════════════════════════════════════════════════════


// Table de conversion tenon -> jonc de pultrusion, pour le futur calcul de
// consommation à partir d'un forecast (produit fini -> tenons -> mètres de
// jonc). Construite à partir du fichier "Listing_Pièces.xlsx" fourni par
// Stéphane, croisé avec PDP_CORRESPONDANCES (pdp.js) — seules les 53 lignes
// dont la correspondance vers un codart_wip connu est sans ambiguïté ont été
// retenues (78 autres restent à confirmer ou à compléter, voir échange du
// 13/07/2026). matiere = code jonc pultrusion, tenonsParMl = facteur de
// conversion direct.
const TENON_TO_JONC = [{"codart_wip": "TENON_W0_JTO", "matiere": "JTO3_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "TENON_W1_JTO", "matiere": "JTO3_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "TENON_W2_JTO", "matiere": "JTO3_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "TENON_W3_JTO", "matiere": "JTO3_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "TENON_W40_JTO_XRO3%", "matiere": "JTO_XRO_3%", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "TENON_W41_JTO_XRO3%", "matiere": "JTO_XRO_3%", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "TENON_W42_JTO_XRO3%", "matiere": "JTO_XRO_3%", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "TENON_W43_JTO_XRO3%", "matiere": "JTO_XRO_3%", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "K_300_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": 56, "diametre": null}, {"codart_wip": "K_1.2_ROD_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "K05_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "K09_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "K11L27_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "K07_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "TENON_K05_L27_C_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 31, "diametre": null}, {"codart_wip": "K09_L27_JNTXRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 31, "diametre": null}, {"codart_wip": "K11L27_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 31, "diametre": null}, {"codart_wip": "K07L27_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 31, "diametre": null}, {"codart_wip": "K_135_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "K_145_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "K_155_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "K_101_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 65, "diametre": null}, {"codart_wip": "K_104_JNT_XRO_IND_C", "matiere": "JNT_XRO_2.5", "tenonsParMl": 61, "diametre": null}, {"codart_wip": "K_105_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": 50, "diametre": null}, {"codart_wip": "K_107_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 61, "diametre": null}, {"codart_wip": "K_108_JNT_XRO_INDC", "matiere": "JNT_XRO_2.5", "tenonsParMl": 50, "diametre": null}, {"codart_wip": "K_110_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": 61, "diametre": null}, {"codart_wip": "K_111_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 50, "diametre": null}, {"codart_wip": "RS_1275_ROSE", "matiere": "JTO_ROUGE_2.5", "tenonsParMl": 98, "diametre": null}, {"codart_wip": "RS_1208_ROSE", "matiere": "JTO_ROUGE_2.5", "tenonsParMl": 88, "diametre": null}, {"codart_wip": "RS_1209_ROSE", "matiere": "JTO_ROUGE_2.5", "tenonsParMl": 80, "diametre": null}, {"codart_wip": "RS_1210_ROSE", "matiere": "JTO_ROUGE_2.5", "tenonsParMl": 73, "diametre": null}, {"codart_wip": "RS_1495_BLEU", "matiere": "JTO_BLEU_2.5", "tenonsParMl": 80, "diametre": null}, {"codart_wip": "RS_1410_BLEU", "matiere": "JTO_BLEU_2.5", "tenonsParMl": 73, "diametre": null}, {"codart_wip": "RS_1411_BLEU", "matiere": "JTO_BLEU_2.5", "tenonsParMl": 68, "diametre": null}, {"codart_wip": "RS_1412_BLEU", "matiere": "JTO_BLEU_2.5", "tenonsParMl": 63, "diametre": null}, {"codart_wip": "RS_1610_JAUNE", "matiere": "JTO_JAUNE_2.5", "tenonsParMl": 73, "diametre": null}, {"codart_wip": "RS_1611_JAUNE", "matiere": "JTO_JAUNE_2.5", "tenonsParMl": 68, "diametre": null}, {"codart_wip": "RS_1612_JAUNE", "matiere": "JTO_JAUNE_2.5", "tenonsParMl": 63, "diametre": null}, {"codart_wip": "RS_1613_JAUNE", "matiere": "JTO_JAUNE_2.5", "tenonsParMl": 59, "diametre": null}, {"codart_wip": "S1_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S2_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S3_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S4_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S5_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S6_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S1_JTO", "matiere": "JTO_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S2_JTO", "matiere": "JTO_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S3_JTO", "matiere": "JTO_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S4_JTO", "matiere": "JTO_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S5_JTO", "matiere": "JTO_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "S6_JTO", "matiere": "JTO_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "TENON_N0_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "TENON_N1_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "TENON_N2_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "TENON_N3_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "TENON_N4_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "L01_JTR", "matiere": "JTR_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "L02_JTR", "matiere": "JTR_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "L03_JTR", "matiere": "JTR_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "AI1_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "AI2_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "AI3_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "AI4_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "AE1_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_JAUNE", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE1_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_JAUNE", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE2_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_ROUGE", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE2_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_ROUGE", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE3_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_BLEU", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE3_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_BLEU", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE4_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_VERT", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE4_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_VERT", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE5_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_NOIR", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE5_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_NOIR", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE6_ILLUSION_X-RO", "matiere": "JTO_XRO", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE6_ILLUSION_X-RO", "matiere": "JTO_XRO", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE1_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE2_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE3_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE3_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE4_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "AE4_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "ML_OVALE_1", "matiere": "JTO_ILLXRO_JAUNEØ3.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "ML_OVALE_2", "matiere": "JTO_ILLXRO_ROUGEØ3.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "ML_OVALE_3", "matiere": "JTO_ILLXRO_BLEU_Ø3.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "ML_OVALE_4", "matiere": "JTO_ILLXRO_VERT_Ø3.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "AD1_JTR", "matiere": "JTR_2.5", "tenonsParMl": 57, "diametre": null}, {"codart_wip": "AD2_JTR", "matiere": "JTR_2.5", "tenonsParMl": 50, "diametre": null}, {"codart_wip": "AD3_JTR", "matiere": "JTR_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "AD4_JTR", "matiere": "JTR_2.5", "tenonsParMl": 41, "diametre": null}, {"codart_wip": "80.04SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 43, "diametre": null}, {"codart_wip": "90.06SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 43, "diametre": null}, {"codart_wip": "100.08SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 43, "diametre": null}, {"codart_wip": "120.10SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 43, "diametre": null}, {"codart_wip": "80.04_ILLU_XRO_NOIR", "matiere": "JTO_ILLUSI_XRO_NOIR", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "80.04_ILLU_XRO_NOIR", "matiere": "JTO_ILLUSI_XRO_NOIR", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "90.06_ILLU_XRO_ROUGE", "matiere": "JTO_ILLUSI_XRO_ROUGE", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "90.06_ILLU_XRO_ROUGE", "matiere": "JTO_ILLUSI_XRO_ROUGE", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "100.08_ILLU_XRO_JAUN", "matiere": "JTO_ILLUSI_XRO_JAUNE", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "100.08_ILLU_XRO_JAUN", "matiere": "JTO_ILLUSI_XRO_JAUNE", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "120.10_ILLU_XRO_BLEU", "matiere": "JTO_ILLUSI_XRO_BLEU", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "120.10_ILLU_XRO_BLEU", "matiere": "JTO_ILLUSI_XRO_BLEU", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "90SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 44, "diametre": null}, {"codart_wip": "100SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 44, "diametre": null}, {"codart_wip": "120SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 44, "diametre": null}, {"codart_wip": "80.04SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "90.06AG_JTR", "matiere": "JTR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "100.08AG_JTR", "matiere": "JTR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "120.10AG_JTR", "matiere": "JTR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "PF_0.8__22MM_JAR", "matiere": "JAR_2.5", "tenonsParMl": 38, "diametre": null}, {"codart_wip": "PF_1.0__22MM_JAR", "matiere": "JAR_2.5", "tenonsParMl": 38, "diametre": null}, {"codart_wip": "PF_1.2_JAR", "matiere": "JAR_2.5", "tenonsParMl": 38, "diametre": null}, {"codart_wip": "PF_1.4_JAR", "matiere": "JAR_2.5", "tenonsParMl": 38, "diametre": null}, {"codart_wip": "PF_1.6_JAR", "matiere": "JAR_2.5", "tenonsParMl": 38, "diametre": null}, {"codart_wip": "16_JAR", "matiere": "JAR_2.5", "tenonsParMl": 53, "diametre": null}, {"codart_wip": "17_JAR", "matiere": "JAR_2.5", "tenonsParMl": 50, "diametre": null}, {"codart_wip": "18_JAR", "matiere": "JAR_2.5", "tenonsParMl": 48, "diametre": null}, {"codart_wip": "19_JAR", "matiere": "JAR_2.5", "tenonsParMl": 46, "diametre": null}, {"codart_wip": "AH1", "matiere": "JAR_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "AH2", "matiere": "JAR_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "AH3", "matiere": "JAR_2.5", "tenonsParMl": 42, "diametre": null}, {"codart_wip": "AH4", "matiere": "JAR_2.5", "tenonsParMl": 42, "diametre": null}];

const PULTRUSION_REFS_DEFAULT = [{"client": "3M", "code": "JTO3_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 35.12, "stockMezzMl": 15804, "stockRtdLots": 5.51, "stockRtdMl": 2478, "lotsAttente": 3, "lotsQuarantaine": 0, "limiteBasse": 11.14, "limiteHaute": 267.38, "mlParLot": 450, "consoLotsMois": 9.536, "historiqueMl": {"2021": 46331, "2022": 65100, "2023": 51572, "2024": 43269, "2025": 51207}}, {"client": "Maillefer", "code": "JTO_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 2.27, "stockMezzMl": 2043, "stockRtdLots": 4.42, "stockRtdMl": 3982, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.42, "limiteHaute": 10.16, "mlParLot": 900, "consoLotsMois": 0.439, "historiqueMl": {"2021": 6972, "2022": 5252, "2023": 4271, "2024": 3978, "2025": 3240}}, {"client": "DT / MATCHPOST", "code": "JTR_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M300", "stockMezzLots": 6.23, "stockMezzMl": 5610, "stockRtdLots": 1.24, "stockRtdMl": 1113, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 1.75, "limiteHaute": 41.91, "mlParLot": 900, "consoLotsMois": 1.813, "historiqueMl": {"2021": 18280, "2022": 19991, "2023": 17349, "2024": 17956, "2025": 24349}}, {"client": "GC", "code": "JAR_2.5", "fibre": "AR600TEX", "rowing": "", "resine": "BIS GMA SR239", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0, "stockRtdMl": 0, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": null, "limiteHaute": null, "mlParLot": 900, "consoLotsMois": 1.785, "historiqueMl": {"2021": 18519, "2022": 23741, "2023": 18399, "2024": 19288, "2025": 16447}}, {"client": "Tokuyamma/shofu", "code": "JAR_2.5", "fibre": "AR600TEX", "rowing": "", "resine": "BIS GMA SR239", "stockMezzLots": 7.19, "stockMezzMl": 6468, "stockRtdLots": 1.71, "stockRtdMl": 1539, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 2.52, "limiteHaute": 60.6, "mlParLot": 900, "consoLotsMois": 1.785, "historiqueMl": {"2021": 18519, "2022": 23741, "2023": 18399, "2024": 19288, "2025": 16447}}, {"client": "3M", "code": "JTO_XRO_3%", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 7.08, "stockMezzMl": 3186, "stockRtdLots": 1.85, "stockRtdMl": 834, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 2.35, "limiteHaute": 56.37, "mlParLot": 450, "consoLotsMois": 1.723, "historiqueMl": {"2021": 8969, "2022": 6394, "2023": 8234, "2024": 9274, "2025": 13649}}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_ROUGEØ3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.05, "stockMezzMl": 942, "stockRtdLots": 0.24, "stockRtdMl": 219, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.08, "limiteHaute": 1.95, "mlParLot": 500, "consoLotsMois": 0.042, "historiqueMl": {"2021": 345, "2022": 345, "2023": 225, "2024": 48, "2025": 296}}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_BLEU_Ø3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.13, "stockMezzMl": 1020, "stockRtdLots": 0.49, "stockRtdMl": 441, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.47, "mlParLot": 500, "consoLotsMois": 0.035, "historiqueMl": {"2021": 267, "2022": 0, "2023": 144, "2024": 495, "2025": 133}}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_JAUNEØ3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.1, "stockMezzMl": 990, "stockRtdLots": 0.33, "stockRtdMl": 300, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.05, "limiteHaute": 1.16, "mlParLot": 500, "consoLotsMois": 0.024, "historiqueMl": {"2021": 124, "2022": 136, "2023": 180, "2024": 51, "2025": 216}}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_VERT_Ø3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 0.61, "stockMezzMl": 549, "stockRtdLots": 0.32, "stockRtdMl": 285, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.36, "mlParLot": 500, "consoLotsMois": 0.042, "historiqueMl": {"2021": 0, "2022": 0, "2023": 0, "2024": 1107, "2025": 139}}, {"client": "Macrolock", "code": "JTO_XRO", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.0, "stockMezzMl": 903, "stockRtdLots": 0.93, "stockRtdMl": 836, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.01, "limiteHaute": 0.14, "mlParLot": 900, "consoLotsMois": 0.156, "historiqueMl": {"2021": 810, "2022": 132, "2023": 0, "2024": 1098, "2025": 6399}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_ROUGE", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.16, "stockMezzMl": 1044, "stockRtdLots": 0.51, "stockRtdMl": 456, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.69, "limiteHaute": 16.62, "mlParLot": 900, "consoLotsMois": 0.754, "historiqueMl": {"2021": 9908, "2022": 9334, "2023": 7310, "2024": 7533, "2025": 6615}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_NOIR", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.3, "stockRtdMl": 266, "lotsAttente": 2, "lotsQuarantaine": 0, "limiteBasse": 0.25, "limiteHaute": 6.04, "mlParLot": 900, "consoLotsMois": 0.271, "historiqueMl": {"2021": 3720, "2022": 2595, "2023": 2883, "2024": 2904, "2025": 2538}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_JAUNE", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.8, "stockMezzMl": 1623, "stockRtdLots": 0.38, "stockRtdMl": 339, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.6, "limiteHaute": 14.45, "mlParLot": 900, "consoLotsMois": 0.528, "historiqueMl": {"2021": 8272, "2022": 6828, "2023": 3929, "2024": 4511, "2025": 4981}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_BLEU", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.83, "stockRtdMl": 747, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.34, "limiteHaute": 8.13, "mlParLot": 900, "consoLotsMois": 0.327, "historiqueMl": {"2021": 4231, "2022": 5910, "2023": 2028, "2024": 2181, "2025": 3309}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_VERT", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.55, "stockRtdMl": 1394, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.1, "limiteHaute": 2.35, "mlParLot": 900, "consoLotsMois": 0.097, "historiqueMl": {"2021": 1392, "2022": 2548, "2023": 288, "2024": 432, "2025": 580}}, {"client": "Komet / ULTRADENT", "code": "JNT_XRO_2.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 2.04, "stockMezzMl": 1020, "stockRtdLots": 1.39, "stockRtdMl": 693, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 1.81, "limiteHaute": 43.43, "mlParLot": 500, "consoLotsMois": 1.682, "historiqueMl": {"2021": 13152, "2022": 8599, "2023": 10502, "2024": 9328, "2025": 8874}}, {"client": "Komet", "code": "JNT_XRO_3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.08, "stockRtdMl": 324, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.5, "limiteHaute": 11.89, "mlParLot": 300, "consoLotsMois": 0.463, "historiqueMl": {"2021": 2206, "2022": 1383, "2023": 2225, "2024": 1547, "2025": 967}}, {"client": "Apol", "code": "JTO_ROUGE_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0.4, "stockMezzMl": 360, "stockRtdLots": 0.3, "stockRtdMl": 272, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.03, "limiteHaute": 0.62, "mlParLot": 900, "consoLotsMois": 0.036, "historiqueMl": {"2021": 638, "2022": 288, "2023": 324, "2024": 141, "2025": 576}}, {"client": "Apol", "code": "JTO_BLEU_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.81, "stockRtdMl": 731, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.05, "limiteHaute": 1.31, "mlParLot": 900, "consoLotsMois": 0.036, "historiqueMl": {"2021": 680, "2022": 292, "2023": 349, "2024": 240, "2025": 378}}, {"client": "Apol", "code": "JTO_JAUNE_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.34, "stockRtdMl": 1205, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.49, "mlParLot": 900, "consoLotsMois": 0.02, "historiqueMl": {"2021": 340, "2022": 127, "2023": 329, "2024": 120, "2025": 162}}, {"client": "Maillefer", "code": "JTO_2.5_BLANC", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.62, "stockRtdMl": 558, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.33, "limiteHaute": 7.97, "mlParLot": 900, "consoLotsMois": 0.339, "historiqueMl": {"2021": 4977, "2022": 3149, "2023": 4811, "2024": 3717, "2025": 1656}}];


// ── Forecast (import Solventum/3M "Vendor Procurement - Delv Date") ─────────
// Données intégrées par défaut : forecast mensuel par référence FG (Material),
// extrait de la ligne "totale" du fichier (sans n° de pièce fournisseur), sur
// l'horizon Jul-2026 -> Jun-2027. Le calcul de consommation de jonc n'utilise
// QUE les mois où aucune commande réelle n'existe déjà pour cette référence
// (voir pultForecastCutoffMonth) — pour ne jamais compter en double une
// commande déjà connue ET le forecast qui la couvrait.
const FORECAST_DEFAULT = {"year": 2026, "data": {"1410050": {"1": 11.45, "2": 17.28, "3": 20.28, "4": 17.28, "5": 15.62, "6": 23.12, "7": 18.62, "8": 11.25, "9": 11.45, "10": 17.28, "11": 18.95, "12": 18.42}, "1410110": {"1": 11.0, "2": 14.83, "3": 19.17, "4": 14.83, "5": 21.5, "6": 22.33, "7": 15.5, "8": 10.0, "9": 11.0, "10": 14.83, "11": 30.5, "12": 14.5}, "1410120": {"1": 718.53, "2": 263.53, "3": 1252.7, "4": 1270.2, "5": 863.53, "6": 526.45, "7": 661.03, "8": 208.33, "9": 303.12, "10": 1195.2, "11": 1266.87, "12": 852.5}, "1410121": {"1": 0, "2": 1.67, "3": 36, "4": 1.67, "5": 0, "6": 19.17, "7": 1.67, "8": 0, "9": 7.5, "10": 1.67, "11": 30, "12": 10.67}, "5000310": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0}, "5000323": {"1": 5.94, "2": 0, "3": 7.11, "4": 7.11, "5": 7.11, "6": 6.59, "7": 6.59, "8": 6.59, "9": 6.59, "10": 7.11, "11": 7.11, "12": 7.11}, "5000325": {"1": 71.31, "2": 0, "3": 85.36, "4": 85.36, "5": 85.36, "6": 79.13, "7": 79.13, "8": 79.13, "9": 79.13, "10": 85.36, "11": 85.36, "12": 85.36}, "5010081": {"1": 4.75, "2": 0, "3": 5.69, "4": 5.69, "5": 5.69, "6": 5.28, "7": 5.28, "8": 5.28, "9": 5.28, "10": 5.69, "11": 5.69, "12": 5.69}, "5010083": {"1": 83.33, "2": 103.33, "3": 87.73, "4": 116.67, "5": 179.83, "6": 87.17, "7": 137.33, "8": 83.33, "9": 88.83, "10": 136.67, "11": 195.17, "12": 84.6}, "5010001": {"1": 113.07, "2": 10.07, "3": 133.7, "4": 133.43, "5": 133.37, "6": 127.43, "7": 124.43, "8": 124.3, "9": 124.87, "10": 133.43, "11": 133.37, "12": 136.53}, "5010048": {"1": 10.3, "2": 16.67, "3": 45.66, "4": 62.33, "5": 34.33, "6": 63.93, "7": 61.43, "8": 11.43, "9": 11.43, "10": 89.0, "11": 78.66, "12": 14.83}, "5010049": {"1": 41.94, "2": 51.02, "3": 54.02, "4": 97.76, "5": 140.42, "6": 92.43, "7": 98.18, "8": 38.74, "9": 65.93, "10": 159.42, "11": 129.09, "12": 62.06}, "5010053": {"1": 334.69, "2": 93.6, "3": 408.25, "4": 439.17, "5": 817.5, "6": 453.23, "7": 435.98, "8": 361.21, "9": 380.89, "10": 468.33, "11": 724.17, "12": 472.98}, "7100288472": {"1": 870.97, "2": 1161.29, "3": 1161.29, "4": 1064.52, "5": 967.74, "6": 967.74, "7": 1258.06, "8": 387.1, "9": 1258.06, "10": 1161.29, "11": 967.74, "12": 774.19}, "7100288473": {"1": 1197.58, "2": 1596.77, "3": 1596.77, "4": 1463.71, "5": 1330.65, "6": 1330.65, "7": 1729.84, "8": 532.26, "9": 1729.84, "10": 1596.77, "11": 1330.65, "12": 1064.52}, "7100288474": {"1": 1850.81, "2": 2467.74, "3": 2467.74, "4": 2262.1, "5": 2056.45, "6": 2056.45, "7": 2673.39, "8": 822.58, "9": 2673.39, "10": 2467.74, "11": 2056.45, "12": 1645.16}, "7100288475": {"1": 870.97, "2": 1161.29, "3": 1161.29, "4": 1064.52, "5": 967.74, "6": 967.74, "7": 1258.06, "8": 387.1, "9": 1258.06, "10": 1161.29, "11": 967.74, "12": 774.19}, "7100288476": {"1": 631.45, "2": 841.94, "3": 841.94, "4": 771.77, "5": 701.61, "6": 701.61, "7": 912.1, "8": 280.65, "9": 912.1, "10": 841.94, "11": 701.61, "12": 561.29}, "1520110": {"1": 184.07, "2": 272.91, "3": 465.7, "4": 295.14, "5": 354.36, "6": 415.1, "7": 357.47, "8": 46.63, "9": 408.75, "10": 474.81, "11": 271.69, "12": 470.37}, "1520111": {"1": 136.34, "2": 182.13, "3": 277.15, "4": 282.13, "5": 235.8, "6": 379.79, "7": 230.6, "8": 28.91, "9": 388.65, "10": 263.06, "11": 294.93, "12": 337.52}, "1520112": {"1": 102.13, "2": 129.95, "3": 214.08, "4": 182.04, "5": 177.79, "6": 307.13, "7": 178.85, "8": 22.76, "9": 280.08, "10": 198.33, "11": 211.43, "12": 290.42}, "1520113": {"1": 87.64, "2": 99.97, "3": 189.25, "4": 102.89, "5": 153.97, "6": 199.99, "7": 136.4, "8": 22.85, "9": 189.58, "10": 162.75, "11": 166.15, "12": 185.55}, "3520110": {"1": 22.85, "2": 25.38, "3": 35.54, "4": 25.38, "5": 25.38, "6": 33, "7": 30.46, "8": 7.62, "9": 35.54, "10": 35.54, "11": 30.46, "12": 22.85}, "3520111": {"1": 22.85, "2": 25.38, "3": 35.54, "4": 25.38, "5": 25.38, "6": 33, "7": 30.46, "8": 7.62, "9": 35.54, "10": 35.54, "11": 30.46, "12": 22.85}, "3520112": {"1": 17.31, "2": 19.23, "3": 26.92, "4": 19.23, "5": 19.23, "6": 25, "7": 23.08, "8": 5.77, "9": 26.92, "10": 26.92, "11": 23.08, "12": 17.31}, "3520113": {"1": 7.82, "2": 8.69, "3": 12.17, "4": 8.69, "5": 8.69, "6": 11.3, "7": 10.43, "8": 2.61, "9": 12.17, "10": 12.17, "11": 10.43, "12": 7.82}, "4520119": {"1": 55.73, "2": 48.64, "3": 84.02, "4": 196.76, "5": 87.59, "6": 80.85, "7": 69.68, "8": 49.38, "9": 71.68, "10": 204.26, "11": 102.01, "12": 67.41}, "4520120": {"1": 99.84, "2": 102.35, "3": 141.84, "4": 272.59, "5": 215.76, "6": 160.61, "7": 135.11, "8": 82.75, "9": 135.94, "10": 299.26, "11": 219.76, "12": 132.18}, "4520121": {"1": 337.42, "2": 200.34, "3": 399.7, "4": 543.11, "5": 421.36, "6": 844.1, "7": 338.27, "8": 286.26, "9": 354.93, "10": 587.28, "11": 501.61, "12": 751.63}, "4520122": {"1": 284.08, "2": 129.94, "3": 317.59, "4": 427.09, "5": 306.17, "6": 654.41, "7": 264.82, "8": 235.72, "9": 276.24, "10": 444.59, "11": 387.92, "12": 580.42}, "4520123": {"1": 188.92, "2": 73.05, "3": 227.94, "4": 320.03, "5": 193.28, "6": 355.04, "7": 181.54, "8": 169.49, "9": 188.54, "10": 323.36, "11": 250.03, "12": 319.78}, "4520124": {"1": 83.33, "2": 39.86, "3": 117.54, "4": 117.27, "5": 98.36, "6": 132.88, "7": 84.13, "8": 78.19, "9": 90.8, "10": 121.44, "11": 132.77, "12": 118.42}, "4520125": {"1": 5.79, "2": 5, "3": 4.82, "4": 24.62, "5": 4.28, "6": 8.13, "7": 4.55, "8": 2.88, "9": 4.8, "10": 26.28, "11": 5.95, "12": 3.92}, "4520126": {"1": 3.29, "2": 5.83, "3": 3.82, "4": 23.62, "5": 3.45, "6": 7.13, "7": 3.55, "8": 2.71, "9": 3.8, "10": 26.95, "11": 3.45, "12": 3.42}, "4820101": {"1": 155.46, "2": 100.0, "3": 232.81, "4": 166.39, "5": 179.39, "6": 209.88, "7": 164.88, "8": 161.55, "9": 166.55, "10": 166.39, "11": 241.73, "12": 184.98}, "4820102": {"1": 24.18, "2": 8.33, "3": 65.22, "4": 27.3, "5": 40.3, "6": 70.5, "7": 29.25, "8": 25.92, "9": 27.17, "10": 27.3, "11": 77.64, "12": 41.89}, "4820210": {"1": 200.13, "2": 48.33, "3": 358.44, "4": 291.36, "5": 231.36, "6": 311.18, "7": 219.18, "8": 217.51, "9": 307.85, "10": 248.03, "11": 348.03, "12": 253.61}, "4820212": {"1": 132.37, "2": 46.67, "3": 262.72, "4": 339.39, "5": 159.89, "6": 214.82, "7": 144.9, "8": 143.24, "9": 342.32, "10": 190.22, "11": 268.06, "12": 170.39}, "4820214": {"1": 84.83, "2": 36.67, "3": 159.98, "4": 164.98, "5": 102.98, "6": 138.73, "7": 92.15, "8": 90.48, "9": 177.07, "10": 118.32, "11": 165.32, "12": 108.48}, "4820216": {"1": 32.31, "2": 12.5, "3": 57.04, "4": 88.71, "5": 45.21, "6": 52.81, "7": 34.48, "8": 34.48, "9": 71.98, "10": 51.21, "11": 68.04, "12": 41.21}, "7100318549": {"1": 2358.87, "2": 3145.16, "3": 3145.16, "4": 2883.06, "5": 2620.97, "6": 2620.97, "7": 3407.26, "8": 1048.39, "9": 3407.26, "10": 3145.16, "11": 2620.97, "12": 2096.77}, "7100318946": {"1": 1088.71, "2": 1451.61, "3": 1451.61, "4": 1330.65, "5": 1209.68, "6": 1209.68, "7": 1572.58, "8": 483.87, "9": 1572.58, "10": 1451.61, "11": 1209.68, "12": 967.74}, "7100318947": {"1": 7258.06, "2": 9677.42, "3": 9677.42, "4": 8870.97, "5": 8064.52, "6": 8064.52, "7": 10483.87, "8": 3225.81, "9": 10483.87, "10": 9677.42, "11": 8064.52, "12": 6451.61}, "7100319078": {"1": 5443.55, "2": 7258.06, "3": 7258.06, "4": 6653.23, "5": 6048.39, "6": 6048.39, "7": 7862.9, "8": 2419.35, "9": 7862.9, "10": 7258.06, "11": 6048.39, "12": 4838.71}, "7100288477": {"1": 272.18, "2": 362.9, "3": 362.9, "4": 332.66, "5": 302.42, "6": 302.42, "7": 393.15, "8": 120.97, "9": 393.15, "10": 362.9, "11": 302.42, "12": 241.94}, "7100288478": {"1": 725.81, "2": 967.74, "3": 967.74, "4": 887.1, "5": 806.45, "6": 806.45, "7": 1048.39, "8": 322.58, "9": 1048.39, "10": 967.74, "11": 806.45, "12": 645.16}, "7100288479": {"1": 725.81, "2": 967.74, "3": 967.74, "4": 887.1, "5": 806.45, "6": 806.45, "7": 1048.39, "8": 322.58, "9": 1048.39, "10": 967.74, "11": 806.45, "12": 645.16}, "7100288480": {"1": 290.32, "2": 387.1, "3": 387.1, "4": 354.84, "5": 322.58, "6": 322.58, "7": 419.35, "8": 129.03, "9": 419.35, "10": 387.1, "11": 322.58, "12": 258.06}, "7100288485": {"1": 166.94, "2": 222.58, "3": 222.58, "4": 204.03, "5": 185.48, "6": 185.48, "7": 241.13, "8": 74.19, "9": 241.13, "10": 222.58, "11": 185.48, "12": 148.39}, "7100254820": {"1": 272.18, "2": 362.9, "3": 362.9, "4": 332.66, "5": 302.42, "6": 302.42, "7": 393.15, "8": 120.97, "9": 393.15, "10": 362.9, "11": 302.42, "12": 241.94}, "2010311": {"1": 0, "2": 625, "3": 0, "4": 625, "5": 0, "6": 625, "7": 0, "8": 0, "9": 625, "10": 0, "11": 0, "12": 500}, "2010312": {"1": 0, "2": 1145.83, "3": 0, "4": 1145.83, "5": 0, "6": 1145.83, "7": 0, "8": 0, "9": 1145.83, "10": 0, "11": 0, "12": 916.67}, "2010313": {"1": 0, "2": 1145.83, "3": 0, "4": 1145.83, "5": 0, "6": 1145.83, "7": 0, "8": 0, "9": 1145.83, "10": 0, "11": 0, "12": 916.67}, "2010314": {"1": 0, "2": 1145.83, "3": 0, "4": 1145.83, "5": 0, "6": 1145.83, "7": 0, "8": 0, "9": 1145.83, "10": 0, "11": 0, "12": 916.67}, "2010315": {"1": 0, "2": 1458.33, "3": 0, "4": 1458.33, "5": 0, "6": 1458.33, "7": 0, "8": 0, "9": 1458.33, "10": 0, "11": 0, "12": 1166.67}, "2010316": {"1": 0, "2": 1458.33, "3": 0, "4": 1458.33, "5": 0, "6": 1458.33, "7": 0, "8": 0, "9": 1458.33, "10": 0, "11": 0, "12": 1166.67}, "2010317": {"1": 0, "2": 1458.33, "3": 0, "4": 1458.33, "5": 0, "6": 1458.33, "7": 0, "8": 0, "9": 1458.33, "10": 0, "11": 0, "12": 1166.67}, "2010318": {"1": 0, "2": 1458.33, "3": 0, "4": 1458.33, "5": 0, "6": 1458.33, "7": 0, "8": 0, "9": 1458.33, "10": 0, "11": 0, "12": 1166.67}, "2010319": {"1": 0, "2": 625, "3": 0, "4": 625, "5": 0, "6": 625, "7": 0, "8": 0, "9": 625, "10": 0, "11": 0, "12": 500}, "2010320": {"1": 0, "2": 625, "3": 0, "4": 625, "5": 0, "6": 625, "7": 0, "8": 0, "9": 625, "10": 0, "11": 0, "12": 500}, "2010321": {"1": 0, "2": 416.67, "3": 0, "4": 416.67, "5": 0, "6": 416.67, "7": 0, "8": 0, "9": 416.67, "10": 0, "11": 0, "12": 333.33}, "2010322": {"1": 0, "2": 468.75, "3": 0, "4": 468.75, "5": 0, "6": 468.75, "7": 0, "8": 0, "9": 468.75, "10": 0, "11": 0, "12": 375}, "F080C100": {"1": 0, "2": 0, "3": 0, "4": 650, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 650, "11": 0, "12": 0}, "F080C200": {"1": 0, "2": 0, "3": 0, "4": 300, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 300, "11": 0, "12": 0}, "F100C300": {"1": 0, "2": 0, "3": 0, "4": 162.5, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 162.5, "11": 0, "12": 0}, "F100C400": {"1": 0, "2": 0, "3": 0, "4": 125, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 125, "11": 0, "12": 0}, "F320CKIT": {"1": 0, "2": 0, "3": 0, "4": 87.5, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 87.5, "11": 0, "12": 0}, "G0620001": {"1": 620.69, "2": 1034.48, "3": 1551.72, "4": 1034.48, "5": 1034.48, "6": 1034.48, "7": 1551.72, "8": 0, "9": 1034.48, "10": 1034.48, "11": 1034.48, "12": 1034.48}, "G0620002": {"1": 1655.17, "2": 2758.62, "3": 4137.93, "4": 2758.62, "5": 2758.62, "6": 2758.62, "7": 4137.93, "8": 0, "9": 2758.62, "10": 2758.62, "11": 2758.62, "12": 2758.62}, "G0620003": {"1": 465.52, "2": 775.86, "3": 1163.79, "4": 775.86, "5": 775.86, "6": 775.86, "7": 1163.79, "8": 0, "9": 775.86, "10": 775.86, "11": 775.86, "12": 775.86}, "G0620004": {"1": 801.72, "2": 1336.21, "3": 2004.31, "4": 1336.21, "5": 1336.21, "6": 1336.21, "7": 2004.31, "8": 0, "9": 1336.21, "10": 1336.21, "11": 1336.21, "12": 1336.21}, "G0630001": {"1": 1034.48, "2": 1724.14, "3": 2586.21, "4": 1724.14, "5": 1724.14, "6": 1724.14, "7": 2586.21, "8": 0, "9": 1724.14, "10": 1724.14, "11": 1724.14, "12": 1724.14}, "G0630002": {"1": 2844.83, "2": 4741.38, "3": 7112.07, "4": 4741.38, "5": 4741.38, "6": 4741.38, "7": 7112.07, "8": 0, "9": 4741.38, "10": 4741.38, "11": 4741.38, "12": 4741.38}, "G0630003": {"1": 1086.21, "2": 1810.34, "3": 2715.52, "4": 1810.34, "5": 1810.34, "6": 1810.34, "7": 2715.52, "8": 0, "9": 1810.34, "10": 1810.34, "11": 1810.34, "12": 1810.34}, "G0630004": {"1": 1887.93, "2": 3146.55, "3": 4719.83, "4": 3146.55, "5": 3146.55, "6": 3146.55, "7": 4719.83, "8": 0, "9": 3146.55, "10": 3146.55, "11": 3146.55, "12": 3146.55}, "G1500004": {"1": 827.59, "2": 1379.31, "3": 2068.97, "4": 1379.31, "5": 1379.31, "6": 1379.31, "7": 2068.97, "8": 0, "9": 1379.31, "10": 1379.31, "11": 1379.31, "12": 1379.31}, "G1500005": {"1": 905.17, "2": 1508.62, "3": 2262.93, "4": 1508.62, "5": 1508.62, "6": 1508.62, "7": 2262.93, "8": 0, "9": 1508.62, "10": 1508.62, "11": 1508.62, "12": 1508.62}, "G1500006": {"1": 118.97, "2": 198.28, "3": 297.41, "4": 198.28, "5": 198.28, "6": 198.28, "7": 297.41, "8": 0, "9": 198.28, "10": 198.28, "11": 198.28, "12": 198.28}, "G1820001": {"1": 103.45, "2": 172.41, "3": 258.62, "4": 172.41, "5": 172.41, "6": 172.41, "7": 258.62, "8": 0, "9": 172.41, "10": 172.41, "11": 172.41, "12": 172.41}, "G1820002": {"1": 25.86, "2": 43.1, "3": 64.66, "4": 43.1, "5": 43.1, "6": 43.1, "7": 64.66, "8": 0, "9": 43.1, "10": 43.1, "11": 43.1, "12": 43.1}, "G1820003": {"1": 310.34, "2": 517.24, "3": 775.86, "4": 517.24, "5": 517.24, "6": 517.24, "7": 775.86, "8": 0, "9": 517.24, "10": 517.24, "11": 517.24, "12": 517.24}, "G1820004": {"1": 51.72, "2": 86.21, "3": 129.31, "4": 86.21, "5": 86.21, "6": 86.21, "7": 129.31, "8": 0, "9": 86.21, "10": 86.21, "11": 86.21, "12": 86.21}, "G1820005": {"1": 310.34, "2": 517.24, "3": 775.86, "4": 517.24, "5": 517.24, "6": 517.24, "7": 775.86, "8": 0, "9": 517.24, "10": 517.24, "11": 517.24, "12": 517.24}, "G1820006": {"1": 51.72, "2": 86.21, "3": 129.31, "4": 86.21, "5": 86.21, "6": 86.21, "7": 129.31, "8": 0, "9": 86.21, "10": 86.21, "11": 86.21, "12": 86.21}, "G1820007": {"1": 51.72, "2": 86.21, "3": 129.31, "4": 86.21, "5": 86.21, "6": 86.21, "7": 129.31, "8": 0, "9": 86.21, "10": 86.21, "11": 86.21, "12": 86.21}, "F021C050B": {"1": 0, "2": 666.67, "3": 333.33, "4": 666.67, "5": 333.33, "6": 666.67, "7": 333.33, "8": 1000, "9": 500, "10": 1000, "11": 500, "12": 500}, "F021C051B": {"1": 0, "2": 2400, "3": 1200, "4": 2400, "5": 1200, "6": 2400, "7": 1200, "8": 0, "9": 500, "10": 1000, "11": 1500, "12": 1500}, "F021C052B": {"1": 0, "2": 2000, "3": 1000, "4": 2000, "5": 1000, "6": 2000, "7": 1000, "8": 0, "9": 1000, "10": 0, "11": 1000, "12": 0}, "F021C053B": {"1": 0, "2": 1733.33, "3": 866.67, "4": 1733.33, "5": 866.67, "6": 1733.33, "7": 866.67, "8": 0, "9": 500, "10": 0, "11": 500, "12": 0}, "F021C05XB": {"1": 0, "2": 466.67, "3": 233.33, "4": 466.67, "5": 233.33, "6": 466.67, "7": 233.33, "8": 500, "9": 0, "10": 500, "11": 500, "12": 500}, "E1020001": {"1": 6447.37, "2": 6447.37, "3": 6754.39, "4": 6447.37, "5": 6447.37, "6": 6754.39, "7": 6754.39, "8": 1842.11, "9": 6754.39, "10": 6140.35, "11": 5526.32, "12": 3684.21}, "E1020002": {"1": 4144.74, "2": 4144.74, "3": 4342.11, "4": 4144.74, "5": 4144.74, "6": 4342.11, "7": 4342.11, "8": 1184.21, "9": 4342.11, "10": 3947.37, "11": 3552.63, "12": 2368.42}, "E1020003": {"1": 2302.63, "2": 2302.63, "3": 2412.28, "4": 2302.63, "5": 2302.63, "6": 2412.28, "7": 2412.28, "8": 657.89, "9": 2412.28, "10": 2192.98, "11": 1973.68, "12": 1315.79}, "E1020004": {"1": 460.53, "2": 460.53, "3": 482.46, "4": 460.53, "5": 460.53, "6": 482.46, "7": 482.46, "8": 131.58, "9": 482.46, "10": 438.6, "11": 394.74, "12": 263.16}, "E1020005": {"1": 46.05, "2": 46.05, "3": 48.25, "4": 46.05, "5": 46.05, "6": 48.25, "7": 48.25, "8": 13.16, "9": 48.25, "10": 43.86, "11": 39.47, "12": 26.32}, "F1020001": {"1": 5526.32, "2": 5526.32, "3": 5789.47, "4": 5526.32, "5": 5526.32, "6": 5789.47, "7": 5789.47, "8": 1578.95, "9": 5789.47, "10": 5263.16, "11": 4736.84, "12": 3157.89}, "F1020002": {"1": 5526.32, "2": 5526.32, "3": 5789.47, "4": 5526.32, "5": 5526.32, "6": 5789.47, "7": 5789.47, "8": 1578.95, "9": 5789.47, "10": 5263.16, "11": 4736.84, "12": 3157.89}, "F1020003": {"1": 2302.63, "2": 2302.63, "3": 2412.28, "4": 2302.63, "5": 2302.63, "6": 2412.28, "7": 2412.28, "8": 657.89, "9": 2412.28, "10": 2192.98, "11": 1973.68, "12": 1315.79}, "F1020004": {"1": 921.05, "2": 921.05, "3": 964.91, "4": 921.05, "5": 921.05, "6": 964.91, "7": 964.91, "8": 263.16, "9": 964.91, "10": 877.19, "11": 789.47, "12": 526.32}, "H15000002": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 165, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 250, "12": 0}, "H15000300": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 50, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 50, "12": 0}, "H15000301": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 50, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 50, "12": 0}, "H15000302": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 50, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 50, "12": 0}, "H1510310B": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 125, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 150, "12": 0}, "H1510311B": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 125, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 150, "12": 0}, "H1510312B": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 125, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 150, "12": 0}, "H1520110": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 50, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 50, "12": 0}, "H1520111": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 50, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 50, "12": 0}, "H1520112": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 50, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 50, "12": 0}, "AHSH0001": {"1": 1055.56, "2": 1055.56, "3": 0, "4": 1055.56, "5": 1055.56, "6": 1055.56, "7": 1055.56, "8": 0, "9": 1055.56, "10": 1055.56, "11": 1055.56, "12": 0}, "AHSH0002": {"1": 1972.22, "2": 1972.22, "3": 0, "4": 1972.22, "5": 1972.22, "6": 1972.22, "7": 1972.22, "8": 0, "9": 1972.22, "10": 1972.22, "11": 1972.22, "12": 0}, "AHSH0003": {"1": 888.89, "2": 888.89, "3": 0, "4": 888.89, "5": 888.89, "6": 888.89, "7": 888.89, "8": 0, "9": 888.89, "10": 888.89, "11": 888.89, "12": 0}, "AHSH0004": {"1": 611.11, "2": 611.11, "3": 0, "4": 611.11, "5": 611.11, "6": 611.11, "7": 611.11, "8": 0, "9": 611.11, "10": 611.11, "11": 611.11, "12": 0}, "F171C101": {"1": 0, "2": 0, "3": 0, "4": 780, "5": 780, "6": 0, "7": 0, "8": 0, "9": 2080, "10": 0, "11": 0, "12": 1560}, "F171C102": {"1": 0, "2": 0, "3": 0, "4": 2025, "5": 2025, "6": 0, "7": 0, "8": 0, "9": 5400, "10": 0, "11": 0, "12": 4050}, "F171C103": {"1": 0, "2": 0, "3": 0, "4": 847.5, "5": 847.5, "6": 0, "7": 0, "8": 0, "9": 2260, "10": 2000, "11": 0, "12": 1695}, "F171C104": {"1": 0, "2": 0, "3": 0, "4": 716.25, "5": 716.25, "6": 0, "7": 0, "8": 0, "9": 1910, "10": 0, "11": 0, "12": 1432.5}, "2110301": {"1": 1062.5, "2": 1062.5, "3": 1275, "4": 1275, "5": 1062.5, "6": 1275, "7": 1275, "8": 212.5, "9": 1275, "10": 1275, "11": 1062.5, "12": 637.5}, "2110302": {"1": 666.67, "2": 666.67, "3": 800, "4": 800, "5": 666.67, "6": 800, "7": 800, "8": 133.33, "9": 800, "10": 800, "11": 666.67, "12": 400}, "2110303": {"1": 416.67, "2": 416.67, "3": 500, "4": 500, "5": 416.67, "6": 500, "7": 500, "8": 83.33, "9": 500, "10": 500, "11": 416.67, "12": 250}, "G1120000": {"1": 0, "2": 0, "3": 0, "4": 5000, "5": 0, "6": 0, "7": 0, "8": 1500, "9": 0, "10": 1500, "11": 2000, "12": 0}, "G1120001": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 4000, "6": 3000, "7": 4000, "8": 6000, "9": 2000, "10": 7000, "11": 3000, "12": 4000}, "G1120002": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 3000, "7": 2000, "8": 5000, "9": 2000, "10": 3000, "11": 7000, "12": 0}, "G1120003": {"1": 0, "2": 0, "3": 0, "4": 2500, "5": 0, "6": 0, "7": 2500, "8": 0, "9": 2500, "10": 0, "11": 0, "12": 0}, "G1120004": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 2000, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0}, "1510310B": {"1": 85.81, "2": 126.73, "3": 251.26, "4": 726.56, "5": 86.9, "6": 796, "7": 253.58, "8": 20.77, "9": 663.76, "10": 334.09, "11": 184.08, "12": 730.47}, "1510311B": {"1": 209.49, "2": 261.78, "3": 430.29, "4": 1153.78, "5": 214.62, "6": 1071.5, "7": 584.54, "8": 55.38, "9": 1192.63, "10": 592.29, "11": 347.37, "12": 951.32}, "1510312B": {"1": 181.64, "2": 245.23, "3": 412.76, "4": 523.23, "5": 188.56, "6": 732.33, "7": 359.91, "8": 50.77, "9": 774.59, "10": 357.92, "11": 292.41, "12": 645.64}, "1510313B": {"1": 97.11, "2": 131.34, "3": 200.7, "4": 167.84, "5": 102.17, "6": 292.2, "7": 183.15, "8": 27.69, "9": 268.26, "10": 207.86, "11": 138.55, "12": 248.11}, "3510310B": {"1": 139.15, "2": 154.62, "3": 216.46, "4": 154.62, "5": 154.62, "6": 201, "7": 185.54, "8": 46.38, "9": 216.46, "10": 216.46, "11": 185.54, "12": 139.15}, "3510311B": {"1": 155.77, "2": 173.08, "3": 242.31, "4": 173.08, "5": 173.08, "6": 225, "7": 207.69, "8": 51.92, "9": 242.31, "10": 242.31, "11": 207.69, "12": 155.77}, "3510312B": {"1": 138.46, "2": 153.85, "3": 215.38, "4": 153.85, "5": 153.85, "6": 200, "7": 184.62, "8": 46.15, "9": 215.38, "10": 215.38, "11": 184.62, "12": 138.46}, "3510313B": {"1": 51.92, "2": 57.69, "3": 80.77, "4": 57.69, "5": 57.69, "6": 75, "7": 69.23, "8": 17.31, "9": 80.77, "10": 80.77, "11": 69.23, "12": 51.92}, "3510330B": {"1": 34.62, "2": 38.46, "3": 53.85, "4": 38.46, "5": 38.46, "6": 50, "7": 46.15, "8": 11.54, "9": 53.85, "10": 53.85, "11": 46.15, "12": 34.62}, "3510331B": {"1": 20.77, "2": 23.08, "3": 32.31, "4": 23.08, "5": 23.08, "6": 30, "7": 27.69, "8": 6.92, "9": 32.31, "10": 32.31, "11": 27.69, "12": 20.77}, "3510332B": {"1": 4.85, "2": 5.38, "3": 7.54, "4": 5.38, "5": 5.38, "6": 7, "7": 6.46, "8": 1.62, "9": 7.54, "10": 7.54, "11": 6.46, "12": 4.85}, "3510333B": {"1": 3.46, "2": 3.85, "3": 5.38, "4": 3.85, "5": 3.85, "6": 5, "7": 4.62, "8": 1.15, "9": 5.38, "10": 5.38, "11": 4.62, "12": 3.46}, "B1510310B": {"1": 2.08, "2": 2.08, "3": 2.5, "4": 2.5, "5": 2.08, "6": 2.5, "7": 2.5, "8": 0.42, "9": 2.5, "10": 2.5, "11": 2.08, "12": 1.25}, "B1510311B": {"1": 5.83, "2": 5.83, "3": 7, "4": 7, "5": 5.83, "6": 7, "7": 7, "8": 1.17, "9": 7, "10": 7, "11": 5.83, "12": 3.5}, "B1510312B": {"1": 2.5, "2": 2.5, "3": 3, "4": 3, "5": 2.5, "6": 3, "7": 3, "8": 0.5, "9": 3, "10": 3, "11": 2.5, "12": 1.5}, "B1510313B": {"1": 2.08, "2": 2.08, "3": 2.5, "4": 2.5, "5": 2.08, "6": 2.5, "7": 2.5, "8": 0.42, "9": 2.5, "10": 2.5, "11": 2.08, "12": 1.25}, "B1510330B": {"1": 0.83, "2": 0.83, "3": 1, "4": 1, "5": 0.83, "6": 1, "7": 1, "8": 0.17, "9": 1, "10": 1, "11": 0.83, "12": 0.5}, "B1510331B": {"1": 2.08, "2": 2.08, "3": 2.5, "4": 2.5, "5": 2.08, "6": 2.5, "7": 2.5, "8": 0.42, "9": 2.5, "10": 2.5, "11": 2.08, "12": 1.25}, "B1510332B": {"1": 0.83, "2": 0.83, "3": 1, "4": 1, "5": 0.83, "6": 1, "7": 1, "8": 0.17, "9": 1, "10": 1, "11": 0.83, "12": 0.5}, "B1510333B": {"1": 0.42, "2": 0.42, "3": 0.5, "4": 0.5, "5": 0.42, "6": 0.5, "7": 0.5, "8": 0.08, "9": 0.5, "10": 0.5, "11": 0.42, "12": 0.25}, "1590310B": {"1": 66.52, "2": 585.74, "3": 1717.39, "4": 115.38, "5": 1681.02, "6": 433.71, "7": 1037.22, "8": 0, "9": 153.8, "10": 1904.17, "11": 437.55, "12": 1712.52}, "1590311B": {"1": 79.5, "2": 414.45, "3": 911.61, "4": 119.58, "5": 843.89, "6": 341.06, "7": 617.07, "8": 2.31, "9": 320.58, "10": 1045.05, "11": 314.96, "12": 881.95}, "1590312B": {"1": 47.18, "2": 228.83, "3": 439.91, "4": 78.88, "5": 338.27, "6": 220.97, "7": 292.16, "8": 0, "9": 283.97, "10": 439.44, "11": 217.38, "12": 370.02}, "1590313B": {"1": 41.46, "2": 114.98, "3": 222.76, "4": 65.54, "5": 216.93, "6": 121.31, "7": 162.66, "8": 4.52, "9": 188.65, "10": 274.29, "11": 82.72, "12": 240.17}, "1590350B": {"1": 0, "2": 0, "3": 0, "4": 30, "5": 190, "6": 380, "7": 0, "8": 0, "9": 0, "10": 0, "11": 285, "12": 600}, "1590351B": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 240, "6": 290, "7": 0, "8": 0, "9": 0, "10": 0, "11": 360, "12": 435}, "1590352B": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 160, "6": 16, "7": 0, "8": 0, "9": 0, "10": 0, "11": 240, "12": 24}, "1590353B": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 100, "6": 4, "7": 0, "8": 0, "9": 0, "10": 0, "11": 150, "12": 6}, "3590310B": {"1": 56.08, "2": 62.31, "3": 87.23, "4": 62.31, "5": 62.31, "6": 81, "7": 74.77, "8": 18.69, "9": 87.23, "10": 87.23, "11": 74.77, "12": 56.08}, "3590311B": {"1": 55.38, "2": 61.54, "3": 86.15, "4": 61.54, "5": 61.54, "6": 80, "7": 73.85, "8": 18.46, "9": 86.15, "10": 86.15, "11": 73.85, "12": 55.38}, "3590312B": {"1": 28.38, "2": 31.54, "3": 44.15, "4": 31.54, "5": 31.54, "6": 41, "7": 37.85, "8": 9.46, "9": 44.15, "10": 44.15, "11": 37.85, "12": 28.38}, "3590313B": {"1": 17.31, "2": 19.23, "3": 26.92, "4": 19.23, "5": 19.23, "6": 25, "7": 23.08, "8": 5.77, "9": 26.92, "10": 26.92, "11": 23.08, "12": 17.31}, "B1590310B": {"1": 8.33, "2": 8.33, "3": 10, "4": 10, "5": 8.33, "6": 10, "7": 10, "8": 1.67, "9": 10, "10": 10, "11": 8.33, "12": 5}, "B1590311B": {"1": 16.67, "2": 16.67, "3": 20, "4": 20, "5": 16.67, "6": 20, "7": 20, "8": 3.33, "9": 20, "10": 20, "11": 16.67, "12": 10}, "B1590312B": {"1": 11.67, "2": 11.67, "3": 14, "4": 14, "5": 11.67, "6": 14, "7": 14, "8": 2.33, "9": 14, "10": 14, "11": 11.67, "12": 7}, "B1590313B": {"1": 1.67, "2": 1.67, "3": 2, "4": 2, "5": 1.67, "6": 2, "7": 2, "8": 0.33, "9": 2, "10": 2, "11": 1.67, "12": 1}, "15900002": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0}, "1590301": {"1": 0.3, "2": 0.13, "3": 3.33, "4": 0.43, "5": 0.13, "6": 0.43, "7": 3.77, "8": 0, "9": 0.3, "10": 0.27, "11": 0.3, "12": 3.6}, "1590320": {"1": 8.59, "2": 27.36, "3": 42.11, "4": 13.94, "5": 49.36, "6": 16.61, "7": 44.27, "8": 0, "9": 10.19, "10": 68.44, "11": 8.94, "12": 57.19}, "B1590320": {"1": 1.25, "2": 1.25, "3": 1.5, "4": 1.5, "5": 1.25, "6": 1.5, "7": 1.5, "8": 0.25, "9": 1.5, "10": 1.5, "11": 1.25, "12": 0.75}, "1110311B": {"1": 39.62, "2": 0, "3": 47.42, "4": 47.42, "5": 47.42, "6": 43.96, "7": 43.96, "8": 43.96, "9": 43.96, "10": 47.42, "11": 47.42, "12": 47.42}, "1110312B": {"1": 39.62, "2": 0, "3": 47.42, "4": 47.42, "5": 47.42, "6": 43.96, "7": 43.96, "8": 43.96, "9": 43.96, "10": 47.42, "11": 47.42, "12": 47.42}, "3410311B": {"1": 33.23, "2": 36.92, "3": 51.69, "4": 36.92, "5": 36.92, "6": 48, "7": 44.31, "8": 11.08, "9": 51.69, "10": 51.69, "11": 44.31, "12": 33.23}, "3410312B": {"1": 18.69, "2": 20.77, "3": 29.08, "4": 20.77, "5": 20.77, "6": 27, "7": 24.92, "8": 6.23, "9": 29.08, "10": 29.08, "11": 24.92, "12": 18.69}, "3410313B": {"1": 9, "2": 10, "3": 14, "4": 10, "5": 10, "6": 13, "7": 12, "8": 3, "9": 14, "10": 14, "11": 12, "12": 9}, "4510311B": {"1": 95.33, "2": 0.25, "3": 114.12, "4": 130.78, "5": 114.07, "6": 105.81, "7": 105.81, "8": 105.56, "9": 105.81, "10": 147.45, "11": 114.07, "12": 113.97}, "4510312B": {"1": 158.71, "2": 0.25, "3": 189.99, "4": 206.66, "5": 189.94, "6": 176.15, "7": 176.15, "8": 175.9, "9": 176.15, "10": 223.33, "11": 189.94, "12": 189.84}, "4510313B": {"1": 79.31, "2": 0.08, "3": 94.95, "4": 101.61, "5": 94.93, "6": 88.02, "7": 88.02, "8": 87.94, "9": 88.02, "10": 108.28, "11": 94.93, "12": 94.9}, "4510314B": {"1": 39.62, "2": 0, "3": 47.42, "4": 48.09, "5": 47.42, "6": 43.96, "7": 43.96, "8": 43.96, "9": 43.96, "10": 48.76, "11": 47.42, "12": 47.42}, "4590311B": {"1": 967.04, "2": 973.91, "3": 1240.88, "4": 1111.66, "5": 1125.19, "6": 1264.06, "7": 1088.78, "8": 943.7, "9": 1065.72, "10": 1262.77, "11": 1278.24, "12": 1072.05}, "4590312B": {"1": 1023.88, "2": 913.09, "3": 1258.47, "4": 1212.41, "5": 1162.77, "6": 1299.35, "7": 1179.9, "8": 1021.48, "9": 1116.18, "10": 1350.19, "11": 1278.33, "12": 1138.94}, "4590313B": {"1": 497.89, "2": 442.7, "3": 802.62, "4": 582.78, "5": 555.28, "6": 695.04, "7": 563.37, "8": 496.93, "9": 534.62, "10": 643.62, "11": 808.2, "12": 546.95}, "4590314B": {"1": 228.46, "2": 182.77, "3": 311.95, "4": 287.14, "5": 256.5, "6": 301.72, "7": 268.94, "8": 230.59, "9": 248.13, "10": 315.75, "11": 310.39, "12": 258.67}, "4590315B": {"1": 25.17, "2": 27.5, "3": 27.62, "4": 35.92, "5": 27.25, "6": 35.28, "7": 28.53, "8": 24.03, "9": 26.45, "10": 42.92, "11": 26.42, "12": 28.89}, "4590316B": {"1": 12.42, "2": 13.42, "3": 14.13, "4": 23.13, "5": 13.04, "6": 17.52, "7": 13.85, "8": 11.93, "9": 12.85, "10": 27.29, "11": 13.04, "12": 14.38}, "4590351B": {"1": 100.0, "2": 0, "3": 0, "4": 785, "5": 8, "6": 2850, "7": 0, "8": 0, "9": 0, "10": 725, "11": 112.0, "12": 2810}, "4590352B": {"1": 75.0, "2": 0, "3": 0, "4": 650, "5": 8, "6": 2200, "7": 0, "8": 0, "9": 0, "10": 625, "11": 87.0, "12": 2150}, "4590353B": {"1": 33.33, "2": 0, "3": 0, "4": 387.5, "5": 4, "6": 908.33, "7": 0, "8": 0, "9": 0, "10": 375, "11": 39.33, "12": 887.5}, "4590354B": {"1": 10.0, "2": 0, "3": 0, "4": 32.5, "5": 4, "6": 310, "7": 0, "8": 0, "9": 0, "10": 25, "11": 16, "12": 307.5}, "4590355B": {"1": 3.33, "2": 0, "3": 0, "4": 15, "5": 0, "6": 3.33, "7": 0, "8": 0, "9": 0, "10": 15, "11": 3.33, "12": 0}, "4590356B": {"1": 0.33, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0.33, "7": 0, "8": 0, "9": 0, "10": 0, "11": 0.33, "12": 0}, "4590002": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0}, "4590302": {"1": 16.62, "2": 21.09, "3": 21.09, "4": 39.59, "5": 21.09, "6": 21.09, "7": 21.09, "8": 12.5, "9": 21.09, "10": 39.59, "11": 21.09, "12": 21.09}, "4590320": {"1": 27.55, "2": 49.75, "3": 288.41, "4": 159.75, "5": 39.25, "6": 171.41, "7": 33.08, "8": 21.33, "9": 32.25, "10": 160.25, "11": 295.91, "12": 67.08}, "46900501": {"1": 66.68, "2": 70.33, "3": 82.97, "4": 84.64, "5": 75.97, "6": 100.75, "7": 74.92, "8": 63.75, "9": 74.92, "10": 106.3, "11": 85.97, "12": 77.8}, "46900502": {"1": 67.1, "2": 60.33, "3": 72.29, "4": 77.29, "5": 68.79, "6": 107.71, "7": 66.88, "8": 64.04, "9": 66.88, "10": 105.62, "11": 77.12, "12": 80.95}, "46900503": {"1": 40.84, "2": 43.58, "3": 46.48, "4": 43.15, "5": 43.07, "6": 61.63, "7": 42.46, "8": 38.04, "9": 42.46, "10": 53.15, "11": 49.73, "12": 45.4}, "46900504": {"1": 14.79, "2": 19, "3": 18.91, "4": 15.58, "5": 35.41, "6": 28.56, "7": 15.23, "8": 12.9, "9": 15.23, "10": 23.91, "11": 50.41, "12": 15.08}, "46900003": {"1": 0, "2": 0.5, "3": 0.5, "4": 1.17, "5": 0.5, "6": 0.5, "7": 0.5, "8": 0, "9": 0.5, "10": 1.83, "11": 0.5, "12": 0.5}, "46900004": {"1": 0, "2": 0.5, "3": 0.5, "4": 1.17, "5": 0.5, "6": 0.5, "7": 0.5, "8": 0, "9": 0.5, "10": 1.83, "11": 0.5, "12": 0.5}, "4690320": {"1": 0.08, "2": 11.75, "3": 1.43, "4": 3.43, "5": 0.08, "6": 16.1, "7": 0.1, "8": 0.02, "9": 0.1, "10": 18.43, "11": 1.42, "12": 3.05}, "4810010B": {"1": 1335, "2": 724.17, "3": 1980.75, "4": 2175.58, "5": 1608.25, "6": 1983.08, "7": 1703.08, "8": 1419.75, "9": 2169.75, "10": 2045.58, "11": 1940.42, "12": 1709.58}, "4810012B": {"1": 1612.31, "2": 667.5, "3": 2460.88, "4": 2847.54, "5": 1915.21, "6": 2439.15, "7": 2087.48, "8": 1727.48, "9": 2799.15, "10": 2367.54, "11": 2345.71, "12": 2110.04}, "4810014B": {"1": 688.71, "2": 282.5, "3": 1063.94, "4": 1464.27, "5": 879.77, "6": 1032.45, "7": 922.45, "8": 739.12, "9": 1394.12, "10": 1070.94, "11": 1093.77, "12": 887.94}, "4810016B": {"1": 153.82, "2": 83.33, "3": 269.16, "4": 346.83, "5": 195.0, "6": 291.13, "7": 220.05, "8": 163.38, "9": 316.97, "10": 304.33, "11": 257.0, "12": 239.0}, "4800001": {"1": 72.13, "2": 28.33, "3": 98.39, "4": 89.73, "5": 98.06, "6": 103.13, "7": 86.55, "8": 78.21, "9": 84.46, "10": 108.06, "11": 95.06, "12": 103.89}, "4800002": {"1": 24.18, "2": 20, "3": 29.3, "4": 33.97, "5": 27.3, "6": 45.42, "7": 27.58, "8": 25.92, "9": 25.92, "10": 52.3, "11": 27.64, "12": 36.47}}};

// ── Calculs de base ─────────────────────────────────────────────────────────
// Retrouve le jonc de pultrusion (et son facteur de conversion) pour un tenon
// donné. Retourne null si ce tenon n'est pas encore répertorié dans
// TENON_TO_JONC (voir note plus haut — 78 références restent à compléter).
function pultGetJoncForTenon(codart_wip) {
  return TENON_TO_JONC.find(t => t.codart_wip === codart_wip) || null;
}

// Convertit un nombre de tenons nécessaires en mètres de jonc, pour un tenon
// donné. Retourne null si la conversion n'est pas connue.
function pultTenonsToMl(codart_wip, nbTenons) {
  const t = pultGetJoncForTenon(codart_wip);
  if (!t || !t.tenonsParMl) return null;
  return nbTenons / t.tenonsParMl;
}

// ── Calcul de consommation prévisionnelle depuis le forecast ────────────────
let pultForecastImported = null; // {year:2026, data:{ref:{1:qte,...,12:qte}}}
function pultGetActiveForecast() { return pultForecastImported || FORECAST_DEFAULT; }

const _PULT_MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Dernier mois pour lequel une commande réelle (restant > 0 ou déjà livrée, peu
// importe : on regarde juste jusqu'où le carnet de commandes va) existe pour
// cette référence FG, au format index triable (année*12+mois). Retourne null si
// aucune commande connue (dans ce cas, tout le forecast est pris en compte).
function pultForecastCutoffMonth(materialCode) {
  if (typeof pcData === 'undefined' || !pcData.commandes) return null;
  let maxIdx = null;
  pcData.commandes.forEach(c => {
    if (String(c.REF_RTD||'').trim() !== materialCode) return;
    if (!c.DATDEL) return;
    const d = new Date(c.DATDEL);
    if (isNaN(d)) return;
    const idx = d.getFullYear() * 12 + d.getMonth();
    if (maxIdx === null || idx > maxIdx) maxIdx = idx;
  });
  return maxIdx;
}

// Nombre de pièces FG prévues par le forecast pour cette référence, en ne
// comptant QUE les mois postérieurs au dernier mois déjà couvert par une
// commande connue (voir pultForecastCutoffMonth) — pour ne jamais compter en
// double une commande déjà passée ET le forecast qui la couvrait à l'origine.
function pultForecastPiecesForMaterial(materialCode) {
  const fc = pultGetActiveForecast();
  const monthsData = fc.data[materialCode];
  if (!monthsData) return { total: 0, detail: [] };
  const cutoff = pultForecastCutoffMonth(materialCode);
  let total = 0;
  const detail = [];
  Object.keys(monthsData).forEach(moisNum => {
    const qte = monthsData[moisNum];
    if (!qte) return;
    const mi = parseInt(moisNum) - 1; // 1-12 -> 0-11
    const idx = fc.year * 12 + mi;
    if (cutoff !== null && idx <= cutoff) return; // déjà couvert par une vraie commande
    total += qte;
    detail.push({ mois: _PULT_MONTH_NAMES[mi] + '-' + fc.year, qte });
  });
  detail.sort((a,b) => a.mois.localeCompare(b.mois));
  return { total, detail };
}

// Ratio cumulé du niveau tenon (premier niveau de la nomenclature) jusqu'au FG —
// combien de tenons faut-il pour 1 pièce FG. Réutilise pdpFindNomenclature
// (pdp.js) si disponible ; retourne 1 si le produit est un "produit simple"
// (le tenon EST le FG) ou si la nomenclature est introuvable.
function pultGetCumRatioTenonToFG(materialCode) {
  if (typeof pdpFindNomenclature !== 'function') return 1;
  const nom = pdpFindNomenclature(null, materialCode);
  if (!nom || !nom.etapes || nom.etapes.length < 2) return 1;
  let cumRatio = 1;
  for (let j = 0; j < nom.etapes.length - 1; j++) {
    if (nom.etapes[j].ratio) cumRatio *= nom.etapes[j].ratio;
  }
  return cumRatio || 1;
}

// Mètres de jonc prévisionnels nécessaires pour UNE référence FG, sur la partie
// du forecast non déjà couverte par une commande connue.
function pultForecastMlForMaterial(materialCode, codart_wip) {
  const { total } = pultForecastPiecesForMaterial(materialCode);
  if (!total) return 0;
  const cumRatio = pultGetCumRatioTenonToFG(materialCode);
  const tenonsNecessaires = total * cumRatio;
  const ml = pultTenonsToMl(codart_wip, tenonsNecessaires);
  return ml || 0;
}

// Mètres de jonc prévisionnels TOTAUX pour une référence de pultrusion donnée
// (ex: "JTO3_2.5"), en sommant sur TOUS les produits finis qui en dépendent.
// C'est la fonction à utiliser pour afficher la prévision dans la modale de
// détail d'un jonc.
function pultForecastMlForJonc(joncCode) {
  if (typeof pdpGetActiveCorrespondances !== 'function') return { total: 0, detail: [] };
  const corrs = pdpGetActiveCorrespondances();
  const fc = pultGetActiveForecast();
  let total = 0;
  const detail = [];
  Object.keys(fc.data).forEach(materialCode => {
    const ref = corrs.find(r => r.code_client === materialCode);
    if (!ref) return; // produit du forecast pas (encore) suivi dans les correspondances
    const jonc = pultGetJoncForTenon(ref.codart_wip);
    if (!jonc || jonc.matiere !== joncCode) return;
    const ml = pultForecastMlForMaterial(materialCode, ref.codart_wip);
    if (ml > 0) {
      total += ml;
      detail.push({ materialCode, libelle: ref.libelle_fg, ml });
    }
  });
  return { total, detail };
}

// Pièces FG restant à livrer, tous clients confondus, pour une référence donnée
// — mêmes règles que partout ailleurs dans l'app : restant > 0 ET pas "Soldée"
// (COMMANDE_S !== 'O'). Contrairement au forecast, aucun cutoff n'est appliqué
// ici : ce sont déjà de vraies commandes fermes, pas une projection.
function pultCommandesPiecesForMaterial(materialCode) {
  if (typeof pcData === 'undefined' || !pcData.commandes) return 0;
  return pcData.commandes.reduce((s, c) => {
    if (String(c.REF_RTD||'').trim() !== materialCode) return s;
    if (String(c.COMMANDE_S||'').trim() === 'O') return s; // Soldée
    const rest = (Number(c.QTE_CDE)||0) - (Number(c.QTE_LIVREE)||0);
    return rest > 0 ? s + rest : s;
  }, 0);
}

// Mètres de jonc nécessaires pour UNE référence FG, d'après ses commandes
// ouvertes réelles (pas le forecast).
function pultCommandesMlForMaterial(materialCode, codart_wip) {
  const pieces = pultCommandesPiecesForMaterial(materialCode);
  if (!pieces) return 0;
  const cumRatio = pultGetCumRatioTenonToFG(materialCode);
  const ml = pultTenonsToMl(codart_wip, pieces * cumRatio);
  return ml || 0;
}

// Mètres de jonc nécessaires TOTAUX pour une référence de pultrusion donnée,
// d'après les commandes ouvertes réelles de TOUS les produits finis qui en
// dépendent — le pendant "commandes fermes" de pultForecastMlForJonc
// (prévisionnel). À utiliser ensemble pour voir stock / engagé / prévu.
function pultCommandesMlForJonc(joncCode) {
  if (typeof pdpGetActiveCorrespondances !== 'function') return { total: 0, detail: [] };
  const corrs = pdpGetActiveCorrespondances();
  let total = 0;
  const detail = [];
  corrs.forEach(ref => {
    const jonc = pultGetJoncForTenon(ref.codart_wip);
    if (!jonc || jonc.matiere !== joncCode) return;
    const ml = pultCommandesMlForMaterial(ref.code_client, ref.codart_wip);
    if (ml > 0) {
      total += ml;
      detail.push({ materialCode: ref.code_client, libelle: ref.libelle_fg, ml });
    }
  });
  return { total, detail };
}

// Zones à exclure du stock disponible de jonc — non-conforme / non classé /
// échantillons R&D. Distincte de EMPL_EXCLUS (index.html, pour les tenons/FG) :
// les zones de stockage des joncs bruts ne sont pas les mêmes.
const PULT_EMPL_INCLUS = ['BSBAS1', 'ECOSTK']; // liste blanche stricte, demandée par Stéphane le 13/07/2026

// Stock RÉEL et actuel d'un jonc, calculé directement depuis pcData.stock (le
// même fichier PTSTOCKSIMPLE utilisé partout ailleurs dans l'app) — PAS depuis
// la photo figée du fichier Excel de pultrusion d'origine, qui se périme dès
// qu'un nouveau stock est importé. Retourne null si pcData n'est pas disponible
// ou si ce code n'y apparaît pas du tout (référence pas encore suivie dans cet
// export) — dans ce cas, on retombe sur les chiffres figés (voir pultTotalStock).
function pultGetLiveStock(code) {
  if (typeof pcData === 'undefined' || !pcData.stock || !pcData.stock.length) return null;
  const rows = pcData.stock.filter(r => String(r.CODART||'').trim() === code);
  if (!rows.length) return null;
  const totalPieces = rows
    .filter(r => PULT_EMPL_INCLUS.includes(String(r.EMPLAC||'').trim()))
    .reduce((s,r) => s + (Number(r.QTEEMP)||0), 0);
  return totalPieces; // en pièces/mètres de jonc — à convertir en lots via mlParLot si besoin
}

// Détail RÉEL par zone d'emplacement (ex: ECOSTK, BUSIN1...), pour affichage dans
// la modale de détail. On ne sait pas avec certitude quelle zone correspond à
// "Mezzanine" vs "RTD disponible" dans le fichier Excel d'origine — plutôt que
// de deviner et risquer une mauvaise catégorisation, on affiche les vraies zones
// telles quelles, en mètres. Retourne un tableau vide si pas de stock live.
function pultGetLiveStockByZone(code) {
  if (typeof pcData === 'undefined' || !pcData.stock || !pcData.stock.length) return [];
  const rows = pcData.stock.filter(r => String(r.CODART||'').trim() === code
    && PULT_EMPL_INCLUS.includes(String(r.EMPLAC||'').trim()));
  const byZone = {};
  rows.forEach(r => {
    const z = String(r.EMPLAC||'').trim() || '(zone non renseignée)';
    byZone[z] = (byZone[z]||0) + (Number(r.QTEEMP)||0);
  });
  return Object.entries(byZone).map(([zone, ml]) => ({zone, ml})).sort((a,b) => b.ml - a.ml);
}

function pultTotalStock(ref) {
  const liveMl = pultGetLiveStock(ref.code);
  if (liveMl !== null && ref.mlParLot) {
    return liveMl / ref.mlParLot; // stock réel actuel, converti en lots
  }
  // Repli : photo figée de l'export Excel d'origine (référence pas encore
  // présente dans le stock importé cette session, ou aucun stock importé du tout)
  return (ref.stockMezzLots||0) + (ref.stockRtdLots||0) + (ref.lotsAttente||0);
}

// true si le stock affiché est calculé en direct depuis pcData.stock (fiable,
// à jour), false s'il s'agit du repli sur la photo figée du fichier d'origine.
function pultIsLiveStock(ref) {
  return pultGetLiveStock(ref.code) !== null && !!ref.mlParLot;
}

// Couverture en mois = stock total ÷ limite basse (déjà "1 mois de conso" dans
// le fichier source) — ne PAS recalculer via une autre consommation moyenne,
// ça donnait un résultat légèrement différent du "MOIS DE STOCK" d'origine.
function pultCouvertureMois(ref) {
  if (!ref.limiteBasse || ref.limiteBasse <= 0) return null;
  return pultTotalStock(ref) / ref.limiteBasse;
}

function pultFmtMois(mois) {
  if (mois === null || mois === undefined || !isFinite(mois)) return '—';
  if (mois >= 10) return Math.round(mois) + ' mois';
  return mois.toFixed(1) + ' mois';
}

function pultCouvertureStyle(mois) {
  if (mois === null || mois === undefined) return {bg:'var(--bg)', text:'var(--text-faint)', dot:'var(--text-faint)'};
  if (mois < 1)  return {bg:'#FCEBEB', text:'#A32D2D', dot:'#A32D2D'};
  if (mois < 3)  return {bg:'#FEF5E7', text:'#633806', dot:'#D4880A'};
  return {bg:'#EAF3DE', text:'#27500A', dot:'#1D9E75'};
}

// ── Import d'un export plus récent (remplace PULTRUSION_REFS_DEFAULT) ──────
// Réutilise la même mécanique que les autres imports xlsx de l'app (lazy-load
// SheetJS via loadXLSXForPdp, défini dans pdp.js).
let pultRefsImported = null;
function pultGetActiveRefs() { return pultRefsImported || PULTRUSION_REFS_DEFAULT; }

function pultImportFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (typeof showToast === 'function') showToast('Chargement ' + file.name + '…');
  const reader = new FileReader();
  reader.onload = (e) => {
    const doImport = () => {
      try {
        const wb = XLSX.read(e.target.result, {type:'array', cellDates:true});
        const sheetName = wb.SheetNames.find(n => /planning.*pultrusion/i.test(n)) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:null});
        const refs = [];
        for (let i = 3; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;
          refs.push({
            client: String(row[0]||'').trim(),
            code: String(row[1]||'').trim(),
            fibre: String(row[3]||'').trim(),
            rowing: String(row[4]||'').trim(),
            resine: String(row[5]||'').replace(/\n/g,' ').trim(),
            stockMezzLots: Number(row[6])||0,
            stockMezzMl: Math.round(Number(row[7])||0),
            stockRtdLots: Number(row[8])||0,
            stockRtdMl: Math.round(Number(row[9])||0),
            lotsAttente: Number(row[10])||0,
            lotsQuarantaine: Number(row[11])||0,
            limiteBasse: Number(row[13])||null,
            limiteHaute: Number(row[14])||null,
            mlParLot: null,
            consoLotsMois: null,
          });
        }
        if (!refs.length) { if (typeof showToast === 'function') showToast('Aucune référence reconnue dans ce fichier.'); return; }
        pultRefsImported = refs;
        if (typeof showToast === 'function') showToast(`Pultrusion : ${refs.length} références importées`);
        if (typeof currentView !== 'undefined' && currentView === 'pultrusion' && typeof renderPultrusionPage === 'function') renderPultrusionPage();
        if (typeof scheduleSave === 'function') scheduleSave();
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Erreur import pultrusion : ' + err.message);
      }
    };
    if (typeof loadXLSXForPdp === 'function') loadXLSXForPdp(doImport);
    else if (typeof XLSX !== 'undefined') doImport();
  };
  reader.readAsArrayBuffer(file);
}

// ── OFs de pultrusion en cours ──────────────────────────────────────────────
// Simple suivi (session uniquement — voir note en tête de fichier, même
// limitation que les autres imports de l'app) : un OF de pultrusion représente
// un passage machine en cours sur une référence donnée, sans les étapes
// multiples du Kanban tenon/blister/FG — la pultrusion est un process continu.
let pultOFs = [];
let _pultOfId = 1;

function pultAddOF() {
  const code = document.getElementById('pult-of-ref')?.value;
  const qty = parseFloat(document.getElementById('pult-of-qty')?.value);
  const dateFin = document.getElementById('pult-of-datefin')?.value || null;
  if (!code || !qty || qty <= 0) {
    if (typeof showToast === 'function') showToast('Référence et quantité (en lots) obligatoires.');
    return;
  }
  pultOFs.push({ id: 'PLT-' + (_pultOfId++), code, qty, dateDebut: new Date().toISOString().slice(0,10), dateFin });
  const qtyInp = document.getElementById('pult-of-qty');
  if (qtyInp) qtyInp.value = '';
  renderPultrusionPage();
  if (typeof scheduleSave === 'function') scheduleSave();
}

function pultDeleteOF(id) {
  pultOFs = pultOFs.filter(o => o.id !== id);
  renderPultrusionPage();
  if (typeof scheduleSave === 'function') scheduleSave();
}

// ── Import d'un fichier de forecast ─────────────────────────────────────────
// Reconnaît deux formats :
// 1) "FCT_YYYY" (préféré) : colonnes STK, REF_ITEM2, RPL LONG2, Mois (1-12),
//    Volume — seules les lignes STK='N' sont retenues (confirmé par Stéphane :
//    'N' = les vraies valeurs de forecast, 'O' est un autre signal à ignorer).
// 2) "Vendor Procurement - Delv Date" (Solventum/3M) : colonne Material + une
//    colonne par mois "Month of Mon-YYYY" — repli si le format 1 n'est pas
//    détecté.
function pultImportForecast(input) {
  if (!input || !input.files || !input.files[0]) {
    const inp = document.getElementById('pult-forecast-input');
    if (inp) inp.click();
    return;
  }
  const file = input.files[0];
  if (typeof showToast === 'function') showToast('Chargement ' + file.name + '…');

  const reader = new FileReader();
  reader.onload = (e) => {
    const doImport = () => {
      try {
        const wb = XLSX.read(e.target.result, {type:'array', cellDates:true});

        // Préférer une feuille nommée "FCT..." si elle existe, sinon la première.
        const fctSheetName = wb.SheetNames.find(n => /^FCT/i.test(n)) || wb.SheetNames[0];
        const ws = wb.Sheets[fctSheetName];
        const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:null});

        const headerRowIdx = rows.findIndex(r => r && r.some(c => ['STK','Material'].includes(String(c||'').trim())));
        if (headerRowIdx < 0) { if (typeof showToast === 'function') showToast('Format non reconnu : ni "STK" ni "Material" trouvé en en-tête.'); return; }
        const headerRow = rows[headerRowIdx];
        const colIdx = (name) => headerRow.findIndex(h => String(h||'').trim() === name);

        let result;
        if (colIdx('STK') >= 0 && colIdx('REF_ITEM2') >= 0 && colIdx('Mois') >= 0 && colIdx('Volume') >= 0) {
          // Format FCT_YYYY
          const cStk = colIdx('STK'), cRef = colIdx('REF_ITEM2'), cMois = colIdx('Mois'), cVol = colIdx('Volume');
          const data = {};
          let year = new Date().getFullYear();
          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || !row[cRef]) continue;
            if (String(row[cStk]||'').trim() !== 'N') continue;
            const ref = String(row[cRef]).trim();
            const mois = parseInt(row[cMois]);
            const vol = row[cVol];
            if (!mois || mois < 1 || mois > 12) continue;
            if (!data[ref]) data[ref] = {};
            data[ref][mois] = typeof vol === 'number' ? Math.round(vol*100)/100 : null;
          }
          // Déduire l'année depuis le nom de la feuille si possible (ex: "FCT_2026")
          const ym = fctSheetName.match(/(\d{4})/);
          if (ym) year = parseInt(ym[1]);
          result = { year, data };
        } else if (colIdx('Material') >= 0) {
          // Format Vendor Procurement (Solventum/3M) — repli
          const monthCols = [];
          headerRow.forEach((h, c) => {
            const s = String(h||'').trim();
            if (s.startsWith('Month of ')) monthCols.push({ col: c, label: s.replace('Month of ', '').trim() });
          });
          const vendorPartCol = colIdx('Vendor Part Number');
          const data = {};
          let year = new Date().getFullYear();
          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || !row[colIdx('Material')]) continue;
            const vendorPart = vendorPartCol >= 0 ? row[vendorPartCol] : null;
            if (vendorPart) continue;
            const material = String(row[colIdx('Material')]).trim();
            monthCols.forEach(mc => {
              const lm = mc.label.match(/^([A-Za-z]{3})-(\d{4})$/);
              if (!lm) return;
              const mi = _PULT_MONTH_NAMES.indexOf(lm[1]) + 1;
              const y = parseInt(lm[2]);
              year = y; // approximation : dernière année vue (fichier mono-année dans les faits)
              const v = row[mc.col];
              if (!data[material]) data[material] = {};
              data[material][mi] = typeof v === 'number' ? v : null;
            });
          }
          result = { year, data };
        } else {
          if (typeof showToast === 'function') showToast('Format non reconnu.');
          return;
        }

        const nbRefs = Object.keys(result.data).length;
        if (!nbRefs) { if (typeof showToast === 'function') showToast('Aucune ligne de forecast reconnue dans ce fichier.'); return; }

        pultForecastImported = result;
        if (typeof showToast === 'function') showToast(`Forecast importé : ${nbRefs} références (${result.year})`);
        if (typeof currentView !== 'undefined' && currentView === 'pultrusion' && typeof renderPultrusionPage === 'function') renderPultrusionPage();
        if (typeof scheduleSave === 'function') scheduleSave();
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Erreur import forecast : ' + err.message);
      }
    };
    if (typeof loadXLSXForPdp === 'function') loadXLSXForPdp(doImport);
    else if (typeof XLSX !== 'undefined') doImport();
  };
  reader.readAsArrayBuffer(file);
}


// ── Rendu principal ──────────────────────────────────────────────────────────
let pultSearchFilter = '';
let pultSortField = 'couverture'; // 'couverture' | 'alpha' | 'conso'
function pultSetSort(val) {
  pultSortField = val;
  renderPultrusionPage();
}
let _pultSearchTimer = null;
function pultSearch(val) {
  pultSearchFilter = val;
  clearTimeout(_pultSearchTimer);
  _pultSearchTimer = setTimeout(() => {
    renderPultrusionPage();
    const inp = document.getElementById('pult-search');
    if (inp) { inp.focus(); inp.value = val; }
  }, 200);
}

// ── Détail d'une référence (modale) ─────────────────────────────────────────
function pultShowDetail(code) {
  const refs = pultGetActiveRefs();
  const r = refs.find(x => x.code === code);
  if (!r) return;

  const couverture = pultCouvertureMois(r);
  const style = pultCouvertureStyle(couverture);
  const stock = pultTotalStock(r);
  const isLive = pultIsLiveStock(r);
  const composition = [r.fibre, r.rowing, r.resine].filter(Boolean).join(' · ');
  const ofsRef = pultOFs.filter(o => o.code === r.code);
  const forecast = (typeof pultForecastMlForJonc === 'function') ? pultForecastMlForJonc(r.code) : {total:0, detail:[]};
  const commandesEnCours = (typeof pultCommandesMlForJonc === 'function') ? pultCommandesMlForJonc(r.code) : {total:0, detail:[]};
  const stockNet = stock - (commandesEnCours.total / (r.mlParLot || 1)) - (forecast.total / (r.mlParLot || 1));

  // Historique annuel (en mètres) — en attendant un vrai forecast (voir note
  // pultImportForecast plus haut), c'est la meilleure donnée disponible pour se
  // projeter : elle vient directement du fichier de planning pultrusion fourni.
  const hist = r.historiqueMl || {};
  const annees = Object.keys(hist).filter(a => hist[a] !== null && hist[a] !== undefined);
  const maxHist = Math.max(1, ...annees.map(a => hist[a]));
  const histRows = annees.map(a => {
    const v = hist[a];
    const pct = Math.round(v / maxHist * 100);
    return `<div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:11px;color:var(--text-faint);width:36px;flex-shrink:0">${a}</span>
      <div style="flex:1;height:12px;background:var(--bg);border-radius:6px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${style.dot};border-radius:6px"></div>
      </div>
      <span style="font-size:11px;font-weight:600;width:70px;text-align:right;flex-shrink:0">${v.toLocaleString('fr')} m</span>
    </div>`;
  }).join('');

  const kpi = (label, val) => `<div style="background:var(--bg);border-radius:var(--radius);padding:10px 12px">
    <div style="font-size:9px;color:var(--text-faint);text-transform:uppercase">${label}</div>
    <div style="font-size:16px;font-weight:700">${val}</div>
  </div>`;

  document.getElementById('modal').innerHTML = `
    <div class="modal-header">
      <h2>${r.code}<span style="font-size:12px;font-weight:500;margin-left:10px;padding:3px 10px;border-radius:20px;background:var(--bg);color:var(--text-muted)">${r.client}</span></h2>
      <button class="close-btn" onclick="closeOverlay()"><i class="ti ti-x"></i></button>
    </div>
    <div class="modal-body">
      <div style="font-size:11px;color:var(--text-faint);margin-bottom:14px">${composition}</div>

      <div style="display:flex;gap:10px;margin-bottom:16px">
        <div style="flex:1.3;background:${style.bg};border-radius:var(--radius);padding:12px 14px;text-align:center">
          <div style="font-size:10px;color:${style.text};text-transform:uppercase;font-weight:600">Couverture</div>
          <div style="font-size:22px;font-weight:700;color:${style.text}">${pultFmtMois(couverture)}</div>
        </div>
        <div style="flex:1;background:var(--bg);border-radius:var(--radius);padding:12px 14px;text-align:center">
          <div style="font-size:10px;color:var(--text-faint);text-transform:uppercase">Stock total</div>
          <div style="font-size:22px;font-weight:700">${stock.toLocaleString('fr',{maximumFractionDigits:1})}<span style="font-size:11px;color:var(--text-faint)"> lots</span></div>
        </div>
      </div>

      <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">
        Détail du stock ${isLive ? '<span style="font-weight:400;color:#1D9E75"><i class="ti ti-refresh" style="font-size:11px;vertical-align:-1px"></i> en direct</span>' : '<span style="font-weight:400;color:var(--text-faint)">(photo figée du fichier d\'origine)</span>'}
      </div>
      ${isLive
        ? (() => {
            const zones = pultGetLiveStockByZone(r.code);
            if (!zones.length) return `<div style="font-size:11px;color:var(--text-faint);padding:12px;background:var(--bg);border-radius:var(--radius);margin-bottom:16px;text-align:center">Aucun stock trouvé pour ce code dans l'import en cours.</div>`;
            return `<div style="margin-bottom:16px">${zones.map(z =>
              `<div style="display:flex;justify-content:space-between;padding:7px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:12px">
                <span>${z.zone}</span><span style="font-weight:700">${z.ml.toLocaleString('fr')} m</span>
              </div>`
            ).join('')}</div>`;
          })()
        : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${kpi('Mezzanine (lots)', r.stockMezzLots.toLocaleString('fr',{maximumFractionDigits:1}))}
        ${kpi('Mezzanine (mètres)', r.stockMezzMl.toLocaleString('fr'))}
        ${kpi('RTD disponible (lots)', r.stockRtdLots.toLocaleString('fr',{maximumFractionDigits:1}))}
        ${kpi('RTD disponible (mètres)', r.stockRtdMl.toLocaleString('fr'))}
        ${kpi('Lots en attente CTRL', r.lotsAttente.toLocaleString('fr',{maximumFractionDigits:1}))}
        ${kpi('Lots en quarantaine', r.lotsQuarantaine.toLocaleString('fr',{maximumFractionDigits:1}))}
      </div>`
      }

      ${r.limiteBasse!==null ? `<div style="display:flex;gap:8px;margin-bottom:16px;font-size:11px;color:var(--text-muted)">
        <span>Limite basse : <strong>${r.limiteBasse.toLocaleString('fr',{maximumFractionDigits:1})} lots</strong> (~1 mois de conso)</span>
        ${r.limiteHaute!==null ? `<span>· Limite haute : <strong>${r.limiteHaute.toLocaleString('fr',{maximumFractionDigits:1})} lots</strong></span>` : ''}
      </div>` : ''}

      ${ofsRef.length ? `
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">OF(s) de pultrusion en cours</div>
        <div style="margin-bottom:16px">${ofsRef.map(o => `<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:12px">
          <span><strong>${o.id}</strong> · ${o.qty.toLocaleString('fr')} lots</span>
          <span style="color:var(--text-faint)">${o.dateDebut}${o.dateFin ? ' → '+o.dateFin : ''}</span>
        </div>`).join('')}</div>
      ` : ''}

      <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">
        <i class="ti ti-shopping-cart" style="vertical-align:-2px;margin-right:4px"></i>Commandes en cours (fermes)
      </div>
      ${commandesEnCours.total > 0
        ? `<div style="background:#FCEBEB;border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;text-align:center">
             <div style="font-size:10px;color:#A32D2D;text-transform:uppercase;font-weight:600">Mètres de jonc déjà engagés</div>
             <div style="font-size:22px;font-weight:700;color:#A32D2D">${Math.round(commandesEnCours.total).toLocaleString('fr')} m</div>
           </div>
           <div style="margin-bottom:8px">${commandesEnCours.detail.map(d => `<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:12px">
             <span>${d.libelle}</span><span style="font-weight:600">${Math.round(d.ml).toLocaleString('fr')} m</span>
           </div>`).join('')}</div>
           ${r.mlParLot ? `<div style="font-size:11px;font-weight:600;padding:8px 10px;background:var(--bg);border-radius:6px;margin-bottom:8px">Stock net après commandes + prévision : <strong style="color:${stockNet<0?'#A32D2D':'#27500A'}">${stockNet.toLocaleString('fr',{maximumFractionDigits:1})} lots</strong></div>` : ''}
           <div style="font-size:10px;color:var(--text-faint);margin-bottom:16px">Commandes ouvertes réelles (restant à livrer, hors commandes soldées) pour tous les produits finis qui dépendent de cette matière.</div>`
        : `<div style="font-size:11px;color:var(--text-faint);padding:12px;background:var(--bg);border-radius:var(--radius);text-align:center;margin-bottom:16px">Aucune commande ouverte sur les produits finis qui dépendent de cette matière.</div>`
      }

      <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">
        <i class="ti ti-chart-line" style="vertical-align:-2px;margin-right:4px"></i>Consommation annuelle (mètres)
      </div>
      ${histRows
        ? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">${histRows}</div>
           <div style="font-size:10px;color:var(--text-faint);margin-bottom:16px">Historique du fichier de planning pultrusion (2021-2025).</div>`
        : `<div style="font-size:11px;color:var(--text-faint);padding:12px;background:var(--bg);border-radius:var(--radius);text-align:center;margin-bottom:16px">Pas d'historique disponible pour cette référence.</div>`
      }

      <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">
        <i class="ti ti-trending-up" style="vertical-align:-2px;margin-right:4px"></i>Prévision (forecast, hors commandes déjà connues)
      </div>
      ${forecast.total > 0
        ? `<div style="background:${style.bg};border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;text-align:center">
             <div style="font-size:10px;color:${style.text};text-transform:uppercase;font-weight:600">Mètres de jonc encore à produire</div>
             <div style="font-size:22px;font-weight:700;color:${style.text}">${Math.round(forecast.total).toLocaleString('fr')} m</div>
           </div>
           <div style="margin-bottom:8px">${forecast.detail.map(d => `<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:12px">
             <span>${d.libelle}</span><span style="font-weight:600">${Math.round(d.ml).toLocaleString('fr')} m</span>
           </div>`).join('')}</div>
           <div style="font-size:10px;color:var(--text-faint)">Calculé à partir du forecast importé, en ne comptant que les mois postérieurs à la dernière commande déjà connue pour chaque produit fini concerné.</div>`
        : `<div style="font-size:11px;color:var(--text-faint);padding:12px;background:var(--bg);border-radius:var(--radius);text-align:center">Aucune prévision disponible pour cette matière (soit aucun forecast importé pour les produits qui l'utilisent, soit tout est déjà couvert par des commandes connues).</div>`
      }
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeOverlay()">Fermer</button>
    </div>`;
  document.getElementById('overlay').classList.add('open');
}


function renderPultrusionPage() {
  const el = document.getElementById('view-pultrusion');
  if (!el) return;

  let refs = pultGetActiveRefs();
  const search = pultSearchFilter.toLowerCase();
  if (search) {
    refs = refs.filter(r =>
      r.client.toLowerCase().includes(search) ||
      r.code.toLowerCase().includes(search) ||
      r.fibre.toLowerCase().includes(search)
    );
  }

  // Consommation la plus récente disponible dans l'historique (ex: 2025), utilisée
  // pour le tri "plus consommé".
  function pultDerniereConso(r) {
    const hist = r.historiqueMl || {};
    const annees = Object.keys(hist).filter(a => hist[a] !== null && hist[a] !== undefined).sort();
    if (!annees.length) return null;
    return hist[annees[annees.length - 1]];
  }

  const withCouverture = refs.map(r => ({ r, couverture: pultCouvertureMois(r), stock: pultTotalStock(r), conso: pultDerniereConso(r) }));

  if (pultSortField === 'alpha') {
    withCouverture.sort((a,b) => a.r.code.localeCompare(b.r.code));
  } else if (pultSortField === 'conso') {
    withCouverture.sort((a,b) => {
      const na = a.conso===null, nb = b.conso===null;
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      return b.conso - a.conso; // plus consommé d'abord
    });
  } else {
    withCouverture.sort((a,b) => {
      const na = a.couverture===null, nb = b.couverture===null;
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      return a.couverture - b.couverture;
    });
  }

  const nbCritique = withCouverture.filter(x => x.couverture !== null && x.couverture < 1).length;
  const nbSurveiller = withCouverture.filter(x => x.couverture !== null && x.couverture >= 1 && x.couverture < 3).length;

  // ── Cartes de références ────────────────────────────────────────────────
  const cardsHtml = withCouverture.map(({r, couverture, stock}) => {
    const style = pultCouvertureStyle(couverture);
    const composition = [r.fibre, r.rowing, r.resine].filter(Boolean).join(' · ');
    const ofsRef = pultOFs.filter(o => o.code === r.code);
    const isLive = pultIsLiveStock(r);
    return `<div onclick="pultShowDetail('${r.code.replace(/'/g,"\\'")}')" style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid ${style.dot};border-radius:var(--radius);padding:14px;cursor:pointer;transition:box-shadow .15s" onmouseenter="this.style.boxShadow='0 4px 16px rgba(0,0,0,.1)'" onmouseleave="this.style.boxShadow='none'">
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${r.code}${isLive ? ' <i class="ti ti-refresh" style="font-size:10px;color:#1D9E75;vertical-align:2px" title="Stock en direct depuis le fichier importé"></i>' : ' <i class="ti ti-clock-pause" style="font-size:10px;color:var(--text-faint);vertical-align:2px" title="Photo figée — importe un stock à jour pour un chiffre en direct"></i>'}</div>
          <div style="font-size:10px;color:var(--text-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${composition}">${composition}</div>
        </div>
        <span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;background:${style.bg};color:${style.text};flex-shrink:0">${pultFmtMois(couverture)}</span>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px"><i class="ti ti-building-factory" style="font-size:11px;vertical-align:-1px;margin-right:3px"></i>${r.client}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
        <div style="background:var(--bg);border-radius:6px;padding:6px 8px">
          <div style="color:var(--text-faint);font-size:9px;text-transform:uppercase">Stock lots</div>
          <div style="font-weight:700">${stock.toLocaleString('fr',{maximumFractionDigits:1})}</div>
        </div>
        <div style="background:var(--bg);border-radius:6px;padding:6px 8px">
          <div style="color:var(--text-faint);font-size:9px;text-transform:uppercase">Stock mètres</div>
          <div style="font-weight:700">${(r.stockMezzMl+r.stockRtdMl).toLocaleString('fr')}</div>
        </div>
      </div>
      ${r.lotsAttente > 0 ? `<div style="margin-top:6px;font-size:10px;color:var(--text-muted)"><i class="ti ti-clock" style="font-size:11px;vertical-align:-1px;margin-right:3px"></i>${r.lotsAttente.toLocaleString('fr',{maximumFractionDigits:1})} lot(s) en attente de contrôle</div>` : ''}
      ${r.limiteBasse!==null && stock < r.limiteBasse ? `<div style="margin-top:6px;font-size:10px;font-weight:600;color:#A32D2D"><i class="ti ti-alert-triangle" style="font-size:11px;vertical-align:-1px;margin-right:3px"></i>Sous la limite basse (${r.limiteBasse.toLocaleString('fr',{maximumFractionDigits:1})})</div>` : ''}
      ${ofsRef.length ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:4px">${ofsRef.map(o => `<span style="font-size:9px;font-weight:600;padding:2px 7px;border-radius:20px;background:#FFF4E6;color:#92400E">${o.id} · ${o.qty}L</span>`).join('')}</div>` : ''}
    </div>`;
  }).join('');

  // ── OFs de pultrusion en cours ──────────────────────────────────────────
  const refOptions = refs.map(r => `<option value="${r.code}">${r.code} — ${r.client}</option>`).join('');
  const ofsRowsHtml = pultOFs.length
    ? pultOFs.map(o => {
        const ref = refs.find(r => r.code === o.code);
        return `<tr>
          <td style="font-size:11px;font-weight:700;color:var(--accent)">${o.id}</td>
          <td style="font-size:12px">${o.code}<div style="font-size:9px;color:var(--text-faint)">${ref ? ref.client : ''}</div></td>
          <td style="text-align:right;font-size:12px">${o.qty.toLocaleString('fr')} lots</td>
          <td style="font-size:11px;color:var(--text-muted)">${o.dateDebut}</td>
          <td style="font-size:11px;color:var(--text-muted)">${o.dateFin || '—'}</td>
          <td style="text-align:right"><button onclick="pultDeleteOF('${o.id}')" style="background:none;border:none;cursor:pointer;color:#A32D2D;opacity:.7;padding:4px"><i class="ti ti-trash" style="font-size:13px"></i></button></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-faint)">Aucun OF de pultrusion en cours</td></tr>';

  let html = '<div style="flex:1;overflow-y:auto;padding:0;display:flex;flex-direction:column">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<h2 style="font-size:17px;font-weight:600"><i class="ti ti-columns-2" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Pultrusion</h2>'
    + '<input id="pult-search" placeholder="Filtrer (référence, client, fibre)…" value="'+pultSearchFilter+'" oninput="pultSearch(this.value)" style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none;width:240px">'
    + '<select onchange="pultSetSort(this.value)" style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none">'
    + '<option value="couverture"'+(pultSortField==='couverture'?' selected':'')+'>Trier : couverture (critique d\'abord)</option>'
    + '<option value="alpha"'+(pultSortField==='alpha'?' selected':'')+'>Trier : alphabétique</option>'
    + '<option value="conso"'+(pultSortField==='conso'?' selected':'')+'>Trier : plus consommé</option>'
    + '</select>'
    + '<div style="display:flex;gap:8px;margin-left:auto;flex-wrap:wrap;align-items:center">'
    + (nbCritique ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FCEBEB;color:#A32D2D"><i class="ti ti-alert-circle" style="vertical-align:-2px;margin-right:4px"></i>${nbCritique} &lt; 1 mois</span>` : '')
    + (nbSurveiller ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FEF5E7;color:#633806"><i class="ti ti-clock" style="vertical-align:-2px;margin-right:4px"></i>${nbSurveiller} &lt; 3 mois</span>` : '')
    + '<label class="btn" style="font-size:11px;padding:5px 12px;cursor:pointer"><i class="ti ti-chart-line"></i> Importer forecast<input type="file" accept=".xlsx,.xls" style="display:none" onchange="pultImportForecast(this)"></label>'
    + '<label class="btn" style="font-size:11px;padding:5px 12px;cursor:pointer"><i class="ti ti-upload"></i> Importer<input type="file" accept=".xlsx,.xls,.xlsm" style="display:none" onchange="pultImportFile(this)"></label>'
    + '</div></div>';

  html += '<div style="flex:1;overflow-y:auto;padding:16px 20px">';

  html += '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:10px">Stock de joncs ('+refs.length+' références)</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-bottom:24px">' + (cardsHtml || '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-faint)">Aucune référence</div>') + '</div>';

  html += '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:10px">OF(s) de pultrusion en cours</div>';

  html += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">'
    + '<div style="flex:2;min-width:180px"><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Référence</div>'
    + '<select id="pult-of-ref" style="width:100%;padding:7px 8px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font)"><option value="">Choisir…</option>'+refOptions+'</select></div>'
    + '<div style="flex:1;min-width:90px"><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Qté (lots)</div>'
    + '<input id="pult-of-qty" type="number" min="0.1" step="0.1" placeholder="ex: 5" style="width:100%;padding:7px 8px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font)"></div>'
    + '<div style="flex:1;min-width:130px"><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Fin prévue</div>'
    + '<input id="pult-of-datefin" type="date" style="width:100%;padding:7px 8px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font)"></div>'
    + '<button class="btn btn-primary" onclick="pultAddOF()" style="font-size:12px;padding:8px 14px"><i class="ti ti-plus"></i> Nouvel OF</button>'
    + '</div>';

  html += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow-x:auto">'
    + '<table class="cat-table" style="width:100%"><thead><tr><th>N° OF</th><th>Référence</th><th style="text-align:right">Quantité</th><th>Début</th><th>Fin prévue</th><th></th></tr></thead>'
    + '<tbody>' + ofsRowsHtml + '</tbody></table></div>';

  html += '</div></div>';
  el.innerHTML = html;
}
