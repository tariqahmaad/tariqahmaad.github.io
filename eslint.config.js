import globals from 'globals';

export default [
  {
    files: ['assets/js/**/*.js', 'tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-undef': 'error',
      'no-var': 'off',
      eqeqeq: ['warn', 'always', { null: 'ignore' }]
    }
  },
  {
    // Classic (non-module) scripts loaded with <script defer>
    files: ['assets/js/main.js', 'assets/js/contact-form.js', 'assets/js/particles-config.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, PureCounter: 'readonly', Lenis: 'readonly', emailjs: 'readonly', particlesJS: 'readonly' }
    }
  },
  {
    ignores: ['assets/vendor/**', 'node_modules/**', '**/*.min.js']
  }
];
