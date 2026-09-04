<script setup>
/* ComputeModal — hisoblangan o'zgaruvchi oynasi.
 *
 * 🔴 «Tekshirish» tugmasi nima uchun kerak
 *
 * Ifoda 5000 qatorga qo'llanadi va natija BARCHA qatorlarga yoziladi.
 * Xatoni saqlangandan keyin bilish qimmat: `overwrite` bilan qayta
 * hisoblash kerak bo'ladi. Tekshiruv esa qatorlarni umuman o'qimaydi,
 * ya'ni bir zumda javob beradi.
 */
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";

import { xatoMatni } from "../api/errors";

const props = defineProps({ open: Boolean });
const emit = defineEmits(["close"]);

const store = useStore();

const nom = ref("");
const yorliq = ref("");
const olchov = ref("scale");
const ifoda = ref("");
const overwrite = ref(false);

const xato = ref(null);
const xulosa = ref(null);
const tekshirildi = ref(false);
const band = ref(false);

const variables = computed(() => store.state.editor.schema.variables);

// Funksiyalar ro'yxati — backenddagi oq ro'yxat bilan bir xil.
const FUNKSIYALAR = [
  { nom: "SUM", izoh: "yig'indi, yo'q qiymatga chidamli" },
  { nom: "MEAN", izoh: "o'rtacha, yo'q qiymatga chidamli" },
  { nom: "SD", izoh: "standart chetlanish (kamida 2 ta qiymat)" },
  { nom: "MIN", izoh: "eng kichigi" },
  { nom: "MAX", izoh: "eng kattasi" },
  { nom: "NVALID", izoh: "yaroqli javoblar soni" },
  { nom: "NMISS", izoh: "yo'q javoblar soni" },
  { nom: "ABS", izoh: "modul" },
  { nom: "SQRT", izoh: "kvadrat ildiz" },
  { nom: "RND", izoh: "yaxlitlash" },
  { nom: "TRUNC", izoh: "kasrni tashlash" },
  { nom: "MOD", izoh: "qoldiq" },
  { nom: "LN", izoh: "natural logarifm" },
  { nom: "LG10", izoh: "o'nlik logarifm" },
  { nom: "EXP", izoh: "eksponenta" },
  { nom: "MISSING", izoh: "qiymat yo'qmi (1/0)" },
  { nom: "SYSMIS", izoh: "katak bo'shmi (1/0)" },
  { nom: "VALUE", izoh: "xom qiymat (kodni yo'q sanamaydi)" },
];

function tozala() {
  nom.value = "";
  yorliq.value = "";
  olchov.value = "scale";
  ifoda.value = "";
  overwrite.value = false;
  xato.value = null;
  xulosa.value = null;
  tekshirildi.value = false;
}

watch(() => props.open, v => { if (v) tozala(); });

// Ifoda o'zgarsa avvalgi tekshiruv natijasi eskiradi.
watch(ifoda, () => { tekshirildi.value = false; xato.value = null; });

function qoshish(matn) {
  ifoda.value = ifoda.value ? `${ifoda.value}${matn}` : matn;
}

async function tekshir() {
  xato.value = null;
  xulosa.value = null;
  band.value = true;
  try {
    await store.dispatch("editor/validateExpression", {
      expression: ifoda.value,
      name: nom.value,
      overwrite: overwrite.value,
    });
    tekshirildi.value = true;
  } catch (e) {
    tekshirildi.value = false;
    xato.value = xatoMatni(e, "Ifodani tekshirib bo'lmadi.");
  } finally {
    band.value = false;
  }
}

async function saqla() {
  xato.value = null;
  band.value = true;
  try {
    const javob = await store.dispatch("editor/computeVariable", {
      name: nom.value,
      label: yorliq.value || null,
      measure: olchov.value,
      expression: ifoda.value,
      overwrite: overwrite.value,
    });
    xulosa.value = javob?.summary || null;
  } catch (e) {
    xato.value = xatoMatni(e, "Hisoblab bo'lmadi.");
  } finally {
    band.value = false;
  }
}

