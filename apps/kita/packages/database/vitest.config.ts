import { defineConfig } from "vitest/config";

// Isolation guard: this package belongs to the kita app slice only. Without an explicit
// root, vitest walks up and loads the parent t3mp3st production config — never acceptable.
export default defineConfig({
  root: import.meta.dirname,
  test: {
    include: ["__tests__/**/*.spec.ts"],
    environment: "node",
    testTimeout: 120_000,
  },
});
