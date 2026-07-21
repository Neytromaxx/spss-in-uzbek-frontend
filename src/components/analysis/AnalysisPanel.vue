<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";

const store = useStore();

const variables = computed(() => store.state.editor.schema.variables || []);
const analyzing = computed(() => store.state.editor.analyzing);
const scaleVars = computed(() => variables.value.filter((v) => v.measure === "scale"));
const groupVars = computed(() =>
  variables.value.filter((v) => v.measure === "nominal" || v.measure === "ordinal")
);

const method = ref("auto");
const corrMethod = ref("pearson");
const normMethod = ref("shapiro");
const selected = ref([]);
const controls = ref([]);
const dependent = ref("");
const groupVar = ref("");
const error = ref("");

const METHODS = [
  { key: "auto", label: "Avtomatik (tavsifiy + chastota)" },
  { key: "correlation", label: "Korrelyatsiya" },
  { key: "reliability", label: "Ishonchlilik (Kronbax alfa)" },
  { key: "partial_correlation", label: "Qisman korrelyatsiya" },
  { key: "normality", label: "Normallik testi" },
  { key: "ttest_ind", label: "Bog'liqsiz t-test" },
  { key: "ttest_paired", label: "Juft t-test" },
  { key: "anova_oneway", label: "Bir omilli ANOVA" },
  { key: "mannwhitney", label: "Mann-Uitni U (noparametrik)" },
  { key: "wilcoxon", label: "Uilkokson (noparametrik juft)" },
  { key: "kruskal", label: "Kruskal-Uollis H (noparametrik)" },
  { key: "friedman", label: "Fridman (noparametrik takroriy)" },
  { key: "crosstab", label: "Kesishma jadvali + xi-kvadrat" },
  { key: "chi_gof", label: "Xi-kvadrat moslik testi" },
  { key: "fisher", label: "Fisher aniq testi (2×2)" },
  { key: "regression_linear", label: "Chiziqli regressiya" },
];

const needsVars = computed(() =>
  ["correlation", "reliability", "partial_correlation", "normality",
   "ttest_paired", "wilcoxon", "friedman", "crosstab", "chi_gof", "fisher",
   "regression_linear"].includes(method.value)
);
const needsControls = computed(() => method.value === "partial_correlation");
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
  error.value = "";
});

function measureLabel(m) {
  return { scale: "raqamli", nominal: "nominal", ordinal: "tartibli" }[m] || m;
}

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
    error.value = e.response?.data?.detail || "Tahlilda xatolik";
  }
}

defineExpose({ run });
</script>

<template>
  <div class="panel">
    <label class="lbl">Tahlil turi</label>
    <select v-model="method" class="method-select">
      <option v-for="m in METHODS" :key="m.key" :value="m.key">{{ m.label }}</option>
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
      <label class="lbl">Bog'liq o'zgaruvchi (raqamli)</label>
      <select v-model="dependent">
        <option value="">— tanlang —</option>
        <option v-for="v in scaleVars" :key="v.name" :value="v.name">{{ v.label || v.name }}</option>
      </select>
    </template>

    <!-- Guruhlovchi (t-test, ANOVA) -->
    <template v-if="needsDepGroup">
      <label class="lbl">Guruhlovchi o'zgaruvchi</label>
      <select v-model="groupVar">
        <option value="">— tanlang —</option>
        <option v-for="v in groupVars" :key="v.name" :value="v.name">{{ v.label || v.name }}</option>
      </select>
    </template>

    <!-- O'zgaruvchi tanlash -->
    <template v-if="needsVars">
      <label class="lbl">{{ varsLabel }}</label>
      <div class="var-list">
        <label v-for="v in variables" :key="v.name" class="var-chk">
          <input type="checkbox" :value="v.name" v-model="selected" />
          <span class="vn">{{ v.label || v.name }}</span>
          <span class="vm">{{ measureLabel(v.measure) }}</span>
        </label>
      </div>
    </template>

    <!-- Nazorat o'zgaruvchilari (qisman) -->
    <template v-if="needsControls">
      <label class="lbl">Nazorat o'zgaruvchilari</label>
      <div class="var-list">
        <label v-for="v in variables" :key="v.name" class="var-chk">
          <input type="checkbox" :value="v.name" v-model="controls" />
          <span class="vn">{{ v.label || v.name }}</span>
        </label>
      </div>
    </template>

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
</style>
