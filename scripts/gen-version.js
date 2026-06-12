import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const now = new Date();
const yy = String(now.getFullYear()).slice(-2);
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const hh = String(now.getHours()).padStart(2, '0');

let hash = 'unknown';
try {
  hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (e) {}

let msg = '';
try {
  msg = execSync('git log -1 --format="%s"', { encoding: 'utf8' }).trim();
} catch (e) {}

const version = `${yy}${mm}${dd}${hh}-${hash}`;

const out = { version, hash, msg, time: now.toISOString() };

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(out, null, 2));

console.log('Version:', version, '|', msg);
