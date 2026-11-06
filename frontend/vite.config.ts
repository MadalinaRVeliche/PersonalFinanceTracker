
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  ...(mode === "test"
    ? {
        define: {
          "import.meta.env.VITE_API_URL": JSON.stringify(
            "http://127.0.0.1:8000"
          ),
        },
      }
    : {}),
}));
