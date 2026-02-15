import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // Use relative paths for Electron file:// protocol
  server: {
    port: 3003,
    host: true,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  define: {
    // Define environment variables
    "process.env": {},
  },
});
