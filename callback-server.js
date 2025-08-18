import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// OAuth callback routes (both paths for compatibility)
app.get('/callback', handleOAuthCallback);
app.get('/auth/callback', handleOAuthCallback);

function handleOAuthCallback(req, res) {
  const { code, state, error } = req.query;
  
  console.log('OAuth callback received:', { code, state, error });
  
  if (error) {
    return res.status(400).json({ 
      error: 'Authorization failed', 
      details: error 
    });
  }
  
  if (!code) {
    return res.status(400).json({ 
      error: 'No authorization code received' 
    });
  }
  
  // Return success page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authorization Successful</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .success { color: #28a745; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 20px; }
      </style>
    </head>
    <body>
      <h1 class="success">✅ Authorization Successful!</h1>
      <p>Your authorization code has been received.</p>
      <div class="code">
        <strong>Code:</strong> ${code}<br>
        <strong>State:</strong> ${state || 'N/A'}
      </div>
      <p>You can now close this window.</p>
    </body>
    </html>
  `);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'OAuth Callback Server',
    endpoints: {
      callback: '/callback',
      'callback-alt': '/auth/callback', 
      health: '/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`OAuth callback server running on port ${PORT}`);
  console.log(`Callback URL: ${process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : 'http://localhost:' + PORT}/auth/callback`);
});