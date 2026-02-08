<script setup>
import { ref } from "vue";
import { useStore } from "vuex";

import TopBar from "../components/TopBar.vue";
import VariablesTab from "../components/VariablesTab.vue";
import DataTab from "../components/DataTab.vue";
import ResultsTab from "../components/ResultsTab.vue";

const store = useStore();

const varsTabRef = ref(null);
const dataTabRef = ref(null);

/* ===============================
   TAB SWITCH
================================ */
function openTab(tab) {
  store.commit("editor/SET_TAB", tab);

  if (
    tab === "results" &&
    Object.keys(store.state.editor.result.columns).length === 0 &&
    store.state.editor.schema.variables.length > 0 &&
    store.state.editor.rows.length > 0
  ) {
    store.dispatch("editor/analyze");
  }
}

</script>

<template>
  <div class="editor">
    <!-- TOP BAR -->
    <TopBar />

    <!-- TABS -->
    <div class="tabs">
      <div
        class="tab"
        :class="{ active: store.state.editor.activeTab === 'variables' }"
        @click="openTab('variables')"
      >
        O‘zgaruvchilar
      </div>

      <div
        class="tab"
        :class="{ active: store.state.editor.activeTab === 'data' }"
        @click="openTab('data')"
      >
        Ma’lumot
      </div>

      <div
        class="tab"
        :class="{ active: store.state.editor.activeTab === 'results' }"
        @click="openTab('results')"
      >
        Tahlil
      </div>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <VariablesTab
        v-if="store.state.editor.activeTab === 'variables'"
        ref="varsTabRef"
      />

      <DataTab
        v-if="store.state.editor.activeTab === 'data'"
        ref="dataTabRef"
      />

      <ResultsTab
        v-if="store.state.editor.activeTab === 'results'"
      />
    </div>

    <!-- ACTION BAR -->
    <div class="action-bar">
      <!-- VARIABLES ACTIONS -->
      <template v-if="store.state.editor.activeTab === 'variables'">
        <button
          @click="varsTabRef.addVariable()"
        >
          + O‘zgaruvchi qo‘shish
        </button>

        <button
          class="primary"
          :disabled="store.state.editor.saving"
          @click="store.dispatch('editor/saveSchema')"
        >
          Saqlash
        </button>
      </template>

      <!-- DATA ACTIONS -->
      <template v-if="store.state.editor.activeTab === 'data'">
        <button
          @click="dataTabRef.addRow()"
        >
          + Qator qo‘shish
        </button>

        <button
          class="primary"
          :disabled="store.state.editor.saving"
          @click="store.dispatch('editor/saveRows')"
        >
          Saqlash
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f1115;
}

.tabs {
  display: flex;
  background: #020617;
  border-bottom: 1px solid #1f2937;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  cursor: pointer;
  color: #9ca3af;
  font-weight: 600;
  border-bottom: 3px solid transparent;
}

.tab.active {
  color: #fff;
  border-bottom: 3px solid #2563eb;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 12px;
  background: #020617;
  border-top: 1px solid #1f2937;
}
</style>
