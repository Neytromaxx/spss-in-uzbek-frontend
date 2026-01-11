<script setup>
import { useStore } from "vuex";

const store = useStore();

function add() {
  store.state.editor.schema.push({
    name: "var_" + Date.now(),
    type: "numeric",
  });
}
</script>

<template>
  <h3>Variables</h3>
  <button @click="add">+ Add</button>

  <div v-for="v in store.state.editor.schema" :key="v.name">
    <input v-model="v.name" />
    <select v-model="v.type">
      <option value="numeric">Numeric</option>
      <option value="categorical">Categorical</option>
    </select>
  </div>

  <button @click="store.dispatch('editor/saveSchema')">Save</button>
</template>
