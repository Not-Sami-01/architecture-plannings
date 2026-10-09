import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // server-only is externalized in tests, so its `react-server` condition
      // never applies; point it at the no-op entry explicitly.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
    // Let "server-only" resolve to its no-op export when running unit tests.
    conditions: ["react-server"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["vitest.setup.ts"],
  },
});
