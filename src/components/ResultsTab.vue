<script setup>
import { computed } from "vue";
import { useStore } from "vuex";

const emit = defineEmits(["openAnalyze"]);
const store = useStore();

/* ===============================
   STATE
================================ */

const results = computed(() =>
  store.state.analysis?.results ?? []
);

const analyzing = computed(() =>
  store.state.analysis?.analyzing ?? false
);

/* ===============================
   HELPERS
================================ */

function fmt(value, digits = 3) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "—";
  }
  return Number(value).toFixed(digits);
}

function removeResult(id) {
  store.commit("analysis/REMOVE_RESULT", id);
}

/* significance marker */
function star(p) {
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "";
}
</script>

<template>
  <div class="results-tab">

    <!-- HEADER -->
    <div class="results-header">
      <h3>Tahlillar</h3>
      <button class="primary" @click="emit('openAnalyze')">
        + Yangi tahlil
      </button>
    </div>

    <!-- ANALYZING -->
    <div v-if="analyzing" class="muted">
      Hisoblanmoqda...
    </div>

    <!-- EMPTY -->
    <div v-if="!analyzing && results.length === 0" class="empty">
      Hali tahlil yo‘q
    </div>

    <!-- RESULT CARDS -->
    <div
      v-for="r in results"
      :key="r.id"
      class="result-card"
    >
      <!-- CARD HEADER -->
      <div class="card-header">
        <div>
          <strong>{{ r.type }}</strong>
        </div>

        <button
          class="danger small"
          @click="removeResult(r.id)"
        >
          ✕
        </button>
      </div>

      <!-- ========================= -->
      <!-- DESCRIPTIVE -->
      <!-- ========================= -->
      <div v-if="r.type === 'descriptive'">

        <div
          v-for="(col, name) in r.data?.columns || {}"
          :key="name"
          class="block"
        >
          <h4>
            {{ col.label || name }}
            <span class="meta">
              ({{ col.measure }})
            </span>
          </h4>

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
      <div v-else-if="r.type === 'correlation'">

        <table class="result-table">
          <thead>
            <tr>
              <th></th>
              <th
                v-for="(row, name) in r.data?.matrix || {}"
                :key="name"
              >
                {{ name }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, name) in r.data?.matrix || {}"
              :key="name"
            >
              <th>{{ name }}</th>

              <td
                v-for="(cell, colName) in row"
                :key="colName"
              >
                {{ fmt(cell.r) }}
                <span class="sig">
                  {{ star(cell.p) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

      </div>

      <!-- ========================= -->
      <!-- T-TEST -->
      <!-- ========================= -->
      <div v-else-if="r.type === 'ttest_ind'">

        <table class="result-table">
          <tbody>
            <tr>
              <td>n1</td>
              <td>{{ r.data?.result?.n1 }}</td>
            </tr>

            <tr>
              <td>n2</td>
              <td>{{ r.data?.result?.n2 }}</td>
            </tr>

            <tr>
              <td>Mean1</td>
              <td>{{ fmt(r.data?.result?.mean1) }}</td>
            </tr>

            <tr>
              <td>Mean2</td>
              <td>{{ fmt(r.data?.result?.mean2) }}</td>
            </tr>

            <tr>
              <td>t</td>
              <td>{{ fmt(r.data?.result?.t) }}</td>
            </tr>

            <tr>
              <td>df</td>
              <td>{{ r.data?.result?.df }}</td>
            </tr>

            <tr>
              <td>p</td>
              <td>
                {{ fmt(r.data?.result?.p, 4) }}
                <span class="sig">
                  {{ star(r.data?.result?.p) }}
                </span>
              </td>
            </tr>

            <tr>
              <td>Cohen's d</td>
              <td>{{ fmt(r.data?.result?.cohens_d) }}</td>
            </tr>
          </tbody>
        </table>

      </div>

      <!-- ========================= -->
      <!-- FALLBACK -->
      <!-- ========================= -->
      <div v-else class="muted">
        Noma’lum tahlil turi
      </div>

    </div>
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