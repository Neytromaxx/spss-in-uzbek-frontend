<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";

const emit = defineEmits(["submit"]);
const store = useStore();

/* ===============================
   VARIABLES
================================ */

const variables = computed(() =>
  store.state.editor.schema.variables
);

const numericVars = computed(() =>
  variables.value.filter(v => v.measure === "scale")
);

const groupVars = computed(() =>
  variables.value.filter(
    v => v.measure === "nominal" || v.measure === "ordinal"
  )
);

const dependent = ref(null);
const group = ref(null);

/* ===============================
   SUBMIT
================================ */

function submit() {
  if (!dependent.value) {
    alert("Dependent variable tanlang");
    return;
  }

  if (!group.value) {
    alert("Group variable tanlang");
    return;
  }

  if (dependent.value === group.value) {
    alert("Dependent va Group bir xil bo‘lishi mumkin emas");
    return;
  }

  emit("submit", {
    type: "ttest_ind",
    params: {
      dependent: dependent.value,
      group: group.value,
    },
  });
}
</script>

<template>
  <div class="ttest-form">

    <div class="form-group">
      <label>Dependent Variable (Scale)</label>
      <select v-model="dependent">
        <option disabled value="">Tanlang</option>
        <option
          v-for="v in numericVars"
          :key="v.name"
          :value="v.name"
        >
          {{ v.label || v.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label>Grouping Variable (Nominal/Ordinal)</label>
      <select v-model="group">
        <option disabled value="">Tanlang</option>
        <option
          v-for="v in groupVars"
          :key="v.name"
          :value="v.name"
        >
          {{ v.label || v.name }}
        </option>
      </select>
    </div>

    <div class="actions">
      <button class="primary" @click="submit">
        Run
      </button>
    </div>

  </div>
</template>

<style scoped>
.form-group {
  margin-bottom: 16px;
}

select {
  width: 100%;
  padding: 6px;
  background: #1f2937;
  color: white;
  border: 1px solid #374151;
}

.actions {
  text-align: right;
}
</style>
