<script setup>
import { useStore } from "vuex";
const store = useStore();
</script>

<template>
  <h3>Natija</h3>
  <p>O'zgaruvchilar nomi: {{ Object.keys(store.state.editor.result.columns).length }}</p>
  <div v-for="(r,name) in store.state.editor.result.columns" :key="name">
    <h4>{{ name }}</h4>
    <pre>{{ r }}</pre>
  </div>
</template>
