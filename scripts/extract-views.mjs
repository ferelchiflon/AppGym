import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const lines = html.split("\n");

// 1-indexed inclusive [start, end] line ranges per view (same as grep output)
const VIEWS = [
  { file: "drawer.js",    start: 85,  end: 156 },
  { file: "header.js",    start: 159, end: 182 },
  { file: "dashboard.js", start: 185, end: 187 },
  { file: "workout.js",   start: 190, end: 356 },
  { file: "history.js",   start: 359, end: 421 },
  { file: "progress.js",  start: 424, end: 473 },
  { file: "profile.js",   start: 476, end: 560 },
  { file: "chrome.js",    start: 565, end: 612 },
];

const viewsDir = resolve(root, "src", "views");
mkdirSync(viewsDir, { recursive: true });

const exports = [];
for (const v of VIEWS) {
  const slice = lines.slice(v.start - 1, v.end).join("\n");
  if (/\$\{/.test(slice)) {
    throw new Error(`Interp literal \${ found in ${v.file}; must not appear`);
  }
  if (/`/.test(slice)) {
    throw new Error(`Backtick found in ${v.file}; must not appear`);
  }
  // Template literal export
  const out = `/**\n * src/views/${v.file}\n * Vista parcial (template string) extraída de index.html.\n * NO editar inline: es mantenida por la estructura modular de vistas.\n */\nexport default \`${slice}\n\`;\n`;
  writeFileSync(resolve(viewsDir, v.file), out, "utf8");
  exports.push({ file: v.file, defaultName: v.file.replace(".js", "") });
}

// Aggregator index.js
let idx = `/**\n * src/views/index.js\n * Punto de entrada único que decide el orden de inserción de las vistas.\n * Se concatena SÍNCRONAMENTE desde src/main.js ANTES de instanciar AppGymPro\n * para que todo el binding centralizado por ID en app.js funcione.\n */\n`;
const names = [];
for (const e of exports) {
  const ident = e.defaultName; // drawer, header, dashboard...
  idx += `import ${ident} from './${e.file}';\n`;
  names.push(ident);
}
idx += `\n/** Orden exacto de inserción dentro de <div class="app" id="app">. */\nexport const appLayout = [\n`;
for (const n of names) idx += `  ${n},\n`;
idx += `];\n\nexport default appLayout;\n`;
writeFileSync(resolve(viewsDir, "index.js"), idx, "utf8");

console.log(`OK: ${VIEWS.length} vistas generadas en src/views/ (${lines.length} líneas index.html)`);
for (const v of VIEWS) console.log(`  - ${v.file} (${v.start}-${v.end})`);