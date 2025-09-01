#!/usr/bin/env node

// Test the problematic client secret
const secret = ".`]@@8;}'QXoxvBy5P9WvSd,twbeeYx`XZQ8.uF3h;A";

console.log('🔍 Client Secret Analysis:');
console.log('==========================');
console.log(`Raw secret: ${secret}`);
console.log(`Length: ${secret.length}`);
console.log(`First 10 chars: ${secret.substring(0, 10)}`);

// Check for problematic characters
const problematicChars = ['`', "'", '"', '\\', '$', '}', '{', '[', ']'];
const foundProblematic = [];

for (let char of secret) {
  if (problematicChars.includes(char)) {
    foundProblematic.push(char);
  }
}

console.log(`\n🚨 Problematic shell characters found: ${[...new Set(foundProblematic)].join(', ')}`);
console.log(`These characters can cause shell parsing issues in Claude Desktop config.`);

// Try to encode it properly
console.log(`\n🔧 Suggested solutions:`);
console.log(`1. URL encode: ${encodeURIComponent(secret)}`);
console.log(`2. Base64 encode: ${Buffer.from(secret).toString('base64')}`);
console.log(`3. Escape for JSON: ${JSON.stringify(secret)}`);

// Test if this is why OAuth is failing
const axios = require('axios');

async function testSecret() {
  try {
    console.log('\n🧪 Testing OAuth with this secret...');
    
    const response = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug",
      client_secret: secret,
      refresh_token: "N0ts8xaF4BjHVtxaBlHrWKm97R1kJvVSSl80cpZn0Mc",
      grant_type: 'refresh_token'
    });
    
    console.log('✅ OAuth test successful with this secret!');
    
  } catch (error) {
    console.log('❌ OAuth test failed:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${JSON.stringify(error.response?.data)}`);
    
    if (error.response?.data?.error === 'invalid_client') {
      console.log('\n💡 The secret characters might be getting corrupted in Claude Desktop config!');
    }
  }
}

testSecret();