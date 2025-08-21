// Quick script to exchange authorization code for refresh token
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';
const REDIRECT_URI = process.env.OUTREACH_REDIRECT_URI;
const AUTH_CODE = 'fbvNUGaMgdz8keFVcW8VypRldtCFF9hR1ynETpJBeE8';

async function exchangeCode() {
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code: AUTH_CODE
    });

    console.log('Exchanging code for tokens...');
    const response = await axios.post('https://api.outreach.io/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Update .env file with refresh token
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const envPath = join(__dirname, '.env');
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

  } catch (error) {
    console.error('Error exchanging code:', error.response?.data || error.message);
  }
}

exchangeCode();