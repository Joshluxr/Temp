'use strict';

/**
 * @kita/eslint-config — frozen baseline rules for the Kita monorepo.
 *
 * T-PLAT-01 contract-freeze artifact (docs/kita-plan/13-backlog.md, "Files — create").
 * Deliberately plugin-free: only ESLint core rules, so this package has ZERO
 * dependencies and is installable offline alongside whatever lint toolchain
 * the root already provides. Do not add plugin rules here without a SOL sign-off
 * amendment to the contract freeze.
 *
 * Consumed via CommonJS require() by .eslintrc.cjs configs:
 *   module.exports = { extends: ['@kita/eslint-config'] };
 * or via `export default [require('@kita/eslint-config')]` in flat configs.
 */

module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // --- Frozen baseline (T-PLAT-01) — do not weaken without an amendment ---
    'no-console': 'warn',
    eqeqeq: ['error', 'smart'],
    'prefer-const': [
      'error',
      {
        destructuring: 'all',
        ignoreReadBeforeAssign: false,
      },
    ],
    'no-var': 'error',

    // --- TS-oriented hygiene expressible with core rules only ---
    // (plugin-free by design; @typescript-eslint lanes extend this config later)
    'no-empty-function': 'error',
    'no-extra-semi': 'error',
    'no-unused-vars': [
      'error',
      {
        args: 'after-used',
        caughtErrors: 'none', // typed catch bindings are idiomatic TS
        ignoreRestSiblings: true,
        vars: 'all',
      },
    ],
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'no-caller': 'error',
    'no-debugger': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-keys': 'error',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-unsafe-negation': 'error',
    'no-shadow-restricted-names': 'error',
    semi: ['error', 'always'],
    quotes: ['error', 'single', { avoidEscape: true }],
    'eol-last': ['error', 'always'],
    'space-before-function-paren': [
      'error',
      { anonymous: 'never', named: 'never', asyncArrow: 'always' },
    ],
  },
};
