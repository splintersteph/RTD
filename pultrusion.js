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
const TENON_TO_JONC = [{"codart_wip": "TENON_W0_JTO", "matiere": "JTO3_2.5", "tenonsParMl": 42, "diametre": 1.1}, {"codart_wip": "TENON_W1_JTO", "matiere": "JTO3_2.5", "tenonsParMl": 42, "diametre": 1.3}, {"codart_wip": "TENON_W2_JTO", "matiere": "JTO3_2.5", "tenonsParMl": 42, "diametre": 1.6}, {"codart_wip": "TENON_W3_JTO", "matiere": "JTO3_2.5", "tenonsParMl": 42, "diametre": 1.9}, {"codart_wip": "TENON_W40_JTO_XRO3%", "matiere": "JTO_XRO_3%", "tenonsParMl": null, "diametre": null}, {"codart_wip": "TENON_W41_JTO_XRO3%", "matiere": "JTO_XRO_3%", "tenonsParMl": null, "diametre": null}, {"codart_wip": "TENON_W42_JTO_XRO3%", "matiere": "JTO_XRO_3%", "tenonsParMl": null, "diametre": null}, {"codart_wip": "TENON_W43_JTO_XRO3%", "matiere": "JTO_XRO_3%", "tenonsParMl": null, "diametre": null}, {"codart_wip": "K_300_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": 56, "diametre": 1.2}, {"codart_wip": "K_1.2_ROD_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "K05_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 46, "diametre": 1.38}, {"codart_wip": "K09_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 46, "diametre": 1.78}, {"codart_wip": "K11L27_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 31, "diametre": 1.98}, {"codart_wip": "K07_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 46, "diametre": 1.58}, {"codart_wip": "TENON_K05_L27_C_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "K09_L27_JNTXRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 31, "diametre": 1.78}, {"codart_wip": "K07L27_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 31, "diametre": 1.58}, {"codart_wip": "K_135_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 48, "diametre": 1.58}, {"codart_wip": "K_145_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 48, "diametre": 1.78}, {"codart_wip": "K_155_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": 48, "diametre": 1.98}, {"codart_wip": "K_101_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 65, "diametre": 1.12}, {"codart_wip": "K_104_JNT_XRO_IND_C", "matiere": "JNT_XRO_2.5", "tenonsParMl": 61, "diametre": 1.32}, {"codart_wip": "K_105_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": 50, "diametre": 1.54}, {"codart_wip": "K_107_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 61, "diametre": 1.52}, {"codart_wip": "K_108_JNT_XRO_INDC", "matiere": "JNT_XRO_2.5", "tenonsParMl": 50, "diametre": 1.74}, {"codart_wip": "K_110_JNT_XRO", "matiere": "JNT_XRO_2.5", "tenonsParMl": 61, "diametre": 1.72}, {"codart_wip": "K_111_JNT_XRO_1", "matiere": "JNT_XRO_2.5", "tenonsParMl": 50, "diametre": 1.94}, {"codart_wip": "RS_1275_ROSE", "matiere": "JTO_ROUGE_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1208_ROSE", "matiere": "JTO_ROUGE_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1209_ROSE", "matiere": "JTO_ROUGE_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1210_ROSE", "matiere": "JTO_ROUGE_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1495_BLEU", "matiere": "JTO_BLEU_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1410_BLEU", "matiere": "JTO_BLEU_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1411_BLEU", "matiere": "JTO_BLEU_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1412_BLEU", "matiere": "JTO_BLEU_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1610_JAUNE", "matiere": "JTO_JAUNE_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1611_JAUNE", "matiere": "JTO_JAUNE_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1612_JAUNE", "matiere": "JTO_JAUNE_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "RS_1613_JAUNE", "matiere": "JTO_JAUNE_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S1_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S2_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S3_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S4_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S5_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S6_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S1_JTO", "matiere": "JTO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S2_JTO", "matiere": "JTO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S3_JTO", "matiere": "JTO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S4_JTO", "matiere": "JTO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S5_JTO", "matiere": "JTO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "S6_JTO", "matiere": "JTO_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "TENON_N0_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": null, "diametre": null}, {"codart_wip": "TENON_N1_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": null, "diametre": null}, {"codart_wip": "TENON_N2_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": null, "diametre": null}, {"codart_wip": "TENON_N3_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": null, "diametre": null}, {"codart_wip": "TENON_N4_IND_E_1", "matiere": "JNT _XRO", "tenonsParMl": null, "diametre": null}, {"codart_wip": "L01_JTR", "matiere": "JTR_2.5", "tenonsParMl": 46, "diametre": 1}, {"codart_wip": "L02_JTR", "matiere": "JTR_2.5", "tenonsParMl": 46, "diametre": 1.25}, {"codart_wip": "L03_JTR", "matiere": "JTR_2.5", "tenonsParMl": 46, "diametre": 1.5}, {"codart_wip": "AI1_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "AI2_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "AI3_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "AI4_JTO_BLANC", "matiere": "JTO_2.5_BLANC", "tenonsParMl": null, "diametre": null}, {"codart_wip": "AE1_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_JAUNE", "tenonsParMl": 48, "diametre": 1.35}, {"codart_wip": "AE2_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_ROUGE", "tenonsParMl": 48, "diametre": 1.47}, {"codart_wip": "AE3_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_BLEU", "tenonsParMl": 48, "diametre": 1.67}, {"codart_wip": "AE4_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_VERT", "tenonsParMl": 48, "diametre": 1.83}, {"codart_wip": "AE5_ILLUSION_X-RO", "matiere": "JTO_ILLUSI_XRO_NOIR", "tenonsParMl": 48, "diametre": 2.04}, {"codart_wip": "AE6_ILLUSION_X-RO", "matiere": "JTO_XRO", "tenonsParMl": 48, "diametre": 2.22}, {"codart_wip": "AE1_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": 1.35}, {"codart_wip": "AE2_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": 1.47}, {"codart_wip": "AE3_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": 1.67}, {"codart_wip": "AE4_JTR", "matiere": "JTR_2.5", "tenonsParMl": 48, "diametre": 1.83}, {"codart_wip": "ML_OVALE_1", "matiere": "JTO_ILLXRO_JAUNEØ3.5", "tenonsParMl": 46, "diametre": 1.83}, {"codart_wip": "ML_OVALE_2", "matiere": "JTO_ILLXRO_ROUGEØ3.5", "tenonsParMl": 46, "diametre": 1.83}, {"codart_wip": "ML_OVALE_3", "matiere": "JTO_ILLXRO_BLEU_Ø3.5", "tenonsParMl": 46, "diametre": 1.83}, {"codart_wip": "ML_OVALE_4", "matiere": "JTO_ILLXRO_VERT_Ø3.5", "tenonsParMl": 46, "diametre": 1.83}, {"codart_wip": "AD1_JTR", "matiere": "JTR_2.5", "tenonsParMl": 57, "diametre": 1.02}, {"codart_wip": "AD2_JTR", "matiere": "JTR_2.5", "tenonsParMl": 50, "diametre": 1.22}, {"codart_wip": "AD3_JTR", "matiere": "JTR_2.5", "tenonsParMl": 46, "diametre": 1.42}, {"codart_wip": "AD4_JTR", "matiere": "JTR_2.5", "tenonsParMl": 41, "diametre": 1.62}, {"codart_wip": "80.04SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 43, "diametre": 1.25}, {"codart_wip": "90.06SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 43, "diametre": 1.52}, {"codart_wip": "100.08SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 43, "diametre": 1.8}, {"codart_wip": "120.10SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 43, "diametre": 2.18}, {"codart_wip": "80.04_ILLU_XRO_NOIR", "matiere": "JTO_ILLUSI_XRO_NOIR", "tenonsParMl": 42, "diametre": 1.25}, {"codart_wip": "90.06_ILLU_XRO_ROUGE", "matiere": "JTO_ILLUSI_XRO_ROUGE", "tenonsParMl": 42, "diametre": 1.52}, {"codart_wip": "100.08_ILLU_XRO_JAUN", "matiere": "JTO_ILLUSI_XRO_JAUNE", "tenonsParMl": 42, "diametre": 1.8}, {"codart_wip": "120.10_ILLU_XRO_BLEU", "matiere": "JTO_ILLUSI_XRO_BLEU", "tenonsParMl": 42, "diametre": 2.18}, {"codart_wip": "90SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 44, "diametre": 1.21}, {"codart_wip": "100SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 44, "diametre": 1.31}, {"codart_wip": "120SG_JTR", "matiere": "JTR_2.5", "tenonsParMl": 44, "diametre": 1.53}, {"codart_wip": "90.06AG_JTR", "matiere": "JTR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "100.08AG_JTR", "matiere": "JTR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "120.10AG_JTR", "matiere": "JTR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "PF_0.8__22MM_JAR", "matiere": "JAR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "PF_1.0__22MM_JAR", "matiere": "JAR_2.5", "tenonsParMl": null, "diametre": null}, {"codart_wip": "PF_1.2_JAR", "matiere": "JAR_2.5", "tenonsParMl": 38, "diametre": 1.2}, {"codart_wip": "PF_1.4_JAR", "matiere": "JAR_2.5", "tenonsParMl": 38, "diametre": 1.4}, {"codart_wip": "PF_1.6_JAR", "matiere": "JAR_2.5", "tenonsParMl": 38, "diametre": 1.6}, {"codart_wip": "16_JAR", "matiere": "JAR_2.5", "tenonsParMl": 53, "diametre": 1}, {"codart_wip": "17_JAR", "matiere": "JAR_2.5", "tenonsParMl": 50, "diametre": 1.2}, {"codart_wip": "18_JAR", "matiere": "JAR_2.5", "tenonsParMl": 48, "diametre": 1.4}, {"codart_wip": "19_JAR", "matiere": "JAR_2.5", "tenonsParMl": 46, "diametre": 1.6}, {"codart_wip": "AH1", "matiere": "JAR_2.5", "tenonsParMl": 42, "diametre": 1.02}, {"codart_wip": "AH2", "matiere": "JAR_2.5", "tenonsParMl": 42, "diametre": 1.22}, {"codart_wip": "AH3", "matiere": "JAR_2.5", "tenonsParMl": 42, "diametre": 1.42}, {"codart_wip": "AH4", "matiere": "JAR_2.5", "tenonsParMl": 42, "diametre": 1.62}];

