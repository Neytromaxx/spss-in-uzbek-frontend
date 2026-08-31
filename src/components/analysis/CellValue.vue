<script setup>
// Katak qiymati bir nechta turda kelishi mumkin: oddiy son yoki satr,
// yoki `{spss, excel}` kabi multi-metod obyekti (asimmetriya, ekssess).
defineProps({
  value: { type: [Number, String, Boolean, Object], default: null },
});

function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}
function fmt(n, digits = 3) {
  if (n === null || n === undefined) return "—";
  if (typeof n === "number") {
    if (Number.isNaN(n)) return "—";
    return Number.isInteger(n) ? String(n) : n.toFixed(digits);
  }
  return n;
}
</script>

<template>
  <!-- Korrelyatsiya katagi: r, p, N (SPSS uslubi) -->
  <div v-if="isObj(value) && 'r' in value" class="corr-cell">
    <div class="r">
      {{ fmt(value.r) }}<sup v-if="value.stars" class="stars">{{ value.stars }}</sup>
    </div>
    <div v-if="value.p !== null && value.p !== undefined" class="sub">p = {{ fmt(value.p) }}</div>
    <div class="sub">N = {{ value.n }}</div>
  </div>

  <!-- Multi-metod katak: SPSS / Excel -->
  <div v-else-if="isObj(value) && 'spss' in value" class="multi-cell">
    <span><i>SPSS</i> {{ fmt(value.spss) }}</span>
    <span><i>Excel</i> {{ fmt(value.excel) }}</span>
  </div>

  <!-- Oddiy qiymat -->
  <span v-else>{{ fmt(value) }}</span>
</template>

<style scoped>
.corr-cell {
  line-height: 1.35;
  font-family: 'JetBrains Mono', monospace;
}
.corr-cell .r {
  font-weight: 700;
  color: var(--t1);
}
.corr-cell .stars {
  color: var(--a1);
  font-weight: 700;
}
.corr-cell .sub {
  font-size: .72rem;
  color: var(--t3);
}
.multi-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: 'JetBrains Mono', monospace;
  font-size: .8rem;
}
.multi-cell i {
  color: var(--t3);
  font-style: normal;
  font-size: .64rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-right: 6px;
}
</style>
