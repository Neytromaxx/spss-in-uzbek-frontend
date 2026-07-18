<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();

const creating = ref(false);
const newTitle = ref("");

const isAuth = computed(() => store.getters["auth/isAuthenticated"]);
const displayName = computed(() => store.getters["auth/displayName"]);

function openLogin() {
  store.commit("auth/SET_LOGIN_VISIBLE", true);
}
function logout() {
  store.dispatch("auth/logout");
}

/* ===============================
   LOAD FILES
================================ */
onMounted(() => {
  store.dispatch("files/load");
});

/* ===============================
   CREATE FLOW
================================ */
function startCreate() {
  creating.value = true;
  newTitle.value = "";
}

async function confirmCreate() {
  if (!newTitle.value.trim()) return;

  const file = await store.dispatch(
    "files/create",
    newTitle.value.trim()
  );

  creating.value = false;

  // router orqali ochamiz
  router.push(`/files/${file.id}`);
}

function cancelCreate() {
  creating.value = false;
  newTitle.value = "";
}

/* ===============================
   OPEN FILE
================================ */
async function openFile(id) {
  // MUHIM: har safar reset qilamiz
  store.commit("editor/RESET");

  await store.dispatch("editor/open", id);
}
</script>

<template>
  <div class="files-page">
    <div class="page-head">
      <h2>Mening tadqiqotlarim</h2>
      <div class="auth-box">
        <template v-if="isAuth">
          <span class="who">{{ displayName }}</span>
          <button class="ghost" @click="logout">Chiqish</button>
        </template>
        <button v-else class="ghost" @click="openLogin">Kirish</button>
      </div>
    </div>

    <!-- CREATE -->
    <div class="create-box">
      <button v-if="!creating" @click="startCreate">
        + Yangi tadqiqot
      </button>

      <div v-else class="create-inline">
        <input
          v-model="newTitle"
          placeholder="Tadqiqot nomini kiriting"
          @keyup.enter="confirmCreate"
          autofocus
        />

        <button class="primary" @click="confirmCreate">
          Saqlash
        </button>

        <button @click="cancelCreate">
          Bekor qilish
        </button>
      </div>
    </div>

    <!-- LIST -->
    <ul class="file-list">
      <li v-for="f in store.state.files.list" :key="f.id">
        <span class="file-title" @click="openFile(f.id)">
          {{ f.title }}
        </span>

        <button
          class="danger"
          @click="store.dispatch('files/delete', f.id)"
        >
          🗑
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.files-page {
  padding: 16px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.auth-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.who {
  font-size: 13px;
  color: #9ca3af;
}

.ghost {
  background: transparent;
  border: 1px solid #334155;
  color: #e5e7eb;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}

.create-box {
  margin-bottom: 16px;
}

.create-inline {
  display: flex;
  gap: 8px;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #1f2937;
}

.file-title {
  cursor: pointer;
}

.file-title:hover {
  text-decoration: underline;
}
</style>