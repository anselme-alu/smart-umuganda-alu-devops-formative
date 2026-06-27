import { defineConfig, mergeConfig } from "vitest/config";

// vite.config.ts is excluded from this file's type checking (not in tsconfig.node.json)
// so the vite 8 / vitest-bundled-vite-7 type conflict is avoided at build time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viteConfig = (await import("./vite.config")).default as any;

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test-setup.ts"],
    },
  }),
);
