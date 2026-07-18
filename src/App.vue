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
  <div class="app-shell">
    <router-view />
    <LoginModal />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
