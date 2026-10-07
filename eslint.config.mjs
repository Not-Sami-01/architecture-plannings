import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Keep every fixed value and env read inside src/config (AGENTS.md).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/config/**"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Use `config` from @/config/config (or publicConfig) instead of process.env.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma-generated client (src/generated) is not linted.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
