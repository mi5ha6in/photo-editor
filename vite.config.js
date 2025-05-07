export default {
  assetsInclude: ['**/*.wasm'],
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@jsquash/oxipng', '@jsquash/jpeg'], // важно для ручного управления
  }
};