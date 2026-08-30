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
| `result-chart.spec.js` | Backend grafik tavsifi -> Chart.js konfiguratsiyasi |

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

## Grafiklar

Tahlil natijalari jadval bilan birga grafik ham beradi: gistogramma,
quti-diagramma, sochma va ustunli.

🔴 **Statistika bu yerda hisoblanmaydi.** Binlar, kvartillar, mo'ylov
chegaralari va regressiya chizig'i backenddan tayyor keladi
(`app/modules/statistics/charts.py`). `ResultChart.vue` faqat chizadi.

Sabab: ular statistik qaror va `pytest` bilan sinaladi. Bu yerda qayta
hisoblansa ikkita manba paydo bo'lardi — jadvaldagi mediana boshqa,
diagrammadagi boshqa bo'lib qolishi mumkin edi.

Chizish uchun `chart.js` va quti-diagramma uchun
`@sgratzl/chartjs-chart-boxplot`. Quti plagini xom sondan o'zi ham
hisoblay oladi, lekin biz unga **tayyor statistikani** beramiz —
uning kvartil usuli backenddagidan farq qilishi mumkin.

---

## CI

`.github/workflows/ci.yml` uchta ishni bajaradi. **Ish branchini
`pull_request` tekshiradi, `main` ni `push`** — ilgari ikkalasi ham
yoqilgan edi va har bir commit ikki marta yugurtilardi.

> Repolar `private`, ya'ni Actions daqiqalari hisobning oylik
> kvotasidan ketadi. Kvota tugagach barcha ishlar **logsiz, bir
> soniyada** yiqila boshlaydi — buni "kod buzildi" deb o'ylash oson;
> shubha tug'ilsa avval billing sahifasini ko'ring.
>
> ⚠️ **PR ochilmagan branchga push CI yugurtirmaydi.** Faqat hujjat
> (`**.md`) o'zgargan commit ham yugurtirmaydi.


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
│   └── analysis/ # AnalysisPanel, ResultTable, CellValue, ResultChart
├── pages/        # FilesPage, EditorPage, InfoPage
├── router/
└── store/        # Vuex: auth, files, editor
```
