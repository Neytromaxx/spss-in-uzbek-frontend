import { createStore } from "vuex";
import auth from "./auth";
import files from "./files";
import index from "./editor/index"

export default createStore({
  modules: {
    auth,
    files,
    editor: index,
  },
});
