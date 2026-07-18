import api from "../api";

export default {
  namespaced: true,
  state: () => ({
    user: null,
    loading: false,
    // "telegram" | "email" | null (anonim)
    method: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
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
  },

  actions: {
    // Ilova ochilganda: Telegram WebApp bo'lsa avtomatik kiramiz,
    // aks holda saqlangan token orqali sessiyani tiklashga urinamiz.
    async init({ dispatch, commit }) {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        try {
          await dispatch("loginTelegram");
          return;
        } catch (e) {
          console.warn("Telegram auto-login failed:", e);
        }
      }
      // Brauzer/PWA: token bo'lsa foydalanuvchini tiklaymiz (2-bosqichda to'liq)
      const token = localStorage.getItem("token");
      if (token) {
        commit("SET_METHOD", localStorage.getItem("auth_method") || null);
      }
    },

    async loginTelegram({ commit }) {
      commit("SET_LOADING", true);
      try {
        const tg = window.Telegram?.WebApp;
        if (!tg?.initData) throw new Error("Telegram WebApp not found");

        tg.ready();
        const res = await api.post("/auth/telegram", { initData: tg.initData });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("auth_method", "telegram");
        commit("SET_USER", res.data.user);
        commit("SET_METHOD", "telegram");
      } finally {
        commit("SET_LOADING", false);
      }
    },

    logout({ commit }) {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_method");
      commit("LOGOUT");
    },
  },
};
