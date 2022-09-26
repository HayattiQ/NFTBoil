module.exports = {
  env: {
    browser: true,
    mocha: true,
    es2021: true,
  },
  extends: ['standard', 'prettier', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  ignorePatterns: ['frontend/src/**'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
  },
  root: true,
}
