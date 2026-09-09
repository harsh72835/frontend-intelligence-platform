import { defineConfig } from "tsup"

export default defineConfig([
  // Importable library surface — dual ESM/CJS + types, same pattern as
  // packages/sdk.
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    target: "es2020",
    sourcemap: true,
  },
  // CLI binary — single CJS bundle with a real node shebang. The previous
  // `bin` pointed straight at raw TS with a `#!/usr/bin/env tsx` shebang,
  // which only worked inside this monorepo (tsx as a devDependency); an
  // actually-installed copy of this package (npm install / npx) would have
  // no `tsx` on PATH and the shebang would fail.
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["cjs"],
    dts: false,
    clean: false, // don't wipe the library build above
    target: "es2020",
    banner: { js: "#!/usr/bin/env node" },
  },
])
