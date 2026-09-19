<script setup>
/* FilterModal — Select Cases (qatorlarni filtrlash) oynasi.
 *
 * 🔴 QATORLAR HECH QACHON O'CHIRILMAYDI
 *
 * Filtr — qaytariladigan amal: uni o'chirib qo'yish bilan hamma
 * qator qaytadi. SPSS'dagi «Delete unselected cases» varianti bizda
 * yo'q va bo'lmaydi.
 *
 * 🔴 «Ko'rib chiqish» nima uchun majburiy
 *
 * Shart `rost` bo'lgan qatorlargina qoladi — `yolg'on` ham, `yo'q`
 * ham chiqib ketadi. `yosh > 25` sharti yoshi KO'RSATILMAGAN
 * respondentlarni ham tashlaydi va foydalanuvchi buni kutmaydi.
 * Shuning uchun yoqishdan oldin uchta raqam ko'rsatiladi.
 */
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";

import { xatoMatni } from "../api/errors";

const props = defineProps({ open: Boolean });
const emit = defineEmits(["close"]);

const store = useStore();

const shart = ref("");
const xato = ref(null);
const xulosa = ref(null);
const band = ref(false);

const variables = computed(() => store.state.editor.schema.variables);
const filtr = computed(() => store.state.editor.filter);

// Telefonda bu belgilarni terish qiyin — tugma bilan qo'yiladi.
const AMALLAR = ["=", "<>", ">", "<", ">=", "<=", "AND", "OR", "NOT", "(", ")"];

function tozala() {
  shart.value = filtr.value?.expression || "";
  xato.value = null;
  xulosa.value = null;
}

watch(() => props.open, v => { if (v) tozala(); });

// Shart o'zgarsa avvalgi ko'rib chiqish natijasi eskiradi.
watch(shart, () => { xulosa.value = null; xato.value = null; });

function qoshish(matn) {
  const b = shart.value;
  shart.value = b && !b.endsWith(" ") ? `${b} ${matn}` : `${b}${matn}`;
}

async function korib_chiq() {
  xato.value = null;
  band.value = true;
  try {
    xulosa.value = await store.dispatch("editor/previewFilter", {
      expression: shart.value,
    });
  } catch (e) {
    xulosa.value = null;
    xato.value = xatoMatni(e, "Shartni tekshirib bo'lmadi.");
  } finally {
    band.value = false;
  }
}

async function saqla() {
  xato.value = null;
  band.value = true;
  try {
    await store.dispatch("editor/saveFilter", { expression: shart.value });
    emit("close");
  } catch (e) {
    xato.value = xatoMatni(e, "Filtrni saqlab bo'lmadi.");
  } finally {
    band.value = false;
  }
}

async function ochir() {
  xato.value = null;
  band.value = true;
  try {
    await store.dispatch("editor/deleteFilter");
    emit("close");
  } catch (e) {
    xato.value = xatoMatni(e, "Filtrni o'chirib bo'lmadi.");
  } finally {
    band.value = false;
  }
}

const yozilgan = computed(() => !!shart.value.trim());
const mumkin = computed(() => !band.value && yozilgan.value);
</script>

<template>
  <div v-if="open" class="fon" @click.self="emit('close')">
    <div class="oyna">
      <h3>Qatorlarni tanlash</h3>

      <p class="hint">
        Shart <strong>rost</strong> bo‘lgan qatorlargina tahlilga kiradi.
        Qolganlari <strong>o‘chirilmaydi</strong> — jadvalda ko‘rinib
        turadi va filtrni o‘chirsangiz qaytadi.
      </p>

      <label class="maydon">
        Shart
        <textarea
          v-model="shart"
          rows="2"
          placeholder="masalan  jins = 2 AND yosh > 25"
        />
      </label>

      <div class="royxatlar">
        <div class="royxat">
          <div class="sarlavha">O‘zgaruvchilar</div>
          <div class="chiplar">
            <button
              v-for="v in variables"
              :key="v.name"
              class="chip"
              @click="qoshish(v.name)"
            >
              {{ v.name }}
            </button>
          </div>
        </div>

        <div class="royxat">
          <div class="sarlavha">Amallar</div>
          <div class="chiplar">
            <button
              v-for="a in AMALLAR"
              :key="a"
              class="chip"
              @click="qoshish(a)"
            >
              {{ a }}
            </button>
          </div>
        </div>
      </div>

      <p class="hint">
        Yo‘q qiymat shartni <strong>noaniq</strong> qiladi: <code>yosh > 25</code>
        yoshi ko‘rsatilmagan respondentlarni ham chiqarib tashlaydi.
        Ko‘rib chiqishda ular alohida sanaladi.
      </p>

      <div v-if="xato" class="xato">{{ xato }}</div>

      <div v-if="xulosa" class="xulosa">
        <div>
          <strong>Tanlanadi:</strong>
          {{ xulosa.selected }} / {{ xulosa.total }}
        </div>
        <div class="sub">Shartga mos kelmadi: {{ xulosa.rejected }}</div>
        <div v-if="xulosa.undefined" class="diqqat">
          Shart hisoblanmadi (yo‘q qiymat): {{ xulosa.undefined }} — ular ham
          chiqarib tashlanadi.
        </div>
        <div v-if="!xulosa.selected" class="diqqat">
          🔴 Birorta ham qator qolmaydi — bunday filtr bilan tahlil
          bajarilmaydi.
        </div>
      </div>

      <div class="tugmalar">
        <button class="link" :disabled="!mumkin" @click="korib_chiq">
          Ko‘rib chiqish
        </button>
        <button
          v-if="filtr"
          class="link ochir"
          :disabled="band"
          @click="ochir"
        >
          Filtrni olib tashlash
        </button>
        <span class="bosh" />
        <button class="link" @click="emit('close')">Yopish</button>
        <button :disabled="!mumkin" @click="saqla">Qo‘llash</button>
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
  width: min(680px, 100%);
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

.maydon {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: .72rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--t3);
}

textarea {
  font-family: 'JetBrains Mono', monospace;
  font-size: .86rem;
  padding: 8px 10px;
  text-transform: none;
  letter-spacing: normal;
  resize: vertical;
}

.hint {
  color: var(--t3);
  font-size: .78rem;
  line-height: 1.55;
}

.hint code {
  font-family: 'JetBrains Mono', monospace;
  color: var(--a1);
}

.royxatlar {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.royxat {
  flex: 1;
  min-width: 200px;
}

.sarlavha {
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 6px;
}

.chiplar {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 108px;
  overflow-y: auto;
}

.chip {
  background: transparent;
  border: 1px solid var(--bd);
  color: var(--t1);
  font-family: 'JetBrains Mono', monospace;
  font-size: .74rem;
  padding: 4px 8px;
}

.xato,
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

.xulosa {
  border-left-color: var(--a1);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xulosa .sub {
  color: var(--t3);
  font-size: .8rem;
}

.diqqat {
  color: #c08a2e;
  font-size: .82rem;
}

.tugmalar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.bosh {
  flex: 1;
}

.link {
  background: transparent;
  border: 1px solid var(--bd);
  color: var(--a1);
}

.link.ochir {
  color: var(--er, #b4453c);
}

button:disabled {
  opacity: .45;
  cursor: not-allowed;
}
</style>
