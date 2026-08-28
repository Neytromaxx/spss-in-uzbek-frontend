<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import AnalysisPanel from "./analysis/AnalysisPanel.vue";
import ResultTable from "./analysis/ResultTable.vue";
import { xatoMatni } from "../api/errors";

const store = useStore();

const result = computed(() => store.state.editor.result);
const tables = computed(() => result.value?.tables ?? []);

// Kanonik natijaning `meta` qismi: ogohlantirishlar va farazlar.
// Bular jadval ichidagi `notes` dan farq qiladi — ular butun tahlilga
// tegishli va natijani qanchalik jiddiy qabul qilish kerakligini aytadi.
const warnings = computed(() => result.value?.meta?.warnings ?? []);
const assumptions = computed(() => result.value?.meta?.assumptions ?? []);
const hasResults = computed(() => tables.value.length > 0);
const isAuth = computed(() => store.getters["auth/isAuthenticated"]);
const hasTelegram = computed(() => !!store.state.auth.user?.telegram_id);

const busy = ref("");
const notice = ref("");
const deliver = ref("browser"); // "browser" | "telegram"

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
    notice.value = xatoMatni(e, "Saqlashda xatolik");
  } finally {
    busy.value = "";
  }
}

async function onExport(f) {
  if (!isAuth.value) return openLogin();
  const mode = hasTelegram.value ? deliver.value : "browser";
  busy.value = f;
  notice.value = "";
  try {
    await store.dispatch("editor/exportResult", { fmt: f, deliver: mode });
    if (mode === "telegram") {
      notice.value = "✓ Fayl Telegram botga yuborildi";
    }
  } catch (e) {
    notice.value = xatoMatni(e, "Yetkazishda xatolik");
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

      <!-- Yetkazish usuli (faqat Telegram bilan bog'langan bo'lsa) -->
      <div v-if="isAuth && hasTelegram" class="deliver">
        <span class="dlbl">Fayl qayerga:</span>
        <button :class="{ on: deliver === 'browser' }" @click="deliver = 'browser'">
          📥 Yuklab olish
        </button>
        <button :class="{ on: deliver === 'telegram' }" @click="deliver = 'telegram'">
          📨 Telegram
        </button>
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

      <!-- Butun tahlilga tegishli ogohlantirishlar (meta.warnings) -->
      <div v-if="warnings.length" class="meta-box warn">
        <div class="meta-title">⚠️ Ogohlantirish</div>
        <ul>
          <li v-for="(w, i) in warnings" :key="i">{{ w }}</li>
        </ul>
      </div>

      <div class="tables">
        <ResultTable v-for="t in tables" :key="t.id" :table="t" />
      </div>

      <!-- Metod qanday farazlarga tayanadi (meta.assumptions) -->
      <div v-if="assumptions.length" class="meta-box info">
        <div class="meta-title">Farazlar va izohlar</div>
        <ul>
          <li v-for="(a, i) in assumptions" :key="i">{{ a }}</li>
        </ul>
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
.deliver {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dlbl {
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--t3);
}
.deliver button {
  background: var(--s3);
  border: 1px solid var(--bd);
  color: var(--t2);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: .78rem;
}
.deliver button.on {
  background: var(--a1g);
  border-color: rgba(79, 110, 247, .4);
  color: var(--a1);
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
/* meta.warnings / meta.assumptions — butun tahlilga tegishli izohlar.
   Ogohlantirish sariq (--a4): natijani ishonchsiz qilishi mumkin.
   Farazlar neytral: metod nimaga tayanganini tushuntiradi. */
.meta-box {
  border: 1px solid var(--bd2);
  border-radius: var(--r2);
  padding: 12px 16px;
  margin: 14px 0;
  font-size: .82rem;
}
.meta-box.warn {
  border-color: rgba(245, 158, 11, .4);
  background: rgba(245, 158, 11, .08);
}
.meta-box.info {
  background: var(--s1);
}
.meta-title {
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 6px;
}
.meta-box.warn .meta-title { color: var(--a4); }
.meta-box ul {
  margin: 0;
  padding-left: 18px;
  color: var(--t2);
}
.meta-box li { margin: 3px 0; }
.empty {
  color: var(--t3);
  font-size: .9rem;
  padding: 24px 0;
  text-align: center;
}
</style>
