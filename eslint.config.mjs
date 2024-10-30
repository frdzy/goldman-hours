import globals from 'globals';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        chrome: 'readonly'
      }
    },
    rules: {
      'strict': ['error', 'global'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'semi': ['error', 'always'],
      'no-unused-vars': 'error',
      'camelcase': 'error',
      'eqeqeq': 'error',
      'no-trailing-spaces': 'error',
      'space-before-blocks': 'error',
      'space-before-function-paren': ['error', 'always'],
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'no-multiple-empty-lines': ['error', { 'max': 2 }],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs', { 'allowSingleLine': false }],
      'eol-last': ['error', 'always']
    }
  }
]; 