const PULTRUSION_REFS_DEFAULT = [{"client": "3M", "code": "JTO3_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 35.12, "stockMezzMl": 15804, "stockRtdLots": 5.51, "stockRtdMl": 2478, "lotsAttente": 3, "lotsQuarantaine": 0, "limiteBasse": 11.14, "limiteHaute": 267.38, "mlParLot": 450, "consoLotsMois": 9.536, "historiqueMl": {"2021": 46331, "2022": 65100, "2023": 51572, "2024": 43269, "2025": 51207}}, {"client": "Maillefer", "code": "JTO_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 2.27, "stockMezzMl": 2043, "stockRtdLots": 4.42, "stockRtdMl": 3982, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.42, "limiteHaute": 10.16, "mlParLot": 900, "consoLotsMois": 0.439, "historiqueMl": {"2021": 6972, "2022": 5252, "2023": 4271, "2024": 3978, "2025": 3240}}, {"client": "DT / MATCHPOST", "code": "JTR_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M300", "stockMezzLots": 6.23, "stockMezzMl": 5610, "stockRtdLots": 1.24, "stockRtdMl": 1113, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 1.75, "limiteHaute": 41.91, "mlParLot": 900, "consoLotsMois": 1.813, "historiqueMl": {"2021": 18280, "2022": 19991, "2023": 17349, "2024": 17956, "2025": 24349}}, {"client": "GC", "code": "JAR_2.5", "fibre": "AR600TEX", "rowing": "", "resine": "BIS GMA SR239", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0, "stockRtdMl": 0, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": null, "limiteHaute": null, "mlParLot": 900, "consoLotsMois": 1.785, "historiqueMl": {"2021": 18519, "2022": 23741, "2023": 18399, "2024": 19288, "2025": 16447}}, {"client": "Tokuyamma/shofu", "code": "JAR_2.5", "fibre": "AR600TEX", "rowing": "", "resine": "BIS GMA SR239", "stockMezzLots": 7.19, "stockMezzMl": 6468, "stockRtdLots": 1.71, "stockRtdMl": 1539, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 2.52, "limiteHaute": 60.6, "mlParLot": 900, "consoLotsMois": 1.785, "historiqueMl": {"2021": 18519, "2022": 23741, "2023": 18399, "2024": 19288, "2025": 16447}}, {"client": "3M", "code": "JTO_XRO_3%", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 7.08, "stockMezzMl": 3186, "stockRtdLots": 1.85, "stockRtdMl": 834, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 2.35, "limiteHaute": 56.37, "mlParLot": 450, "consoLotsMois": 1.723, "historiqueMl": {"2021": 8969, "2022": 6394, "2023": 8234, "2024": 9274, "2025": 13649}}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_ROUGEØ3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.05, "stockMezzMl": 942, "stockRtdLots": 0.24, "stockRtdMl": 219, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.08, "limiteHaute": 1.95, "mlParLot": 500, "consoLotsMois": 0.042, "historiqueMl": {"2021": 345, "2022": 345, "2023": 225, "2024": 48, "2025": 296}}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_BLEU_Ø3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.13, "stockMezzMl": 1020, "stockRtdLots": 0.49, "stockRtdMl": 441, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.47, "mlParLot": 500, "consoLotsMois": 0.035, "historiqueMl": {"2021": 267, "2022": 0, "2023": 144, "2024": 495, "2025": 133}}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_JAUNEØ3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 1.1, "stockMezzMl": 990, "stockRtdLots": 0.33, "stockRtdMl": 300, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.05, "limiteHaute": 1.16, "mlParLot": 500, "consoLotsMois": 0.024, "historiqueMl": {"2021": 124, "2022": 136, "2023": 180, "2024": 51, "2025": 216}}, {"client": "Macrolock oval", "code": "JTO_ILLXRO_VERT_Ø3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 0.61, "stockMezzMl": 549, "stockRtdLots": 0.32, "stockRtdMl": 285, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.36, "mlParLot": 500, "consoLotsMois": 0.042, "historiqueMl": {"2021": 0, "2022": 0, "2023": 0, "2024": 1107, "2025": 139}}, {"client": "Macrolock", "code": "JTO_XRO", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.0, "stockMezzMl": 903, "stockRtdLots": 0.93, "stockRtdMl": 836, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.01, "limiteHaute": 0.14, "mlParLot": 900, "consoLotsMois": 0.156, "historiqueMl": {"2021": 810, "2022": 132, "2023": 0, "2024": 1098, "2025": 6399}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_ROUGE", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.16, "stockMezzMl": 1044, "stockRtdLots": 0.51, "stockRtdMl": 456, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.69, "limiteHaute": 16.62, "mlParLot": 900, "consoLotsMois": 0.754, "historiqueMl": {"2021": 9908, "2022": 9334, "2023": 7310, "2024": 7533, "2025": 6615}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_NOIR", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.3, "stockRtdMl": 266, "lotsAttente": 2, "lotsQuarantaine": 0, "limiteBasse": 0.25, "limiteHaute": 6.04, "mlParLot": 900, "consoLotsMois": 0.271, "historiqueMl": {"2021": 3720, "2022": 2595, "2023": 2883, "2024": 2904, "2025": 2538}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_JAUNE", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 1.8, "stockMezzMl": 1623, "stockRtdLots": 0.38, "stockRtdMl": 339, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.6, "limiteHaute": 14.45, "mlParLot": 900, "consoLotsMois": 0.528, "historiqueMl": {"2021": 8272, "2022": 6828, "2023": 3929, "2024": 4511, "2025": 4981}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_BLEU", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.83, "stockRtdMl": 747, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.34, "limiteHaute": 8.13, "mlParLot": 900, "consoLotsMois": 0.327, "historiqueMl": {"2021": 4231, "2022": 5910, "2023": 2028, "2024": 2181, "2025": 3309}}, {"client": "DT+Macrolock", "code": "JTO_ILLUSI_XRO_VERT", "fibre": "1200 TEX XRO", "rowing": "200 TEX XRO", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.55, "stockRtdMl": 1394, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.1, "limiteHaute": 2.35, "mlParLot": 900, "consoLotsMois": 0.097, "historiqueMl": {"2021": 1392, "2022": 2548, "2023": 288, "2024": 432, "2025": 580}}, {"client": "Komet / ULTRADENT", "code": "JNT_XRO_2.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 2.04, "stockMezzMl": 1020, "stockRtdLots": 1.39, "stockRtdMl": 693, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 1.81, "limiteHaute": 43.43, "mlParLot": 500, "consoLotsMois": 1.682, "historiqueMl": {"2021": 13152, "2022": 8599, "2023": 10502, "2024": 9328, "2025": 8874}}, {"client": "Komet", "code": "JNT_XRO_3.5", "fibre": "1200 TEX XRO", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.08, "stockRtdMl": 324, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.5, "limiteHaute": 11.89, "mlParLot": 300, "consoLotsMois": 0.463, "historiqueMl": {"2021": 2206, "2022": 1383, "2023": 2225, "2024": 1547, "2025": 967}}, {"client": "Apol", "code": "JTO_ROUGE_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0.4, "stockMezzMl": 360, "stockRtdLots": 0.3, "stockRtdMl": 272, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.03, "limiteHaute": 0.62, "mlParLot": 900, "consoLotsMois": 0.036, "historiqueMl": {"2021": 638, "2022": 288, "2023": 324, "2024": 141, "2025": 576}}, {"client": "Apol", "code": "JTO_BLEU_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.81, "stockRtdMl": 731, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.05, "limiteHaute": 1.31, "mlParLot": 900, "consoLotsMois": 0.036, "historiqueMl": {"2021": 680, "2022": 292, "2023": 349, "2024": 240, "2025": 378}}, {"client": "Apol", "code": "JTO_JAUNE_2.5", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 1.34, "stockRtdMl": 1205, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.02, "limiteHaute": 0.49, "mlParLot": 900, "consoLotsMois": 0.02, "historiqueMl": {"2021": 340, "2022": 127, "2023": 329, "2024": 120, "2025": 162}}, {"client": "Maillefer", "code": "JTO_2.5_BLANC", "fibre": "AR1200TEX", "rowing": "", "resine": "M640", "stockMezzLots": 0, "stockMezzMl": 0, "stockRtdLots": 0.62, "stockRtdMl": 558, "lotsAttente": 0, "lotsQuarantaine": 0, "limiteBasse": 0.33, "limiteHaute": 7.97, "mlParLot": 900, "consoLotsMois": 0.339, "historiqueMl": {"2021": 4977, "2022": 3149, "2023": 4811, "2024": 3717, "2025": 1656}}];

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

function pultTotalStock(ref) {
  return (ref.stockMezzLots||0) + (ref.stockRtdLots||0) + (ref.lotsAttente||0);
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
}

function pultDeleteOF(id) {
  pultOFs = pultOFs.filter(o => o.id !== id);
  renderPultrusionPage();
}

// ── Import futur de fichiers de forecast (à venir) ──────────────────────────
// Prévu : lier un ou plusieurs fichiers de prévision de vente/commande par
// client pour estimer la consommation annuelle de chaque référence de jonc, et
// comparer au stock/à la capacité de pultrusion disponible. Pas encore
// implémenté — en attente des fichiers de forecast réels pour connaître leur
// structure exacte, comme pour tous les autres imports de cette app.
function pultImportForecast() {
  if (typeof showToast === 'function') showToast('Import de forecast : bientôt disponible — envoie un exemple de fichier pour que ce soit branché.');
}


// ── Rendu principal ──────────────────────────────────────────────────────────
let pultSearchFilter = '';
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
  const composition = [r.fibre, r.rowing, r.resine].filter(Boolean).join(' · ');
  const ofsRef = pultOFs.filter(o => o.code === r.code);

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

      <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">Détail du stock</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${kpi('Mezzanine (lots)', r.stockMezzLots.toLocaleString('fr',{maximumFractionDigits:1}))}
        ${kpi('Mezzanine (mètres)', r.stockMezzMl.toLocaleString('fr'))}
        ${kpi('RTD disponible (lots)', r.stockRtdLots.toLocaleString('fr',{maximumFractionDigits:1}))}
        ${kpi('RTD disponible (mètres)', r.stockRtdMl.toLocaleString('fr'))}
        ${kpi('Lots en attente CTRL', r.lotsAttente.toLocaleString('fr',{maximumFractionDigits:1}))}
        ${kpi('Lots en quarantaine', r.lotsQuarantaine.toLocaleString('fr',{maximumFractionDigits:1}))}
      </div>

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
        <i class="ti ti-chart-line" style="vertical-align:-2px;margin-right:4px"></i>Consommation annuelle (mètres)
      </div>
      ${histRows
        ? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">${histRows}</div>
           <div style="font-size:10px;color:var(--text-faint)">Historique du fichier de planning pultrusion — sera remplacé par une vraie prévision une fois le forecast lié (bouton "Forecast" en haut de l'onglet).</div>`
        : `<div style="font-size:11px;color:var(--text-faint);padding:12px;background:var(--bg);border-radius:var(--radius);text-align:center">Pas d'historique disponible pour cette référence.</div>`
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

  const withCouverture = refs.map(r => ({ r, couverture: pultCouvertureMois(r), stock: pultTotalStock(r) }));
  withCouverture.sort((a,b) => {
    const na = a.couverture===null, nb = b.couverture===null;
    if (na && nb) return 0;
    if (na) return 1;
    if (nb) return -1;
    return a.couverture - b.couverture;
  });

  const nbCritique = withCouverture.filter(x => x.couverture !== null && x.couverture < 1).length;
  const nbSurveiller = withCouverture.filter(x => x.couverture !== null && x.couverture >= 1 && x.couverture < 3).length;

  // ── Cartes de références ────────────────────────────────────────────────
  const cardsHtml = withCouverture.map(({r, couverture, stock}) => {
    const style = pultCouvertureStyle(couverture);
    const composition = [r.fibre, r.rowing, r.resine].filter(Boolean).join(' · ');
    const ofsRef = pultOFs.filter(o => o.code === r.code);
    return `<div onclick="pultShowDetail('${r.code.replace(/'/g,"\\'")}')" style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid ${style.dot};border-radius:var(--radius);padding:14px;cursor:pointer;transition:box-shadow .15s" onmouseenter="this.style.boxShadow='0 4px 16px rgba(0,0,0,.1)'" onmouseleave="this.style.boxShadow='none'">
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${r.code}</div>
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
    + '<div style="display:flex;gap:8px;margin-left:auto;flex-wrap:wrap;align-items:center">'
    + (nbCritique ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FCEBEB;color:#A32D2D"><i class="ti ti-alert-circle" style="vertical-align:-2px;margin-right:4px"></i>${nbCritique} &lt; 1 mois</span>` : '')
    + (nbSurveiller ? `<span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background:#FEF5E7;color:#633806"><i class="ti ti-clock" style="vertical-align:-2px;margin-right:4px"></i>${nbSurveiller} &lt; 3 mois</span>` : '')
    + '<button class="btn" onclick="pultImportForecast()" style="font-size:11px;padding:5px 12px"><i class="ti ti-chart-line"></i> Forecast (bientôt)</button>'
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
