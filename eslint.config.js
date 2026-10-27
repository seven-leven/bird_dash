// Lint rules: ESLint's and typescript-eslint's recommended sets (what `deno lint` checked
// before), plus the Vue rules that catch real mistakes in templates.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'public',
      'raw_png',
      'test-results',
      'docs/assets',
      'docs/.vitepress/cache',
      'docs/.vitepress/dist',
      '.vite',
      '.claude',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // TypeScript already reports undefined names, and knows the ones vite.config.ts injects.
      'no-undef': 'off',
      // Style only: Icon and Chrome read fine as they are.
      'vue/multi-word-component-names': 'off',
      // A test's fake is often held only for its cleanup (`using _fetch = fakeFetch(…)`):
      // a name starting with `_` says so.
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
);
