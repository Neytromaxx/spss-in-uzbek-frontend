import api from "../api";

export default {
  namespaced: true,
  state: () => ({
    user: null,
    loading: false,
    method: null, // "telegram" | "email" | null (anonim)
    loginVisible: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    displayName: (state) => {
      const u = state.user;
      if (!u) return "";
      if (u.first_name) return [u.first_name, u.last_name].filter(Boolean).join(" ");
      return u.email || u.telegram_id || "Foydalanuvchi";
    },

    // Kutubxonachi yoki undan yuqori (backend: accounts/roles.py).
    //
    // Backenddagi `UserOut.role` izohi shuni talab qiladi: "Frontend
    // interfeysni shu maydon bo'yicha yig'adi: rolga to'g'ri kelmaydigan
    // tugmalar UMUMAN chizilmaydi." Ya'ni bu getter bilan tugma
    // yashiriladi, foydalanuvchi 403 ga urilib ovora bo'lmaydi.
    isLibrarian: (state) => ["librarian", "admin"].includes(state.user?.role),
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_LOADING(state, v) {
      state.loading = v;
    },
    SET_METHOD(state, m) {
      state.method = m;
    },
    LOGOUT(state) {
      state.user = null;
      state.method = null;
    },
    SET_LOGIN_VISIBLE(state, v) {
      state.loginVisible = v;
    },
  },

  actions: {
    // Ilova ochilganda sessiyani tiklaydi (token bo'lsa /auth/me).
    async init({ commit, dispatch }) {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData && !localStorage.getItem("token")) {
        // Telegram WebApp ichida ochilgan bo'lsa ham hozircha anonim
        // ishlaymiz; kirish LoginModal orqali (deep-link/email).
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await api.get("/auth/me");
        commit("SET_USER", res.data);
        commit("SET_METHOD", localStorage.getItem("auth_method") || null);
      } catch {
        // token eskirgan
        dispatch("logout");
      }
    },

    // ── Email OTP ──
    async requestEmailCode(_ctx, email) {
      await api.post("/auth/email/request", { email });
    },

    async verifyEmail({ dispatch }, { email, code }) {
      const res = await api.post("/auth/email/verify", { email, code });
      await dispatch("_completeLogin", { token: res.data.token, user: res.data.user, method: "email" });
    },

    // ── Telegram deep-link ──
    async telegramStart() {
      const res = await api.post("/auth/telegram/start");
      return res.data; // { token, deep_link, expires_in }
    },

    // token — telegram/start dan olingan login token
    async telegramPoll({ dispatch }, loginToken) {
      const res = await api.get("/auth/telegram/poll", { params: { token: loginToken } });
      if (res.data.status === "ready") {
        await dispatch("_completeLogin", {
          token: res.data.token,
          user: res.data.user,
          method: "telegram",
        });
        return true;
      }
      return false;
    },

    // Login yakunlash: token saqlaymiz, anonim fayllarni biriktiramiz, user
    async _completeLogin({ commit, dispatch }, { token, user, method }) {
      localStorage.setItem("token", token);
      localStorage.setItem("auth_method", method);
      commit("SET_USER", user);
      commit("SET_METHOD", method);
      try {
        await api.post("/files/claim");
      } catch {
        /* claim ixtiyoriy — xato bo'lsa ham login davom etadi */
      }
      // biriktirilgan fayllar ro'yxatini yangilaymiz
      dispatch("files/load", null, { root: true });
    },

    logout({ commit, dispatch }) {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_method");
      commit("LOGOUT");
      dispatch("files/load", null, { root: true });
    },
  },
};
