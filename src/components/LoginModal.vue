<script setup>
import { ref, computed, onUnmounted } from "vue";
import { useStore } from "vuex";
import { xatoMatni } from "../api/errors";

const store = useStore();

const visible = computed(() => store.state.auth.loginVisible);

const tab = ref("email"); // "email" | "telegram"
const error = ref("");
const busy = ref(false);

// Email holati
const email = ref("");
const code = ref("");
const codeSent = ref(false);

// Telegram holati
const tgLink = ref("");
let pollTimer = null;

function close() {
  stopPoll();
  reset();
  store.commit("auth/SET_LOGIN_VISIBLE", false);
}

function reset() {
  error.value = "";
  busy.value = false;
  email.value = "";
  code.value = "";
  codeSent.value = false;
  tgLink.value = "";
  tab.value = "email";
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

onUnmounted(stopPoll);

async function sendCode() {
  error.value = "";
  if (!email.value.includes("@")) {
    error.value = "Email manzilini to'g'ri kiriting";
    return;
  }
  busy.value = true;
  try {
    await store.dispatch("auth/requestEmailCode", email.value.trim());
    codeSent.value = true;
  } catch (e) {
    error.value = xatoMatni(e, "Kod yuborishda xatolik");
  } finally {
    busy.value = false;
  }
}

async function verifyCode() {
  error.value = "";
  busy.value = true;
  try {
    await store.dispatch("auth/verifyEmail", {
      email: email.value.trim(),
      code: code.value.trim(),
    });
    close();
  } catch (e) {
    error.value = xatoMatni(e, "Kod noto'g'ri");
  } finally {
    busy.value = false;
  }
}

async function startTelegram() {
  error.value = "";
  busy.value = true;
  try {
    const { token, deep_link } = await store.dispatch("auth/telegramStart");
    tgLink.value = deep_link;
    window.open(deep_link, "_blank");

    // tasdiqlashni kutamiz
    stopPoll();
    pollTimer = setInterval(async () => {
      try {
        const ok = await store.dispatch("auth/telegramPoll", token);
        if (ok) close();
      } catch (e) {
        stopPoll();
        error.value = xatoMatni(e, "Telegram login muddati tugadi");
      }
    }, 2500);
  } catch (e) {
    error.value = xatoMatni(e, "Telegram login boshlanmadi");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div v-if="visible" class="overlay" @click.self="close">
    <div class="modal">
      <div class="head">
        <h3>Tizimga kirish</h3>
        <button class="x" @click="close">✕</button>
      </div>

      <div class="tabs">
        <button :class="{ on: tab === 'email' }" @click="tab = 'email'">Email</button>
        <button :class="{ on: tab === 'telegram' }" @click="tab = 'telegram'">Telegram</button>
      </div>

      <!-- EMAIL -->
      <div v-if="tab === 'email'" class="body">
        <template v-if="!codeSent">
          <label>Email manzilingiz</label>
          <input v-model="email" type="email" placeholder="siz@example.com" @keyup.enter="sendCode" />
          <button class="primary" :disabled="busy" @click="sendCode">
            {{ busy ? "Yuborilmoqda…" : "Kod yuborish" }}
          </button>
        </template>
        <template v-else>
          <p class="hint">{{ email }} manziliga yuborilgan 6 xonali kodni kiriting.</p>
          <input v-model="code" inputmode="numeric" maxlength="6" placeholder="______" @keyup.enter="verifyCode" />
          <button class="primary" :disabled="busy" @click="verifyCode">
            {{ busy ? "Tekshirilmoqda…" : "Tasdiqlash" }}
          </button>
          <button class="link" @click="codeSent = false">Emailni o'zgartirish</button>
        </template>
      </div>

      <!-- TELEGRAM -->
      <div v-else class="body">
        <p class="hint">Telegram bot orqali kiring. Havolani bossangiz, botda tasdiqlaysiz.</p>
        <button class="primary" :disabled="busy" @click="startTelegram">
          Telegram bilan kirish
        </button>
        <p v-if="tgLink" class="waiting">Tasdiqlash kutilmoqda… Botda «Start» bosing.</p>
      </div>

      <p v-if="error" class="err">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 16, .85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal {
  background: var(--s1);
  color: var(--t1);
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--bd);
  box-shadow: var(--shadow);
  animation: mu .35s cubic-bezier(.16, 1, .3, 1);
}
@keyframes mu {
  from { transform: scale(.96) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.head h3 {
  margin: 0;
  font-family: 'Instrument Serif', serif;
  font-size: 1.4rem;
}
.x {
  background: transparent;
  border: 1px solid var(--bd);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  color: var(--t2);
  font-size: 16px;
  padding: 0;
}
.tabs {
  display: flex;
  gap: 8px;
  margin: 18px 0;
}
.tabs button {
  flex: 1;
  padding: 11px;
  background: var(--s3);
  border: 1px solid var(--bd);
  color: var(--t2);
  border-radius: 10px;
  font-weight: 600;
}
.tabs button.on {
  background: var(--a1g);
  border-color: rgba(79, 110, 247, .4);
  color: var(--a1);
}
.body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.body label {
  font-size: .72rem;
  font-weight: 600;
  color: var(--t3);
  letter-spacing: .05em;
}
.body input {
  font-size: 1rem;
}
.primary {
  padding: 13px;
  background: linear-gradient(135deg, var(--a1), var(--a2));
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 0 24px rgba(79, 110, 247, .3);
}
.link {
  background: none;
  border: none;
  color: var(--a1);
  cursor: pointer;
  font-size: .8rem;
}
.hint {
  font-size: .86rem;
  color: var(--t2);
  margin: 0;
  line-height: 1.6;
}
.waiting {
  font-size: .8rem;
  color: var(--a4);
}
.err {
  color: var(--a5);
  font-size: .84rem;
  margin-top: 12px;
}
</style>
