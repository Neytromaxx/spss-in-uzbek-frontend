<script setup>
import { useStore } from "vuex";
import VariablesTab from "../components/VariablesTab.vue";
import DataTab from "../components/DataTab.vue";
import ResultsTab from "../components/ResultsTab.vue";
import TopBar from "../components/TopBar.vue";

const store = useStore();
function addRow() {
  store.state.editor.rows.push({});
}
function addVariable() {
  const index = store.state.editor.schema.length + 1;
  store.state.editor.schema.push({
    name: `var_${index}`,
    type: "numeric",
  });
}
</script>

<template>
  <TopBar />
    <div class="tabs">
        <div 
            class="tab"
            :class="{ active: store.state.editor.activeTab === 'variables' }"
            @click="store.commit('editor/SET_TAB','variables')">
            O'zgaruvchilar
        </div>
        <div 
            class="tab"
            :class="{ active: store.state.editor.activeTab === 'data' }"
            @click="store.commit('editor/SET_TAB','data')">
            Ma'lumot
        </div>
        <div 
            class="tab"
            :class="{ active: store.state.editor.activeTab === 'results' }"
            @click="store.dispatch('editor/analyze')">
            Tahlil
        </div>
    </div>

    <VariablesTab v-if="store.state.editor.activeTab==='variables'" />
    <DataTab v-if="store.state.editor.activeTab==='data'" />
    <ResultsTab v-if="store.state.editor.activeTab==='results'" />

    <div class="action-bar">
    <button
      v-if="store.state.editor.activeTab === 'variables'"
      @click="addVariable"
    >
      + O'zgaruvchi qo'shish
    </button>

    <button
      v-if="store.state.editor.activeTab === 'variables'"
      class="primary"
      @click="store.dispatch('editor/saveSchema')"
    >
      O'zgaruvchini saqlash
    </button>

    <button
      v-if="store.state.editor.activeTab === 'data'"
      @click="addRow"
    >
      + Qator qo'shish
    </button>

    <button
      v-if="store.state.editor.activeTab === 'data'"
      class="primary"
      @click="store.dispatch('editor/saveRows')"
    >
      Ma'lumotni saqlash
  </button>
</div>

</template>
<style scoped>
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
  background: #020617;
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