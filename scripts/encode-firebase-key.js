#!/usr/bin/env node

/**
 * Utility script to encode Firebase private key for Coolify deployment
 * Usage: node scripts/encode-firebase-key.js
 */

require('dotenv').config();

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
  console.error('❌ FIREBASE_PRIVATE_KEY not found in .env file');
  process.exit(1);
}

// Clean and format the private key
const cleanKey = privateKey.replace(/\\n/g, '\n');

// Base64 encode the private key
const encodedKey = Buffer.from(cleanKey).toString('base64');

console.log('🔑 Firebase Private Key Encoding for Coolify Deployment');
console.log('=' .repeat(60));
console.log('\n📋 Copy this base64 encoded key to your Coolify environment variables:');
console.log('\nFIREBASE_PRIVATE_KEY_BASE64=' + encodedKey);
console.log('\n💡 Then update your Firebase config to decode it.');
console.log('\n✅ This approach avoids newline character issues in containerized environments.');
