<script setup>
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";

const emit = defineEmits(["submit"]);
const store = useStore();

/* ===============================
   STATE
================================ */

const variables = computed(() =>
  store.state.editor.schema.variables
);

const numericVars = computed(() =>
  variables.value.filter(v => v.measure === "scale")
);

const available = ref([]);
const selected = ref([]);

watch(numericVars, (nv) => {
  available.value = nv.map(v => v.name);
}, { immediate: true });


/* ===============================
   MOVE LOGIC
================================ */

function addVar(name) {
  if (!selected.value.includes(name)) {
    selected.value.push(name);
    available.value = available.value.filter(v => v !== name);
  }
}

function removeVar(name) {
  selected.value = selected.value.filter(v => v !== name);
  available.value.push(name);
}

/* ===============================
   SUBMIT
================================ */

function submit() {
  if (selected.value.length < 2) {
    alert("Kamida 2 ta numeric o‘zgaruvchi tanlang");
    return;
  }

  emit("submit", {
    type: "correlation",
    params: {
      variables: selected.value,
    },
  });
}
</script>

<template>
  <div class="correlation-form">

    <div class="selector">
      <!-- AVAILABLE -->
      <div class="panel">
        <h4>Available</h4>
        <ul>
          <li
            v-for="v in available"
            :key="v"
            @click="addVar(v)"
          >
            {{ v }}
          </li>
        </ul>
      </div>

      <!-- SELECTED -->
      <div class="panel">
        <h4>Selected</h4>
        <ul>
          <li
            v-for="v in selected"
            :key="v"
            @click="removeVar(v)"
          >
            {{ v }}
          </li>
        </ul>
      </div>
    </div>

    <div class="actions">
      <button class="primary" @click="submit">
        Run
      </button>
    </div>

  </div>
</template>

<style scoped>
.selector {
  display: flex;
  gap: 20px;
}

.panel {
  flex: 1;
  background: #1f2937;
  padding: 10px;
  border-radius: 6px;
  min-height: 200px;
}

.panel ul {
  list-style: none;
  padding: 0;
}

.panel li {
  padding: 6px;
  cursor: pointer;
}

.panel li:hover {
  background: #2563eb;
}

.actions {
  margin-top: 20px;
  text-align: right;
}
</style>
