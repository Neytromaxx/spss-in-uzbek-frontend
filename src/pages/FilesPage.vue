<script setup>
import { useStore } from "vuex";
import EditorPage from "./EditorPage.vue";

const store = useStore();

store.dispatch("files/load");

async function create() {
  const file = await store.dispatch("files/create");
  await store.dispatch("editor/open", file.id);
}

function open(id) {
  store.dispatch("editor/open", id);
}
</script>

<template>
  <div v-if="!store.state.editor.file">
    <h2>Mening tadqiqotlarim</h2>
    <button @click="create">+ Yangi</button>

    <ul>
      <li v-for="f in store.state.files.list" :key="f.id">
        <span @click="open(f.id)">{{ f.title }}</span>
        <button @click="store.dispatch('files/delete', f.id)">🗑</button>
      </li>
    </ul>
  </div>

  <EditorPage v-else />
</template>