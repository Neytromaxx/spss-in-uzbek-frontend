<script setup>
/* RecodeModal — qayta kodlangan o'zgaruvchi oynasi.
 *
 * 🔴 QOIDALAR TARTIBI MA'NONI O'ZGARTIRADI
 *
 * Qiymat BIRINCHI mos kelgan qoidaga tushadi, qolganlari
 * tekshirilmaydi. Ya'ni `1 THRU 3 -> 1` va `3 THRU 5 -> 2` ketma-ket
 * turganda `3` birinchisiga yoziladi. Shuning uchun tartib ko'rinib
 * turishi va o'zgartirilishi SHART.
 *
 * 🔴 «Ko'rib chiqish» nima uchun kerak
 *
 * Hech qaysi qoidaga tushmagan qiymat yangi ustunda BO'SH bo'ladi.
 * 7 ta darajadan 5 tasi kodlansa, qolgan 2 tasi jimgina yo'qoladi va
 * tanlama qisqaradi. `summary.unmatched` va `by_target` aynan shuni
 * saqlashdan OLDIN ko'rsatadi.
 */
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";

import { xatoMatni } from "../api/errors";
import { OLCHOVLAR } from "../olchov";

const props = defineProps({ open: Boolean });
const emit = defineEmits(["close"]);

const store = useStore();

const manba = ref("");
const nom = ref("");
const yorliq = ref("");
const olchov = ref("nominal");
const overwrite = ref(false);
// 🔴 Boshlang'ich holatda ham bitta qoida bo'ladi. `tozala()` faqat
// `open` o'zgarganda chaqiriladi — oyna darhol ochiq holda yaratilsa
// (test yoki kelajakdagi boshqa chaqiruv) ro'yxat bo'sh qolardi va
// foydalanuvchi «+ Qoida» tugmasidan boshqa hech narsa ko'rmasdi.
const qoidalar = ref([bosh_qoida()]);
const yorliqlar = ref([]); // [{ kod, matn }]

const xato = ref(null);
const xulosa = ref(null);
const ogohlar = ref([]);
const saqlandi = ref(false);
const band = ref(false);

const variables = computed(() => store.state.editor.schema.variables);
const rows = computed(() => store.state.editor.rows);

// Moslik turlari — backenddagi `MOS_TURLARI` bilan bir xil.
const MOS_TURLARI = [
  { qiymat: "value", nom: "Qiymat" },
  { qiymat: "values", nom: "Qiymatlar" },
  { qiymat: "range", nom: "Oraliq" },
  { qiymat: "missing", nom: "Yo'q qiymat" },
  { qiymat: "sysmis", nom: "Bo'sh katak" },
  { qiymat: "else", nom: "Qolganlari" },
];

const NAT_TURLARI = [
  { qiymat: "value", nom: "Qiymat" },
  { qiymat: "sysmis", nom: "Bo'sh" },
  { qiymat: "copy", nom: "Ko'chirish" },
];

function bosh_qoida() {
  return {
    type: "value",
    values: "",
    low: "",
    high: "",
    target_kind: "value",
    target: "",
  };
}

function tozala() {
  manba.value = "";
  nom.value = "";
  yorliq.value = "";
  olchov.value = "nominal";
  overwrite.value = false;
  qoidalar.value = [bosh_qoida()];
  yorliqlar.value = [];
  xato.value = null;
  xulosa.value = null;
  ogohlar.value = [];
  saqlandi.value = false;
}

watch(() => props.open, v => { if (v) tozala(); });

// Qoidalar yoki manba o'zgarsa avvalgi ko'rib chiqish natijasi eskiradi.
watch([qoidalar, manba], () => {
  if (!saqlandi.value) {
    xulosa.value = null;
    ogohlar.value = [];
  }
}, { deep: true });

/* ── Manba ustunning qiymatlari ──
 *
 * Foydalanuvchi qaysi kodlar borligini KO'RMASDAN qoida yoza olmaydi.
 * Yangi endpoint kerak emas: barcha qatorlar allaqachon store'da.
 */
const chastotalar = computed(() => {
  if (!manba.value) return [];
  const hisob = new Map();
  for (const r of rows.value) {
    const v = r?.[manba.value];
    const kalit = v === null || v === undefined || String(v).trim() === ""
      ? "(bo'sh)"
      : String(v).trim();
    hisob.set(kalit, (hisob.get(kalit) || 0) + 1);
  }
  return [...hisob.entries()]
    .sort((a, b) => {
      const sa = Number(a[0]);
      const sb = Number(b[0]);
      // Sonli kodlar son tartibida, matnlar alifbo tartibida.
      if (Number.isFinite(sa) && Number.isFinite(sb)) return sa - sb;
      if (Number.isFinite(sa)) return -1;
      if (Number.isFinite(sb)) return 1;
      return a[0].localeCompare(b[0]);
    })
    .map(([qiymat, soni]) => ({ qiymat, soni }));
});

