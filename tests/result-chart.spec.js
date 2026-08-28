// tests/result-chart.spec.js — backend tavsifi -> Chart.js konfiguratsiyasi.
//
// Bu komponent statistika HISOBLAMAYDI; u faqat backenddan kelgan
// tayyor sonlarni chizishga o'giradi. Shuning uchun testlar ham aynan
// shu o'girishni tekshiradi: qaysi tur, qaysi yorliq, qaysi qiymat.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

// Chart.js jsdom'da haqiqiy canvas talab qiladi. Bizni chizish emas,
// UNGA UZATILGAN KONFIGURATSIYA qiziqtiradi — shuning uchun sinf
// o'rniga qo'g'irchoq qo'yamiz va argumentni ushlaymiz.
const qurilganlar = [];
vi.mock("chart.js", () => {
  class Chart {
    constructor(canvas, cfg) {
      qurilganlar.push(cfg);
      this.cfg = cfg;
    }
    destroy() {}
    static register() {}
  }
  return {
    Chart,
    BarController: {}, BarElement: {},
    ScatterController: {}, LineController: {},
    PointElement: {}, LineElement: {},
    CategoryScale: {}, LinearScale: {},
    Tooltip: {}, Legend: {}, Title: {},
  };
});
vi.mock("@sgratzl/chartjs-chart-boxplot", () => ({
  BoxPlotController: {}, BoxAndWiskers: {},
}));

const ResultChart = (await import("../src/components/analysis/ResultChart.vue")).default;

function chiz(chart) {
  qurilganlar.length = 0;
  mount(ResultChart, { props: { chart } });
  return qurilganlar[0];
}

beforeEach(() => {
  qurilganlar.length = 0;
});

describe("gistogramma", () => {
  const spec = {
    id: "hist_x", kind: "histogram", title: "X — taqsimot",
    x_label: "X", y_label: "Chastota",
    bins: [
      { from: 10, to: 15, count: 4 },
      { from: 15, to: 20, count: 7 },
    ],
  };

  it("bar turida chiziladi", () => {
    expect(chiz(spec).type).toBe("bar");
  });

  it("butun sonli bin chegaralari toza ko'rsatiladi", () => {
    expect(chiz(spec).data.labels).toEqual(["10–15", "15–20"]);
  });

  it("kasrli chegaralar bitta xonagacha yaxlitlanadi", () => {
    const cfg = chiz({
      ...spec,
      bins: [{ from: 12.3456, to: 17.8912, count: 2 }],
    });
    expect(cfg.data.labels).toEqual(["12.3–17.9"]);
  });

  it("chastotalar o'zgartirilmasdan uzatiladi", () => {
    expect(chiz(spec).data.datasets[0].data).toEqual([4, 7]);
  });

  it("ustunlar tegib turadi (uzluksiz o'q)", () => {
    const ds = chiz(spec).data.datasets[0];
    expect(ds.barPercentage).toBe(1);
    expect(ds.categoryPercentage).toBe(1);
  });
});

describe("quti-diagramma", () => {
  const spec = {
    id: "box_y", kind: "boxplot", title: "Y — guruhlar",
    groups: [
      { label: "A", min: 10, q1: 11, median: 12, q3: 13, max: 14, outliers: [30], n: 8 },
      { label: "B", min: 18, q1: 19, median: 20, q3: 21, max: 22, outliers: [], n: 7 },
    ],
  };

  it("boxplot turida chiziladi", () => {
    expect(chiz(spec).type).toBe("boxplot");
  });

  it("XOM ma'lumot emas, TAYYOR statistika uzatiladi", () => {
    // 🔴 Muhim: plagin xom sonlardan o'zi ham hisoblay oladi. Agar shu
    // yo'ldan ketilsa, diagrammadagi mediana backend jadvalidagidan
    // farq qilishi mumkin edi (kvartil usuli boshqacha).
    const d = chiz(spec).data.datasets[0].data;
    expect(d[0]).toEqual({
      min: 10, q1: 11, median: 12, q3: 13, max: 14, outliers: [30],
    });
  });

  it("guruh yorliqlari saqlanadi", () => {
    expect(chiz(spec).data.labels).toEqual(["A", "B"]);
  });

  it("y o'qi noldan boshlanmaydi", () => {
    // Qutilar 10–22 oralig'ida; noldan boshlansa ular yassilanib qolardi.
    expect(chiz(spec).options.scales.y.beginAtZero).toBe(false);
  });
});

