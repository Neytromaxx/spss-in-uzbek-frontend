<script setup>
// ProfilPage — hisob va sozlamalar.
//
// ── NIMA UCHUN SOZLAMALAR SHU YERDA ──
//
// Nom prefiksi tahrirlovchi ichida emas, profilda: u BITTA marta
// tanlanadi va barcha fayllarga tegishli. Tahrirlovchiga qo'yilsa,
// foydalanuvchi uni har fayl uchun alohida sozlash kerakmi deb
// o'ylardi.
//
// Sozlamalar ANONIM foydalanuvchida ham ishlaydi (`localStorage`),
// chunki tahlil login talab qilmaydi.

import { computed, ref, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { MAX_PREFIKS, SUKUT_PREFIKS, prefiksXatosi, yangiNom } from "../sozlamalar";

const store = useStore();
const router = useRouter();

const isAuth = computed(() => store.getters["auth/isAuthenticated"]);
const user = computed(() => store.state.auth.user);
const displayName = computed(() => store.getters["auth/displayName"]);

const ROL_NOMI = {
  admin: "Administrator",
  librarian: "Kutubxonachi",
  user: "Foydalanuvchi",
};
const rol = computed(() => ROL_NOMI[user.value?.role] || user.value?.role || "—");

const KIRISH_USULI = {
  telegram: "Telegram",
  email: "Elektron pochta",
};
const usul = computed(() => KIRISH_USULI[store.state.auth.method] || "—");

function openLogin() {
  store.commit("auth/SET_LOGIN_VISIBLE", true);
}
function logout() {
  store.dispatch("auth/logout");
  router.push("/");
}

/* ===============================
   SOZLAMA: NOM PREFIKSI
================================ */

const prefiks = ref(store.state.sozlamalar.nomPrefiksi);
const saqlandi = ref(false);

const xato = computed(() => prefiksXatosi(prefiks.value));

// Jonli ko'rinish: foydalanuvchi natijani YOZAYOTGANDA ko'radi.
// Aks holda u sozlamani saqlab, tahrirlovchiga o'tib, ustun
// qo'shib, keyingina nima chiqqanini bilardi.
const namuna = computed(() => {
  if (xato.value) return "";
  const p = prefiks.value.trim();
  return [yangiNom([], p), yangiNom([`${p}_1`], p), `${p}_3`].join(", ");
});

watch(prefiks, () => { saqlandi.value = false; });

function saqla() {
  if (xato.value) return;
  store.commit("sozlamalar/SET_NOM_PREFIKSI", prefiks.value.trim());
  prefiks.value = store.state.sozlamalar.nomPrefiksi;
  saqlandi.value = true;
}

function tikla() {
  store.commit("sozlamalar/SOZLAMALARNI_TIKLA");
  prefiks.value = store.state.sozlamalar.nomPrefiksi;
  saqlandi.value = true;
}
</script>

<template>
  <div class="wrap">
    <nav class="topnav">
      <button class="nav-back" @click="router.push('/')">←</button>
      <div class="nl-name serif">Profil</div>
      <span class="nav-bosh"></span>
    </nav>

    <div class="profil">
      <!-- ── HISOB ── -->
      <section class="blok">
        <h2 class="serif">Hisob</h2>

        <template v-if="isAuth">
          <dl class="jadval">
            <dt>Ism</dt>
            <dd>{{ displayName }}</dd>

            <dt v-if="user?.email">Pochta</dt>
            <dd v-if="user?.email">{{ user.email }}</dd>

            <dt v-if="user?.telegram_id">Telegram</dt>
            <dd v-if="user?.telegram_id">{{ user.telegram_id }}</dd>

            <dt>Kirish usuli</dt>
            <dd>{{ usul }}</dd>

            <dt>Rol</dt>
            <dd>{{ rol }}</dd>
          </dl>

          <!-- Telegram fayl yuborish uchun kerak — `POST /export`
               `deliver: "telegram"` da aynan shuni talab qiladi. -->
          <p v-if="!user?.telegram_id" class="eslatma">
            Telegram bog‘lanmagan — tahlil hujjatini botga yuborib
            bo‘lmaydi. Telegram orqali qayta kirsangiz bog‘lanadi.
          </p>

          <button class="ghost" @click="logout">Chiqish</button>
        </template>

        <template v-else>
          <p class="eslatma">
            Tizimga kirmagansiz. Tahlil qilish uchun kirish shart
            emas, lekin natijalarni saqlash va Word/PDF yuklab olish
            uchun kerak.
          </p>
          <button class="primary" @click="openLogin">Kirish</button>
        </template>
      </section>

      <!-- ── SOZLAMALAR ── -->
      <section class="blok">
        <h2 class="serif">Sozlamalar</h2>

        <label class="lbl" for="prefiks">Yangi o‘zgaruvchi nomi</label>
        <p class="izoh">
          «+ O‘zgaruvchi qo‘shish» tugmasi yasaydigan nom shu
          prefiksdan boshlanadi. Mavjud ustunlar nomiga tegmaydi.
        </p>

        <div class="qator">
          <input
            id="prefiks"
            v-model="prefiks"
            class="prefiks-input"
            :class="{ xato: !!xato }"
            :maxlength="MAX_PREFIKS"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
          />
          <button class="primary saqla" :disabled="!!xato" @click="saqla">
            Saqlash
          </button>
        </div>

        <p v-if="xato" class="xato-matn">{{ xato }}</p>
        <p v-else class="namuna">
          Natija: <code>{{ namuna }}</code>
          <span v-if="saqlandi" class="saqlandi">✓ saqlandi</span>
        </p>

        <!-- 🔴 Nima uchun apostrof yo'q — shu yerda aytiladi.
             Foydalanuvchi «o'zg» yozmoqchi bo'ladi va rad etilsa,
             sababini bilmasa buni nuqson deb o'ylaydi. -->
        <p class="izoh kichik">
          Nom filtr va Compute ifodalarida ishlatiladi, shuning uchun
          faqat lotin harflari, raqam va pastki chiziq bo‘ladi —
          apostrofli nom (<code>o‘zg_1</code>) shartlarda ishlamaydi.
        </p>

        <button
          v-if="prefiks.trim() !== SUKUT_PREFIKS"
          class="link"
          @click="tikla"
        >
          Sukut qiymatga qaytarish ({{ SUKUT_PREFIKS }})
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.wrap { min-height: 100vh; min-height: 100dvh; }

.topnav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--bd);
  background: rgba(6, 8, 16, .88);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-back {
  background: var(--s3);
  border: 1px solid var(--bd);
  color: var(--t1);
  border-radius: 10px;
  width: 38px;
  height: 38px;
  font-size: 1.1rem;
}
.nl-name { font-size: 1.25rem; }
.nav-bosh { flex: 1; }

