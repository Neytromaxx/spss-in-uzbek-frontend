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
| **`npm run check`** | **lint + test + build — commitdan oldin (~9 s)** |

---

## Testlar

`tests/` ichida, Vitest + `@vue/test-utils`:

| Fayl | Nimani qo'riqlaydi |
| --- | --- |
| `errors.spec.js` | Backend xatosining uch xil shakli o'qiladigan matnga aylanishi |
| `editor-store.spec.js` | `ADD_RESULT` natijadan hech qanday maydonni tashlab yubormasligi |
| `results-list.spec.js` | Natijalar ro'yxati: dubl, eskirganlik, tanlash, eksport |
| `sozlamalar.spec.js` | O'lchov nomlari, nom prefiksi tekshiruvi, profil sahifasi |
| `analysis-panel.spec.js` | Panel backend kutgan ANIQ parametr nomlarini yuborishi |
| `dataset-import.spec.js` | Manbadan fayl yaratish amallari va rol getteri |
| `dataset-modal.spec.js` | Import oynasi: uchta manba, kampaniya tanlash, bo'sh kampaniya himoyasi |
| `result-chart.spec.js` | Backend grafik tavsifi -> Chart.js konfiguratsiyasi |

Bu uchtasi tasodifiy tanlanmagan. Ular **yiqilmaydigan** xatolarni
qo'riqlaydi — kod ishlaydi, lekin noto'g'ri yoki kam natija beradi:

- `analysis-panel.spec.js` metodlar ro'yxatini backend registri bilan
  solishtiradi. Ilgari panel 16 ta metodni taklif qilardi, backend so'rov
  sxemasi esa faqat 3 tasini qabul qilardi — qolgani 422 berardi.
- `editor-store.spec.js` natija sarlavhasi va statistik ogohlantirishlar
  saqlanishini tekshiradi. Ilgari ular jimgina tashlanardi.
- `results-list.spec.js` ro'yxatning uchta jimgina buziladigan
  xatti-harakatini qo'riqlaydi: dubl karta, yo'qolgan «eskirgan»
  nishoni va eskirgan natijani tasdiqsiz eksport qilish.

> ⚠️ `analysis-panel.spec.js` dagi metodlar ro'yxati qo'lda yozilgan, chunki
> u boshqa repodagi `engine.ANALYSES` ga tegishli. Backendga yangi metod
> qo'shilsa, bu ro'yxatni ham yangilang.

---

## Interfeys tili va sozlamalar

### O'lchov nomlari — `src/olchov.js`

Bu nomlar ilgari **uchta joyda, uch xil** yozilgan edi:

| Joy | scale | nominal | ordinal |
| --- | --- | --- | --- |
| `VariablesTab`, `ComputeModal` | `Scale` | `Nominal` | `Ordinal` |
| `AnalysisPanel` | `raqamli` | `nominal` | `tartibli` |
| `ImportPreview` | `Raqamli` | **`Matn`** | `Tartibli` |

Uchinchisi nomuvofiq emas, **xato** ham edi: nominal shkala «matn»
degani emas — u tartibsiz toifa (1 = erkak, 2 = ayol ham nominal).

O'lchov darajasi bezak emas: `AnalysisPanel` metod ro'yxatini,
`DataTab` esa katak muharririni aynan shunga qarab tanlaydi.
Foydalanuvchi uni bir ekranda «Matn», ikkinchisida «Nominal» deb
ko'rsa, ikki xil narsa deb o'ylaydi.

Endi bitta manba: `OLCHOV_NOMI` = Miqdoriy / Tartibli / Nominal.
`nominal` o'zbek statistika adabiyotidagi shaklda qoldirildi;
`scale` uchun «Miqdoriy», chunki «Shkala» uchala darajaga ham
tegishli so'z.

### 🔴 Nom prefiksida apostrof bo'lmaydi

Yangi o'zgaruvchi nomi (`ozg_1`, `ozg_2`) Profil → Sozlamalar
bo'limida sozlanadi. Prefiks ASCII bo'lishi **shart**:

Nom filtr va Compute ifodalarida token bo'lib tahlil qilinadi
(backend `expr/tokenizer.py`: `[harf|_][harf|raqam|_]*`). Oddiy
apostrof harf emas, ya'ni `o'zg_1 > 5` sharti «kutilmagan belgi»
xatosini berardi. Tipografik `ʻ` (U+02BB) texnik jihatdan
o'tadi, lekin klaviaturada oddiy `'` teriladi va nom topilmay
qolardi — ya'ni xato ustun yasalganda emas, ancha keyin, filtr
yozilganda chiqardi.

Shuning uchun `prefiksXatosi()` apostrofni rad etadi va sababini
aytadi. Zahiralangan so'z (`and`, `or`, `not`, `to`) ham prefiks
bo'la olmaydi.

Ko'rinadigan matnlar — sarlavhalar, yorliqlar, tugmalar — to'liq
o'zbekcha; faqat **nomning o'zi** ASCII.

### Nom to'qnashuvi

`yangiNom(mavjudNomlar, prefiks)` **band bo'lmagan birinchi**
raqamni oladi. Eski kod `uzunlik + 1` ishlatardi: ikkita ustun
qo'shib, birinchisini o'chirsangiz, keyingisi mavjudi bilan
to'qnashardi.

### Sozlamalar qayerda saqlanadi

`localStorage`, hisobda emas — ular anonim foydalanuvchida ham
kerak (tahlil login talab qilmaydi):

| Kalit | Nima |
| --- | --- |
| `mtt.sozlamalar.nomPrefiksi` | yangi o'zgaruvchi nomi prefiksi |
| `mtt.results.order` | natijalar ro'yxati tartibi |

