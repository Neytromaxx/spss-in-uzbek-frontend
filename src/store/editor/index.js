// store/editor/index.js

import editorCore from "./editorCore";
import editorSchema from "./editorSchema";
import editorData from "./editorData";
import analyze from "./analyze";

export default {
  namespaced: true,
  modules: {
    core: editorCore,
    schema: editorSchema,
    data: editorData,
    analyze,
  },
};