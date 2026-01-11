import { createStore } from "vuex";
import auth from "./auth";
import files from "./files";
import editor from "./editor";

export default createStore({
  modules: {
    auth,
    files,
    editor,
  },
});
