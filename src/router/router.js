import { createRouter, createWebHistory } from "vue-router";
import FilesPage from "../pages/FilesPage.vue";
import EditorPage from "../pages/EditorPage.vue";
import TelegramGate from "../pages/TelegramGate.vue";
import store from "../store";

const routes = [
  { path: "/gate", component: TelegramGate },
  { path: "/", component: FilesPage },
  { path: "/files/:id", component: EditorPage, props: true },
];

const router = createRouter({
  history: createWebHistory(),
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
    if (to.path === "/" && store.state.editor.file) {
      store.commit("editor/RESET");
    }
  });
  
export default router;