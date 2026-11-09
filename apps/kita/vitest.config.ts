import { defineConfig } from "vitest/config";

// Isolation guard: this config belongs to the kita app slice only. Without an explicit
// root, vitest walks up and loads the parent t3mp3st production config — never acceptable.
// tests/features/*.spec.ts are the backlog's TEST-PLAT-* acceptance suites; they read the
// real workspace tree (package.json / package-lock.json / client sources) from disk, so the
// repo root must stay inside apps/kita and node_modules must never be traversed.
export default defineConfig({
  root: import.meta.dirname,
  test: {
    include: ["tests/features/**/*.spec.ts"],
    environment: "node",
    // Each suite hashes the whole slice tree; give it room.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    server: {
      deps: {
        external: ["**/node_modules/**"],
      },
    },
  },
});
