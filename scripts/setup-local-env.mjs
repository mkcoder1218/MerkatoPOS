import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const envPath = resolve(root, '.env');
const examplePath = resolve(root, '.env.example');

const defaults = new Map([
  ['NEXT_PUBLIC_TENANT_SLUG', 'local-demo'],
  ['SEED_TENANT_NAME', 'Local Demo Business'],
  ['SEED_TENANT_SLUG', 'local-demo'],
  ['SEED_BRANCH_NAME', 'Main Branch'],
  ['SEED_ADMIN_NAME', 'Local Admin'],
  ['SEED_ADMIN_USERNAME', 'admin'],
  ['SEED_ADMIN_EMAIL', 'admin@local.test'],
  ['SEED_ADMIN_PASSWORD', 'ChangeMe123!'],
]);

function hasVariable(content, name) {
  return new RegExp('^' + name + '=', 'm').test(content);
}

if (existsSync(envPath)) {
  let env = readFileSync(envPath, 'utf8');
  const added = [];

  for (const [name, value] of defaults) {
    if (!hasVariable(env, name)) {
      env += '\n' + name + '="' + value + '"';
      added.push(name);
    }
  }

  if (!hasVariable(env, 'JWT_ACCESS_SECRET')) {
    env +=
      '\nJWT_ACCESS_SECRET="' +
      randomBytes(48).toString('base64url') +
      '"';
    added.push('JWT_ACCESS_SECRET');
  }

  if (added.length > 0) {
    writeFileSync(envPath, env.trimEnd() + '\n', 'utf8');
    console.log('Updated existing .env with missing local-development values:');
    for (const name of added) {
      console.log('  ' + name);
    }
  } else {
    console.log('.env already contains all required local-development values.');
  }
} else {
  const example = readFileSync(examplePath, 'utf8');
  const secret = randomBytes(48).toString('base64url');

  let env = example.replace(
    'JWT_ACCESS_SECRET=""',
    'JWT_ACCESS_SECRET="' + secret + '"',
  );

  for (const [name, value] of defaults) {
    env = env.replace(name + '=""', name + '="' + value + '"');
  }

  writeFileSync(envPath, env, { encoding: 'utf8', flag: 'wx' });
  console.log('Created .env for local development.');
}

console.log('Local login:');
console.log('  tenant slug: local-demo');
console.log('  username: admin');
console.log('  password: ChangeMe123!');
console.log('');
console.log('Change these credentials before using anything beyond local development.');
