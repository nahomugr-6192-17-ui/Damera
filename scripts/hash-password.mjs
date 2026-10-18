#!/usr/bin/env node
// ==============================================================================
// scripts/hash-password.mjs — Secure Password Hash Generator for Damera Admin
// Usage: npm run hash-password <password>
//   or: node scripts/hash-password.mjs <password>
// ==============================================================================

import crypto from 'crypto';

const password = process.argv[2];

if (!password) {
  console.error('\x1b[31mError: Please provide a password to hash.\x1b[0m');
  console.log('\nUsage:');
  console.log('  node scripts/hash-password.mjs <your-password>');
  console.log('Example:');
  console.log('  node scripts/hash-password.mjs MySecurePassword2026!');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const iterations = 100000;
const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
const formattedHash = `pbkdf2$${iterations}$${salt}$${hash}`;

console.log('\n\x1b[32m✔ Secure PBKDF2-SHA512 Password Hash Generated Successfully!\x1b[0m\n');
console.log('--------------------------------------------------------------------------------');
console.log('\x1b[33mEnvironment Variable Configuration for Vercel:\x1b[0m\n');
console.log(`ADMIN_PASSWORD_HASH=${formattedHash}\n`);
console.log('--------------------------------------------------------------------------------');
console.log('Instructions:');
console.log('1. Go to your Vercel Project Settings -> Environment Variables');
console.log('2. Add or update ADMIN_PASSWORD_HASH with the value above.');
console.log('3. Set ADMIN_USERNAME to your chosen username.');
console.log('4. Redeploy your project on Vercel.');
console.log('--------------------------------------------------------------------------------\n');
