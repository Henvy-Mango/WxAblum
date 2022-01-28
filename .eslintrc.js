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
        browser: true,
        es6: true,
        node: true,
        commonjs: true,
      },
      extends: ['eslint:recommended'],
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 6,
        sourceType: 'module',
        allowImportExportEverywhere: false,
        ecmaFeatures: {
          globalReturn: false,
        },
      },
      //全局变量
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
      },
      rules: {
        'no-tabs': 2,
        'no-extra-semi': 2,
        semi: [2, 'always'],
        quotes: [2, 'single'],
        'comma-dangle': [1, 'always-multiline'],
      },
    },
  ],
};
