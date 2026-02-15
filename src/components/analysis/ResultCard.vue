<script setup>
import { computed } from "vue";

const props = defineProps({
  result: Object,
});

function fmt(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return Number(value).toFixed(digits);
}

const type = computed(() => props.result.type);
const data = computed(() => props.result.data);
</script>

<template>
  <div class="result-card">

    <div class="card-header">
      <strong>{{ type }}</strong>
      <button
        class="danger small"
        @click="$emit('remove', result.id)"
      >
        ✕
      </button>
    </div>

    <!-- ========================= -->
    <!-- DESCRIPTIVE -->
    <!-- ========================= -->
    <div v-if="type === 'descriptive'">
      <div
        v-for="(col, name) in data.columns"
        :key="name"
        class="block"
      >
        <h4>{{ col.label || name }}</h4>

        <table class="result-table">
          <tbody>
            <tr><td>N</td><td>{{ col.descriptive.n }}</td></tr>
            <tr><td>Mean</td><td>{{ fmt(col.descriptive.mean) }}</td></tr>
            <tr><td>SD</td><td>{{ fmt(col.descriptive.std_dev) }}</td></tr>
            <tr><td>Min</td><td>{{ col.descriptive.min }}</td></tr>
            <tr><td>Max</td><td>{{ col.descriptive.max }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================= -->
    <!-- CORRELATION -->
    <!-- ========================= -->
    <div v-else-if="type === 'correlation'">
      <table class="result-table">
        <thead>
          <tr>
            <th></th>
            <th
              v-for="(row, name) in data.matrix"
              :key="name"
            >
              {{ name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, name) in data.matrix"
            :key="name"
          >
            <th>{{ name }}</th>
            <td
              v-for="(cell, colName) in row"
              :key="colName"
            >
              {{ fmt(cell.r) }}
              <span v-if="cell.p < 0.05">*</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ========================= -->
    <!-- T-TEST -->
    <!-- ========================= -->
    <div v-else-if="type === 'ttest_ind'">
      <table class="result-table">
        <tbody>
          <tr><td>n1</td><td>{{ data.result.n1 }}</td></tr>
          <tr><td>n2</td><td>{{ data.result.n2 }}</td></tr>
          <tr><td>Mean1</td><td>{{ fmt(data.result.mean1) }}</td></tr>
          <tr><td>Mean2</td><td>{{ fmt(data.result.mean2) }}</td></tr>
          <tr><td>t</td><td>{{ fmt(data.result.t) }}</td></tr>
          <tr><td>df</td><td>{{ data.result.df }}</td></tr>
          <tr><td>p</td><td>{{ fmt(data.result.p, 4) }}</td></tr>
          <tr><td>Cohen's d</td><td>{{ fmt(data.result.cohens_d) }}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ========================= -->
    <!-- FALLBACK -->
    <!-- ========================= -->
    <div v-else class="muted">
      Unknown analysis type
    </div>

  </div>
</template>

<style scoped>
.result-card {
  background: #111827;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
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

.muted {
  opacity: 0.6;
}
</style>
