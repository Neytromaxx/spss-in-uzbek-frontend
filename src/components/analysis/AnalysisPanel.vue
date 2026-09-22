<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { xatoMatni } from "../../api/errors";
import { olchovNomi } from "../../olchov";
import { TAHLILLAR, ajrat, rolTalabi } from "../../tahlil-rollari";
import { tuzatildiXabari, tuzatish } from "../../tur-tuzatish";

const store = useStore();

const variables = computed(() => store.state.editor.schema.variables || []);
const analyzing = computed(() => store.state.editor.analyzing);

const method = ref("auto");
const corrMethod = ref("pearson");
const normMethod = ref("shapiro");
const selected = ref([]);
const controls = ref([]);
const dependent = ref("");
const groupVar = ref("");
const error = ref("");


const needsVars = computed(() =>
  ["correlation", "reliability", "partial_correlation", "normality",
   "ttest_paired", "wilcoxon", "friedman", "crosstab", "chi_gof", "fisher",
   "regression_linear"].includes(method.value)
);
const needsControls = computed(() => method.value === "partial_correlation");

// Ekrandagi maydon → backend `params` dagi rol kaliti.
//
// 🔴 RO'YXATLAR ENDI `tahlil-rollari.js` DAN HOSIL BO'LADI.
//
// Ilgari ular qotirilgan edi: bog'liq o'zgaruvchi uchun DOIM
// faqat `scale`. Mann-Uitni va Kruskal esa backendda `ordinal`
// ni ham qabul qiladi — ya'ni Likert bandi, noparametrik test
// aynan uning uchun mo'ljallangan bo'lsa-da, ro'yxatda
// ko'rinmasdi. Frontend statistik jihatdan TO'G'RI
// foydalanishni to'sib qo'ygan edi.
const rows = computed(() => store.state.editor.rows || []);

// Ekrandagi maydon → backend `params` dagi rol kaliti.
const ROYXAT_ROLI = {
  reliability: "items",
  regression_linear: "predictors",
};
const varsRol = computed(() => ROYXAT_ROLI[method.value] || "variables");

function bolim(rol) {
  return ajrat(variables.value, method.value, rol);
}

/** Mos kelmaganlar — sabab va tuzatish bilan. */
function nomoslar(rol) {
  return bolim(rol).nomos.map(v => ({
    ozgaruvchi: v,
    rol,
    ...tuzatish(method.value, rol, v, rows.value),
  }));
}

const depVars = computed(() => bolim("dependent").mos);
const groupVars = computed(() => bolim("group").mos);
const depNomos = computed(() => nomoslar("dependent"));
const groupNomos = computed(() => nomoslar("group"));

// Belgilash katakchalarida hammasi KO'RINADI — mos kelmagani
// o'chirilgan holda. Yashirilsa, foydalanuvchi o'zgaruvchisi
// qayoqqa ketganini tushunmasdi.
const varsHolati = computed(() => {
  const rol = varsRol.value;
  const nomosNomlari = new Set(bolim(rol).nomos.map(v => v.name));
  return variables.value.map(v => ({
    ozgaruvchi: v,
    mos: !nomosNomlari.has(v.name),
    ...(nomosNomlari.has(v.name) ? tuzatish(method.value, rol, v, rows.value) : {}),
    rol,
  }));
});

const controlsHolati = computed(() => {
  const nomosNomlari = new Set(bolim("control").nomos.map(v => v.name));
  return variables.value.map(v => ({
    ozgaruvchi: v,
    mos: !nomosNomlari.has(v.name),
    ...(nomosNomlari.has(v.name) ? tuzatish(method.value, "control", v, rows.value) : {}),
    rol: "control",
  }));
});

/* ===============================
   TURNI BIR BOSISHDA TUZATISH
================================ */

// 🔴 SAQLASHNI O'ZIMIZ CHAQIRAMIZ.
//
// Sxema avtosaqlanadi, lekin watcher `VariablesTab` ICHIDA va u
// Tahlil yorlig'ida `v-if` bilan unmount qilingan. Ya'ni bu
// yerdan qilingan o'zgarish serverga yetib bormasdi: ekranda
// tuzatilgandek ko'rinardi, sahifa yangilanganda esa qaytib
// kelardi.
const tuzatildi = ref(null); // { nom, target, eski, index }

