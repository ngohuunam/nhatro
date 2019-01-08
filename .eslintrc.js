module.exports = {
  root: true,
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  globals: {
    document: true,
    window: true,
  },
  rules: {
    'react/prefer-stateless-function': 0,
    'no-console': 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'comma-dangle': [2, 'always-multiline'],
    'space-before-function-paren': [2, 'never'],
    'generator-star-spacing': 'off',
    'arrow-parens': 0,
    'one-var': 0,
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
  },
  parser: 'babel-eslint',
  // parserOptions: {
  //   parser: 'babel-eslint',
  //   ecmaVersion: 7,
  //   sourceType: 'module',
  //   ecmaFeatures: {
  //     jsx: true,
  //   },
  // },
}
