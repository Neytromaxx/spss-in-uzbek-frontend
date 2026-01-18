<script setup>
import { useStore } from "vuex";
import ResultCard from "./ResultCard.vue";

const store = useStore();
</script>

<template>
  <div class="results-tab">
    <h3>Natijalar</h3>

    <div v-if="!store.state.editor.result" class="empty">
      Analiz hali bajarilmadi
    </div>

    <div
      v-else
      class="cards"
    >
      <ResultCard
        v-for="(stats, name) in store.state.editor.result.columns"
        :key="name"
        :name="name"
        :stats="stats"
      />
    </div>
  </div>
</template>

<style scoped>
.results-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.empty {
  opacity: 0.6;
  font-style: italic;
}
</style>
