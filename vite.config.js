import { defineConfig } from "vite";

export default defineConfig({
  base: "/storyshandy/", // nama repo kamu di GitHub
  server: {
    proxy: {
      "/v1": {
        target: "https://story-api.dicoding.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
