// Enhanced OAuth Manager with proactive token refresh and error recovery
import { setTimeout as delay } from 'timers/promises';

class EnhancedOAuthManager {
  constructor(clientId, clientSecret, redirectUri, initialRefreshToken, cacheManager) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.refreshToken = initialRefreshToken;
    this.cacheManager = cacheManager;
    
    this.tokenURL = 'https://api.outreach.io/oauth/token';
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Enhanced configuration
    this.bufferTime = 10 * 60 * 1000; // 10 minutes buffer before expiry
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    this.stats = {
      tokenRefreshes: 0,
      proactiveRefreshes: 0,
      failedRefreshes: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // Start proactive token management
    this.startProactiveRefresh();
  }

  // Start proactive token refresh monitoring
  startProactiveRefresh() {
    // Check every 5 minutes if token needs refreshing
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, 5 * 60 * 1000);

    console.error('🔄 Proactive OAuth token refresh monitoring started');
  }

  // Check if token needs refreshing and refresh if necessary
  async checkAndRefreshToken() {
    try {
      if (this.needsRefresh()) {
        console.error('🔄 Proactive token refresh triggered');
        await this.refreshAccessToken();
        this.stats.proactiveRefreshes++;
      }
    } catch (error) {
      console.error('❌ Proactive token refresh failed:', error.message);
    }
  }

  // Check if token needs refresh (with buffer time)
  needsRefresh() {
    if (!this.accessToken || !this.tokenExpiry) {
      return true;
    }
    
    const timeUntilExpiry = this.tokenExpiry - Date.now();
    return timeUntilExpiry <= this.bufferTime;
  }

  // Enhanced token refresh with retry logic and caching
  async refreshAccessToken(attempt = 1) {
    try {
      console.error(`🔑 Refreshing OAuth token (attempt ${attempt})...`);

      // Check cache first
      const cachedToken = this.cacheManager?.getOAuthToken('access_token');
      if (cachedToken && !this.isTokenExpired(cachedToken)) {
        console.error('✅ Using cached access token');
        this.accessToken = cachedToken.access_token;
        this.tokenExpiry = cachedToken.expiry;
        this.stats.cacheHits++;
        return this.accessToken;
      }
      
      this.stats.cacheMisses++;

      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      });

      const response = await fetch(this.tokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MCP-Outreach-Server/1.0'
        },
        body: params
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const tokenData = await response.json();

      // Update token information
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token || this.refreshToken;
      
      // Set expiry time with buffer
      const expiresIn = tokenData.expires_in || 3600;
      this.tokenExpiry = Date.now() + ((expiresIn - 300) * 1000); // 5 minute buffer

      // Cache the token
      if (this.cacheManager) {
        this.cacheManager.setOAuthToken('access_token', {
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expiry: this.tokenExpiry
        });
      }

      this.stats.tokenRefreshes++;
      console.error(`✅ OAuth token refreshed successfully (expires in ${Math.round((this.tokenExpiry - Date.now()) / 1000 / 60)} minutes)`);

      // Log refresh token changes
      if (tokenData.refresh_token && tokenData.refresh_token !== this.refreshToken) {
        console.error('🔄 New refresh token received - update your .env file');
        console.error(`OUTREACH_REFRESH_TOKEN=${tokenData.refresh_token}`);
      }

      return this.accessToken;

    } catch (error) {
      console.error(`❌ OAuth token refresh failed (attempt ${attempt}):`, error.message);
      this.stats.failedRefreshes++;

      // Retry logic with exponential backoff
      if (attempt < this.maxRetries) {
        const delayMs = this.retryDelay * Math.pow(2, attempt - 1);
        console.error(`🔄 Retrying token refresh in ${delayMs}ms...`);
        
        await delay(delayMs);
        return this.refreshAccessToken(attempt + 1);
      }

      throw new Error(`OAuth token refresh failed after ${this.maxRetries} attempts: ${error.message}`);
    }
  }

  // Ensure valid token with automatic refresh
  async ensureValidToken() {
    if (!this.accessToken || this.needsRefresh()) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  // Get current access token (refresh if needed)
  async getAccessToken() {
    return await this.ensureValidToken();
  }

  // Check if token is expired
  isTokenExpired(token = null) {
    if (token && token.expiry) {
      return Date.now() >= token.expiry;
    }
    
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  // Get token status and health
  getTokenStatus() {
    if (!this.accessToken || !this.tokenExpiry) {
      return {
        status: 'invalid',
        hasToken: false,
        expiresIn: 0,
        needsRefresh: true
      };
    }

    const expiresIn = Math.max(0, this.tokenExpiry - Date.now());
    const expiresInMinutes = Math.round(expiresIn / 1000 / 60);

    return {
      status: this.isTokenExpired() ? 'expired' : 'valid',
      hasToken: true,
      expiresIn: expiresIn,
      expiresInMinutes: expiresInMinutes,
      needsRefresh: this.needsRefresh()
    };
  }

  // Get OAuth statistics
  getStats() {
    return {
      ...this.stats,
      tokenStatus: this.getTokenStatus(),
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 
        ? `${((this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100).toFixed(2)}%`
        : '0%'
    };
  }

  // Health check
  getHealth() {
    const status = this.getTokenStatus();
    const stats = this.getStats();
    
    return {
      status: status.status === 'valid' ? 'healthy' : 'warning',
      tokenStatus: status.status,
      expiresInMinutes: status.expiresInMinutes,
      totalRefreshes: stats.tokenRefreshes,
      proactiveRefreshes: stats.proactiveRefreshes,
      cacheHitRate: stats.cacheHitRate
    };
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    console.error('🔄 OAuth manager cleanup complete');
  }
}

export default EnhancedOAuthManager;