import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  base: "/audit-checklist-UI/",
  plugins: [vue()],
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..")]
    }
  }
});
