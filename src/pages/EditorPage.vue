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
async function openTab(tab) {
  store.commit("editor/SET_TAB", tab);

  if (
    tab === "results" &&
    Object.keys(store.state.editor.result.columns).length === 0 &&
    store.state.editor.schema.variables.length > 0 &&
    store.state.editor.rows.length > 0
  ) {
    // 🔥 MAJBURIY SAQLASH
    await store.dispatch("editor/saveRows");

    await store.dispatch("editor/analyze");
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
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  background: rgba(6, 8, 16, .88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--bd);
  position: sticky;
  top: 0;
  z-index: 200;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  cursor: pointer;
  color: var(--t2);
  font-weight: 600;
  font-size: .9rem;
  border-bottom: 2px solid transparent;
  transition: color .2s, border-color .2s;
}

.tab:hover {
  color: var(--t1);
}

.tab.active {
  color: var(--a1);
  border-bottom: 2px solid var(--a1);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px clamp(16px, 4vw, 32px);
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

.action-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px clamp(16px, 4vw, 32px);
  background: rgba(6, 8, 16, .92);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--bd);
}
</style>