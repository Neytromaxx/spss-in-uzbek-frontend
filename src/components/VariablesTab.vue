<script setup>
import { useStore } from "vuex";

const store = useStore();
</script>

<template>
  <h3>O'zgaruvchilar</h3>
  <div class="variable-list">
    <div class="var-row" v-for="v in store.state.editor.schema" :key="v.name">
    <input v-model="v.name" />
    <select v-model="v.type">
      <option value="numeric">Numeric</option>
      <option value="categorical">Categorical</option>
    </select>
   </div>
  </div>
  
</template>
<style scoped>
.variable-list{
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.var-row{
  display: flex;
  gap: 10px;
}
</style>