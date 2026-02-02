<script setup>
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();

const columns = computed(
  () => store.state.editor.result?.columns
);
console.log("store.state.editor.result.columns", store.state.editor.result?.columns)
</script>

<template>
  <div class="results-tab">
    <h3>Tahlil natijalari</h3>

    <div v-if="!columns" class="empty">
      Avval tahlilni ishga tushiring
    </div>

    <div v-else class="results-list">
      <div
        v-for="(col, name) in columns"
        :key="name"
        class="result-block"
      >
        <h4>
          {{ col.label || name }}
          <span class="meta">({{ col.measure }})</span>
        </h4>

        <!-- DESCRIPTIVE -->
        <table
          v-if="col.analysis === 'descriptive'"
          class="result-table"
        >
          <tbody>
            <tr><td>N</td><td>{{ col.descriptive.n }}</td></tr>
            <tr><td>Min</td><td>{{ col.descriptive.min }}</td></tr>
            <tr><td>Max</td><td>{{ col.descriptive.max }}</td></tr>
            <tr><td>O‘rtacha</td><td>{{ col.descriptive.mean.toFixed(3) }}</td></tr>
            <tr><td>Median</td><td>{{ col.descriptive.median }}</td></tr>
            <tr><td>SD</td><td>{{ col.descriptive.sd.toFixed(3) }}</td></tr>
            <tr><td>Q1</td><td>{{ col.descriptive.q1 }}</td></tr>
            <tr><td>Q2</td><td>{{ col.descriptive.q2 }}</td></tr>
            <tr><td>Q3</td><td>{{ col.descriptive.q3 }}</td></tr>
            <tr><td>Skewness</td><td>{{ col.descriptive.skewness.toFixed(3) }}</td></tr>
            <tr><td>Kurtosis</td><td>{{ col.descriptive.kurtosis_excess.toFixed(3) }}</td></tr>
          </tbody>
        </table>

        <!-- FREQUENCY -->
        <table
          v-else-if="col.analysis === 'frequency'"
          class="result-table"
        >
          <thead>
            <tr>
              <th>Qiymat</th>
              <th>Chastota</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in col.frequency.table"
              :key="row.value"
            >
              <td>{{ row.label || row.value }}</td>
              <td>{{ row.count }}</td>
              <td>{{ row.percent.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- FALLBACK -->
        <div v-else class="muted">
          Ushbu o‘zgaruvchi uchun natija yo‘q
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #e5e7eb;
}

.empty {
  opacity: 0.6;
  font-style: italic;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-block {
  border: 1px solid #1f2937;
  padding: 12px;
  background: #020617;
  border-radius: 8px;
}

.result-block h4 {
  margin-bottom: 8px;
}

.meta {
  font-size: 12px;
  opacity: 0.6;
  margin-left: 6px;
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

.result-table th {
  color: #9ca3af;
  font-weight: 600;
}

.muted {
  opacity: 0.6;
}
</style>
