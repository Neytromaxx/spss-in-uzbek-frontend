<script setup>
import { onMounted } from "vue";
import { useStore } from "vuex";

const store = useStore();

onMounted(() => {
  // Telegram WebApp ichida ochilgan bo'lsa avtomatik kiramiz.
  // PWA (brauzer) rejimida login ixtiyoriy — anonim ishlash mumkin.
  store.dispatch("auth/init");
});
</script>

<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
