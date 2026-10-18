import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('[Build API] Bundling serverless functions with @vercel/ncc...');

fs.mkdirSync('api/admin', { recursive: true });
fs.mkdirSync('api/analytics', { recursive: true });

// 1. Bundle admin [route]
execSync('npx ncc build server/admin/[route].ts -o dist-admin -m', { stdio: 'inherit' });
fs.copyFileSync('dist-admin/index.js', 'api/admin/[route].js');
fs.rmSync('dist-admin', { recursive: true, force: true });

// 2. Bundle analytics collect
execSync('npx ncc build server/analytics/collect.ts -o dist-collect -m', { stdio: 'inherit' });
fs.copyFileSync('dist-collect/index.js', 'api/analytics/collect.js');
fs.rmSync('dist-collect', { recursive: true, force: true });

// 3. Remove .ts sources and _lib from api/ so Vercel sees only 3 clean .js/.ts functions
if (fs.existsSync('api/admin/[route].ts')) fs.unlinkSync('api/admin/[route].ts');
if (fs.existsSync('api/analytics/collect.ts')) fs.unlinkSync('api/analytics/collect.ts');
if (fs.existsSync('api/_lib')) fs.rmSync('api/_lib', { recursive: true, force: true });

console.log('[Build API] Serverless functions bundled successfully into api/');
