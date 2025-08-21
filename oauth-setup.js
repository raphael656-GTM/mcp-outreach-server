#!/usr/bin/env node

// One-time OAuth setup script for MCP server
import { OutreachOAuth } from './dist/oauth.js';
import { config } from 'dotenv';

config();

async function setupOAuth() {
  if (!process.env.OUTREACH_CLIENT_ID || !process.env.OUTREACH_CLIENT_SECRET) {
    console.error('Missing OUTREACH_CLIENT_ID or OUTREACH_CLIENT_SECRET environment variables');
    process.exit(1);
  }

  const oauth = new OutreachOAuth({
    clientId: process.env.OUTREACH_CLIENT_ID,
    clientSecret: process.env.OUTREACH_CLIENT_SECRET,
    redirectUri: process.env.OUTREACH_REDIRECT_URI || 'http://localhost:3001/callback',
    scope: 'sequences.all prospects.all accounts.read sequenceStates.all sequenceSteps.all mailboxes.read'
  });

  try {
    console.log('Starting OAuth flow...');
    const token = await oauth.initialize();
    console.log('✅ OAuth setup complete! Token saved.');
    console.log('You can now use the MCP server with Claude.');
    process.exit(0);
  } catch (error) {
    console.error('❌ OAuth setup failed:', error.message);
    process.exit(1);
  }
}

setupOAuth();