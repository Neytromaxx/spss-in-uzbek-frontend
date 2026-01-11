<script setup>
import { useStore } from "vuex";

const store = useStore();
</script>

<template>
  <h3>Ma'lumot</h3>

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
</template>
