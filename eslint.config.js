const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['server/**', 'node_modules/**', '.expo/**', 'dist/**'] },
]);
