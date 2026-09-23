<script setup>
// TayyorlikRoyxati — tahlilga o'tishdan oldingi ogohlantirishlar.
//
// 🔴 HECH NARSANI TO'SMAYDI. Ro'yxat faqat aytadi; foydalanuvchi
// uni e'tiborsiz qoldirib tahlilga o'ta oladi (qadamlar
// chizig'idagi «baribir davom etish»).
//
// Ko'rinish (presentational) komponent: do'konga tegmaydi,
// faqat hodisa chiqaradi. Shu sababli alohida sinaladi va
// `VariablesTab` shishmaydi.

import { computed } from "vue";
import { radEtiladimi } from "../tayyorlik";

const props = defineProps({
  muammolar: { type: Array, default: () => [] },
});

const emit = defineEmits(["tuzat", "rad"]);

// Qaysi ogohlantirish rad etilishi `tayyorlik.js` da — kodlar
// o'sha yerda va siyosat ikki joyda bo'lsa ajralib ketardi.
const elementlar = computed(() =>
  props.muammolar.map(m => ({ ...m, radEtiladi: radEtiladimi(m.kod) })),
);
</script>

<template>
  <div v-if="elementlar.length" class="tayyorlik">
    <div class="bosh">
      <span class="belgi">⚠</span>
      <span>{{ elementlar.length }} ta e’tibor talab qiladigan joy</span>
    </div>

    <ul class="royxat">
      <li v-for="m in elementlar" :key="`${m.variable}:${m.kod}`" :data-kod="m.kod">
        <span class="matn">{{ m.matn }}</span>
        <span class="amallar">
          <button v-if="m.tuzatish" class="tuzat" @click="emit('tuzat', m)">
            {{ m.tuzatish.matn }}
          </button>
          <button v-if="m.radEtiladi" class="rad" @click="emit('rad', m)">
            Yo‘q, bu ball
          </button>
        </span>
      </li>
    </ul>

    <p class="izoh">
      Bular tahlilni to‘smaydi — istasangiz e’tiborsiz qoldiring.
    </p>
  </div>
</template>

<style scoped>
.tayyorlik {
  border: 1px solid rgba(245, 158, 11, .35);
  background: rgba(245, 158, 11, .07);
  border-radius: var(--r2);
  padding: 12px 14px;
  margin-bottom: 14px;
}
.bosh {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .78rem;
  font-weight: 700;
  color: var(--a4);
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: 10px;
}
.belgi { font-size: .9rem; }

.royxat {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.royxat li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: .84rem;
  color: var(--t2);
  line-height: 1.5;
}
.matn { flex: 1; min-width: 200px; }
.amallar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tuzat,
.rad {
  border-radius: 6px;
  padding: 4px 10px;
  font-size: .74rem;
  white-space: nowrap;
  cursor: pointer;
}
.tuzat {
  background: rgba(245, 158, 11, .14);
  border: 1px solid rgba(245, 158, 11, .45);
  color: var(--a4);
}
.rad {
  background: transparent;
  border: 1px solid var(--bd);
  color: var(--t3);
}

.izoh {
  font-size: .74rem;
  color: var(--t3);
  margin: 10px 0 0;
}
</style>
