import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 120000, // 2 minutes for rate limit tests
    hookTimeout: 30000,
    reporters: ["verbose"],
  },
});
