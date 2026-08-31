<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import DatasetImportModal from "../components/DatasetImportModal.vue";

const store = useStore();
const router = useRouter();

const creating = ref(false);
const newTitle = ref("");
const importVisible = ref(false);

const files = computed(() => store.state.files.list);
const isAuth = computed(() => store.getters["auth/isAuthenticated"]);
const displayName = computed(() => store.getters["auth/displayName"]);
// Manbadan import faqat kutubxonachi va undan yuqorida: `load_campaign`
// aynan shu rolni talab qiladi. Rolsiz foydalanuvchiga tugma
// ko'rsatilsa, u 403 ga urilardi.
const isLibrarian = computed(() => store.getters["auth/isLibrarian"]);

function openLogin() {
  store.commit("auth/SET_LOGIN_VISIBLE", true);
}
function logout() {
  store.dispatch("auth/logout");
}

onMounted(() => {
  store.dispatch("files/load");
});

function startCreate() {
  creating.value = true;
  newTitle.value = "";
}

async function confirmCreate() {
  if (!newTitle.value.trim()) return;
  const file = await store.dispatch("files/create", newTitle.value.trim());
  creating.value = false;
  router.push(`/files/${file.id}`);
}

function cancelCreate() {
  creating.value = false;
  newTitle.value = "";
}

function openFile(id) {
  router.push(`/files/${id}`);
}

function onImported(file) {
  importVisible.value = false;
  router.push(`/files/${file.id}`);
}
</script>

<template>
  <div class="wrap">
    <!-- NAV -->
    <nav class="topnav">
      <div class="nav-logo">
        <div class="nl-box">📊</div>
        <div class="nl-name serif">SPSS <b>·</b> Uzbek</div>
      </div>
      <div class="auth-box">
        <template v-if="isAuth">
          <span class="who">{{ displayName }}</span>
          <button class="ghost-sm" @click="logout">Chiqish</button>
        </template>
        <button v-else class="ghost-sm" @click="openLogin">Kirish</button>
      </div>
    </nav>

    <div class="files-page">
      <!-- HERO -->
      <div class="hero">
        <div class="eyebrow accent">
          <span class="pulse"></span> Statistik tahlil platformasi
        </div>
        <h1 class="serif">
          Mening <span class="grad-text">tadqiqotlarim</span>
        </h1>
        <p class="hero-desc">
          Ma'lumotlaringizni kiriting, o'zgaruvchilarni belgilang va bir
          bosishda descriptive hamda chastota tahlilini oling.
        </p>
      </div>

      <!-- CREATE -->
      <div class="create-box">
        <template v-if="!creating">
          <button class="primary" @click="startCreate">+ Yangi tadqiqot</button>
          <button v-if="isLibrarian" class="from-source" @click="importVisible = true">
            📥 So'rovnoma ma'lumotidan
          </button>
        </template>
        <div v-else class="create-inline">
          <input
            v-model="newTitle"
            placeholder="Tadqiqot nomini kiriting"
            @keyup.enter="confirmCreate"
          />
          <button class="primary" @click="confirmCreate">Yaratish</button>
          <button @click="cancelCreate">Bekor</button>
        </div>
      </div>

      <!-- LIST -->
      <div v-if="files.length" class="file-grid">
        <div v-for="f in files" :key="f.id" class="file-card" @click="openFile(f.id)">
          <div class="fc-ico">📈</div>
          <div class="fc-body">
            <div class="fc-title">{{ f.title }}</div>
            <div class="fc-sub">Tadqiqot</div>
          </div>
          <button class="fc-del" @click.stop="store.dispatch('files/delete', f.id)">
            🗑
          </button>
        </div>
      </div>

      <div v-else class="empty">
        <div class="empty-ico">📂</div>
        <p>Hali tadqiqot yo'q. Yangi tadqiqot yaratib boshlang.</p>
      </div>
    </div>

    <DatasetImportModal
      :visible="importVisible"
      @close="importVisible = false"
      @created="onImported"
    />
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  z-index: 1;
}
.topnav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px clamp(20px, 5vw, 56px);
  border-bottom: 1px solid var(--bd);
  background: rgba(6, 8, 16, .88);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 300;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 11px;
}
.nl-box {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, var(--a1), var(--a2));
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .95rem;
  box-shadow: 0 0 20px rgba(79, 110, 247, .35);
}
.nl-name {
  font-size: 1.18rem;
}
.nl-name b {
  color: var(--a1);
}
.auth-box {
  display: flex;
  align-items: center;
  gap: 10px;
}
.who {
  font-size: .82rem;
  color: var(--t2);
}
.ghost-sm {
  background: transparent;
  border: 1px solid var(--bd);
  color: var(--t2);
  border-radius: 8px;
  padding: 7px 16px;
  font-size: .8rem;
}

.files-page {
  max-width: 840px;
  margin: 0 auto;
  padding: clamp(40px, 8vw, 72px) clamp(20px, 5vw, 32px) 60px;
}
.hero {
  text-align: center;
  margin-bottom: 44px;
}
.eyebrow.accent {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--a1);
  background: var(--a1g);
  border: 1px solid rgba(79, 110, 247, .25);
  padding: 7px 18px;
  border-radius: 20px;
  margin-bottom: 28px;
}
.pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--a1);
  animation: ep 2.2s ease infinite;
}
@keyframes ep {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .4; transform: scale(.7); }
}
.hero h1 {
  font-size: clamp(2.4rem, 6vw, 3.8rem);
  line-height: 1.1;
  letter-spacing: -.02em;
  margin-bottom: 18px;
}
.hero-desc {
  font-size: 1rem;
  color: var(--t2);
  line-height: 1.75;
  max-width: 520px;
  margin: 0 auto;
}
.from-source {
  margin-left: 8px;
}
.create-box {
  display: flex;
  justify-content: center;
  margin-bottom: 36px;
}
.create-inline {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 480px;
}
.create-inline input {
  flex: 1;
}
.file-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.file-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--s1);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  padding: 18px 20px;
  cursor: pointer;
  transition: transform .18s, border-color .18s;
}
.file-card:hover {
  transform: translateY(-2px);
  border-color: var(--bd2);
}
.fc-ico {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--a1g);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.fc-body {
  flex: 1;
  min-width: 0;
}
.fc-title {
  font-size: .95rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fc-sub {
  font-size: .72rem;
  color: var(--t3);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-top: 3px;
}
.fc-del {
  background: transparent;
  border: 1px solid var(--bd);
  padding: 8px 12px;
  border-radius: 8px;
  flex-shrink: 0;
}
.fc-del:hover {
  border-color: rgba(239, 68, 68, .4);
}
.empty {
  text-align: center;
  padding: 64px 20px;
  color: var(--t3);
}
.empty-ico {
  font-size: 3rem;
  opacity: .4;
  margin-bottom: 14px;
}
.empty p {
  font-size: .9rem;
}
</style>
