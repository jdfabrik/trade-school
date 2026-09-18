import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Browser-only audit harness, pasted into the console by hand. Not part of
    // the app, not bundled, and written for a plain browser rather than Next.
    "test-fixtures/**",
    // Vendored, minified third-party recogniser. Not our code to lint.
    "public/ocr/**",
  ]),
]);

export default eslintConfig;
