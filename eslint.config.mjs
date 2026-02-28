import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettierPlugin from 'eslint-plugin-prettier'

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      quotes: ['error', 'single', { avoidEscape: true }],
      'prettier/prettier': 'error',
    },
  },
]
