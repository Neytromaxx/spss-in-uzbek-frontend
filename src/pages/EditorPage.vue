<script setup>
import { useStore } from "vuex";
import VariablesTab from "../components/VariablesTab.vue";
import DataTab from "../components/DataTab.vue";
import ResultsTab from "../components/ResultsTab.vue";
import TopBar from "../components/TopBar.vue";

const store = useStore();
</script>

<template>
  <TopBar />

  <div>
    <button @click="store.commit('editor/SET_TAB','variables')">Variables</button>
    <button @click="store.commit('editor/SET_TAB','data')">Data</button>
    <button @click="store.dispatch('editor/analyze')">Analyze</button>
  </div>

  <VariablesTab v-if="store.state.editor.activeTab==='variables'" />
  <DataTab v-if="store.state.editor.activeTab==='data'" />
  <ResultsTab v-if="store.state.editor.activeTab==='results'" />
</template>
