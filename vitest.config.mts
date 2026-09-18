import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Node for the pure logic; a DOM only where a component test asks for it,
    // via a `// @vitest-environment happy-dom` pragma at the top of the file.
    environment: "node",
  },
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "./src") },
  },
});
