<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import AnalysisPanel from "./analysis/AnalysisPanel.vue";
import ResultTable from "./analysis/ResultTable.vue";

const store = useStore();

const result = computed(() => store.state.editor.result);
const tables = computed(() => result.value?.tables ?? []);
const hasResults = computed(() => tables.value.length > 0);
const isAuth = computed(() => store.getters["auth/isAuthenticated"]);

const busy = ref("");
const notice = ref("");

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
    <h3>Tahlil</h3>

    <!-- Analiz tanlash -->
    <AnalysisPanel />

    <!-- Natija -->
    <template v-if="hasResults">
      <div class="res-head">
        <div>
          <div class="res-eyebrow">Natija</div>
          <div class="res-title">{{ result.title || "Tahlil natijasi" }}</div>
        </div>
      </div>

      <div v-if="!isAuth" class="login-banner">
        <span>💾 Natijani saqlash yoki Word/PDF yuklab olish uchun tizimga kiring.</span>
        <button @click="openLogin">Kirish</button>
      </div>

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

      <div class="tables">
        <ResultTable v-for="t in tables" :key="t.id" :table="t" />
      </div>
    </template>

    <div v-else class="empty">
      Tahlil turini tanlab, «Tahlil qilish» tugmasini bosing.
    </div>
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
.res-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.res-eyebrow {
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--a1);
}
.res-title {
  font-family: 'Instrument Serif', serif;
  font-size: 1.35rem;
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
.tables {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.empty {
  color: var(--t3);
  font-size: .9rem;
  padding: 24px 0;
  text-align: center;
}
</style>
