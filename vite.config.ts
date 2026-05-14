import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite"; // <-- 1. Tambahkan import ini

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // <-- 2. Masukkan ke dalam array plugins
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
