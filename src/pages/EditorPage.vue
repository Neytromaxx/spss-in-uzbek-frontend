<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";

import TopBar from "../components/TopBar.vue";
import VariablesTab from "../components/VariablesTab.vue";
import DataTab from "../components/DataTab.vue";
import ResultsTab from "../components/ResultsTab.vue";
import AnalyzeDialog from "../components/analysis/AnalyzeDialog.vue";

const store = useStore();
const route = useRoute();
const dialogRef = ref(null);

function openAnalyze(){
  dialogRef.value?.open()
}

const activeTab = computed(() =>
  store.state.editor.core.activeTab
);

function openTab(tab) {
  store.commit("editor/core/SET_TAB", tab);
}

/* ===============================
   LOAD FILE FROM ROUTE
================================ */

async function loadFile(id){
  if(!id) return;

  store.commit("editor/core/RESET");
  await store.dispatch("editor/core/open", id);
}

onMounted(() => {
  loadFile(route.params.id);
});

watch(
  () => route.params.id,
  (newId) => {
    loadFile(newId);
  }
);
</script>

<template>
  <div class="editor">
    <TopBar />

    <!-- TABS -->
    <div class="tabs">
      <div
        class="tab"
        :class="{ active: activeTab === 'variables' }"
        @click="openTab('variables')"
      >
        O‘zgaruvchilar
      </div>

      <div
        class="tab"
        :class="{ active: activeTab === 'data' }"
        @click="openTab('data')"
      >
        Ma’lumot
      </div>

      <div
        class="tab"
        :class="{ active: activeTab === 'results' }"
        @click="openTab('results')"
      >
        Tahlil
      </div>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <VariablesTab v-if="activeTab === 'variables'" />
      <DataTab v-if="activeTab === 'data'" />
      <ResultsTab v-if="activeTab === 'results'"
        @openAnalyze="openAnalyze" />
      <AnalyzeDialog ref="dialogRef" />
    </div>

    <!-- ACTION BAR -->
    <div class="action-bar">
      <!-- VARIABLES -->
      <template v-if="activeTab === 'variables'">
        <button
          @click="store.commit('editorCore/SET_SAVED', false)"
        >
          O‘zgaruvchini saqlash kerak
        </button>

        <button
          class="primary"
          :disabled="store.state.editorCore.saving"
          @click="store.dispatch('editorCore/saveSchema')"
        >
          Saqlash
        </button>
      </template>

      <!-- DATA -->
      <template v-if="activeTab === 'data'">
        <button
          @click="store.commit(
            'editorData/ADD_ROW',
            store.state.editorCore.schema.variables
          )"
        >
          + Qator qo‘shish
        </button>

        <button
          class="primary"
          @click="store.dispatch('editorData/saveRows')"
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