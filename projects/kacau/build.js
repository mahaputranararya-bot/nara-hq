// KACAU! build: bundles src/main.js (IIFE) + CSS into ONE self-contained dist/index.html
// that works by double-click from file:// (no ES module script tags, no external requests).
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const dev = process.argv.includes('--dev');
const root = __dirname;

async function build() {
  const result = await esbuild.build({
    entryPoints: [path.join(root, 'src/main.js')],
    bundle: true,
    format: 'iife',
    target: ['chrome90', 'edge90', 'firefox90'],
    minify: !dev,
    sourcemap: dev ? 'inline' : false,
    write: false,
    loader: { '.json': 'json' },
    legalComments: 'none',
    define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  });
  const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KACAU! - party chaos for 2-8 friends</title>
<link rel="icon" href="data:,">
<style>${css}</style>
</head>
<body>
<canvas id="game" tabindex="0"></canvas>
<script>${js}</script>
</body>
</html>
`;
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dist/index.html'), html);
  console.log(`built dist/index.html (${(html.length / 1024).toFixed(1)} KB)${dev ? ' [dev]' : ''}`);
}

build().catch((e) => { console.error(e); process.exit(1); });
