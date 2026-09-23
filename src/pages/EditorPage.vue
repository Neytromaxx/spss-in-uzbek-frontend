<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";

import { tekshir } from "../tayyorlik";
import { BELGILAR, davomIzohi, keyingiQadam, qadamHolatlari } from "../qadamlar";

import TopBar from "../components/TopBar.vue";
import VariablesTab from "../components/VariablesTab.vue";
import DataTab from "../components/DataTab.vue";
import ResultsTab from "../components/ResultsTab.vue";

const store = useStore();

const varsTabRef = ref(null);
const dataTabRef = ref(null);

/* ===============================
   QADAMLAR CHIZIG'I
================================ */

const ed = computed(() => store.state.editor);

// Tayyorlik BIR MARTA hisoblanadi: uni ham chiziq, ham
// «keyingi qadam» izohi, ham `VariablesTab` ishlatadi. Ikki
// marta chaqirilsa, ikkita ro'yxat bir-biridan farq qilib
// qolishi mumkin edi.
const muammolar = computed(() =>
  tekshir(ed.value.schema.variables, ed.value.rows),
);

const qadamlar = computed(() =>
  qadamHolatlari({
    rows: ed.value.rows,
    variables: ed.value.schema.variables,
    muammolar: muammolar.value,
    natijalar: ed.value.results,
  }),
);

const joriyQadam = computed(() => {
  // Bitta yorliqda ikkita qadam bo'lsa (`results`), joriy deb
  // OXIRGISI belgilanadi: foydalanuvchi natija ro'yxatini
  // ko'rayotgan bo'lsa, u allaqachon tahlilni tanlagan.
  const mos = qadamlar.value.filter(q => q.tab === ed.value.activeTab);
  return mos[mos.length - 1]?.key || "";
});

const keyingi = computed(() => keyingiQadam(ed.value.activeTab));
const izoh = computed(() =>
  ed.value.activeTab === "variables" ? davomIzohi(muammolar.value) : "",
);

/* ===============================
   TAB SWITCH
================================ */
async function openTab(tab) {
  store.commit("editor/SET_TAB", tab);

  if (
    tab === "results" &&
    store.state.editor.results.length === 0 &&
    store.state.editor.schema.variables.length > 0 &&
    store.state.editor.rows.length > 0
  ) {
    // majburiy saqlash, keyin avtomatik (auto) tahlil
    await store.dispatch("editor/saveRows");
    await store.dispatch("editor/analyze");
  }
}

</script>

