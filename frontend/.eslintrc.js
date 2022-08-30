module.exports = {
  env: {
    browser: true,
    mocha: true,
    es2021: true,
  },
  extends: ['standard', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  ignorePatterns: ['**'],
  rules: {},
  root: true,
}
