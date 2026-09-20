<script setup>
// ResultsTab — natijalar RO'YXATI (08-vazifa).
//
// ── NIMA UCHUN RO'YXAT ──
//
// Tadqiqotchi bitta ma'lumot ustida 5–10 ta tahlil bajaradi.
// Ilgari ekranda faqat OXIRGISI turardi: ANOVA qilib, keyin
// korrelyatsiya qilsa, ANOVA yo'qolardi va uni qayta yugurtirish
// kerak edi. Hisobot uchun har birini alohida eksport qilib,
// Word'da qo'lda birlashtirilardi.
//
// 🔴 IERARXIYA YO'Q — barcha elementlar teng huquqli.
//
// 🔴 FAQAT FAOL ELEMENT TO'LIQ CHIZILADI. 10 ta natijaning
// hammasini bir vaqtda DOM'ga chiqarish telefonda sezilarli
// sekinlik beradi — har birida jadvallar va SVG grafiklar bor.

import { computed, ref } from "vue";
import { useStore } from "vuex";
import AnalysisPanel from "./analysis/AnalysisPanel.vue";
import ResultTable from "./analysis/ResultTable.vue";
import ResultChart from "./analysis/ResultChart.vue";
import { natijaSarlavhasi } from "../natijalar";
import { xatoMatni } from "../api/errors";

const store = useStore();

const results = computed(() => store.state.editor.results);
const activeId = computed(() => store.state.editor.activeId);
const tartib = computed(() => store.state.editor.resultsOrder);

// Tartib — KO'RSATISH uchun; `results` ning o'zi doim «yangisi
// oldinda» bo'lib qoladi, aks holda `ADD_RESULT` qaysi uchiga
// qo'shishni bilishi uchun tartibni ham bilishi kerak bo'lardi.
const korinadigan = computed(() =>
  tartib.value === "eski" ? [...results.value].reverse() : results.value,
);

const belgilanganlar = computed(() => results.value.filter(e => e.selected));
const eskirganTanlangan = computed(() => belgilanganlar.value.filter(e => e.stale));

const isAuth = computed(() => store.getters["auth/isAuthenticated"]);
const hasTelegram = computed(() => !!store.state.auth.user?.telegram_id);

const busy = ref("");
const notice = ref("");
const deliver = ref("browser"); // "browser" | "telegram"

function openLogin() {
  store.commit("auth/SET_LOGIN_VISIBLE", true);
}

function sarlavha(e) {
  return natijaSarlavhasi(e);
}

function vaqt(e) {
  const d = new Date(e.created_at);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit",
                                  hour: "2-digit", minute: "2-digit" });
}

function toggleOchish(id) {
  store.commit("editor/SET_ACTIVE_RESULT", id);
}

function belgila(id) {
  store.commit("editor/TOGGLE_SELECTED", id);
}

function hammasi(qiymat) {
  store.commit("editor/SELECT_ALL", qiymat);
}

function tartibAlmash() {
  store.commit("editor/SET_ORDER", tartib.value === "yangi" ? "eski" : "yangi");
}

async function qaytaHisobla(e) {
  busy.value = `calc:${e.id}`;
  notice.value = "";
  try {
    await store.dispatch("editor/recomputeEntry", e.id);
  } catch (err) {
    notice.value = xatoMatni(err, "Qayta hisoblashda xatolik");
  } finally {
    busy.value = "";
  }
}

async function saqla(e) {
  if (!isAuth.value) return openLogin();
  busy.value = `save:${e.id}`;
  notice.value = "";
  try {
    await store.dispatch("editor/saveResultEntry", e.id);
    notice.value = "✓ Natija profilingizga saqlandi";
  } catch (err) {
    notice.value = xatoMatni(err, "Saqlashda xatolik");
  } finally {
    busy.value = "";
  }
}

// O'chirish QAYTARIB BO'LMAYDI: saqlangan element serverdan ham
// o'chadi. Shuning uchun tasdiq so'raladi.
const ochiriladigan = ref(null);

function ochirishniSora(e) {
  ochiriladigan.value = e;
}

