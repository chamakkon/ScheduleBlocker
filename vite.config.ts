import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import electron from "vite-plugin-electron/simple";

/** file:// では crossorigin 付き script/link が読み込めずレンダラーが真っ暗になるのを防ぐ */
function electronStripCrossorigin(): Plugin {
  return {
    name: "electron-strip-crossorigin",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(?:="anonymous")?/gi, "");
    }
  };
}

export default defineConfig({
  base: "./",
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
              external: ["electron", "googleapis"]
            }
          }
        }
      },
      preload: {
        input: "src/preload/preload.ts"
      },
      renderer: {}
    }),
    electronStripCrossorigin()
  ],
  resolve: {
    alias: {
      "@renderer": resolve(__dirname, "src/renderer"),
      "@shared": resolve(__dirname, "src/shared")
    }
  }
});
