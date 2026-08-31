<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import {
  Chart,
  BarController,
  BarElement,
  ScatterController,
  LineController,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { BoxPlotController, BoxAndWiskers } from "@sgratzl/chartjs-chart-boxplot";

// Backend tayyorlagan grafik tavsifini chizadi.
//
// 🔴 BU YERDA STATISTIKA HISOBLANMAYDI.
//
// Binlar, kvartillar, mo'ylov chegaralari va regressiya chizig'i —
// hammasi backenddan tayyor keladi (`app/modules/statistics/charts.py`).
// Sabab: ular statistik qaror va `pytest` bilan sinaladi; bu yerda
// qayta hisoblansa ikkita manba paydo bo'lardi va ular vaqt o'tib
// ajralardi (jadvaldagi mediana boshqa, diagrammadagi boshqa).
//
// Shuning uchun quyida faqat chizish: ranglar, o'qlar, tooltip.

// Faqat kerakli qismlarni ro'yxatdan o'tkazamiz — `Chart.register(...all)`
// yig'ilgan faylni keraksiz kattalashtirardi.
Chart.register(
  BarController, BarElement,
  ScatterController, LineController, PointElement, LineElement,
  CategoryScale, LinearScale,
  Tooltip, Legend, Title,
  BoxPlotController, BoxAndWiskers,
);

const props = defineProps({
  chart: { type: Object, required: true },
});

const canvas = ref(null);
let instance = null;

// Interfeys ranglari (`assets/base.css` bilan bir xil).
const A1 = "#4f6ef7";
const A2 = "#8b5cf6";
const A3 = "#06d6a0";
const A4 = "#f59e0b";
const SETKA = "rgba(123, 132, 176, .18)";
const MATN = "#7b84b0";

const SERIYA_RANGLARI = [A1, A2, A3, A4, "#ef4444", "#14b8a6"];

function shaffof(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function son(v, raqam = 2) {
  if (v === null || v === undefined) return "—";
  return Number.isInteger(v) ? String(v) : Number(v).toFixed(raqam);
}

const umumiyOqlar = (c) => ({
  x: {
    title: { display: !!c.x_label, text: c.x_label, color: MATN },
    ticks: { color: MATN, font: { size: 10 } },
    grid: { color: SETKA },
  },
  y: {
    title: { display: !!c.y_label, text: c.y_label, color: MATN },
    ticks: { color: MATN, font: { size: 10 } },
    grid: { color: SETKA },
    beginAtZero: true,
  },
});

// Quti va sochma diagrammada y noldan boshlanmaydi — aks holda
// qiymatlar tor oraliqda bo'lsa (masalan 40..75) shakl yassilanib
// qolardi. `grace` esa chekkada bo'sh joy qoldiradi: usiz eng yuqori
// mo'ylov yoki nuqta o'q chizig'iga TEGIB turadi va kesilgandek
// ko'rinadi.
function erkinY(c) {
  return { ...umumiyOqlar(c).y, beginAtZero: false, grace: "6%" };
}

function konfiguratsiya(c) {
  const umumiy = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false, labels: { color: MATN } },
      tooltip: { backgroundColor: "#161b2e", borderColor: "#28304d", borderWidth: 1 },
    },
    scales: umumiyOqlar(c),
  };

  if (c.kind === "histogram") {
    // Bin chegaralari yorliqqa aylanadi: "12.0–17.5".
    return {
      type: "bar",
      data: {
        labels: c.bins.map((b) => `${son(b.from, 1)}–${son(b.to, 1)}`),
        datasets: [{
          data: c.bins.map((b) => b.count),
          backgroundColor: shaffof(A1, 0.55),
          borderColor: A1,
          borderWidth: 1,
          // Gistogrammada ustunlar tegib turadi — bu uni ustunli
          // diagrammadan farqlaydi va uzluksiz o'qni bildiradi.
          barPercentage: 1,
          categoryPercentage: 1,
        }],
      },
      options: umumiy,
    };
  }

  if (c.kind === "bar") {
    const seriyalar = c.series
      ? c.series.map((s, i) => ({
          label: s.label,
          data: s.counts,
          backgroundColor: shaffof(SERIYA_RANGLARI[i % SERIYA_RANGLARI.length], 0.55),
          borderColor: SERIYA_RANGLARI[i % SERIYA_RANGLARI.length],
          borderWidth: 1,
        }))
      : [{
          data: c.counts,
          backgroundColor: shaffof(A2, 0.55),
          borderColor: A2,
          borderWidth: 1,
        }];
    return {
      type: "bar",
      data: { labels: c.categories, datasets: seriyalar },
      options: {
        ...umumiy,
        plugins: { ...umumiy.plugins, legend: { display: !!c.series, labels: { color: MATN } } },
      },
    };
  }

  if (c.kind === "boxplot") {
    // Qiymatlar backendda hisoblangan, shuning uchun plaginga XOM
    // ma'lumot emas, tayyor statistikani beramiz.
    return {
      type: "boxplot",
      data: {
        labels: c.groups.map((g) => g.label),
        datasets: [{
          data: c.groups.map((g) => ({
            min: g.min, q1: g.q1, median: g.median, q3: g.q3, max: g.max,
            outliers: g.outliers || [],
          })),
          backgroundColor: shaffof(A1, 0.35),
          borderColor: A1,
          borderWidth: 1.5,
          medianColor: A3,
          outlierBackgroundColor: A4,
          itemRadius: 0,
        }],
      },
      options: {
        ...umumiy,
        scales: { ...umumiyOqlar(c), y: erkinY(c) },
      },
    };
  }

  if (c.kind === "scatter") {
    const datasets = [{
      type: "scatter",
      data: c.points,
      backgroundColor: shaffof(A1, 0.7),
      borderColor: A1,
      pointRadius: 3,
    }];

    if (c.line) {
      // Chiziqni ikkita nuqta bilan chizamiz: eng chap va eng o'ng x.
      const xs = c.points.map((p) => p.x);
      const x1 = Math.min(...xs);
      const x2 = Math.max(...xs);
      datasets.push({
        type: "line",
        label: "Regressiya chizig'i",
        data: [
          { x: x1, y: c.line.slope * x1 + c.line.intercept },
          { x: x2, y: c.line.slope * x2 + c.line.intercept },
        ],
        borderColor: A4,
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      });
    }

    return {
      type: "scatter",
      data: { datasets },
      options: {
        ...umumiy,
        scales: { ...umumiyOqlar(c), y: erkinY(c) },
      },
    };
  }

  return null;
}

function chiz() {
  if (instance) {
    instance.destroy();
    instance = null;
  }
  const cfg = konfiguratsiya(props.chart);
  if (!cfg || !canvas.value) return;
  instance = new Chart(canvas.value, cfg);
}

onMounted(chiz);
watch(() => props.chart, chiz, { deep: true });
onBeforeUnmount(() => {
  if (instance) instance.destroy();
});
</script>

<template>
  <div class="chart-card">
    <div class="ch-title">{{ chart.title }}</div>
    <div class="ch-box">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: var(--s1);
  border: 1px solid var(--bd);
  border-radius: var(--r2);
  padding: 16px 18px;
}
.ch-title {
  font-size: .9rem;
  color: var(--t1);
  margin-bottom: 10px;
}
.ch-box {
  position: relative;
  height: 280px;
}
</style>
