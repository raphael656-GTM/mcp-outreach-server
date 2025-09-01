#!/usr/bin/env node

// Debug version of MCP HTTP-to-STDIO Bridge
const https = require('https');
const http = require('http');
const fs = require('fs');

const MCP_SERVER_URL = 'https://mcp-outreach-server-production.up.railway.app/mcp-server';
const LOG_FILE = '/tmp/mcp-bridge-debug.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.error(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

let inputBuffer = '';

function makeHttpRequest(data) {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_SERVER_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        log(`HTTP Response: ${responseData}`);
        resolve(responseData);
      });
    });

    req.on('error', (error) => {
      log(`HTTP Error: ${error.message}`);
      reject(error);
    });

    log(`HTTP Request: ${data}`);
    req.write(data);
    req.end();
  });
}

let pendingRequests = 0;

process.stdin.on('data', async (data) => {
  const rawData = data.toString();
  log(`Raw stdin data: ${JSON.stringify(rawData)}`);
  
  inputBuffer += rawData;
  
  const lines = inputBuffer.split('\n');
  inputBuffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim()) {
      log(`Processing line: ${line}`);
      
      let jsonData = null;
      try {
        jsonData = JSON.parse(line.trim());
        log(`Parsed JSON: ${JSON.stringify(jsonData)}`);
        
        pendingRequests++;
        const response = await makeHttpRequest(line.trim());
        
        log(`Sending to stdout: ${response}`);
        process.stdout.write(response + '\n');
        pendingRequests--;
        
      } catch (error) {
        log(`Error processing line: ${error.message}`);
        log(`Error stack: ${error.stack}`);
        
        const errorResponse = {
          jsonrpc: '2.0',
          id: jsonData?.id || null,
          error: {
            code: error.name === 'SyntaxError' ? -32700 : -32603,
            message: error.name === 'SyntaxError' ? 'Parse error' : `Bridge error: ${error.message}`,
            data: { originalError: error.message }
          }
        };
        
        const errorResponseStr = JSON.stringify(errorResponse);
        log(`Sending error response: ${errorResponseStr}`);
        process.stdout.write(errorResponseStr + '\n');
        pendingRequests--;
      }
    }
  }
});

process.stdin.on('end', () => {
  log('stdin closed');
  const checkPending = () => {
    if (pendingRequests === 0) {
      log('Exiting - no pending requests');
      process.exit(0);
    } else {
      setTimeout(checkPending, 10);
    }
  };
  checkPending();
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, exiting');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Received SIGINT, exiting');
  process.exit(0);
});

log('Debug MCP HTTP-to-STDIO Bridge started');
log(`Log file: ${LOG_FILE}`);
log(`Connecting to: ${MCP_SERVER_URL}`);