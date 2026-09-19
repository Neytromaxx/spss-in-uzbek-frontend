// src/natijalar.js — natija elementining o'ziga xosligi.
//
// ⚠️ BU QOIDA IKKI TILDA YOZILGAN
//
// Aynan shu mantiq backendda ham bor
// (`app/modules/statistics/results.py`). Ikkala tomonda kerak,
// chunki birlashtirish ikki joyda bajariladi: backend saqlangan
// dublni tozalaydi, frontend esa sessiya ro'yxatini yig'adi.
// Python va JS kodni baham ko'ra olmaydi.
//
// Ikkinchi nusxa — bu kodbazada odatda qochadigan narsa. Bu yerda
// undan qutulib bo'lmaydi, shuning uchun ikkala tomonga ham AYNAN
// bir xil holatlar ro'yxati test qilib yozilgan: kalit tartibi,
// `null` va yo'q maydon, ichma-ich obyekt, massiv tartibi.

const BOSH_PARAMS = "{}";

/** `null` maydonlarni olib tashlaydi, obyekt kalitlarini saralaydi.
 *
 * MASSIV TARTIBI SAQLANADI: `{variables: ["a","b"]}` va
 * `{variables: ["b","a"]}` — ikki xil tahlil. Korrelyatsiya
 * matritsasida ustunlar tartibi natijada ko'rinadi.
 */
function tozala(qiymat) {
  if (Array.isArray(qiymat)) return qiymat.map(tozala);
  if (qiymat && typeof qiymat === "object") {
    const chiqish = {};
    // `JSON.stringify` JS'da kalitlarni SARALAMAYDI (Python'dagi
    // `sort_keys` ning egizagi yo'q), shuning uchun saralash shu
    // yerda — har bir ichki daraja uchun.
    for (const k of Object.keys(qiymat).sort()) {
      if (qiymat[k] === null || qiymat[k] === undefined) continue;
      chiqish[k] = tozala(qiymat[k]);
    }
    return chiqish;
  }
  return qiymat;
}

/** Parametrlarning barqaror matn ko'rinishi. */
export function kanonikParams(params) {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return BOSH_PARAMS;
  }
  return JSON.stringify(tozala(params));
}

/** Elementni aniqlaydigan uchlik — bitta satr. */
export function natijaKaliti(type, params, rowsHash) {
  return `${type || "auto"}\u0000${kanonikParams(params)}\u0000${rowsHash || ""}`;
}

let hisoblagich = 0;

/** Mijoz tomonidagi `id`.
 *
 * `crypto.randomUUID` hamma joyda yo'q (eski WebView, HTTP
 * kontekst), shuning uchun zaxira bilan.
 */
export function yangiId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  hisoblagich += 1;
  return `n${Date.now()}-${hisoblagich}`;
}

/** `AnalyzeResponse` ni ro'yxat elementiga aylantiradi.
 *
 * 🔴 `title` va `meta` NI TASHLAB YUBORMAYMIZ.
 *
 * Ilgari bu yerda faqat type/params/columns/tables olinardi va
 * ikkita narsa jimgina yo'qolardi:
 *
 *   1. `title` — ro'yxat uni ko'rsatmoqchi bo'lardi, lekin u hech
 *      qachon kelmagani uchun DOIM "Tahlil natijasi" zaxira matni
 *      chiqardi. Ya'ni "Chiziqli regressiya" ham, "Kruskal-Uollis
 *      H testi" ham bir xil ko'rinardi.
 *
 *   2. `meta.warnings` va `meta.assumptions` — backend ularni
 *      to'ldiradi. Bular statistikada bezak emas: masalan kategorik
 *      tahlilda "kutilgan chastota 5 dan kichik" ogohlantirishi
 *      natijani ishonchsiz qiladi. Foydalanuvchi buni umuman
 *      ko'rmasdi.
 */
export function natijaElementi(payload, qoshimcha = {}) {
  const r = payload?.result || {};
  return {
    id: yangiId(),
    type: payload?.type ?? null,
    params: payload?.params ?? null,
    title: r.title ?? null,
    meta: r.meta ?? null,
    charts: r.charts ?? [],
    columns: r.legacy_columns?.columns ?? r.columns ?? {},
    tables: r.tables ?? [],
    rows_hash: payload?.rows_hash ?? null,
    created_at: new Date().toISOString(),
    saved: false,
    saved_id: payload?.saved_id ?? null,
    stale: false,
    // Yangi natija sukut bo'yicha eksportga kiradi — foydalanuvchi
    // uni endigina bajardi.
    selected: true,
    ...qoshimcha,
  };
}

/** Ko'rsatish uchun sarlavha — backend `_natija_sarlavhasi` bilan bir xil. */
export function natijaSarlavhasi(element) {
  return element?.title || element?.type || "Tahlil natijasi";
}
