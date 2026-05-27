import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    envPrefix: "NEXT_PUBLIC_",
    define: {
      "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(env.NEXT_PUBLIC_API_URL || ""),
      "process.env.NEXT_PUBLIC_SOCKET_URL": JSON.stringify(env.NEXT_PUBLIC_SOCKET_URL || ""),
    },
  };
});

