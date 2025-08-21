// src/setup-oauth.js
// This script helps you get the initial refresh token for Outreach OAuth

import express from 'express';
import axios from 'axios';
import open from 'open';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import readline from 'readline';

dotenv.config();

const app = express();
const PORT = 3000;

const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = process.env.OUTREACH_CLIENT_SECRET;
const REDIRECT_URI = process.env.OUTREACH_REDIRECT_URI || `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing OUTREACH_CLIENT_ID or OUTREACH_CLIENT_SECRET in .env file');
  process.exit(1);
}

// OAuth URLs
const AUTH_URL = 'https://api.outreach.io/oauth/authorize';
const TOKEN_URL = 'https://api.outreach.io/oauth/token';

// Required scopes for our MCP server
const SCOPES = [
  'accounts.read',
  'prospects.read', 
  'sequences.read',
  'users.read'
].join(' ');

let server;

app.get('/', (req, res) => {
  const authUrl = `${AUTH_URL}?` + new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES
  });
  
  res.send(`
    <html>
      <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1>Outreach OAuth Setup</h1>
        <p>Click the button below to authorize the MCP server with Outreach:</p>
        <a href="${authUrl}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
          Authorize with Outreach
        </a>
        <p><small>You will be redirected to: ${REDIRECT_URI}</small></p>
      </body>
    </html>
  `);
});

app.get('/auth', (req, res) => {
  const authUrl = `${AUTH_URL}?` + new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES
  });
  
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px;">
          <h1 style="color: red;">❌ Authorization Failed</h1>
          <p>Error: ${error}</p>
        </body>
      </html>
    `);
    return;
  }

  try {
    // Exchange code for tokens
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code: code
    });

    const response = await axios.post(TOKEN_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Update .env file with refresh token
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const envPath = join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('OUTREACH_REFRESH_TOKEN=')) {
      envContent = envContent.replace(
        /OUTREACH_REFRESH_TOKEN=.*/,
        `OUTREACH_REFRESH_TOKEN=${refresh_token}`
      );
    } else {
      envContent += `\nOUTREACH_REFRESH_TOKEN=${refresh_token}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);

    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: green;">✅ Authorization Successful!</h1>
          <p>Your refresh token has been saved to the .env file.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Token Information:</h3>
            <p><strong>Access Token:</strong> ${access_token.substring(0, 20)}...</p>
            <p><strong>Refresh Token:</strong> ${refresh_token.substring(0, 20)}...</p>
            <p><strong>Expires In:</strong> ${expires_in} seconds</p>
          </div>
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>⚠️ Important:</h3>
            <p>Your refresh token has been saved. Keep this token secure!</p>
            <p>The MCP server will use this token to authenticate with Outreach.</p>
          </div>
          <p>You can now close this window and start using the MCP server.</p>
          <button onclick="window.close()" style="padding: 12px 24px; background: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Close Window
          </button>
        </body>
      </html>
    `);

    console.log('\n✅ OAuth setup complete!');
    console.log('📝 Refresh token saved to .env file');
    console.log('\nYou can now run: npm start\n');
    
    // Close the server after a delay
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 40px;">
          <h1 style="color: red;">❌ Token Exchange Failed</h1>
          <p>Error: ${error.message}</p>
          <pre>${JSON.stringify(error.response?.data, null, 2)}</pre>
        </body>
      </html>
    `);
  }
});

server = app.listen(PORT, () => {
  const isLocalRedirect = REDIRECT_URI.includes('localhost');
  
  if (isLocalRedirect) {
    console.log(`\n🚀 OAuth Setup Server running at http://localhost:${PORT}`);
    console.log('\n📋 Steps to complete OAuth setup:');
    console.log('1. Opening browser to http://localhost:3000');
    console.log('2. Click "Authorize with Outreach"');
    console.log('3. Log in to your Outreach account');
    console.log('4. Approve the permissions');
    console.log('5. The refresh token will be saved automatically\n');
    
    // Open browser automatically
    open(`http://localhost:${PORT}`);
  } else {
    // For production callback, create direct auth URL
    const authUrl = `${AUTH_URL}?` + new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES
    });
    
    console.log(`\n🚀 OAuth Setup using production callback: ${REDIRECT_URI}`);
    console.log('\n📋 Steps to complete OAuth setup:');
    console.log('1. Opening browser to Outreach OAuth page');
    console.log('2. Log in to your Outreach account');
    console.log('3. Approve the permissions');
    console.log('4. You will be redirected to your production server');
    console.log('5. Copy the authorization code from the URL and paste it here\n');
    
    // Open browser to direct auth URL
    open(authUrl);
    
    // Start interactive prompt for code
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('📝 Paste the authorization code from the redirect URL: ', async (code) => {
      rl.close();
      
      try {
        // Exchange code for tokens
        const params = new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
          code: code.trim()
        });

        const response = await axios.post(TOKEN_URL, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Update .env file with refresh token
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const envPath = join(__dirname, '..', '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('OUTREACH_REFRESH_TOKEN=')) {
          envContent = envContent.replace(
            /OUTREACH_REFRESH_TOKEN=.*/,
            `OUTREACH_REFRESH_TOKEN=${refresh_token}`
          );
        } else {
          envContent += `\nOUTREACH_REFRESH_TOKEN=${refresh_token}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);

        console.log('\n✅ OAuth setup complete!');
        console.log('📝 Refresh token saved to .env file');
        console.log(`🔑 Access Token: ${access_token.substring(0, 20)}...`);
        console.log(`🔄 Refresh Token: ${refresh_token.substring(0, 20)}...`);
        console.log(`⏰ Expires In: ${expires_in} seconds`);
        console.log('\nYou can now run: npm start\n');
        
        server.close();
        process.exit(0);

      } catch (error) {
        console.error('\n❌ Error exchanging code for token:', error.response?.data || error.message);
        server.close();
        process.exit(1);
      }
    });
  }
});