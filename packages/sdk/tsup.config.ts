import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "es2020",
  sourcemap: true,
  // @fip/shared is only used for types here (see packages/sdk/src/core/queue.ts
  // for why the one runtime value it used to provide is now inlined instead) —
  // `import type` erases at compile time, so nothing of it ends up in the
  // bundle. web-vitals stays external — it's a real published dependency,
  // no reason to duplicate it.
  external: ["web-vitals"],
})