const manbaYorliqlari = computed(() => {
  const v = variables.value.find(x => x.name === manba.value);
  return v?.values || {};
});

/* ── Qoidalar ro'yxati ── */

function qoshQoida() {
  qoidalar.value.push(bosh_qoida());
}

function ochirQoida(i) {
  qoidalar.value.splice(i, 1);
  if (!qoidalar.value.length) qoidalar.value.push(bosh_qoida());
}

function yuqoriga(i) {
  if (i <= 0) return;
  const q = qoidalar.value;
  [q[i - 1], q[i]] = [q[i], q[i - 1]];
}

function pastga(i) {
  const q = qoidalar.value;
  if (i >= q.length - 1) return;
  [q[i], q[i + 1]] = [q[i + 1], q[i]];
}

/* ── Yorliqlar ── */

function qoshYorliq() {
  yorliqlar.value.push({ kod: "", matn: "" });
}

function ochirYorliq(i) {
  yorliqlar.value.splice(i, 1);
}

/* ── Yuklamaga aylantirish ──
 *
 * Bo'sh maydon `null` bo'ladi, `""` emas: backendda `low: ""` songa
 * aylanmaydi va «chegara son emas» xatosini berardi, holbuki
 * foydalanuvchi «cheksiz» demoqchi edi.
 */
function son(x) {
  const m = String(x ?? "").trim();
  return m === "" ? null : m;
}

