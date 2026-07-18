<script setup>
import { ref, computed, onUnmounted } from "vue";
import { useStore } from "vuex";

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
    error.value = e.response?.data?.detail || "Kod yuborishda xatolik";
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
    error.value = e.response?.data?.detail || "Kod noto'g'ri";
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
        error.value = e.response?.data?.detail || "Telegram login muddati tugadi";
      }
    }, 2500);
  } catch (e) {
    error.value = e.response?.data?.detail || "Telegram login boshlanmadi";
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
  background: rgba(2, 6, 23, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal {
  background: #0f172a;
  color: #e2e8f0;
  width: 100%;
  max-width: 380px;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #1e293b;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.head h3 {
  margin: 0;
}
.x {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
}
.tabs {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}
.tabs button {
  flex: 1;
  padding: 10px;
  background: #1e293b;
  border: none;
  color: #94a3b8;
  border-radius: 10px;
  cursor: pointer;
}
.tabs button.on {
  background: #2563eb;
  color: #fff;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.body label {
  font-size: 13px;
  color: #94a3b8;
}
.body input {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #020617;
  color: #fff;
  font-size: 16px;
}
.primary {
  padding: 12px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.6;
}
.link {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  font-size: 13px;
}
.hint {
  font-size: 14px;
  color: #cbd5e1;
  margin: 0;
}
.waiting {
  font-size: 13px;
  color: #fbbf24;
}
.err {
  color: #f87171;
  font-size: 14px;
  margin-top: 12px;
}
</style>
