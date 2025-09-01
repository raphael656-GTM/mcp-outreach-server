#!/usr/bin/env node

// Debug what environment variables the server is actually receiving
console.log('🔍 Environment Variables Debug:');
console.log('================================');

console.log(`OUTREACH_CLIENT_ID: ${process.env.OUTREACH_CLIENT_ID ? process.env.OUTREACH_CLIENT_ID.substring(0, 20) + '...' : 'UNDEFINED'}`);
console.log(`OUTREACH_CLIENT_SECRET: ${process.env.OUTREACH_CLIENT_SECRET ? process.env.OUTREACH_CLIENT_SECRET.substring(0, 10) + '...' : 'UNDEFINED'}`);
console.log(`OUTREACH_REFRESH_TOKEN: ${process.env.OUTREACH_REFRESH_TOKEN ? process.env.OUTREACH_REFRESH_TOKEN.substring(0, 20) + '...' : 'UNDEFINED'}`);
console.log(`OUTREACH_REDIRECT_URI: ${process.env.OUTREACH_REDIRECT_URI || 'UNDEFINED'}`);
console.log(`OUTREACH_API_BASE_URL: ${process.env.OUTREACH_API_BASE_URL || 'UNDEFINED'}`);

console.log('\n📋 Full Environment Check:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'UNDEFINED'}`);
console.log(`PWD: ${process.env.PWD || 'UNDEFINED'}`);

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const possibleEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env')
];

console.log('\n📁 .env File Check:');
possibleEnvPaths.forEach(envPath => {
  if (fs.existsSync(envPath)) {
    console.log(`✅ Found .env at: ${envPath}`);
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n').filter(line => line.includes('OUTREACH_'));
      console.log('   Contents:');
      lines.forEach(line => {
        if (line.includes('SECRET') || line.includes('TOKEN')) {
          const [key, value] = line.split('=');
          console.log(`   ${key}=${value ? value.substring(0, 10) + '...' : 'EMPTY'}`);
        } else {
          console.log(`   ${line}`);
        }
      });
    } catch (err) {
      console.log(`   ❌ Error reading file: ${err.message}`);
    }
  } else {
    console.log(`❌ Not found: ${envPath}`);
  }
});

console.log('\n🔧 Recommendation:');
if (!process.env.OUTREACH_CLIENT_ID) {
  console.log('❌ OUTREACH_CLIENT_ID not found in environment');
  console.log('   This suggests Claude Desktop is not passing environment variables correctly');
}

if (process.env.OUTREACH_CLIENT_SECRET && process.env.OUTREACH_CLIENT_SECRET.includes('3~uWIul')) {
  console.log('❌ Using OLD CLIENT_SECRET - update needed');
}

if (process.env.OUTREACH_REFRESH_TOKEN && process.env.OUTREACH_REFRESH_TOKEN.includes('g8YZ5GAo')) {
  console.log('❌ Using OLD REFRESH_TOKEN - update needed');
}