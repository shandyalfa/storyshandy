// vite.config.js
export default {
  server: {
    proxy: {
      '/v1': {
        target: 'https://story-api.dicoding.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
};