<template>
  <div class="editor">
    <!-- TOP BAR -->
    <TopBar />

    <!-- QADAMLAR CHIZIG'I -->
    <!--
      🔴 Chiziq yorliqlarning O'RNINI BOSMAYDI, ustiga qo'shiladi.
      U yo'nalish va holat ko'rsatadi; yorliqlar esa o'z-o'zidan
      navigatsiya bo'lib qoladi.
    -->
    <nav class="qadamlar" aria-label="Ish qadamlari">
      <button
        v-for="(q, i) in qadamlar"
        :key="q.key"
        class="qadam"
        :class="[q.holat, { joriy: q.key === joriyQadam }]"
        :data-qadam="q.key"
        @click="openTab(q.tab)"
      >
        <span class="belgi">{{ BELGILAR[q.holat] }}</span>
        <span class="raqam">{{ q.raqam }}</span>
        <span class="qadam-nom">{{ q.nom }}</span>
        <span v-if="i < qadamlar.length - 1" class="strelka" aria-hidden="true">→</span>
      </button>
    </nav>

    <!-- TABS -->
    <div class="tabs">
      <div
        class="tab"
        :class="{ active: store.state.editor.activeTab === 'data' }"
        @click="openTab('data')"
      >
        Ma’lumot
      </div>

      <div
        class="tab"
        :class="{ active: store.state.editor.activeTab === 'variables' }"
        @click="openTab('variables')"
      >
        O‘zgaruvchilar
      </div>

      <div
        class="tab"
        :class="{ active: store.state.editor.activeTab === 'results' }"
        @click="openTab('results')"
      >
        Tahlil
      </div>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <VariablesTab
        v-if="store.state.editor.activeTab === 'variables'"
        ref="varsTabRef"
      />

      <DataTab
        v-if="store.state.editor.activeTab === 'data'"
        ref="dataTabRef"
      />

      <ResultsTab
        v-if="store.state.editor.activeTab === 'results'"
      />
    </div>

    <!-- ACTION BAR -->
    <div class="action-bar">
      <!-- VARIABLES ACTIONS -->
      <template v-if="store.state.editor.activeTab === 'variables'">
        <button
          @click="varsTabRef.addVariable()"
        >
          + O‘zgaruvchi qo‘shish
        </button>

        <button
          class="primary"
          :disabled="store.state.editor.saving"
          @click="store.dispatch('editor/saveSchema')"
        >
          Saqlash
        </button>
      </template>

      <!-- DATA ACTIONS -->
      <template v-if="store.state.editor.activeTab === 'data'">
        <button
          @click="dataTabRef.addRow()"
        >
          + Qator qo‘shish
        </button>

        <button
          class="primary"
          :disabled="store.state.editor.saving"
          @click="store.dispatch('editor/saveRows')"
        >
          Saqlash
        </button>
      </template>

      <!-- KEYINGI QADAM -->
      <!--
        🔴 Tugma TO'SMAYDI: muammo bo'lsa ham ishlaydi, yonidagi
        matn faqat nima o'tkazib yuborilayotganini aytadi.
      -->
      <template v-if="keyingi">
        <span v-if="izoh" class="qadam-izoh">{{ izoh }}</span>
        <button class="primary keyingi" @click="openTab(keyingi.tab)">
          {{ keyingi.matn }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.editor {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ── qadamlar chizig'i ── */
.qadamlar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 10px 12px 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.qadamlar::-webkit-scrollbar { display: none; }

.qadam {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 4px 6px;
  font-size: .76rem;
  color: var(--t3);
  white-space: nowrap;
  cursor: pointer;
}
.qadam .raqam {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.qadam .belgi { font-size: .82rem; }
.qadam .strelka { color: var(--bd2); margin-left: 4px; }

.qadam.tayyor .belgi { color: var(--a3); }
.qadam.etibor .belgi { color: var(--a4); }
.qadam.hali_emas .belgi { color: var(--t3); }

.qadam.joriy {
  color: var(--t1);
}
.qadam.joriy .raqam { color: var(--a1); }

.qadam-izoh {
  font-size: .76rem;
  color: var(--a4);
  margin-right: auto;
}
.keyingi { white-space: nowrap; }

/* Telefonda chiziq bir qatorga sig'masa — faqat raqamlar va
   JORIY qadam nomi. Gorizontal aylantirish qoladi, lekin
   odatiy holatda kerak bo'lmaydi. */
@media (max-width: 560px) {
  .qadam:not(.joriy) .qadam-nom { display: none; }
  .qadam-izoh {
    width: 100%;
    margin: 0 0 6px;
  }
}

.tabs {
  display: flex;
  background: rgba(6, 8, 16, .88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--bd);
  position: sticky;
  top: 0;
  z-index: 200;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  cursor: pointer;
  color: var(--t2);
  font-weight: 600;
  font-size: .9rem;
  border-bottom: 2px solid transparent;
  transition: color .2s, border-color .2s;
}

.tab:hover {
  color: var(--t1);
}

.tab.active {
  color: var(--a1);
  border-bottom: 2px solid var(--a1);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px clamp(16px, 4vw, 32px);
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

.action-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px clamp(16px, 4vw, 32px);
  background: rgba(6, 8, 16, .92);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--bd);
}
</style>