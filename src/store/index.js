import { createStore } from "vuex";
import auth from "./auth";
import files from "./files";
import editorCore from "./editor/editorCore";
import editorData from "./editor/editorData";
import analysis from "./editor/analysis";

export default createStore({
  modules: {
    auth,
    files,
    editorCore,
    editorData,
    analysis
  },
});
