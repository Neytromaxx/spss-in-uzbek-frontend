import { createStore } from "vuex";
import auth from "./auth";
import files from "./files";
import editor from "./editor.js";

export default createStore({
  modules: {
    auth,
    files,
    editor,
  },
});
