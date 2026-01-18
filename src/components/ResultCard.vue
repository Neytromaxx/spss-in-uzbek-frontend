<script setup>
defineProps({
  name: String,
  stats: Object,
});
</script>

<template>
  <div class="card">
    <h4 class="title">{{ name }}</h4>

    <div class="grid">
      <div class="item">
        <span>O‘rtacha</span>
        <strong>{{ stats.mean }}</strong>
      </div>

      <div class="item">
        <span>Mediana</span>
        <strong>{{ stats.median }}</strong>
      </div>

      <div class="item">
        <span>Standart og‘ish</span>
        <strong>{{ stats.sd }}</strong>
      </div>

      <div class="item">
        <span>Min – Max</span>
        <strong>{{ stats.min }} – {{ stats.max }}</strong>
      </div>

      <div class="item">
        <span>1-kvartil</span>
        <strong>{{ stats.q1 }}</strong>
      </div>

      <div class="item">
        <span>3-kvartil</span>
        <strong>{{ stats.q3 }}</strong>
      </div>

      <div class="item">
        <span>Asimmetriya</span>
        <strong>{{ stats.skewness }}</strong>
      </div>

      <div class="item">
        <span>Eksess</span>
        <strong>{{ stats.kurtosis }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #020617;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 16px;
}

.title {
  margin: 0 0 12px;
  font-size: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.item {
  background: #0f172a;
  border-radius: 8px;
  padding: 8px;
}

.item span {
  display: block;
  font-size: 12px;
  opacity: 0.7;
}

.item strong {
  font-size: 14px;
}
</style>