function royxat(x) {
  return String(x ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

const yuklama = computed(() =>
  qoidalar.value.map(q => {
    const mos = { type: q.type };
    if (q.type === "value" || q.type === "values") mos.values = royxat(q.values);
    if (q.type === "range") {
      mos.low = son(q.low);
      mos.high = son(q.high);
    }
    const natija = { match: mos, target_kind: q.target_kind };
    if (q.target_kind === "value") natija.target = son(q.target);
    return natija;
  })
);

const yorliqYuklamasi = computed(() => {
  const out = {};
  for (const y of yorliqlar.value) {
    const k = String(y.kod ?? "").trim();
    if (k) out[k] = y.matn;
  }
  return Object.keys(out).length ? out : null;
});

/* ── Amallar ── */

async function korib_chiq() {
  xato.value = null;
  band.value = true;
  try {
    const javob = await store.dispatch("editor/previewRecode", {
      source: manba.value,
      rules: yuklama.value,
      name: nom.value || null,
      overwrite: overwrite.value,
    });
    xulosa.value = javob?.summary || null;
    ogohlar.value = javob?.warnings || [];
  } catch (e) {
    xulosa.value = null;
    ogohlar.value = [];
    xato.value = xatoMatni(e, "Ko'rib chiqib bo'lmadi.");
  } finally {
    band.value = false;
  }
}

async function saqla() {
  xato.value = null;
  band.value = true;
  try {
    const javob = await store.dispatch("editor/recodeVariable", {
      source: manba.value,
      name: nom.value,
      rules: yuklama.value,
      label: yorliq.value || null,
      measure: olchov.value,
      values: yorliqYuklamasi.value,
      overwrite: overwrite.value,
    });
    xulosa.value = javob?.summary || null;
    ogohlar.value = javob?.warnings || [];
    saqlandi.value = true;
  } catch (e) {
    xato.value = xatoMatni(e, "Qayta kodlab bo'lmadi.");
  } finally {
    band.value = false;
  }
}

const saqlash_mumkin = computed(
  () => !band.value && !!manba.value && !!nom.value.trim()
);

const korish_mumkin = computed(() => !band.value && !!manba.value);

function toifaNomi(kalit) {
  const yorliq = yorliqYuklamasi.value?.[kalit];
  return yorliq ? `${kalit} — ${yorliq}` : kalit;
}
</script>

<template>
  <div v-if="open" class="fon" @click.self="emit('close')">
    <div class="oyna">
      <h3>Qayta kodlash</h3>

      <p class="hint">
        Manba ustun <strong>o‘zgarmaydi</strong> — natija yangi ustunga
        yoziladi. Qiymat <strong>birinchi mos kelgan</strong> qoidaga
        tushadi, ya‘ni tartib muhim.
      </p>

      <div class="qator">
        <label>
          Manba ustun
          <select v-model="manba">
            <option value="">— tanlang —</option>
            <option v-for="v in variables" :key="v.name" :value="v.name">
              {{ v.name }}
            </option>
          </select>
        </label>
        <label>
          Yangi ustun nomi
          <input v-model="nom" placeholder="masalan yosh_guruh" maxlength="64" />
        </label>
        <label>
          Yorliq
          <input v-model="yorliq" placeholder="ixtiyoriy" />
        </label>
        <label>
          O‘lchov
          <select v-model="olchov">
            <option v-for="o in OLCHOVLAR" :key="o.key" :value="o.key">
              {{ o.nom }} ({{ o.texnik }})
            </option>
          </select>
        </label>
      </div>

      <!-- Manba qiymatlari: qaysi kodlar borligini ko'rmasdan
           qoida yozib bo'lmaydi. -->
      <div v-if="manba" class="qiymatlar">
        <div class="sarlavha">
          {{ manba }} — mavjud qiymatlar
        </div>
        <div class="chiplar">
          <span v-for="c in chastotalar" :key="c.qiymat" class="chip statik">
            {{ c.qiymat }}<template v-if="manbaYorliqlari[c.qiymat]">
              ({{ manbaYorliqlari[c.qiymat] }})</template>
            <i>{{ c.soni }}</i>
          </span>
        </div>
      </div>

      <div class="bolim">
        <div class="sarlavha">Qoidalar</div>

        <div v-for="(q, i) in qoidalar" :key="i" class="qoida">
          <span class="raqam">{{ i + 1 }}</span>

          <select v-model="q.type" class="tur">
            <option v-for="t in MOS_TURLARI" :key="t.qiymat" :value="t.qiymat">
              {{ t.nom }}
            </option>
          </select>

          <input
            v-if="q.type === 'value' || q.type === 'values'"
            v-model="q.values"
            class="kirish"
            :placeholder="q.type === 'value' ? '1' : '1, 2, 3'"
          />

          <template v-else-if="q.type === 'range'">
            <input v-model="q.low" class="chegara" placeholder="eng past" />
            <span class="tire">–</span>
            <input v-model="q.high" class="chegara" placeholder="eng yuqori" />
          </template>

          <span v-else class="kirish bosh-kirish" />

          <span class="strelka">→</span>

          <select v-model="q.target_kind" class="tur">
            <option v-for="t in NAT_TURLARI" :key="t.qiymat" :value="t.qiymat">
              {{ t.nom }}
            </option>
          </select>

          <input
            v-if="q.target_kind === 'value'"
            v-model="q.target"
            class="chegara"
            placeholder="kod"
          />
          <span v-else class="chegara bosh-kirish" />

          <span class="bosh" />

          <button class="mayda" title="Yuqoriga" :disabled="i === 0" @click="yuqoriga(i)">↑</button>
          <button
            class="mayda"
            title="Pastga"
            :disabled="i === qoidalar.length - 1"
            @click="pastga(i)"
          >↓</button>
          <button class="mayda ochir" title="O‘chirish" @click="ochirQoida(i)">×</button>
        </div>

        <button class="link" @click="qoshQoida">+ Qoida qo‘shish</button>
        <p class="hint">
          <strong>Qolganlari</strong> (ELSE) oxirgi bo‘lishi kerak va
          faqat bitta bo‘ladi. <strong>Yo‘q qiymat</strong> e‘lon
          qilingan kodlarni (99) ham, bo‘sh katakni ham oladi;
          <strong>Bo‘sh katak</strong> esa faqat bo‘shini.
          Hech qaysi qoidaga tushmagan qiymat bo‘sh qoladi.
        </p>
      </div>

      <div class="bolim">
        <div class="sarlavha">Qiymat yorliqlari</div>
        <p class="hint">
          Yorliqsiz natijada <code>1</code>, <code>2</code>, <code>3</code>
          chiqadi va bir hafta o‘tib ular nimani anglatishi unutiladi.
        </p>
        <div v-for="(y, i) in yorliqlar" :key="i" class="yorliq">
          <input v-model="y.kod" class="chegara" placeholder="kod" />
          <input v-model="y.matn" class="kirish" placeholder="masalan 25 gacha" />
          <button class="mayda ochir" title="O‘chirish" @click="ochirYorliq(i)">×</button>
        </div>
        <button class="link" @click="qoshYorliq">+ Yorliq qo‘shish</button>
      </div>

      <label class="checkbox">
        <input v-model="overwrite" type="checkbox" />
        Mavjud o‘zgaruvchini qayta yozish
      </label>

      <div v-if="xato" class="xato">{{ xato }}</div>

      <div v-for="(o, i) in ogohlar" :key="i" class="ogoh">{{ o }}</div>

      <div v-if="xulosa" class="xulosa">
        <div>
          <strong>{{ saqlandi ? "Kodlandi" : "Kodlanadi" }}:</strong>
          {{ xulosa.recoded }} / {{ xulosa.total }}
        </div>
        <div v-if="xulosa.unmatched" class="diqqat">
          <strong>Hech qaysi qoidaga tushmadi:</strong> {{ xulosa.unmatched }} qator —
          ular yangi ustunda bo‘sh bo‘ladi.
        </div>
        <div class="toifalar">
          <span v-for="(soni, kalit) in xulosa.by_target" :key="kalit" class="toifa">
            {{ toifaNomi(kalit) }}<i>{{ soni }}</i>
          </span>
        </div>
      </div>

      <div class="tugmalar">
        <button class="link" :disabled="!korish_mumkin" @click="korib_chiq">
          Ko‘rib chiqish
        </button>
        <span class="bosh" />
        <button class="link" @click="emit('close')">Yopish</button>
        <button :disabled="!saqlash_mumkin" @click="saqla">Qayta kodlash</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fon {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
}

.oyna {
  background: var(--s1);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  padding: 20px;
  width: min(820px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--t1);
}

.oyna h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 1.4rem;
}

.qator {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.qator label {
  flex: 1;
  min-width: 150px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: .72rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--t3);
}

input,
select {
  font-size: .86rem;
  padding: 8px 10px;
  text-transform: none;
  letter-spacing: normal;
}

.hint {
  color: var(--t3);
  font-size: .78rem;
  line-height: 1.55;
  text-transform: none;
}

.hint code {
  font-family: 'JetBrains Mono', monospace;
  color: var(--a1);
}

.sarlavha {
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 6px;
}

.bolim {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--bd);
  padding-top: 12px;
}

