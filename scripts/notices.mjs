// Writes public/notices.txt: the licences of what the page ships (React, Inter, the bot avatars).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const file = dir => readFileSync(path.join(dir, readdirSync(dir).find(f => /^licen[cs]e/i.test(f))), 'utf8').trim();
const bar = '='.repeat(72);
const parts = [`The botlings website uses the software below. Their licences follow, as their authors ask.`];
parts.push(`${bar}\nbot-avatars (Libraries.dev, Jakub Antalik), in src/vendor\n${bar}\n\n${readFileSync(path.join(root, 'src/vendor/LICENSE-libraries-dev'), 'utf8').trim()}`);
for (const name of ['react', 'react-dom', 'scheduler', '@fontsource-variable/inter']) {
  const dir = path.join(root, 'node_modules', name);
  const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
  parts.push(`${bar}\n${pkg.name} ${pkg.version}, ${pkg.license}\n${bar}\n\n${file(dir)}`);
}
writeFileSync(path.join(root, 'public/notices.txt'), parts.join('\n\n') + '\n');
console.log('public/notices.txt written');