async function ochirishniTasdiqla() {
  const e = ochiriladigan.value;
  ochiriladigan.value = null;
  if (!e) return;
  busy.value = `del:${e.id}`;
  notice.value = "";
  try {
    await store.dispatch("editor/deleteResultEntry", e.id);
  } catch (err) {
    notice.value = xatoMatni(err, "O'chirishda xatolik");
  } finally {
    busy.value = "";
  }
}

// 🔴 ESKIRGAN ELEMENT UCHUN TASDIQ.
//
// Eksport natija JSON'ini emas, `(type, params)` ni yuboradi va
// server hammasini JORIY ma'lumot bilan qayta hisoblaydi. Ya'ni
// hujjatdagi raqam ekrandagidan farq qilishi mumkin — foydalanuvchi
// buni oldindan bilishi shart.
const eksportSorovi = ref(null);

function eksportniSora(fmt) {
  if (!isAuth.value) return openLogin();
  if (!belgilanganlar.value.length) return;
  if (eskirganTanlangan.value.length) {
    eksportSorovi.value = fmt;
    return;
  }
  eksportQil(fmt);
}

async function eksportQil(fmt) {
  eksportSorovi.value = null;
  const mode = hasTelegram.value ? deliver.value : "browser";
  busy.value = fmt;
  notice.value = "";
  try {
    await store.dispatch("editor/exportSelected", { fmt, deliver: mode });
    notice.value = mode === "telegram"
      ? "✓ Fayl Telegram botga yuborildi"
      : "✓ Hujjat yuklab olindi";
  } catch (err) {
    notice.value = xatoMatni(err, "Yetkazishda xatolik");
  } finally {
    busy.value = "";
  }
}
</script>

