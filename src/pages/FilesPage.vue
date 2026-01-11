<script setup>
import {ref} from "vue";
import { useStore } from "vuex";
import EditorPage from "./EditorPage.vue";

const store = useStore();
const creating = ref(false);
const newTitle = ref('');

function startCreate(){
    creating.value = true;
    newTitle.value = '';
}

store.dispatch("files/load");

async function confirmCreate() {
  if (!newTitle.value.trim()) return;

  const file = await store.dispatch("files/create", {
    title: newTitle.value.trim(),
  });

  creating.value = false;

  // MUHIM: router emas, Vuex orqali ochamiz
  await store.dispatch("editor/open", file.id);
}

function cancelCreate() {
  creating.value = false;
  newTitle.value = "";
}

function openFile(id) {
  store.dispatch("editor/open", id);
}
</script>

<template>
    <div class="files-page" v-if="!store.state.editor.file">
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
  