import { createStore } from "vuex";
import auth from "./auth";
import files from "./files";
import editor from "./editor";
// import index from "./editor/index"

export default createStore({
  modules: {
    auth,
    files,
    editor,
    // editor: index,
  },
});
