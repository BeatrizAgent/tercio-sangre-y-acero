// Vitest config for the frontend UX test battery.
// Mirrors the tsconfig @/* alias and uses jsdom for component tests.

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(root, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/ux/**/*.test.{ts,tsx}"],
    css: false,
  },
});
