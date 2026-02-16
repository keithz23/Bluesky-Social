import * as fs from 'fs';
import * as path from 'path';

export function resolveTemplatePath(name: string) {
  const p1 = path.join(__dirname, 'templates', `${name}.hbs`);
  if (fs.existsSync(p1)) return p1;

  const p2 = path.join(
    process.cwd(),
    'src',
    'mail',
    'templates',
    `${name}.hbs`,
  );
  if (fs.existsSync(p2)) return p2;

  const p3 = path.join(process.cwd(), 'mail', 'templates', `${name}.hbs`);
  if (fs.existsSync(p3)) return p3;

  throw new Error(`Template not found:\n- ${p1}\n- ${p2}\n- ${p3}`);
}
