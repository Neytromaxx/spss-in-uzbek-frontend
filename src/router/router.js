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

router.beforeEach(async (to) => {
  const isTelegram = !!window.Telegram?.WebApp;

  if (!isTelegram && to.path !== "/gate") {
    return "/gate";
  }

  if (to.path.startsWith("/files/")) {
    const id = to.params.id;
    if (!store.state.editor.file || store.state.editor.file.id !== id) {
      await store.dispatch("editor/open", id);
    }
  }
});

export default router;