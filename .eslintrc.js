/*
 * Eslint config file
 * Documentation: https://eslint.org/docs/user-guide/configuring/
 * Install the Eslint extension before using this feature.
 */
module.exports = {
  root: true,
  overrides: [
    {
      files: ['*.wxml'],
      rules: {
        'wxml/forbid-tags': ['error', { forbid: ['div', 'span', 'p'] }],
        'wxml/colon-style-event-binding': 'error',
        'wxml/report-wxml-syntax-error': 'error',
        'wxml/no-duplicate-attributes': 'error',
        'wxml/no-const-and-let-in-wxs': 'error',
        'wxml/empty-tag-self-closing': 'error',
        'wxml/no-dot-this-in-wx-key': 'error',
        'wxml/quotes': ['error', 'double'],
        'wxml/no-wx-if-string': 'error',
        'wxml/wxs-module-prop': 'error',
        'wxml/wx-key': 'error',
      },
      plugins: ['wxml'],
      processor: 'wxml/wxml',
      parser: '@wxml/parser',
    },
    // all your raw config need move to anthor overrides !
    {
      files: ['*.js'],
      env: {
        es6: true,
        browser: true,
        node: true,
      },
      ecmaFeatures: {
        modules: true,
      },
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      // 全局变量
      globals: {
        App: true,
        Page: true,
        Component: true,
        Behavior: true,
        Promise: true,
        wx: true,
        getApp: true,
        console: true,
        module: true,
        setTimeout: true,
        getCurrentPages: true,
        requirePlugin: true,
        requireMiniProgram: true,
      },
      parser: '@babel/eslint-parser',
      extends: ['alloy', 'eslint:recommended'],
      rules: {
        'no-tabs': 2,
        'no-extra-semi': 2,
        semi: [2, 'always'],
        quotes: [2, 'single'],
        'comma-dangle': [1, 'always-multiline'],
        'no-unreachable': 'error',
        'default-case-last': 'error',
        'no-duplicate-imports': 'error',
        'no-irregular-whitespace': 'error',
        'max-nested-callbacks': ['error', 3],
        'no-promise-executor-return': 'error',
        'no-cond-assign': ['error', 'except-parens'],
      },
    },
    {
      files: ['*.ts'],
      env: {
        es6: true,
        browser: true,
        node: true,
      },
      ecmaFeatures: {
        modules: true,
      },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      // 全局变量
      globals: {
        App: true,
        Page: true,
        Component: true,
        Behavior: true,
        Promise: true,
        wx: true,
        getApp: true,
        console: true,
        module: true,
        setTimeout: true,
        getCurrentPages: true,
        requirePlugin: true,
        requireMiniProgram: true,
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'no-tabs': 2,
        'no-extra-semi': 2,
        semi: [2, 'always'],
        quotes: [2, 'single'],
        'comma-dangle': [1, 'always-multiline'],
        'no-unreachable': 'error',
        'default-case-last': 'error',
        'no-duplicate-imports': 'error',
        'no-irregular-whitespace': 'error',
        'max-nested-callbacks': ['error', 3],
        'no-promise-executor-return': 'error',
        'no-cond-assign': ['error', 'except-parens'],
      },
    },
  ],
};
