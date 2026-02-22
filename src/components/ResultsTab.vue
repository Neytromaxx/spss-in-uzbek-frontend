<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import ResultCard from "./analysis/ResultCard.vue";

const emit = defineEmits(["openAnalyze"]);
const store = useStore();

const result = computed(() =>
  store.state.editor.analyze.result
);

const analyzing = computed(() =>
  store.state.editor.analyze.analyzing
);
</script>

<template>
  <div class="results-tab">

    <!-- HEADER -->
    <div class="results-header">
      <h3>Tahlil</h3>
      <button class="primary" @click="emit('openAnalyze')">
        Yangi tahlil
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="analyzing" class="muted">
      Hisoblanmoqda...
    </div>

    <!-- EMPTY -->
    <div v-else-if="!result" class="empty">
      Hali tahlil yo‘q
    </div>

    <!-- RESULT -->
    <ResultCard
      v-else
      :result="result"
    />

  </div>
</template>

<style scoped>
.results-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-card {
  background: #111827;
  padding: 16px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
}

.result-table td,
.result-table th {
  border-bottom: 1px solid #1f2937;
  padding: 6px;
}

.block {
  margin-bottom: 16px;
}

.meta {
  opacity: 0.5;
  font-size: 12px;
}

.sig {
  margin-left: 4px;
  font-weight: bold;
  color: #facc15;
}

.empty,
.muted {
  opacity: 0.6;
}
</style>