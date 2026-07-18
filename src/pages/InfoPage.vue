<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div class="info-page">
    <div class="eyebrow accent">Ma'lumot</div>
    <h1 class="serif">SPSS <span class="grad-text">in Uzbek</span></h1>
    <p>
      O'zbek tilida SPSS uslubidagi statistik tahlil platformasi. Ma'lumot
      kiriting, o'zgaruvchilarni belgilang va descriptive hamda chastota
      tahlilini bir bosishda oling. Natijani saqlang yoki Word/PDF yuklab oling.
    </p>
    <button class="primary" @click="router.push('/')">Boshlash</button>
  </div>
</template>

<style scoped>
.info-page {
  max-width: 560px;
  margin: 0 auto;
  padding: 100px 24px;
  text-align: center;
}
.eyebrow.accent {
  display: inline-block;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--a1);
  background: var(--a1g);
  border: 1px solid rgba(79, 110, 247, .25);
  padding: 7px 18px;
  border-radius: 20px;
  margin-bottom: 24px;
}
.info-page h1 {
  font-size: clamp(2.2rem, 6vw, 3.4rem);
  margin-bottom: 20px;
}
.info-page p {
  color: var(--t2);
  line-height: 1.8;
  margin-bottom: 32px;
}
</style>