async function turniYoz(index, qiymat) {
  store.commit("editor/UPDATE_VARIABLE", { index, key: "measure", value: qiymat });
  try {
    await store.dispatch("editor/saveSchema");
  } catch (e) {
    error.value = xatoMatni(e, "Turni saqlashda xatolik");
  }
}

async function turniTuzat(element) {
  const v = element.ozgaruvchi;
  const index = variables.value.findIndex(x => x.name === v.name);
  if (index < 0 || !element.target) return;

  const eski = v.measure;
  await turniYoz(index, element.target);
  tuzatildi.value = {
    nom: v.label || v.name,
    target: element.target,
    eski,
    index,
  };
}

async function tuzatishniBekor() {
  const t = tuzatildi.value;
  tuzatildi.value = null;
  if (!t) return;
  // `eski` `undefined` bo'lishi mumkin — o'lchovi umuman
  // aniqlanmagan ustun. O'sha holatga qaytariladi.
  await turniYoz(t.index, t.eski);
}

const tuzatishXabari = computed(() =>
  tuzatildi.value ? tuzatildiXabari(tuzatildi.value.nom, tuzatildi.value.target) : "",
);

const depTalabi = computed(() => rolTalabi(method.value, "dependent"));
const groupTalabi = computed(() => rolTalabi(method.value, "group"));
const needsDepGroup = computed(() =>
  ["ttest_ind", "anova_oneway", "mannwhitney", "kruskal"].includes(method.value)
);
// regressiya: bog'liq (scale) select + predictorlar checkbox
const isRegression = computed(() => method.value === "regression_linear");
const varsLabel = computed(() => (isRegression.value ? "Mustaqil o'zgaruvchilar" : "O'zgaruvchilar"));

// metod o'zgarganda tanlovlarni tozalaymiz
watch(method, () => {
  selected.value = [];
  controls.value = [];
  dependent.value = "";
  groupVar.value = "";
  tuzatildi.value = null;
  error.value = "";
});

function validate() {
  error.value = "";
  const m = method.value;
  if (m === "reliability" && selected.value.length < 2)
    return (error.value = "Kamida 2 ta band tanlang."), false;
  if (m === "correlation" && selected.value.length < 2)
    return (error.value = "Kamida 2 ta o'zgaruvchi tanlang."), false;
  if (m === "normality" && selected.value.length < 1)
    return (error.value = "Kamida 1 ta o'zgaruvchi tanlang."), false;
  if ((m === "ttest_paired" || m === "wilcoxon") && selected.value.length !== 2)
    return (error.value = "Aynan 2 ta o'zgaruvchi tanlang."), false;
  if (m === "friedman" && selected.value.length < 3)
    return (error.value = "Kamida 3 ta o'zgaruvchi (o'lchov) tanlang."), false;
  if ((m === "crosstab" || m === "fisher") && selected.value.length !== 2)
    return (error.value = "Aynan 2 ta o'zgaruvchi tanlang."), false;
  if (m === "chi_gof" && selected.value.length !== 1)
    return (error.value = "Aynan 1 ta o'zgaruvchi tanlang."), false;
  if (m === "partial_correlation") {
    if (selected.value.length < 2) return (error.value = "Kamida 2 ta o'zgaruvchi tanlang."), false;
    if (controls.value.length < 1) return (error.value = "Kamida 1 ta nazorat o'zgaruvchisi tanlang."), false;
  }
  if (needsDepGroup.value && (!dependent.value || !groupVar.value))
    return (error.value = "Bog'liq va guruhlovchi o'zgaruvchini tanlang."), false;
  if (m === "regression_linear") {
    if (!dependent.value) return (error.value = "Bog'liq o'zgaruvchini tanlang."), false;
    if (selected.value.length < 1)
      return (error.value = "Kamida 1 ta mustaqil o'zgaruvchi tanlang."), false;
  }
  return true;
}

async function run() {
  if (!validate()) return;
  const params = {};
  const m = method.value;
  if (m === "correlation") { params.variables = selected.value; params.method = corrMethod.value; }
  else if (m === "reliability") params.items = selected.value;
  else if (m === "normality") { params.variables = selected.value; params.method = normMethod.value; }
  else if (["ttest_paired", "wilcoxon", "friedman", "crosstab", "chi_gof", "fisher"].includes(m))
    params.variables = selected.value;
  else if (m === "partial_correlation") {
    params.variables = selected.value.filter((v) => !controls.value.includes(v));
    params.control = controls.value;
  } else if (["ttest_ind", "anova_oneway", "mannwhitney", "kruskal"].includes(m)) {
    params.dependent = dependent.value;
    params.group = groupVar.value;
  } else if (m === "regression_linear") {
    params.dependent = dependent.value;
    params.predictors = selected.value;
  }
  try {
    await store.dispatch("editor/analyze", { type: m, params });
  } catch (e) {
    error.value = xatoMatni(e, "Tahlilda xatolik");
  }
}

