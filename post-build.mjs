// post-build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

for (const name of ['mayo1', 'mayo2', 'mayo3', 'mayo5']) {
  const path = `./dist/${name}.cjs`;
  if (!existsSync(path)) continue;
  
  const content = readFileSync(path, 'utf8');
  writeFileSync(`./dist/${name}.js`, content + '\nexport default ' + name[0].toUpperCase() + name.slice(1) + 'Module;');
}