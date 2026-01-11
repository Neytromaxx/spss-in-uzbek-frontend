<script setup>
import { useStore } from "vuex";
const store = useStore();
</script>

<template>
  <div>
    <button @click="store.commit('editor/SET_FILE',null)">⬅ Back</button>
    <strong>{{ store.state.editor.file.title }}</strong>
  </div>
</template>
