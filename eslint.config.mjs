import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettierPlugin from 'eslint-plugin-prettier'
import unusedImports from 'eslint-plugin-unused-imports'

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
      'unused-imports': unusedImports
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'unused-imports/no-unused-imports': 'error',
      'quotes': ['error', 'single'],
      'prettier/prettier': 'error',
    },
  },
]
