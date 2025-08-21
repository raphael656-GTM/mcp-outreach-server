import express from 'express';
import axios from 'axios';
import fs from 'fs';
import open from 'open';

const CLIENT_ID = 'huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug';
const CLIENT_SECRET = '3~uWIul|6x~MS6b8>#O1b_tN<V|#H2~O$wR&QsA#N@<';
const REDIRECT_URI = 'http://localhost:3001/callback';
const PORT = 3001;

const app = express();

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.send('Error: No authorization code received');
  }

  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code: code
    });

    console.log('\n📝 Exchanging code for tokens...');
    const response = await axios.post('https://api.outreach.io/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { refresh_token } = response.data;

    // Update .env file
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(
      /OUTREACH_REFRESH_TOKEN=.*/,
      `OUTREACH_REFRESH_TOKEN=${refresh_token}`
    );
    fs.writeFileSync('.env', envContent);

    console.log('\n✅ Success! Refresh token saved to .env');
    res.send('<h1>✅ Success!</h1><p>You can close this window.</p>');
    
    setTimeout(() => process.exit(0), 2000);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.send(`Error: ${JSON.stringify(error.response?.data || error.message)}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  const authUrl = `https://api.outreach.io/oauth/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=accounts.all prospects.all sequences.all sequenceStates.all mailboxes.all tags.all users.all`;
  
  console.log('\nOpening browser...');
  console.log('If it doesn\'t open, visit:');
  console.log(authUrl);
  
  open(authUrl);
});