<template>
  <div class="results-tab">
    <h3>Tahlil</h3>

    <AnalysisPanel />

    <template v-if="results.length">
      <!-- ── Yuqori panel ── -->
      <div class="panel">
        <div class="panel-chap">
          <span class="soni">{{ results.length }} ta natija</span>
          <button class="link" @click="tartibAlmash">
            {{ tartib === "yangi" ? "↓ Yangisi tepada" : "↑ Yangisi pastda" }}
          </button>
        </div>
        <div class="panel-ong">
          <button class="link" @click="hammasi(true)">Hammasini belgilash</button>
          <button class="link" @click="hammasi(false)">Hech birini</button>
        </div>
      </div>

      <div v-if="!isAuth" class="login-banner">
        <span>
          💾 Ro'yxat sahifa yangilanganda yo'qoladi. Saqlash va
          Word/PDF yuklab olish uchun tizimga kiring.
        </span>
        <button @click="openLogin">Kirish</button>
      </div>

      <div v-if="isAuth && hasTelegram" class="deliver">
        <span class="dlbl">Fayl qayerga:</span>
        <button :class="{ on: deliver === 'browser' }" @click="deliver = 'browser'">
          📥 Yuklab olish
        </button>
        <button :class="{ on: deliver === 'telegram' }" @click="deliver = 'telegram'">
          📨 Telegram
        </button>
      </div>

      <div class="actions">
        <button
          class="eksport"
          :disabled="!belgilanganlar.length || busy === 'docx'"
          @click="eksportniSora('docx')"
        >
          {{ busy === "docx" ? "…" : `📄 Word (${belgilanganlar.length})` }}
        </button>
        <button
          class="eksport"
          :disabled="!belgilanganlar.length || busy === 'pdf'"
          @click="eksportniSora('pdf')"
        >
          {{ busy === "pdf" ? "…" : `📑 PDF (${belgilanganlar.length})` }}
        </button>
      </div>
      <p v-if="notice" class="notice">{{ notice }}</p>

      <!-- ── Kartalar ── -->
      <div class="kartalar">
        <div
          v-for="e in korinadigan"
          :key="e.id"
          class="karta"
          :class="{ ochiq: e.id === activeId, eskirgan: e.stale }"
        >
          <div class="karta-bosh">
            <input
              type="checkbox"
              class="belgi"
              :checked="e.selected"
              @change="belgila(e.id)"
            />
            <button class="karta-nom" @click="toggleOchish(e.id)">
              <span class="nom">{{ sarlavha(e) }}</span>
              <span class="vaqt">{{ vaqt(e) }}</span>
            </button>
            <span v-if="e.stale" class="nishon stale" title="Ma'lumot o'zgargan">
              eskirgan
            </span>
            <span v-if="e.saved" class="nishon saved">saqlangan</span>
            <button class="ochish" @click="toggleOchish(e.id)">
              {{ e.id === activeId ? "▲" : "▼" }}
            </button>
          </div>

          <div class="karta-amallar">
            <button class="link" :disabled="busy === `calc:${e.id}`" @click="qaytaHisobla(e)">
              ↻ Qayta hisoblash
            </button>
            <button
              v-if="!e.saved"
              class="link"
              :disabled="busy === `save:${e.id}`"
              @click="saqla(e)"
            >
              💾 Saqlash
            </button>
            <button class="link ochir" @click="ochirishniSora(e)">🗑 O'chirish</button>
          </div>

          <!-- 🔴 FAQAT FAOL ELEMENT CHIZILADI -->
          <div v-if="e.id === activeId" class="karta-tana">
            <p v-if="e.stale" class="stale-izoh">
              Bu natija eski ma'lumot bilan hisoblangan. Eksportda u
              joriy ma'lumot bilan qayta hisoblanadi.
            </p>

            <div v-if="e.meta?.warnings?.length" class="meta-box warn">
              <div class="meta-title">⚠️ Ogohlantirish</div>
              <ul>
                <li v-for="(w, i) in e.meta.warnings" :key="i">{{ w }}</li>
              </ul>
            </div>

            <div class="tables">
              <ResultTable v-for="t in e.tables" :key="t.id" :table="t" />
            </div>

            <!-- Grafiklar jadvallardan KEYIN: SPSS'da ham natija
                 oynasida avval raqam, keyin tasvir keladi. Raqam —
                 javob, grafik — uni tekshirish vositasi. -->
            <div v-if="e.charts?.length" class="charts">
              <ResultChart v-for="c in e.charts" :key="c.id" :chart="c" />
            </div>

            <div v-if="e.meta?.assumptions?.length" class="meta-box info">
              <div class="meta-title">Farazlar va izohlar</div>
              <ul>
                <li v-for="(a, i) in e.meta.assumptions" :key="i">{{ a }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty">
      Tahlil turini tanlab, «Tahlil qilish» tugmasini bosing.
    </div>

    <!-- ── O'chirish tasdiqi ── -->
    <div v-if="ochiriladigan" class="modal-fon" @click.self="ochiriladigan = null">
      <div class="modal">
        <h4>Natijani o'chirish</h4>
        <p>
          «{{ sarlavha(ochiriladigan) }}» ro'yxatdan o'chiriladi.
          <template v-if="ochiriladigan.saved">
            U profilingizdan ham o'chadi.
          </template>
        </p>
        <div class="modal-amallar">
          <button class="link" @click="ochiriladigan = null">Bekor qilish</button>
          <button class="xatarli" @click="ochirishniTasdiqla">O'chirish</button>
        </div>
      </div>
    </div>

    <!-- ── Eskirgan natija tasdiqi ── -->
    <div v-if="eksportSorovi" class="modal-fon" @click.self="eksportSorovi = null">
      <div class="modal">
        <h4>Eskirgan natijalar</h4>
        <p>
          {{ eskirganTanlangan.length }} ta natija eski ma'lumot bilan
          hisoblangan. Eksportda ular joriy ma'lumot bilan qayta
          hisoblanadi, ya'ni raqamlar ekrandagidan farq qilishi mumkin.
        </p>
        <div class="modal-amallar">
          <button class="link" @click="eksportSorovi = null">Bekor qilish</button>
          <button @click="eksportQil(eksportSorovi)">Davom etish</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--t1);
}
.results-tab h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 1.5rem;
}