const saqlash_mumkin = computed(
  () => !band.value && nom.value.trim() && ifoda.value.trim()
);

// Nima uchun natija chiqmagani — o'zbekcha izoh.
const SABAB_MATNI = {
  yetarli_javob_yoq: "yetarli javob yo'q",
  kirish_yoq_qiymat: "kirishda yo'q qiymat",
  matematik_aniqlanmagan: "matematik aniqlanmagan (nolga bo'lish va h.k.)",
};
</script>

<template>
  <div v-if="open" class="fon" @click.self="emit('close')">
    <div class="oyna">
      <h3>Hisoblangan o‘zgaruvchi</h3>

      <div class="qator">
        <label>
          Nom
          <input v-model="nom" placeholder="masalan jami_ball" maxlength="64" />
        </label>
        <label>
          Yorliq
          <input v-model="yorliq" placeholder="ixtiyoriy" />
        </label>
        <label>
          O‘lchov
          <select v-model="olchov">
            <option value="scale">Scale</option>
            <option value="ordinal">Ordinal</option>
            <option value="nominal">Nominal</option>
          </select>
        </label>
      </div>

      <label class="maydon">
        Ifoda
        <textarea
          v-model="ifoda"
          rows="3"
          placeholder="masalan  SUM.18(b1 TO b20)  yoki  6 - b5"
        />
      </label>

      <p class="hint">
        <code>+ - * / **</code> yo‘q qiymatni tarqatadi:
        bitta band javobsiz bo‘lsa natija chiqmaydi.
        <code>SUM</code>, <code>MEAN</code> kabi funksiyalar esa
        mavjud javoblar bilan ishlaydi.
        <code>SUM.18(...)</code> — kamida 18 ta javob bo‘lsagina hisoblaydi.
      </p>

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
          <div class="sarlavha">Funksiyalar</div>
          <div class="chiplar">
            <button
              v-for="f in FUNKSIYALAR"
              :key="f.nom"
              class="chip"
              :title="f.izoh"
              @click="qoshish(f.nom + '(')"
            >
              {{ f.nom }}
            </button>
          </div>
        </div>
      </div>

      <label class="checkbox">
        <input v-model="overwrite" type="checkbox" />
        Mavjud o‘zgaruvchini qayta yozish
      </label>

      <div v-if="xato" class="xato">{{ xato }}</div>
      <div v-else-if="tekshirildi && !xulosa" class="ok">Ifoda to‘g‘ri.</div>

      <div v-if="xulosa" class="xulosa">
        <div><strong>Hisoblandi:</strong> {{ xulosa.computed }} / {{ xulosa.total }}</div>
        <div v-if="xulosa.missing">
          <strong>Chiqib qoldi:</strong> {{ xulosa.missing }}
          <span v-for="(soni, sabab) in xulosa.reasons" :key="sabab" class="sabab">
            — {{ SABAB_MATNI[sabab] || sabab }}: {{ soni }}
          </span>
        </div>
      </div>

      <div class="tugmalar">
        <button class="link" :disabled="band || !ifoda.trim()" @click="tekshir">
          Tekshirish
        </button>
        <span class="bosh" />
        <button class="link" @click="emit('close')">Yopish</button>
        <button :disabled="!saqlash_mumkin" @click="saqla">Hisoblash</button>
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

.qator {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.qator label {
  flex: 1;
  min-width: 140px;
}

label,
.maydon {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: .72rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--t3);
}

input,
select,
textarea {
  font-size: .86rem;
  padding: 8px 10px;
  text-transform: none;
  letter-spacing: normal;
}

textarea {
  font-family: 'JetBrains Mono', monospace;
  resize: vertical;
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

.royxatlar {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.royxat {
  flex: 1;
  min-width: 220px;
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
.ok,
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

.ok {
  border-left-color: var(--a1);
  color: var(--t3);
}

.xulosa {
  border-left-color: var(--a1);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sabab {
  color: var(--t3);
  font-size: .8rem;
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
