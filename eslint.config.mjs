import antfu from "@antfu/eslint-config";
import oxlint from "eslint-plugin-oxlint";
import globals from "globals";

export default antfu(
  {
    ignores: [
      ".husky/",
      ".vscode/",
      ".yarn/",
      "coverage/",
      "dist/",
      "public/assets/",
      "tsconfig.*.json",
      "components.d.ts",
    ],
    stylistic: false,
    vue: true,
    typescript: true,
    unicorn: true,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "node/prefer-global/process": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-multiple-template-root": "off",
      "vue/singleline-html-element-content-newline": "off",
      // Prettier owns Vue template layout; these rules otherwise fight the
      // repository's formatter and make the release gate impossible to satisfy.
      "vue/html-indent": "off",
      "vue/multiline-html-element-content-newline": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/html-self-closing": "off",
    },
  },
  {
    files: ["app/components/games/**/*.ts"],
    // Phaser palettes are intentionally expressed as hex literals; casing is not runtime-safe or user-facing.
    rules: {
      "unicorn/number-literal-case": "off",
    },
  },
  oxlint.configs["flat/recommended"], // oxlint should be the last one
);
