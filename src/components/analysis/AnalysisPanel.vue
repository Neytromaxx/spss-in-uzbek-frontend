<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";

const store = useStore();

const variables = computed(() => store.state.editor.schema.variables || []);
const analyzing = computed(() => store.state.editor.analyzing);

const method = ref("auto"); // auto | correlation | reliability | partial_correlation
const corrMethod = ref("pearson"); // pearson | spearman | kendall
const selected = ref([]); // tanlangan o'zgaruvchi nomlari
const controls = ref([]); // qisman korrelyatsiya nazorat o'zgaruvchilari

const METHODS = [
  { key: "auto", label: "Avtomatik (tavsifiy + chastota)" },
  { key: "correlation", label: "Korrelyatsiya" },
  { key: "reliability", label: "Ishonchlilik (Kronbax alfa)" },
  { key: "partial_correlation", label: "Qisman korrelyatsiya" },
];

const needsVars = computed(() => method.value !== "auto");
const needsControls = computed(() => method.value === "partial_correlation");

function measureLabel(m) {
  return { scale: "raqamli", nominal: "nominal", ordinal: "tartibli" }[m] || m;
}

const error = ref("");

function validate() {
  error.value = "";
  if (method.value === "auto") return true;
  if (method.value === "reliability" && selected.value.length < 2) {
    error.value = "Kronbax alfa uchun kamida 2 ta band tanlang.";
    return false;
  }
  if (method.value === "correlation" && selected.value.length < 2) {
    error.value = "Korrelyatsiya uchun kamida 2 ta o'zgaruvchi tanlang.";
    return false;
  }
  if (method.value === "partial_correlation") {
    if (selected.value.length < 2) {
      error.value = "Kamida 2 ta o'zgaruvchi tanlang.";
      return false;
    }
    if (controls.value.length < 1) {
      error.value = "Kamida 1 ta nazorat o'zgaruvchisi tanlang.";
      return false;
    }
  }
  return true;
}

async function run() {
  if (!validate()) return;
  const params = {};
  if (method.value === "correlation") {
    params.variables = selected.value;
    params.method = corrMethod.value;
  } else if (method.value === "reliability") {
    params.items = selected.value;
  } else if (method.value === "partial_correlation") {
    params.variables = selected.value.filter((v) => !controls.value.includes(v));
    params.control = controls.value;
  }
  try {
    await store.dispatch("editor/analyze", {
      type: method.value,
      params,
    });
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
        <button
          v-for="cm in ['pearson', 'spearman', 'kendall']"
          :key="cm"
          :class="{ on: corrMethod === cm }"
          @click="corrMethod = cm"
        >
          {{ { pearson: 'Pirson', spearman: 'Spirmen', kendall: 'Kendall' }[cm] }}
        </button>
      </div>
    </template>

    <!-- O'zgaruvchi tanlash -->
    <template v-if="needsVars">
      <label class="lbl">O'zgaruvchilar</label>
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
.method-select {
  font-size: .9rem;
}
.pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
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
.var-chk input {
  width: auto;
}
.vn {
  flex: 1;
  font-size: .85rem;
  color: var(--t1);
}
.vm {
  font-size: .64rem;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--t3);
}
.run-btn {
  margin-top: 12px;
}
.err {
  color: var(--a5);
  font-size: .8rem;
}
</style>
