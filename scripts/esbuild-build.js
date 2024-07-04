require("esbuild").buildSync({
  platform: 'node',
  format: 'cjs',
  entryPoints: ['src/extension.ts'],
  outdir: "dist",
  bundle: true,
  minify: true,
  sourcemap: true,
  external: ['vscode'],
})