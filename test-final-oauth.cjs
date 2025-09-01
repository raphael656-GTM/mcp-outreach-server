#!/usr/bin/env node

// Final test with new refresh token
const axios = require('axios');

async function testFinalOAuth() {
  console.log('🔐 FINAL OAuth Test with updated credentials...\n');
  
  const clientId = "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug";
  const clientSecret = "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6";
  const refreshToken = "e8Ttz8jshLts-e3T896lH4MGPYaKVuP_LD5dA21E3ZU";
  
  try {
    console.log('🔄 Testing OAuth token refresh...');
    
    const response = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,  
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ OAuth refresh SUCCESSFUL!');
    console.log(`- New Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`- Updated Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`);
    console.log(`- Expires In: ${response.data.expires_in} seconds`);
    
    // Update .env with the latest refresh token
    const fs = require('fs');
    const envPath = '/Users/raphaelberrebi/mcp-outreach-server/.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(
      /OUTREACH_REFRESH_TOKEN=.*/,
      `OUTREACH_REFRESH_TOKEN=${response.data.refresh_token}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env with latest refresh token');
    
    // Update Claude Desktop config
    const configPath = '/Users/raphaelberrebi/Library/Application Support/Claude/claude_desktop_config.json';
    let configContent = fs.readFileSync(configPath, 'utf8');
    let config = JSON.parse(configContent);
    
    config.mcpServers.outreach.env.OUTREACH_REFRESH_TOKEN = response.data.refresh_token;
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    console.log('✅ Updated Claude Desktop config with latest refresh token');
    
    console.log('\n🧪 Testing API call...');
    
    const apiResponse = await axios.get('https://api.outreach.io/api/v2/sequences?page[limit]=1', {
      headers: {
        'Authorization': `Bearer ${response.data.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ API call successful!');
    console.log(`- Status: ${apiResponse.status}`);
    console.log(`- Sequences: ${apiResponse.data.data?.length || 0}`);
    
    console.log('\n🎉 OAuth is now FULLY WORKING!');
    console.log('🔧 Restart Claude Desktop and test the Outreach MCP connection!');
    
  } catch (error) {
    console.log('❌ OAuth test failed:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${JSON.stringify(error.response?.data, null, 2)}`);
  }
}

testFinalOAuth();