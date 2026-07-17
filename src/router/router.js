import { createRouter, createWebHashHistory } from "vue-router";
import FilesPage from "../pages/FilesPage.vue";
import EditorPage from "../pages/EditorPage.vue";
import InfoPage from "../pages/InfoPage.vue";
import TelegramGate from "../pages/TelegramGate.vue";
import MainView from "../layouts/MainView.vue"
import store from "../store";

const routes = [
  { path: "/gate", component: TelegramGate },
  { path: "/files", component: FilesPage },
  { path: "/", component: MainView },
  { path: "/files/:id", component: EditorPage, props: true },
  { path: "/info", component: InfoPage },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

/* ===============================
   GLOBAL GUARD
================================ */
router.beforeEach(async (to) => {
    const isTelegram = !!window.Telegram?.WebApp;
  
    // Telegram gate
    if (!isTelegram && to.path !== "/gate") {
      return "/gate";
    }
  
    // Editor open
    if (to.path.startsWith("/files/")) {
      const id = to.params.id;
  
      if (
        !store.state.editor.core.file ||
        store.state.editor.core.file.id !== id
      ) {
        try {
          await store.dispatch("editor/core/open", id);
        } catch (e) {
          return "/";
        }
      }
    }
  
    // Agar editor yopilgan bo‘lsa, URL’ni tozalaymiz
    if (to.path === "/" && store.state.editor.core.file) {
      store.commit("editor/core/RESET");
    }
  });
  
export default router;