describe("sochma diagramma", () => {
  const nuqtalar = [
    { x: 1, y: 3 }, { x: 2, y: 5 }, { x: 5, y: 11 },
  ];

  it("nuqtalar o'zgartirilmasdan uzatiladi", () => {
    const cfg = chiz({ id: "s", kind: "scatter", title: "S", points: nuqtalar });
    expect(cfg.type).toBe("scatter");
    expect(cfg.data.datasets[0].data).toEqual(nuqtalar);
  });

  it("chiziqsiz spec'da faqat bitta qatlam bo'ladi", () => {
    const cfg = chiz({ id: "s", kind: "scatter", title: "S", points: nuqtalar });
    expect(cfg.data.datasets).toHaveLength(1);
  });

  it("regressiya chizig'i x chegaralarida quriladi", () => {
    const cfg = chiz({
      id: "s", kind: "scatter", title: "S", points: nuqtalar,
      line: { slope: 2, intercept: 1 },
    });
    expect(cfg.data.datasets).toHaveLength(2);
    // y = 2x + 1, x eng kichigi 1 va eng kattasi 5
    expect(cfg.data.datasets[1].data).toEqual([
      { x: 1, y: 3 },
      { x: 5, y: 11 },
    ]);
  });
});

describe("ustunli diagramma", () => {
  it("oddiy: bitta qatlam, afsona yo'q", () => {
    const cfg = chiz({
      id: "b", kind: "bar", title: "B",
      categories: ["Erkak", "Ayol"], counts: [12, 18],
    });
    expect(cfg.data.datasets).toHaveLength(1);
    expect(cfg.data.datasets[0].data).toEqual([12, 18]);
    expect(cfg.options.plugins.legend.display).toBe(false);
  });

  it("guruhlangan: har seriya alohida qatlam va afsona bor", () => {
    const cfg = chiz({
      id: "b", kind: "bar", title: "B", categories: ["Ha", "Yo'q"],
      series: [
        { label: "Erkak", counts: [5, 5] },
        { label: "Ayol", counts: [4, 6] },
      ],
    });
    expect(cfg.data.datasets).toHaveLength(2);
    expect(cfg.data.datasets[1].label).toBe("Ayol");
    expect(cfg.data.datasets[1].data).toEqual([4, 6]);
    expect(cfg.options.plugins.legend.display).toBe(true);
  });
});

describe("noma'lum tur", () => {
  it("chizmaydi va yiqilmaydi", () => {
    // Backend yangi tur qo'shsa, eski frontend uni jimgina o'tkazsin.
    expect(chiz({ id: "v", kind: "violin", title: "V" })).toBeUndefined();
  });
});

describe("o'q yorliqlari", () => {
  it("berilgan bo'lsa ko'rsatiladi", () => {
    const cfg = chiz({
      id: "h", kind: "histogram", title: "H", x_label: "Yosh", y_label: "Chastota",
      bins: [{ from: 1, to: 2, count: 1 }],
    });
    expect(cfg.options.scales.x.title.display).toBe(true);
    expect(cfg.options.scales.x.title.text).toBe("Yosh");
  });

  it("bo'sh bo'lsa ko'rsatilmaydi", () => {
    const cfg = chiz({
      id: "h", kind: "histogram", title: "H",
      bins: [{ from: 1, to: 2, count: 1 }],
    });
    expect(cfg.options.scales.x.title.display).toBe(false);
  });
});
