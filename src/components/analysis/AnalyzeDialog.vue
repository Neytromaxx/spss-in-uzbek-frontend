<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";

import CorrelationForm from "./CorrelationForm.vue";
import TTestForm from "./TTestForm.vue";

const store = useStore();

const visible = ref(false);
const type = ref("correlation");

function open() {
  visible.value = true;
}

function close() {
  visible.value = false;
}

async function runAnalysis(payload) {
  await store.dispatch("analysis/analyze", payload);
  close();
}

defineExpose({ open });
</script>

<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal">

      <div class="modal-header">
        <h3>Tahlil tanlang</h3>
        <button class="danger small" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <div class="analysis-types">
          <button
            :class="{ active: type === 'correlation' }"
            @click="type = 'correlation'"
          >
            Correlation
          </button>

          <button
            :class="{ active: type === 'ttest_ind' }"
            @click="type = 'ttest_ind'"
          >
            Independent t-test
          </button>
        </div>

        <div class="analysis-form">
          <CorrelationForm
            v-if="type === 'correlation'"
            @submit="runAnalysis"
          />

          <TTestForm
            v-if="type === 'ttest_ind'"
            @submit="runAnalysis"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  width: 800px;
  background: #111827;
  border-radius: 10px;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-types {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.analysis-types button {
  padding: 8px 14px;
  background: #1f2937;
  border: none;
  cursor: pointer;
}

.analysis-types button.active {
  background: #2563eb;
  color: white;
}
</style>