Buzuq yoki eski qiymat o'qilganda sukutga qaytiladi — aks holda
ilova yaroqsiz nom yasab qo'yardi.

---

## Natijalar ro'yxati (08-vazifa)

Tahlillar **teng huquqli ro'yxat** bo'lib to'planadi: `results: []`
va `activeId`. Ierarxiya yo'q — «asosiy natija + qo'shilganlar»
modeli javobsiz savol tug'dirardi: birinchisi nimasi bilan alohida,
uni o'chirsa nima bo'ladi, eksportda u majburiymi?

Sessiya elementlari va saqlanganlar ham ikki xil ro'yxat emas:
bittasi, har elementda `saved` bayrog'i bilan.

### 🔴 Faqat faol element chiziladi

10 ta natijaning hammasini bir vaqtda DOM'ga chiqarish telefonda
sezilarli sekinlik beradi — har birida jadvallar va SVG grafiklar
bor. Kartalar yig'iladi, `activeId` esa bittasini ochadi.

### ⚠️ `src/natijalar.js` — backend qoidasining nusxasi

Element o'ziga xosligi `(type, params, rows_hash)` bilan
aniqlanadi va `params` solishtirishdan oldin kanonik holatga
keltiriladi: kalitlar saralanadi, `null` va yo'q maydon bir xil
ko'riladi, **massiv tartibi saqlanadi**.

Aynan shu mantiq backendda ham bor
(`app/modules/statistics/results.py`). Ikkala tomonda kerak:
backend saqlangan dublni tozalaydi, frontend sessiya ro'yxatini
yig'adi. Python va JS kodni baham ko'ra olmaydi.

Shuning uchun `tests/results-list.spec.js` dagi holatlar ro'yxati
backenddagi `tests/test_results_api.py` bilan **aynan bir xil**.
Biri o'zgartirilsa, ikkinchisi ham o'zgartirilsin.

### Eskirganlik

`element.rows_hash !== current_rows_hash` → `stale: true`.
Backenddagi `_rows_hash` qatorlarni **va** filtrni qamraydi, ya'ni
bitta maydon ikkala o'zgarishni ham ushlaydi.

🔴 Bu ro'yxatning eng muhim qismi. Foydalanuvchi ANOVA qiladi,
keyin Compute bilan ustun qo'shadi yoki filtrni yoqadi — eski
natijalar endi **boshqa tanlamaga** tegishli, lekin ekranda
o'zgarishsiz turadi. Belgilanmasa, u ikki xil tanlamadan chiqqan
raqamlarni bitta hisobotga qo'yadi.

Xesh `GET /files/{id}` javobidan olinadi, `GET /results` dan emas:
ro'yxat anonim foydalanuvchida ham ishlaydi, ikkinchi marshrut esa
login talab qiladi.

🔴 Elementni **qayta hisoblash** eskisini almashtiradi (`replaceId`),
qo'shmaydi — aks holda ro'yxatda bir xil tahlilning ikki nusxasi
qolardi va `eskirgan` nishoni yo'qolmasdi. Oddiy tahlilda esa eski
element **qoladi**: foydalanuvchi eski raqamni ham ko'rmoqchi
bo'lishi mumkin.

Eskirgan element sukut bo'yicha **eksportga belgilanmaydi**, va
belgilangan bo'lsa eksportdan oldin tasdiq so'raladi: server
hammasini joriy ma'lumot bilan qayta hisoblaydi, ya'ni hujjatdagi
raqam ekrandagidan farq qilishi mumkin. Hujjat yasalgach o'sha
elementlar qayta hisoblanadi — ekran bilan hujjat mos bo'lib
qolsin.

### Anonim foydalanuvchi

Tahlil login talab qilmaydi, saqlash va eksport talab qiladi.
`GET /results` anonim holatda **chaqirilmaydi** (chaqirilsa har
fayl ochilishida kutilgan `401` konsolga tushardi). Ro'yxat sahifa
yangilanganda yo'qoladi va interfeys buni bir qatorda aytadi.

### `localStorage` da nima saqlanadi

Faqat tartib tanlovi: `mtt.results.order` = `yangi` | `eski`. Bu
bitta qisqa satr. Natijalarning o'zi saqlanmaydi — ular
megabaytlarga yetishi mumkin va baribir serverdan qayta o'qiladi.

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

`.github/workflows/ci.yml` bitta ish bajaradi — `npm run check`, ya'ni
mahalliy tekshiruv bilan **aynan bir xil buyruq**. **Ish branchini
`pull_request` tekshiradi, `main` ni `push`** — ilgari ikkalasi ham
yoqilgan edi va har bir commit ikki marta yugurtilardi.

> Repolar `private`, ya'ni Actions daqiqalari hisobning oylik
> kvotasidan ketadi. Kvota tugagach barcha ishlar **logsiz, bir
> soniyada** yiqila boshlaydi — buni "kod buzildi" deb o'ylash oson;
> shubha tug'ilsa avval billing sahifasini ko'ring.
>
> ⚠️ **PR ochilmagan branchga push CI yugurtirmaydi.** Faqat hujjat
> (`**.md`) o'zgargan commit ham yugurtirmaydi.


Ilgari `lint`, `test`, `build` alohida uchta ish edi. Parallellik bu
yerda hech narsa bermaydi (uchalasi birga 9 soniya), lekin GitHub har
bir ishni alohida hisoblaydi va minimal birlik — 1 daqiqa. Ya'ni
9 soniyalik tekshiruv uchun 3 daqiqa yozilardi. Endi 1.

Buyruq bitta joyda (`package.json` → `check`), shuning uchun mahalliy
tekshiruv bilan CI ajralib keta olmaydi.

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
