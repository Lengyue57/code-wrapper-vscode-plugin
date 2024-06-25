require("esbuild").context({
  platform: 'node',
  format: 'cjs',
  entryPoints: ['src/extension.ts'],
  outdir: "dist",
  bundle: true,
  external: ['vscode'],
}).then(async(context) => {
  await context.watch();
  console.log("Watching...");
});