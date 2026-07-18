<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";

const store = useStore();

const columns = computed(() => store.state.editor.result?.columns ?? {});
const hasResults = computed(() => Object.keys(columns.value).length > 0);
const isAuth = computed(() => store.getters["auth/isAuthenticated"]);

const busy = ref("");
const notice = ref("");

function fmt(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

// backend descriptive: {n, mean, std_dev, min, max,
//   quartiles:{default:{q1,q2,q3}}, skewness:{spss}, kurtosis:{spss}}
function q(col, k) {
  return col.descriptive?.quartiles?.default?.[k];
}

function openLogin() {
  store.commit("auth/SET_LOGIN_VISIBLE", true);
}

async function onSave() {
  if (!isAuth.value) return openLogin();
  busy.value = "save";
  notice.value = "";
  try {
    await store.dispatch("editor/saveResult");
    notice.value = "✓ Natija profilingizga saqlandi";
  } catch (e) {
    notice.value = e.response?.data?.detail || "Saqlashda xatolik";
  } finally {
    busy.value = "";
  }
}

async function onExport(f) {
  if (!isAuth.value) return openLogin();
  busy.value = f;
  notice.value = "";
  try {
    await store.dispatch("editor/exportResult", f);
  } catch (e) {
    notice.value = "Yuklab olishda xatolik";
  } finally {
    busy.value = "";
  }
}
</script>

<template>
  <div class="results-tab">
    <h3>Tahlil natijalari</h3>

    <div v-if="!hasResults" class="empty">Avval tahlilni ishga tushiring</div>

    <template v-if="hasResults">
      <!-- Anonim foydalanuvchi uchun banner -->
      <div v-if="!isAuth" class="login-banner">
        <span>💾 Natijani saqlash yoki Word/PDF yuklab olish uchun tizimga kiring.</span>
        <button @click="openLogin">Kirish</button>
      </div>

      <!-- Amallar -->
      <div class="actions">
        <button :disabled="busy === 'save'" @click="onSave">
          {{ busy === "save" ? "…" : "💾 Saqlash" }}
        </button>
        <button :disabled="busy === 'docx'" @click="onExport('docx')">
          {{ busy === "docx" ? "…" : "📄 Word" }}
        </button>
        <button :disabled="busy === 'pdf'" @click="onExport('pdf')">
          {{ busy === "pdf" ? "…" : "📑 PDF" }}
        </button>
      </div>
      <p v-if="notice" class="notice">{{ notice }}</p>

      <div class="results-list">
        <div v-for="(col, name) in columns" :key="name" class="result-block">
          <h4>
            {{ col.label || name }}
            <span class="meta">({{ col.measure }})</span>
          </h4>

          <!-- DESCRIPTIVE -->
          <table v-if="col.analysis === 'descriptive'" class="result-table">
            <tbody>
              <tr><td>N</td><td>{{ col.descriptive.n }}</td></tr>
              <tr><td>Min</td><td>{{ fmt(col.descriptive.min) }}</td></tr>
              <tr><td>Max</td><td>{{ fmt(col.descriptive.max) }}</td></tr>
              <tr><td>O‘rtacha</td><td>{{ fmt(col.descriptive.mean) }}</td></tr>
              <tr><td>Standart chetlanish</td><td>{{ fmt(col.descriptive.std_dev) }}</td></tr>
              <tr><td>Q1</td><td>{{ fmt(q(col, 'q1')) }}</td></tr>
              <tr><td>Mediana (Q2)</td><td>{{ fmt(q(col, 'q2')) }}</td></tr>
              <tr><td>Q3</td><td>{{ fmt(q(col, 'q3')) }}</td></tr>
              <tr><td>Assimetriya</td><td>{{ fmt(col.descriptive.skewness?.spss) }}</td></tr>
              <tr><td>Ekssess</td><td>{{ fmt(col.descriptive.kurtosis?.spss) }}</td></tr>
            </tbody>
          </table>

          <!-- FREQUENCY -->
          <table v-else-if="col.analysis === 'frequency'" class="result-table">
            <thead>
              <tr><th>Qiymat</th><th>Chastota</th><th>%</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, key) in col.frequency.table" :key="key">
                <td>{{ row.label || key }}</td>
                <td>{{ row.count }}</td>
                <td>{{ fmt(row.percent, 2) }}</td>
              </tr>
            </tbody>
          </table>

          <div v-else class="muted">Ushbu o‘zgaruvchi uchun natija yo‘q</div>
        </div>
      </div>
    </template>
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
.login-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
}
.login-banner button {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.actions button {
  background: #1f2937;
  color: #e5e7eb;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}
.actions button:disabled {
  opacity: 0.6;
}
.notice {
  font-size: 13px;
  color: #93c5fd;
  margin: 0;
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
