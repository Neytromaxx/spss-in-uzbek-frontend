import { createStore } from "vuex";
import auth from "./auth";
import files from "./files";
import editor from "./editor.js";
import sozlamalar from "./sozlamalar";

export default createStore({
  modules: {
    auth,
    files,
    editor,
    sozlamalar,
  },
});
