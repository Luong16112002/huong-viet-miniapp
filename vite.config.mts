import { defineConfig, loadEnv } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default ({ command, mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");
  if (command === "build") {
    const base = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL;
    if (!base) throw new Error("Missing VITE_API_BASE_URL. Configure the public HTTPS backend before production build.");
    const url = new URL(base);
    if (url.protocol !== "https:" || /^(localhost|127\.|\[::1\])/.test(url.hostname) || url.username || url.password || url.pathname !== "/" || url.search || url.hash)
      throw new Error("VITE_API_BASE_URL must be a public HTTPS origin (no credentials or path).");
  }
  return defineConfig({
    root: "./src",
    publicDir: resolve(__dirname, "src/public"),
    envDir: resolve(__dirname),
    base: "",
    plugins: [
      {
        name: "production-api-audit",
        apply: "build",
        enforce: "pre",
        transform(code, id) {
          // Router URL parsing uses a dummy origin; it never sends requests to it.
          if (/node_modules[\\/](react-router|react-router-dom)[\\/]/.test(id))
            return code.replace(/(["'])http:\/\/localhost\1/g, '"https://router.invalid"');
        },
        generateBundle(_options, bundle) {
          for (const item of Object.values(bundle)) {
            if (item.type !== "chunk") continue;
            if (/https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?=[:/"'\s]|$)/i.test(item.code))
              this.error(`Loopback URL found in production bundle: ${item.fileName}`);
            if (item.code.includes("GEMINI_API_KEY"))
              this.error(`Server secret variable found in production bundle: ${item.fileName}`);
          }
        },
      },
      zaloMiniApp(), react(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": "http://localhost:8787",
        "/images/hotpot": "http://localhost:8787",
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 3000,
    },
    build: {
      assetsInlineLimit: 0,
      outDir: resolve(__dirname, "www"),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        "@/": `${resolve(__dirname, "src")}/`,
      },
    },
  });
};
