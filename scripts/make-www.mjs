// Builds the course (Markdown -> HTML) and copies it into www/ for the Android app,
// adding the native speech bridge before app.js on every page.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const site = path.join(root, 'course', 'site');
const www = path.join(root, 'www');
const skip = new Set(['Start Dutch Course.bat', 'serve.ps1']);

execFileSync('python3', [path.join(root, 'course', 'build.py')], { stdio: 'inherit' });
fs.rmSync(www, { recursive: true, force: true });

let pages = 0;
(function copy(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { copy(a, b); continue; }
    if (e.name.endsWith('.html')) {
      let h = fs.readFileSync(a, 'utf8');
      h = h.replace(/<script src="((?:\.\.\/)*)assets\/app\.js"><\/script>/,
        (m, up) => `<link rel="stylesheet" href="${up}assets/app-shell.css"><script src="${up}assets/version.js"></script><script src="${up}assets/native-speech.js"></script>${m}<script src="${up}assets/updater.js"></script>`);
      if (!h.includes('native-speech.js')) throw new Error('No app.js script tag in ' + a);
      fs.writeFileSync(b, h); pages++;
    } else fs.copyFileSync(a, b);
  }
})(site, www);
for (const f of ['native-speech.js', 'app-shell.css', 'updater.js']) fs.copyFileSync(path.join(root, 'app-shell', f), path.join(www, 'assets', f));
// Which release these pages belong to (the in-app updater compares it with the newest release).
const build = parseInt(process.env.WEB_BUILD || '0', 10);
fs.writeFileSync(path.join(www, 'assets', 'version.js'), `window.LANGUA_BUILD=${build};window.LANGUA_VERSION="1.0.${build}";`);
console.log(`www/ ready: ${pages} pages`);
