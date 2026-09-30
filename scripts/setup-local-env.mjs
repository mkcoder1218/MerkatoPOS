import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const envPath = resolve(root, '.env');
const examplePath = resolve(root, '.env.example');

if (existsSync(envPath)) {
  console.log('.env already exists; leaving it unchanged.');
  process.exit(0);
}

const example = readFileSync(examplePath, 'utf8');
const secret = randomBytes(48).toString('base64url');

const replacements = new Map([
  ['JWT_ACCESS_SECRET=""', 'JWT_ACCESS_SECRET="' + secret + '"'],
  ['SEED_TENANT_NAME=""', 'SEED_TENANT_NAME="Local Demo Business"'],
  ['SEED_TENANT_SLUG=""', 'SEED_TENANT_SLUG="local-demo"'],
  ['SEED_BRANCH_NAME=""', 'SEED_BRANCH_NAME="Main Branch"'],
  ['SEED_ADMIN_NAME=""', 'SEED_ADMIN_NAME="Local Admin"'],
  ['SEED_ADMIN_EMAIL=""', 'SEED_ADMIN_EMAIL="admin@local.test"'],
  ['SEED_ADMIN_PASSWORD=""', 'SEED_ADMIN_PASSWORD="ChangeMe123!"'],
]);

let env = example;
for (const [from, to] of replacements) {
  env = env.replace(from, to);
}

writeFileSync(envPath, env, { encoding: 'utf8', flag: 'wx' });

console.log('Created .env for local development.');
console.log('Local login:');
console.log('  tenant slug: local-demo');
console.log('  email: admin@local.test');
console.log('  password: ChangeMe123!');
console.log('');
console.log('Change these credentials before using anything beyond local development.');
