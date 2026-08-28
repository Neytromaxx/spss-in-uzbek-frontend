// api/errors.js
//
// Backend xatolarini foydalanuvchiga ko'rsatiladigan MATNGA aylantiradi.
//
// 🔴 NIMA UCHUN KERAK
//
// Hamma joyda `e.response?.data?.detail || "..."` yozilgandi. Bu `detail`
// SATR bo'lganda ishlaydi (`app/core/errors.py` shunday qaytaradi), lekin
// backendda uch xil shakl bor:
//
//   1. HTTPException          -> { detail: "matn" }
//   2. FastAPI validatsiyasi  -> { detail: [ {loc, msg, type}, ... ] }   (422)
//   3. RFC 9457 (catalog,     -> { title, detail, status, ... }
//      ingest, survey)
//
// 2-holatda `detail` massiv bo'lgani uchun Vue uni "[object Object]"
// ko'rinishida chizardi — foydalanuvchi nima xato qilganini bilmasdi.
//
// `zaxira` — hech narsa aniqlanmaganda ko'rsatiladigan matn.
export function xatoMatni(e, zaxira = "Kutilmagan xatolik") {
  const data = e?.response?.data;

  if (!data) {
    // Javob umuman kelmagan: tarmoq uzilishi yoki CORS.
    return e?.message ? `${zaxira} (${e.message})` : zaxira;
  }

  if (typeof data === "string") return data;

  const d = data.detail;

  if (typeof d === "string" && d) return d;

  // FastAPI validatsiya xatolari: har biri {loc, msg, type}.
  if (Array.isArray(d) && d.length) {
    const matnlar = d
      .map((x) => {
        if (typeof x === "string") return x;
        const maydon = Array.isArray(x?.loc) ? x.loc[x.loc.length - 1] : null;
        const msg = x?.msg || "";
        return maydon && msg ? `${maydon}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (matnlar.length) return matnlar.join("; ");
  }

  // RFC 9457
  if (typeof data.title === "string" && data.title) return data.title;

  return zaxira;
}
