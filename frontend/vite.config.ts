import { defineConfig, loadEnv } from "vite";

import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],

    /* Shadcn */
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    /* Redirect any request starting with /ai to the LM Studio server */
    server: {
      proxy: {
        "/ai": {
          target: env.VITE_AI_PROXY ?? "http://13.250.82.143:4321",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai/, ""),
        },
      },
    },
  };
});
