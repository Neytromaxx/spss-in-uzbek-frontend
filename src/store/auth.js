import api from "../api";

export default {
  namespaced: true,
  state: () => ({
    user: null,
    loading: false,
  }),

  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_LOADING(state, v) {
      state.loading = v;
    },
  },

  actions: {
    async login({ commit }) {
      commit("SET_LOADING", true);
      try {
        const tg = window.Telegram?.WebApp;
        if (!tg) throw new Error("Telegram WebApp not found");

        tg.ready();
        const initData = tg.initData;

        const res = await api.post("/auth/telegram", { initData });
        localStorage.setItem("token", res.data.token);
        commit("SET_USER", res.data.user);
      } finally {
        commit("SET_LOADING", false);
      }
    },
  },
};