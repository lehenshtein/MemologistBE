module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'standard'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "windows"
    ],
    "quotes": ["error", "single", { "allowTemplateLiterals": true }],
    "semi": [
      "error",
      "always"
    ],
    "no-unused-vars": [
      "off",
      "always"
    ],
  }
}
