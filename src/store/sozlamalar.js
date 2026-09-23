// store/sozlamalar.js — foydalanuvchi sozlamalari.
//
// Qiymatlar `localStorage` da, hisobda EMAS: ular ANONIM
// foydalanuvchida ham kerak (tahlil login talab qilmaydi) va
// bittasi ham server bilmasligi shart bo'lgan narsa emas —
// shunchaki interfeys sozlamasi.
//
// Mantiq `src/sozlamalar.js` da (sof modul), bu yerda faqat
// Vuex bog'lanishi.

import { SUKUT_PREFIKS, prefiksXatosi, prefiksniOqi, prefiksniYoz } from "../sozlamalar";

export default {
  namespaced: true,

  state: () => ({
    nomPrefiksi: prefiksniOqi(),
  }),

  mutations: {
    SET_NOM_PREFIKSI(state, prefiks) {
      // 🔴 YAROQSIZ QIYMAT SAQLANMAYDI. Aks holda foydalanuvchi
      // `1a` deb yozib, keyin filtr shartida ishlamaydigan
      // ustunlar yasab qo'yardi va sababini topa olmasdi.
      const p = String(prefiks ?? "").trim();
      if (prefiksXatosi(p)) return;
      state.nomPrefiksi = p;
      prefiksniYoz(p);
    },

    SOZLAMALARNI_TIKLA(state) {
      state.nomPrefiksi = SUKUT_PREFIKS;
      prefiksniYoz(SUKUT_PREFIKS);
    },
  },
};