/* ── yuqori panel ── */
.panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--bd);
  padding-bottom: 10px;
}
.panel-chap,
.panel-ong {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.soni {
  font-size: .8rem;
  font-weight: 700;
  color: var(--t2);
}
.link {
  background: none;
  border: none;
  color: var(--a1);
  font-size: .78rem;
  padding: 2px 0;
  cursor: pointer;
}
.link:disabled { opacity: .5; }
.link.ochir { color: var(--a4); }

.login-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(135deg, rgba(79, 110, 247, .1), rgba(139, 92, 246, .06));
  border: 1px solid rgba(79, 110, 247, .28);
  border-radius: var(--r2);
  padding: 14px 16px;
  font-size: .86rem;
  color: var(--t2);
}
.login-banner button {
  background: linear-gradient(135deg, var(--a1), var(--a2));
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  white-space: nowrap;
  font-weight: 700;
}
.deliver {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dlbl {
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--t3);
}
.deliver button {
  background: var(--s3);
  border: 1px solid var(--bd);
  color: var(--t2);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: .78rem;
}
.deliver button.on {
  background: var(--a1g);
  border-color: rgba(79, 110, 247, .4);
  color: var(--a1);
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.actions .eksport:disabled { opacity: .45; }
.notice {
  font-size: .8rem;
  color: var(--a3);
  margin: 0;
}

/* ── kartalar ── */
.kartalar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.karta {
  border: 1px solid var(--bd);
  border-radius: var(--r2);
  background: var(--s1);
  padding: 10px 12px;
}
.karta.ochiq { border-color: rgba(79, 110, 247, .4); }
.karta.eskirgan { border-left: 3px solid var(--a4); }
.karta-bosh {
  display: flex;
  align-items: center;
  gap: 8px;
}
.belgi {
  width: 18px;
  height: 18px;
  flex: none;
}
.karta-nom {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}
.nom {
  font-size: .92rem;
  color: var(--t1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.vaqt {
  font-size: .68rem;
  color: var(--t3);
}
.nishon {
  font-size: .62rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  border-radius: 10px;
  padding: 2px 7px;
  white-space: nowrap;
}
.nishon.stale {
  background: rgba(245, 158, 11, .15);
  color: var(--a4);
}
.nishon.saved {
  background: var(--a1g);
  color: var(--a1);
}
.ochish {
  background: none;
  border: none;
  color: var(--t3);
  font-size: .8rem;
  padding: 4px;
}
.karta-amallar {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 6px;
  padding-left: 26px;
}
.karta-tana {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--bd2);
}
.stale-izoh {
  font-size: .78rem;
  color: var(--a4);
  margin: 0 0 10px;
}
.tables {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
/* meta.warnings / meta.assumptions — butun tahlilga tegishli izohlar.
   Ogohlantirish sariq (--a4): natijani ishonchsiz qilishi mumkin.
   Farazlar neytral: metod nimaga tayanganini tushuntiradi. */
.charts {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}
.meta-box {
  border: 1px solid var(--bd2);
  border-radius: var(--r2);
  padding: 12px 16px;
  margin: 14px 0;
  font-size: .82rem;
}
.meta-box.warn {
  border-color: rgba(245, 158, 11, .4);
  background: rgba(245, 158, 11, .08);
}
.meta-box.info { background: var(--s1); }
.meta-title {
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t3);
  margin-bottom: 6px;
}
.meta-box.warn .meta-title { color: var(--a4); }
.meta-box ul {
  margin: 0;
  padding-left: 18px;
  color: var(--t2);
}
.meta-box li { margin: 3px 0; }
.empty {
  color: var(--t3);
  font-size: .9rem;
  padding: 24px 0;
  text-align: center;
}

/* ── tasdiq oynalari ── */
.modal-fon {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}
.modal {
  background: var(--s2);
  border: 1px solid var(--bd);
  border-radius: var(--r2);
  padding: 20px;
  max-width: 420px;
  width: 100%;
}
.modal h4 {
  margin: 0 0 10px;
  font-family: 'Instrument Serif', serif;
  font-size: 1.15rem;
}
.modal p {
  margin: 0 0 16px;
  font-size: .85rem;
  color: var(--t2);
}
.modal-amallar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-items: center;
}
.xatarli {
  background: var(--a4);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 700;
}
</style>
