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
  color: var(--t1);
}
.results-tab h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 1.5rem;
}
.empty {
  color: var(--t3);
  font-size: .9rem;
  padding: 32px 0;
  text-align: center;
}
.login-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(135deg, rgba(79, 110, 247, .1), rgba(139, 92, 246, .06));
  border: 1px solid rgba(79, 110, 247, .28);
  border-radius: var(--r2);
  padding: 14px 16px;
  font-size: .86rem;
  color: var(--t2);
}
.login-banner button {
  background: linear-gradient(135deg, var(--a1), var(--a2));
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  white-space: nowrap;
  font-weight: 700;
  box-shadow: 0 0 20px rgba(79, 110, 247, .3);
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.notice {
  font-size: .8rem;
  color: var(--a3);
  margin: 0;
}
.results-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.result-block {
  border: 1px solid var(--bd);
  padding: 20px;
  background: var(--s1);
  border-radius: var(--r);
}
.result-block h4 {
  margin-bottom: 14px;
  font-size: .95rem;
  font-weight: 700;
}
.meta {
  font-size: .68rem;
  color: var(--t3);
  margin-left: 6px;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
}
.result-table td,
.result-table th {
  border-bottom: 1px solid var(--bd);
  padding: 9px 6px;
  font-size: .84rem;
}
.result-table td:last-child {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  color: var(--t1);
}
.result-table td:first-child {
  color: var(--t2);
}
.result-table th {
  color: var(--t3);
  font-weight: 700;
  font-size: .68rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  text-align: left;
}
.muted {
  color: var(--t3);
  font-size: .85rem;
}
</style>
