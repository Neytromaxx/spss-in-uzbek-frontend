// eslint.config.js — flat config (ESLint 10).
//
// Maqsad: CI'ni yo'lga qo'yish, mavjud uslubni qayta yozish emas.
// Shuning uchun qoidalar to'plami ataylab tor — xatoni ushlaydiganlar.
// Backenddagi `pyproject.toml` da `ruff` uchun ham xuddi shu qaror
// qabul qilingan.

import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "dev-dist/**", "node_modules/**", "coverage/**"],
  },

  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      // Ishlatilmagan o'zgaruvchi — ko'pincha tugallanmagan refaktoring
      // belgisi. `_` bilan boshlangani ataylab qoldirilgan deb hisoblanadi.
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Vue komponent nomlari: `EditorPage.vue` kabi bir so'zli sahifa
      // nomlari loyihada allaqachon ko'p. Bu uslub masalasi, xato emas.
      "vue/multi-word-component-names": "off",

      // Shablondagi atribut tartibi va yangi qatorlar ham uslub masalasi —
      // prettier ular bilan to'qnashadi.
      "vue/attributes-order": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/first-attribute-linebreak": "off",
    },
  },

  // Testlar Vitest globallarini ishlatadi.
  {
    files: ["src/**/*.spec.js", "src/**/*.test.js", "tests/**/*.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },

  // 🔴 `skip-formatting`, `index` EMAS.
  //
  // To'liq variant `prettier/prettier` qoidasini YOQADI va butun mavjud
  // kodni qayta formatlashni talab qiladi — bitta yugurishda 255 ta
  // ogohlantirish chiqardi. Bu bosqichning maqsadi CI'ni yo'lga qo'yish,
  // uslubni qayta yozish emas (backendda `pyproject.toml` da `ruff`
  // uchun ham aynan shu qaror qabul qilingan: `UP` va `I` qo'shilmagan).
  //
  // Shuning uchun bu yerda faqat prettier bilan TO'QNASHADIGAN qoidalar
  // o'chiriladi. Formatlash `npm run format` bilan qo'lda, ixtiyoriy.
  skipFormatting,
];
