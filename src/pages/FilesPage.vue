<script setup>
import { ref, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();

const creating = ref(false);
const newTitle = ref("");

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
  // store.commit("editor/core/RESET");
  // await store.dispatch("editor/core/open", id);
  router.push(`/files/${id}`);
  console.log("Clicked File ID: ", id)
}
</script>

<template>
  <div class="files-page">
    <h2>Mening tadqiqotlarim</h2>

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
