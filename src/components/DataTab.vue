<script setup>
import { useStore } from "vuex";

const store = useStore();

function addRow() {
  store.state.editor.rows.push({});
}
</script>

<template>
  <h3>Data</h3>
  <button @click="addRow">+ Row</button>

  <table>
    <tr>
      <th v-for="v in store.state.editor.schema" :key="v.name">
        {{ v.name }}
      </th>
    </tr>

    <tr v-for="(row,i) in store.state.editor.rows" :key="i">
      <td v-for="v in store.state.editor.schema" :key="v.name">
        <input v-model="row[v.name]" />
      </td>
    </tr>
  </table>

  <button @click="store.dispatch('editor/saveRows')">Save</button>
</template>
