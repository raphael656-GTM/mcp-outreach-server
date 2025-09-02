import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

const TOKEN_FILE = path.join(os.homedir(), '.mcp-outreach', 'token.json');

export class OutreachOAuth {
  private config: OAuthConfig;
  private tokenData?: TokenData;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  async initialize(): Promise<string> {
    // Try to load existing token
    try {
      const tokenContent = await fs.readFile(TOKEN_FILE, 'utf8');
      this.tokenData = JSON.parse(tokenContent);
      
      // Check if token is expired
      if (this.tokenData && Date.now() < this.tokenData.expires_at) {
        console.error('Using existing valid token');
        return this.tokenData.access_token;
      }
      
      // Try to refresh if we have refresh token
      if (this.tokenData?.refresh_token) {
        console.error('Token expired, refreshing...');
        return await this.refreshToken();
      }
    } catch (error) {
      console.error('No valid token found, starting OAuth flow...');
    }

    // Start OAuth flow
    return await this.startOAuthFlow();
  }

  private async startOAuthFlow(): Promise<string> {
    return new Promise((resolve, reject) => {
      const app = express();
      let server: any;

      // OAuth callback handler
      app.get('/callback', async (req, res) => {
        const { code } = req.query;
        
        if (!code) {
          res.send('Error: No authorization code received');
          server.close();
          reject(new Error('No authorization code received'));
          return;
        }

        try {
          // Exchange code for tokens
          const tokenResponse = await axios.post('https://api.outreach.io/oauth/token', {
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            code: code as string,
            grant_type: 'authorization_code',
            redirect_uri: this.config.redirectUri
          });

          const { access_token, refresh_token, expires_in } = tokenResponse.data;
          
          // Save tokens
          this.tokenData = {
            access_token,
            refresh_token,
            expires_at: Date.now() + (expires_in * 1000)
          };

          await this.saveToken();

          res.send(`
            <html>
              <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>✅ Authentication Successful!</h1>
                <p>You can now close this window and return to Claude.</p>
                <script>setTimeout(() => window.close(), 3000);</script>
              </body>
            </html>
          `);

          server.close();
          resolve(access_token);
        } catch (error) {
          res.send('Error exchanging code for token');
          server.close();
          reject(error);
        }
      });

      // Start server
      const port = this.config.redirectUri.includes('localhost:3001') ? 3001 : 3000;
      server = app.listen(port, () => {
        console.error(`OAuth server listening on http://localhost:${port}`);
        
        // Build authorization URL
        const authUrl = new URL('https://api.outreach.io/oauth/authorize');
        authUrl.searchParams.append('client_id', this.config.clientId);
        authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', this.config.scope);

        console.error('\n🔐 Please authorize the application:');
        console.error(authUrl.toString());
        console.error('\nOpening browser...\n');

        // Open browser
        const openCommand = process.platform === 'darwin' ? 'open' :
                          process.platform === 'win32' ? 'start' :
                          'xdg-open';
        
        spawn(openCommand, [authUrl.toString()], { detached: true });
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('OAuth flow timed out'));
      }, 300000);
    });
  }

  private async refreshToken(): Promise<string> {
    if (!this.tokenData?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('https://api.outreach.io/oauth/token', {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.tokenData.refresh_token,
        grant_type: 'refresh_token'
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.tokenData = {
        access_token,
        refresh_token: refresh_token || this.tokenData.refresh_token,
        expires_at: Date.now() + (expires_in * 1000)
      };

      await this.saveToken();
      return access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Start new OAuth flow if refresh fails
      return await this.startOAuthFlow();
    }
  }

  private async saveToken(): Promise<void> {
    const dir = path.dirname(TOKEN_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(TOKEN_FILE, JSON.stringify(this.tokenData, null, 2));
  }

  async getValidToken(): Promise<string> {
    if (!this.tokenData) {
      return await this.initialize();
    }

    // Check if token is still valid
    if (Date.now() >= this.tokenData.expires_at) {
      return await this.refreshToken();
    }

    return this.tokenData.access_token;
  }
}