defineExpose({ run });
</script>

<template>
  <div class="panel">
    <label class="lbl">Tahlil turi</label>
    <select v-model="method" class="method-select">
      <option v-for="m in TAHLILLAR" :key="m.key" :value="m.key">{{ m.label }}</option>
    </select>

    <!-- Korrelyatsiya usuli -->
    <template v-if="method === 'correlation'">
      <label class="lbl">Korrelyatsiya usuli</label>
      <div class="pills">
        <button v-for="cm in ['pearson', 'spearman', 'kendall']" :key="cm"
                :class="{ on: corrMethod === cm }" @click="corrMethod = cm">
          {{ { pearson: 'Pirson', spearman: 'Spirmen', kendall: 'Kendall' }[cm] }}
        </button>
      </div>
    </template>

    <!-- Normallik usuli -->
    <template v-if="method === 'normality'">
      <label class="lbl">Usul</label>
      <div class="pills">
        <button v-for="nm in ['shapiro', 'ks']" :key="nm"
                :class="{ on: normMethod === nm }" @click="normMethod = nm">
          {{ { shapiro: 'Shapiro-Uilk', ks: 'Kolmogorov-Smirnov' }[nm] }}
        </button>
      </div>
    </template>

    <!-- Bog'liq o'zgaruvchi (t-test, ANOVA, regressiya) -->
    <template v-if="needsDepGroup || isRegression">
      <label class="lbl">Bog'liq o'zgaruvchi ({{ depTalabi }})</label>
      <select v-model="dependent">
        <option value="">— tanlang —</option>
        <option v-for="v in depVars" :key="v.name" :value="v.name">{{ v.label || v.name }}</option>
      </select>

      <!-- 🔴 MOS KELMAGANLAR YASHIRILMAYDI.
           Tanlov maydonining O'ZIDA o'chirilgan `<option>` ga
           izoh qo'shib bo'lmaydi (telefonda ko'rinmaydi), shuning
           uchun sabab maydon OSTIDA. -->
      <div v-if="depNomos.length" class="nomos" data-rol="dependent">
        <span class="nomos-bosh">Ro'yxatda yo'q:</span>
        <span v-for="n in depNomos" :key="n.ozgaruvchi.name" class="nomos-el">
          <b>{{ n.nom }}</b> — {{ n.sabab }}.
          <button v-if="n.target" class="tuzat" @click="turniTuzat(n)">
            {{ n.tugma }}
          </button>
        </span>
      </div>
    </template>

    <!-- Guruhlovchi (t-test, ANOVA) -->
    <template v-if="needsDepGroup">
      <label class="lbl">Guruhlovchi o'zgaruvchi ({{ groupTalabi }})</label>
      <select v-model="groupVar">
        <option value="">— tanlang —</option>
        <option v-for="v in groupVars" :key="v.name" :value="v.name">{{ v.label || v.name }}</option>
      </select>

      <!-- 🔴 MOS KELMAGANLAR YASHIRILMAYDI.
           Tanlov maydonining O'ZIDA o'chirilgan `<option>` ga
           izoh qo'shib bo'lmaydi (telefonda ko'rinmaydi), shuning
           uchun sabab maydon OSTIDA. -->
      <div v-if="groupNomos.length" class="nomos" data-rol="group">
        <span class="nomos-bosh">Ro'yxatda yo'q:</span>
        <span v-for="n in groupNomos" :key="n.ozgaruvchi.name" class="nomos-el">
          <b>{{ n.nom }}</b> — {{ n.sabab }}.
          <button v-if="n.target" class="tuzat" @click="turniTuzat(n)">
            {{ n.tugma }}
          </button>
        </span>
      </div>
    </template>

    <!-- O'zgaruvchi tanlash -->
    <template v-if="needsVars">
      <label class="lbl">{{ varsLabel }}</label>
      <div class="var-list">
        <!-- Mos kelmagan KO'RINADI, lekin o'chirilgan: yashirilsa
             foydalanuvchi o'zgaruvchisi qayoqqa ketganini
             tushunmasdi. -->
        <div
          v-for="h in varsHolati"
          :key="h.ozgaruvchi.name"
          class="var-qator"
          :data-nom="h.ozgaruvchi.name"
        >
          <label class="var-chk" :class="{ nomos: !h.mos }">
            <input
              type="checkbox"
              :value="h.ozgaruvchi.name"
              :disabled="!h.mos"
              v-model="selected"
            />
            <span class="vn">{{ h.ozgaruvchi.label || h.ozgaruvchi.name }}</span>
            <span class="vm">{{ olchovNomi(h.ozgaruvchi.measure) }}</span>
          </label>
          <span v-if="!h.mos" class="nomos-izoh">
            {{ h.sabab }}.
            <button v-if="h.target" class="tuzat" @click="turniTuzat(h)">
              {{ h.tugma }}
            </button>
          </span>
        </div>
      </div>
    </template>

    <!-- Nazorat o'zgaruvchilari (qisman) -->
    <template v-if="needsControls">
      <label class="lbl">Nazorat o'zgaruvchilari</label>
      <div class="var-list">
        <div
          v-for="h in controlsHolati"
          :key="h.ozgaruvchi.name"
          class="var-qator"
          :data-nom="h.ozgaruvchi.name"
        >
          <label class="var-chk" :class="{ nomos: !h.mos }">
            <input
              type="checkbox"
              :value="h.ozgaruvchi.name"
              :disabled="!h.mos"
              v-model="controls"
            />
            <span class="vn">{{ h.ozgaruvchi.label || h.ozgaruvchi.name }}</span>
          </label>
          <span v-if="!h.mos" class="nomos-izoh">
            {{ h.sabab }}.
            <button v-if="h.target" class="tuzat" @click="turniTuzat(h)">
              {{ h.tugma }}
            </button>
          </span>
        </div>
      </div>
    </template>

    <p v-if="tuzatishXabari" class="tuzatildi">
      {{ tuzatishXabari }}
      <button class="link" @click="tuzatishniBekor">Bekor qilish</button>
    </p>

    <p v-if="error" class="err">{{ error }}</p>

    <button class="primary run-btn" :disabled="analyzing" @click="run">
      {{ analyzing ? "Hisoblanmoqda…" : "Tahlil qilish" }}
    </button>
  </div>
</template>

<style scoped>
.panel {
  background: var(--s1);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lbl {
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
  margin-top: 6px;
}
.method-select { font-size: .9rem; }
.pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pills button {
  background: var(--s3);
  border: 1px solid var(--bd);
  color: var(--t2);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: .78rem;
}
.pills button.on {
  background: var(--a1g);
  border-color: rgba(79, 110, 247, .4);
  color: var(--a1);
}
.var-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
}
.var-chk {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: var(--r3);
  cursor: pointer;
}
.var-chk input { width: auto; }
.vn { flex: 1; font-size: .85rem; color: var(--t1); }
.vm {
  font-size: .64rem;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--t3);
}
.run-btn { margin-top: 12px; }
.err { color: var(--a5); font-size: .8rem; }

/* ── mos kelmagan o'zgaruvchi ──
   Sariq (--a4): xato emas, e'tibor talab qiladigan holat. */
.nomos {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: .76rem;
  color: var(--t3);
  margin-top: 6px;
}
.nomos-bosh {
  text-transform: uppercase;
  letter-spacing: .06em;
  font-size: .66rem;
}
.nomos-el b { color: var(--t2); font-weight: 600; }

.var-qator {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.var-chk.nomos {
  opacity: .55;
  cursor: default;
}
.nomos-izoh {
  font-size: .72rem;
  color: var(--t3);
  padding-left: 26px;
}
.tuzat {
  background: rgba(245, 158, 11, .12);
  border: 1px solid rgba(245, 158, 11, .4);
  color: var(--a4);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: .72rem;
  margin-left: 4px;
  cursor: pointer;
}
.tuzatildi {
  font-size: .8rem;
  color: var(--a3);
  margin: 0;
}
.tuzatildi .link {
  background: none;
  border: none;
  color: var(--a1);
  font-size: .78rem;
  margin-left: 6px;
  cursor: pointer;
}
</style>
