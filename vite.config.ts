import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: "src/main/main.ts",
        vite: {
          resolve: {
            alias: {
              "@shared": resolve(__dirname, "src/shared")
            }
          },
          build: {
            rollupOptions: {
              external: ["electron", "electron/main", "googleapis"]
            }
          }
        }
      },
      preload: {
        input: "src/preload/preload.ts"
      },
      renderer: {}
    })
  ],
  resolve: {
    alias: {
      "@renderer": resolve(__dirname, "src/renderer"),
      "@shared": resolve(__dirname, "src/shared")
    }
  }
});