.profil {
  max-width: 640px;
  margin: 0 auto;
  padding: 20px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.blok {
  border: 1px solid var(--bd);
  border-radius: var(--r2);
  background: var(--s1);
  padding: 18px 16px;
}
.blok h2 {
  font-size: 1.2rem;
  margin: 0 0 14px;
}

.jadval {
  display: grid;
  grid-template-columns: minmax(96px, auto) 1fr;
  gap: 8px 14px;
  margin: 0 0 16px;
  font-size: .88rem;
}
.jadval dt {
  color: var(--t3);
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  align-self: center;
}
.jadval dd {
  margin: 0;
  color: var(--t1);
  overflow-wrap: anywhere;
}

.eslatma {
  font-size: .84rem;
  color: var(--t2);
  margin: 0 0 14px;
  line-height: 1.5;
}

.lbl {
  display: block;
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--t3);
  margin-bottom: 6px;
}
.izoh {
  font-size: .82rem;
  color: var(--t2);
  margin: 0 0 12px;
  line-height: 1.5;
}
.izoh.kichik { font-size: .76rem; color: var(--t3); }

.qator {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.prefiks-input {
  flex: 1;
  min-width: 140px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.prefiks-input.xato { border-color: var(--a4); }

.xato-matn {
  font-size: .8rem;
  color: var(--a4);
  margin: 10px 0 0;
  line-height: 1.5;
}
.namuna {
  font-size: .82rem;
  color: var(--t2);
  margin: 10px 0 0;
}
.namuna code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--a1);
}
.saqlandi {
  color: var(--a3);
  margin-left: 8px;
  font-size: .78rem;
}

.link {
  background: none;
  border: none;
  color: var(--a1);
  font-size: .8rem;
  padding: 10px 0 0;
  cursor: pointer;
}
</style>
