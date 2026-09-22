// src/tahlil-rollari.js — qaysi tahlil qaysi o'lchov turini qabul qiladi.
//
// ── 🔴 BU JADVAL O'YLAB TOPILMAGAN ──
//
// Har bir qator backenddagi `require_measure(...)` chaqiruvidan
// olingan (`grep -rn "require_measure" app/`). «Mantiqan shunday
// bo'lishi kerak» degan bitta qator ham yo'q — chunki jadval
// backenddan chetga chiqsa, ikki xil xato chiqadi:
//
//   qattiqroq bo'lsa  → foydalanuvchi TO'G'RI tahlilni qila olmaydi
//                       va sababini hech qayerda ko'rmaydi;
//   yumshoqroq bo'lsa → «Hisoblash» dan keyin backend xatosi.
//
// Birinchisi aynan shu vazifa tuzatayotgan nuqson edi: Likert
// bandi (`ordinal`) Mann-Uitni ro'yxatida ko'rinmasdi, holbuki
// noparametrik test aynan uning uchun mo'ljallangan.
//
// ── NIMA UCHUN FRONTENDDA ──
//
// To'g'ri joyi — backend (`GET /analyze/catalog`). Lekin hozir
// frontend mos kelmaganlarni OLDINDAN ko'rsatishi kerak, ya'ni
// qoidalar so'rovdan oldin qo'lda bo'lishi shart. Marshrut
// qo'shilganda bu fayl o'sha javob bilan almashtiriladi —
// jadvalning shakli ataylab javob shaklida.
//
// ── QOIDA: TEKSHIRUV YO'Q BO'LSA, CHEKLOV HAM YO'Q ──
//
// Backend biror rolni tekshirmasa, frontend o'zidan cheklov
// qo'ymaydi. Bitta istisno — `group`: u yerda `require_measure`
// yo'q (faqat `require_group_count` darajalar sonini sanaydi),
// lekin guruhlovchi o'zgaruvchi ma'no jihatidan TOIFA bo'ladi va
// ro'yxatga 40 xil qiymatli `yosh` ni qo'shish foydasiz. Bu
// jadvaldagi YAGONA statistik qaror va shuning uchun shu yerda
// yozib qo'yilgan.

import { olchovNomi } from "./olchov";

// Tahlillar katalogi. `AnalysisPanel` shu ro'yxatdan chizadi —
// ilgari u komponent ichida edi va `ROLLAR` bilan mos kelishini
// hech narsa tekshirmasdi.
export const TAHLILLAR = [
  { key: "auto", label: "Avtomatik (tavsifiy + chastota)" },
  { key: "correlation", label: "Korrelyatsiya" },
  { key: "reliability", label: "Ishonchlilik (Kronbax alfa)" },
  { key: "partial_correlation", label: "Qisman korrelyatsiya" },
  { key: "normality", label: "Normallik testi" },
  { key: "ttest_ind", label: "Bog'liqsiz t-test" },
  { key: "ttest_paired", label: "Juft t-test" },
  { key: "anova_oneway", label: "Bir omilli ANOVA" },
  { key: "mannwhitney", label: "Mann-Uitni U (noparametrik)" },
  { key: "wilcoxon", label: "Uilkokson (noparametrik juft)" },
  { key: "kruskal", label: "Kruskal-Uollis H (noparametrik)" },
  { key: "friedman", label: "Fridman (noparametrik takroriy)" },
  { key: "crosstab", label: "Kesishma jadvali + xi-kvadrat" },
  { key: "chi_gof", label: "Xi-kvadrat moslik testi" },
  { key: "fisher", label: "Fisher aniq testi (2×2)" },
  { key: "regression_linear", label: "Chiziqli regressiya" },
];

// Backenddagi nomlangan to'plamlar — shu nomlar bilan, chunki
// o'zgarganda `grep` ikkala tomonni ham topsin.
const NUM = ["scale", "ordinal"]; // nonparametric.py:31 `_NUM`
const CAT = ["nominal", "ordinal"]; // categorical.py:21 `_CAT`
const SCALE = ["scale"];

// Rol kaliti = backend `params` dagi kalit. Boshqacha nomlansa,
// jadvalni so'rov bilan solishtirish qiyin bo'lardi.
export const ROLLAR = {
  auto: {},

  reliability: { items: NUM }, //                 reliability.py:35
  correlation: { variables: NUM }, //             correlation.py:68
  partial_correlation: {
    variables: SCALE, //                          partial.py:41
    control: SCALE, //                            partial.py:41 (names + controls)
  },
  normality: { variables: SCALE }, //             normality.py:88

  ttest_ind: {
    dependent: SCALE, //                          ttest.py:38
    group: CAT, //                                tekshiruv yo'q — yuqoridagi izohga qarang
  },
  ttest_paired: { variables: SCALE }, //          ttest.py:175
  anova_oneway: {
    dependent: SCALE, //                          anova.py:226
    group: CAT,
  },

  mannwhitney: {
    dependent: NUM, //                            nonparametric.py:55
    group: CAT,
  },
  wilcoxon: { variables: NUM }, //                nonparametric.py:160
  kruskal: {
    dependent: NUM, //                            nonparametric.py:252
    group: CAT,
  },
  friedman: { variables: NUM }, //                nonparametric.py:311

  crosstab: { variables: CAT }, //                categorical.py:62
  chi_gof: { variables: CAT }, //                 categorical.py:179
  fisher: { variables: CAT }, //                  categorical.py:231

  regression_linear: {
    dependent: SCALE, //                          regression.py:42
    predictors: SCALE, //                         regression.py:44
  },
};

/** Rol qabul qiladigan turlar. Cheklov yo'q bo'lsa — `null`. */
export function rolTurlari(tahlil, rol) {
  return ROLLAR[tahlil]?.[rol] ?? null;
}

/** O'zgaruvchi shu rolga mos keladimi? */
export function mosmi(tahlil, rol, measure) {
  const turlar = rolTurlari(tahlil, rol);
  // Cheklov yo'q → hammasi mos. Bu «bilmayman» emas, ataylab
  // ochiq qoldirilgan rol degani.
  if (!turlar) return true;
  return turlar.includes(measure);
}

/** Ro'yxatni mos va mos kelmaganlarga ajratadi (tartib saqlanadi). */
export function ajrat(ozgaruvchilar, tahlil, rol) {
  const mos = [];
  const nomos = [];
  for (const v of ozgaruvchilar || []) {
    (mosmi(tahlil, rol, v.measure) ? mos : nomos).push(v);
  }
  return { mos, nomos };
}

/** Rol nimani qabul qilishini o'zbekcha aytadi.
 *
 * «Ro'yxatda yo'q: guruh — hozir «O'lchov / ball» turida» degan
 * izohning ikkinchi yarmi shu yerdan chiqadi.
 */
export function rolTalabi(tahlil, rol) {
  const turlar = rolTurlari(tahlil, rol);
  if (!turlar) return "";
  return turlar.map(olchovNomi).join(" yoki ");
}
