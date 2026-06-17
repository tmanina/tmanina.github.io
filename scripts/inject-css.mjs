import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../out');

const criticalCSS = `
:root {
  --primary-gold: #d4a574; --primary-dark-gold: #b8885a; --sage-green: #7d9d7f; --sage-dark: #5a7c5c;
  --primary-gradient: linear-gradient(135deg, #d4a574 0%, #7d9d7f 100%);
  --background: 40 30% 96%; --foreground: 20 10% 15%; --card: 0 0% 100%; --card-foreground: 20 10% 15%;
  --muted: 40 15% 90%; --muted-foreground: 30 5% 45%; --border: 30 10% 85%; --radius: 0.75rem;
}
.dark {
  --background: 180 15% 6%; --foreground: 40 20% 92%; --card: 180 12% 10%; --card-foreground: 40 15% 88%;
  --muted: 180 5% 16%; --muted-foreground: 35 8% 58%; --border: 180 8% 18%;
}
body { font-family: Arial, Helvetica, sans-serif; background: linear-gradient(135deg, #f5f1ea 0%, #e8e3d8 100%); min-height: 100vh; }
`;

function injectCSS(htmlPath) {
  let html = fs.readFileSync(htmlPath, 'utf-8');

  html = html.replace(
    '</head>',
    `<style id="__critical_css">${criticalCSS}</style>\n    <link rel="stylesheet" href="/app.css">\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n    <link rel="manifest" href="/manifest.json">\n  </head>`
  );

  fs.writeFileSync(htmlPath, html);
  console.log(`✅ Injected CSS into ${htmlPath}`);
}

const files = fs.readdirSync(outDir, { recursive: true }).filter(f => f.endsWith('.html'));
for (const file of files) {
  injectCSS(path.join(outDir, file));
}
console.log('✅ Done');
