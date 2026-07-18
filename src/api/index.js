// api/index.js
import axios from "axios";

// Anonim foydalanuvchini aniqlash uchun barqaror client identifikatori.
// Login qilinganda shu id orqali anonim fayllar profilga biriktiriladi (claim).
function getClientId() {
  let id = localStorage.getItem("client_id");
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("client_id", id);
  }
  return id;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Anonim egalik uchun har doim yuboramiz (backend login bo'lsa e'tiborsiz qoldiradi)
  config.headers["X-Client-Id"] = getClientId();
  return config;
});

export default api;
