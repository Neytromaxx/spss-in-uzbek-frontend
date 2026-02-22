<script setup>
import { onMounted } from "vue";
import { useStore } from "vuex";
import FilesPage from "./pages/FilesPage.vue";
import EditorPage from "./pages/EditorPage.vue";

const store = useStore();

onMounted(() => {
  store.dispatch("auth/login");
});
</script>
<template>
  <div class="wrapper">
    <div v-if="store.state.auth.loading">
      Yuklanmoqda...
    </div>
    <FilesPage v-if="!store.state.editor.file" />
  <EditorPage v-else />
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
