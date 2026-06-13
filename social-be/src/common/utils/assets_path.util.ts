import * as fs from 'fs';
import * as path from 'path';

export function resolveTemplatePath(name: string) {
  const prodPath = path.join(
    process.cwd(),
    'dist',
    'mail',
    'templates',
    `${name}.hbs`,
  );
  if (fs.existsSync(prodPath)) return prodPath;

  const localPath = path.join(
    process.cwd(),
    'src',
    'mail',
    'templates',
    `${name}.hbs`,
  );
  if (fs.existsSync(localPath)) return localPath;

  throw new Error(
    `Template not found:\n- Prod Path: ${prodPath}\n- Local Path: ${localPath}`,
  );
}
