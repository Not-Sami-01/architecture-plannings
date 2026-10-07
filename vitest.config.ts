import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    // Let "server-only" resolve to its no-op export when running unit tests.
    conditions: ["react-server"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["vitest.setup.ts"],
  },
});
