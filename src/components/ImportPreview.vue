<script setup>
// FAYLDAN O'QILGANINI KO'RSATISH VA TASDIQLASH.
//
// ══════════════════════════════════════════════════════════════════
// 🔴 NIMA UCHUN AVVAL KO'RSATILADI
// ══════════════════════════════════════════════════════════════════
//
// Import mavjud o'zgaruvchilar va BARCHA qatorlarni almashtiradi.
// Ilgari bu so'ramasdan bajarilardi: tasodifan bosilgan tugma bir
// necha soatlik ishni o'chirib yuborardi va uni qaytarib bo'lmasdi.
//
// Endi avval nima yozilishi ko'rsatiladi: ustunlar, ularning
// aniqlangan turi, birinchi qatorlar va NIMA YO'QOLISHI.
//
// ── OGOHLANTIRISHLAR ALOHIDA KO'RSATILADI ──
//
// Import "ok" deb qaytishi mumkin, lekin ichida jimgina o'zgarish
// bo'lgan bo'ladi: o'nlik vergul nuqtaga o'girilgan, ustun matn deb
// belgilangan, faqat bitta varaq o'qilgan. Bularni yashirsak,
// foydalanuvchi ma'lumoti nima uchun boshqacha ko'rinayotganini
// hech qachon bilmasdi.

import { computed } from "vue";

const props = defineProps({
  // Backend `import:parse` javobi
  preview: { type: Object, required: true },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(["confirm", "cancel", "sheet"]);

const MEASURE_NOMI = {
  scale: "Raqamli",
  nominal: "Matn",
  ordinal: "Tartibli",
};

const variables = computed(() => props.preview.variables || []);
const sample = computed(() => props.preview.sample || []);
const warnings = computed(() => props.preview.warnings || []);
const sheets = computed(() => props.preview.sheets || []);

// Yozib bo'lmaydigan holat (masalan qatorlar chegaradan oshgan)
const blocked = computed(() => Boolean(props.preview.blocked));

// 🔴 Nima YO'QOLISHI — eng muhim raqam.
const currentRows = computed(() => props.preview.currentRows || 0);

function katak(row, name) {
  const v = row.values?.[name];
  return v === undefined || v === "" ? "—" : v;
}
</script>

<template>
  <div class="ip-backdrop">
    <div class="ip-box">
      <h3 class="ip-title">Fayldan o‘qildi — tekshiring</h3>

      <p class="ip-sum">
        <strong>{{ variables.length }}</strong> ustun,
        <strong>{{ preview.rowsTotal }}</strong> qator o‘qildi.
      </p>

      <!-- 🔴 Nima yo'qolishi. Bo'sh faylda ogohlantirish shart emas. -->
      <p v-if="currentRows > 0" class="ip-warn ip-danger">
        Diqqat: hozirgi <strong>{{ currentRows }}</strong> qator va mavjud
        o‘zgaruvchilar <strong>o‘chiriladi</strong> va o‘rniga shu fayl yoziladi.
      </p>

      <div v-if="sheets.length > 1" class="ip-sheets">
        <label>Varaq:</label>
        <select :disabled="busy" @change="emit('sheet', $event.target.value)">
          <option v-for="s in sheets" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <ul v-if="warnings.length" class="ip-warns">
        <li v-for="(w, i) in warnings" :key="i" class="ip-warn">{{ w }}</li>
      </ul>

      <div class="ip-table-wrap">
        <table class="ip-table">
          <thead>
            <tr>
              <th v-for="v in variables" :key="v.name">
                {{ v.label || v.name }}
                <span class="ip-measure">{{
                  MEASURE_NOMI[v.measure] || v.measure
                }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in sample" :key="i">
              <td v-for="v in variables" :key="v.name">{{ katak(r, v.name) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="preview.rowsTotal > sample.length" class="ip-more">
        …va yana {{ preview.rowsTotal - sample.length }} qator.
      </p>

      <div class="ip-actions">
        <button class="ip-cancel" :disabled="busy" @click="emit('cancel')">
          Bekor qilish
        </button>
        <button
          class="ip-ok"
          :disabled="busy || blocked"
          @click="emit('confirm')"
        >
          {{ busy ? "Yozilmoqda…" : "Tasdiqlash va yozish" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ip-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 16px;
}
.ip-box {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow: auto;
}
.ip-title {
  margin: 0 0 8px;
  font-size: 18px;
}
.ip-sum {
  margin: 0 0 10px;
  color: #374151;
}
.ip-warn {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  border-radius: 8px;
  padding: 8px 10px;
  margin: 6px 0;
  font-size: 13px;
}
.ip-danger {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}
.ip-warns {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
}
.ip-sheets {
  margin: 8px 0;
  font-size: 14px;
}
.ip-sheets select {
  margin-left: 6px;
  padding: 4px 6px;
}
.ip-table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.ip-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 13px;
}
.ip-table th,
.ip-table td {
  border-bottom: 1px solid #f3f4f6;
  padding: 6px 10px;
  text-align: left;
  white-space: nowrap;
}
.ip-table th {
  background: #f9fafb;
}
.ip-measure {
  display: block;
  font-weight: 400;
  font-size: 11px;
  color: #6b7280;
}
.ip-more {
  color: #6b7280;
  font-size: 12px;
  margin: 8px 0 0;
}
.ip-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
.ip-actions button {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
}
.ip-ok {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.ip-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
