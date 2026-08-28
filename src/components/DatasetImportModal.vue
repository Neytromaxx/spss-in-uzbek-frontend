<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import api from "../api";
import { xatoMatni } from "../api/errors";

// Boshqa moduldagi ma'lumotdan SPSS fayli yaratish oynasi.
//
// Backendda bu ikkita endpoint (`CLAUDE_SURVEY.md` §7):
//   GET  /files/dataset-sources   — qaysi modullar jadval bera oladi
//   POST /files/from-dataset      — {source, ref, title} -> yangi fayl
//
// Ikkalasi ham tayyor edi, lekin frontend ularning bittasini ham
// chaqirmasdi: kod yozilgan, testlar bor, foydalanuvchi uchun esa
// mavjud emas edi.

const SURVEY_KEY = "survey_campaign";

const props = defineProps({
  visible: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "created"]);

const store = useStore();

const sources = ref([]);
const source = ref("");
const campaigns = ref([]);
const selectedRef = ref("");
const title = ref("");
const busy = ref(false);
const loading = ref(false);
const error = ref("");

// Kampaniya tanlovi faqat so'rovnoma manbasi uchun. Boshqa manba
// qo'shilsa (registr ochiq), oddiy matn maydoni ko'rsatiladi — ya'ni
// yangi manba frontendni buzmaydi, shunchaki qulayligi kamroq bo'ladi.
const isSurvey = computed(() => source.value === SURVEY_KEY);

const selectedCampaign = computed(() =>
  campaigns.value.find((k) => k.id === selectedRef.value)
);

// `load_campaign` faqat YAKUNLANGAN ishtiroklarni oladi
// (`finished_only=True`). Nol bo'lsa backend 400 qaytaradi, shuning
// uchun tanlashga ruxsat bermaymiz va sababini aytamiz.
const bosLangan = computed(() => selectedCampaign.value?.finished_count === 0);

const yuborishMumkin = computed(
  () => !!source.value && !!selectedRef.value.trim() && !bosLangan.value && !busy.value
);

async function yuklash() {
  loading.value = true;
  error.value = "";
  try {
    sources.value = await store.dispatch("files/datasetSources");
    if (sources.value.length === 1) source.value = sources.value[0].key;
  } catch (e) {
    error.value = xatoMatni(e, "Manbalar ro'yxatini olib bo'lmadi");
  } finally {
    loading.value = false;
  }
}

async function kampaniyalarniYuklash() {
  loading.value = true;
  error.value = "";
  try {
    const res = await api.get("/api/v1/survey/campaigns", { params: { limit: 100 } });
    campaigns.value = res.data.items || [];
  } catch (e) {
    campaigns.value = [];
    error.value = xatoMatni(e, "Kampaniyalar ro'yxatini olib bo'lmadi");
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return;
    source.value = "";
    selectedRef.value = "";
    title.value = "";
    error.value = "";
    campaigns.value = [];
    yuklash();
  }
);

watch(source, (v) => {
  selectedRef.value = "";
  if (v === SURVEY_KEY) kampaniyalarniYuklash();
});

async function yaratish() {
  if (!yuborishMumkin.value) return;
  busy.value = true;
  error.value = "";
  try {
    const file = await store.dispatch("files/createFromDataset", {
      source: source.value,
      ref: selectedRef.value.trim(),
      title: title.value.trim() || null,
    });
    emit("created", file);
  } catch (e) {
    error.value = xatoMatni(e, "Fayl yaratilmadi");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div v-if="visible" class="overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="m-head">
        <h3>Ma'lumot manbasidan tadqiqot</h3>
        <button class="ghost-sm" @click="emit('close')">✕</button>
      </div>

      <p class="m-desc">
        Boshqa modulda yig'ilgan ma'lumotni to'g'ridan-to'g'ri tahlilga oling.
        O'zgaruvchilar turini tizim o'zi aniqlaydi.
      </p>

      <label class="lbl">Manba</label>
      <select v-model="source" :disabled="loading">
        <option value="">— tanlang —</option>
        <option v-for="s in sources" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>

      <!-- So'rovnoma: kampaniyalar ro'yxati -->
      <template v-if="isSurvey">
        <label class="lbl">Kampaniya</label>
        <div v-if="loading" class="hint">Yuklanmoqda…</div>
        <div v-else-if="!campaigns.length" class="hint">Kampaniya topilmadi.</div>
        <div v-else class="camp-list">
          <label v-for="k in campaigns" :key="k.id" class="camp">
            <input v-model="selectedRef" type="radio" :value="k.id" />
            <span class="c-body">
              <span class="c-title">{{ k.title }}</span>
              <span class="c-sub">
                {{ k.instrument?.name || "—" }} ·
                {{ k.finished_count }} ta yakunlangan
                <span v-if="!k.is_open" class="c-closed">· yopiq</span>
              </span>
            </span>
          </label>
        </div>
      </template>

      <!-- Noma'lum manba: identifikatorni qo'lda -->
      <template v-else-if="source">
        <label class="lbl">Identifikator</label>
        <input v-model="selectedRef" placeholder="Manba ichidagi id yoki slug" />
      </template>

      <template v-if="source">
        <label class="lbl">Nom (ixtiyoriy)</label>
        <input v-model="title" placeholder="Bo'sh qoldirilsa manba nomi olinadi" />
      </template>

      <p v-if="bosLangan" class="warn">
        Bu kampaniyada hali yakunlangan ishtirok yo'q — tahlil qilinadigan
        ma'lumot topilmaydi.
      </p>
      <p v-if="error" class="err">{{ error }}</p>

      <div class="m-actions">
        <button @click="emit('close')">Bekor</button>
        <button class="primary" :disabled="!yuborishMumkin" @click="yaratish">
          {{ busy ? "Yaratilmoqda…" : "Yaratish" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
  padding: 20px;
}
.modal {
  background: var(--s1);
  border: 1px solid var(--bd2);
  border-radius: var(--r);
  padding: 22px 24px;
  width: min(520px, 100%);
  max-height: 86vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--shadow);
}
.m-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.m-head h3 { margin: 0; }
.m-desc {
  color: var(--t2);
  font-size: .84rem;
  margin: 0 0 4px;
}
.lbl {
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
  margin-top: 6px;
}
.hint {
  color: var(--t3);
  font-size: .84rem;
  padding: 6px 0;
}
.camp-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
}
.camp {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: var(--r3);
  cursor: pointer;
}
.camp input { width: auto; margin-top: 3px; }
.c-body { display: flex; flex-direction: column; gap: 2px; }
.c-title { font-size: .88rem; color: var(--t1); }
.c-sub { font-size: .74rem; color: var(--t3); }
.c-closed { color: var(--a4); }
.m-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
.warn { color: var(--a4); font-size: .8rem; margin: 4px 0 0; }
.err { color: var(--a5); font-size: .8rem; margin: 4px 0 0; }
</style>
