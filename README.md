# spss-in-uzbek-frontend

O'zbek tilida SPSS uslubidagi statistik tahlil interfeysi (Vue 3 + Vite).

Backend: [`spss-in-uzbek-backend`](https://github.com/Neytromaxx/spss-in-uzbek-backend).

---

## Tez boshlash

```bash
npm install
cp .env.example .env      # yoki .env ni qo'lda yarating
npm run dev               # http://localhost:5173
```

`.env` da bitta o'zgaruvchi kerak:

```
VITE_API_URL=http://localhost:8080
```

Ishlab chiqarishda bu Railway'dagi backend manzili bo'ladi.

---

## Buyruqlar

| Buyruq | Nima qiladi |
| --- | --- |
| `npm run dev` | Ishlab chiqish serveri (HMR bilan) |
| `npm run build` | Ishlab chiqarish uchun yig'ish (`dist/`) |
| `npm run preview` | Yig'ilgan `dist/` ni mahalliy ko'rish |
| `npm run lint` | ESLint (`--max-warnings 0`) |
| `npm run lint:fix` | ESLint avtomatik tuzatishi |
| `npm run format` | Prettier bilan formatlash (ixtiyoriy) |
| `npm test` | Vitest — bir marta yugurtiradi |
| `npm run test:watch` | Vitest kuzatuv rejimida |

---

## Testlar

`tests/` ichida, Vitest + `@vue/test-utils`:

| Fayl | Nimani qo'riqlaydi |
| --- | --- |
| `errors.spec.js` | Backend xatosining uch xil shakli o'qiladigan matnga aylanishi |
| `editor-store.spec.js` | `SET_RESULT` natijadan hech qanday maydonni tashlab yubormasligi |
| `analysis-panel.spec.js` | Panel backend kutgan ANIQ parametr nomlarini yuborishi |
| `dataset-import.spec.js` | Manbadan fayl yaratish amallari va rol getteri |
| `dataset-modal.spec.js` | Import oynasi: kampaniya tanlash va bo'sh kampaniya himoyasi |

Bu uchtasi tasodifiy tanlanmagan. Ular **yiqilmaydigan** xatolarni
qo'riqlaydi — kod ishlaydi, lekin noto'g'ri yoki kam natija beradi:

- `analysis-panel.spec.js` metodlar ro'yxatini backend registri bilan
  solishtiradi. Ilgari panel 16 ta metodni taklif qilardi, backend so'rov
  sxemasi esa faqat 3 tasini qabul qilardi — qolgani 422 berardi.
- `editor-store.spec.js` natija sarlavhasi va statistik ogohlantirishlar
  saqlanishini tekshiradi. Ilgari ular jimgina tashlanardi.

> ⚠️ `analysis-panel.spec.js` dagi metodlar ro'yxati qo'lda yozilgan, chunki
> u boshqa repodagi `engine.ANALYSES` ga tegishli. Backendga yangi metod
> qo'shilsa, bu ro'yxatni ham yangilang.

---

## CI

`.github/workflows/ci.yml` har bir push va PR'da uchta ishni bajaradi:

1. **lint** — `npm run lint`
2. **test** — `npm test`
3. **build** — `npm run build`

Uchalasini mahalliy ravishda ham xuddi shu tartibda yugurtirsa bo'ladi.

---

## Tuzilma

```
src/
├── api/          # axios klienti, xato matnini normallashtirish
├── assets/       # global uslublar
├── components/   # TopBar, tablar, LoginModal, DatasetImportModal
│   └── analysis/ # AnalysisPanel, ResultTable, CellValue
├── pages/        # FilesPage, EditorPage, InfoPage
├── router/
└── store/        # Vuex: auth, files, editor
```
