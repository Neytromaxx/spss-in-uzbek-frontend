<script setup>
// NamunaBanner — namuna fayl ochilganda bitta tavsiya.
//
// 🔴 BITTA BANNER, BITTA TAVSIYA — interaktiv sayohat EMAS.
//
// Qadamlar chizig'i va «keyingi qadam» tugmalari yo'nalishni
// allaqachon ko'rsatadi. Bu yerda faqat namunaning o'ziga xos
// ikki joyi aytiladi: `b3` dagi yo'q qiymat kodi va `jins`
// bo'yicha taqqoslash.
//
// Yopilganda `localStorage` da eslab qolinadi: bitta faylni
// qayta-qayta ochganda banner qayta chiqmasin.

import { ref } from "vue";

const props = defineProps({
  fileId: { type: String, default: "" },
});

const KALIT = "mtt.namuna.banner";

function yopilganmi(id) {
  try {
    return (localStorage.getItem(KALIT) || "").split(",").includes(id);
  } catch {
    return false;
  }
}

const korinadi = ref(!yopilganmi(props.fileId));

function yop() {
  korinadi.value = false;
  try {
    const eski = (localStorage.getItem(KALIT) || "").split(",").filter(Boolean);
    localStorage.setItem(KALIT, [...new Set([...eski, props.fileId])].join(","));
  } catch {
    // Saqlanmasa ham joriy sessiyada yopilgan holicha qoladi.
  }
}
</script>

<template>
  <div v-if="korinadi" class="namuna-banner">
    <div class="matn">
      <strong>Bu — namuna (o‘quv) ma’lumot, haqiqiy tadqiqot emas.</strong>
      <p>
        Tavsiya: <b>② O‘zgaruvchilar</b> yorlig‘ida <code>b3</code> dagi
        yo‘q qiymat kodini (<code>99</code>) ko‘ring, keyin
        <b>③ Tahlil</b> da «Bog‘liqsiz t-test» bilan <code>jins</code>
        bo‘yicha solishtiring.
      </p>
    </div>
    <button class="yop" aria-label="Yopish" @click="yop">✕</button>
  </div>
</template>

<style scoped>
.namuna-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 10px 12px 0;
  padding: 12px 14px;
  border: 1px solid rgba(79, 110, 247, .32);
  border-radius: var(--r2);
  background: linear-gradient(135deg, rgba(79, 110, 247, .1), rgba(139, 92, 246, .06));
}
.matn { flex: 1; font-size: .84rem; color: var(--t2); }
.matn strong { color: var(--t1); }
.matn p { margin: 6px 0 0; line-height: 1.55; }
.matn code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--a1);
}
.yop {
  background: none;
  border: none;
  color: var(--t3);
  font-size: .9rem;
  padding: 2px 4px;
  cursor: pointer;
}
</style>
