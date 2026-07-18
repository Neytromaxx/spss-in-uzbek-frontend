<script setup>
import { onMounted } from "vue";
import { useStore } from "vuex";
import LoginModal from "./components/LoginModal.vue";

const store = useStore();

onMounted(() => {
  store.dispatch("auth/init");
});
</script>

<template>
  <div class="mesh">
    <div class="mesh-dot m1"></div>
    <div class="mesh-dot m2"></div>
    <div class="mesh-dot m3"></div>
  </div>
  <div class="app-shell">
    <router-view />
    <LoginModal />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