.qiymatlar .chiplar {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 96px;
  overflow-y: auto;
}

.chip {
  border: 1px solid var(--bd);
  border-radius: var(--r3);
  font-family: 'JetBrains Mono', monospace;
  font-size: .74rem;
  padding: 4px 8px;
  color: var(--t1);
}

.chip.statik {
  background: transparent;
}

.chip i,
.toifa i {
  font-style: normal;
  color: var(--a1);
  margin-left: 6px;
}

.qoida,
.yorliq {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.raqam {
  font-family: 'JetBrains Mono', monospace;
  font-size: .74rem;
  color: var(--t3);
  min-width: 18px;
}

.tur {
  min-width: 110px;
}

.kirish {
  flex: 1;
  min-width: 120px;
}

.chegara {
  width: 96px;
}

.bosh-kirish {
  opacity: 0;
  pointer-events: none;
}

.tire,
.strelka {
  color: var(--t3);
  font-size: .82rem;
}

.mayda {
  background: transparent;
  border: 1px solid var(--bd);
  color: var(--t1);
  padding: 4px 8px;
  font-size: .8rem;
}

.mayda.ochir {
  color: var(--er, #b4453c);
}

.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  text-transform: none;
  letter-spacing: normal;
  font-size: .84rem;
  color: var(--t1);
}

.checkbox input {
  width: auto;
}

.xato,
.ogoh,
.xulosa {
  border: 1px solid var(--bd);
  border-left-width: 3px;
  border-radius: var(--r3);
  padding: 10px 12px;
  font-size: .84rem;
  line-height: 1.5;
}

.xato {
  border-left-color: var(--er, #b4453c);
}

.ogoh {
  border-left-color: #c08a2e;
  color: var(--t3);
}

.xulosa {
  border-left-color: var(--a1);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diqqat {
  color: #c08a2e;
}

.toifalar {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.toifa {
  border: 1px solid var(--bd);
  border-radius: var(--r3);
  font-size: .76rem;
  padding: 3px 7px;
  color: var(--t3);
}

.tugmalar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.bosh {
  flex: 1;
}

.link {
  background: transparent;
  border: 1px solid var(--bd);
  color: var(--a1);
}

button:disabled {
  opacity: .45;
  cursor: not-allowed;
}
</style>
