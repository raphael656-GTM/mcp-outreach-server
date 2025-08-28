// Cache Manager for API responses and frequently accessed data
import NodeCache from 'node-cache';

class CacheManager {
  constructor(config = {}) {
    // Different TTL for different types of data
    this.ttl = {
      oauth_token: config.oauthTtl || 3300, // 55 minutes (tokens expire in 1 hour)
      api_response: config.apiTtl || 300,   // 5 minutes for API responses
      prospect_data: config.prospectTtl || 1800, // 30 minutes for prospect data
      sequence_data: config.sequenceTtl || 3600, // 1 hour for sequences/templates
      short_term: config.shortTtl || 60     // 1 minute for temporary data
    };

    // Create separate cache instances for different data types
    this.oauthCache = new NodeCache({ 
      stdTTL: this.ttl.oauth_token,
      checkperiod: 60,
      useClones: false
    });

    this.apiCache = new NodeCache({ 
      stdTTL: this.ttl.api_response,
      checkperiod: 30,
      useClones: false
    });

    this.dataCache = new NodeCache({ 
      stdTTL: this.ttl.sequence_data,
      checkperiod: 120,
      useClones: false
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    // Setup cache event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    [this.oauthCache, this.apiCache, this.dataCache].forEach(cache => {
      cache.on('expired', (key, value) => {
        console.error(`🗑️ Cache expired: ${key}`);
      });

      cache.on('del', (key, value) => {
        this.stats.deletes++;
      });

      cache.on('set', (key, value) => {
        this.stats.sets++;
      });
    });
  }

  // OAuth Token Caching
  setOAuthToken(key, tokenData) {
    const cacheKey = `oauth:${key}`;
    this.oauthCache.set(cacheKey, tokenData, this.ttl.oauth_token);
    console.error(`🔐 OAuth token cached: ${key}`);
  }

  getOAuthToken(key) {
    const cacheKey = `oauth:${key}`;
    const token = this.oauthCache.get(cacheKey);
    if (token) {
      this.stats.hits++;
      console.error(`✅ OAuth token cache hit: ${key}`);
      return token;
    }
    this.stats.misses++;
    console.error(`❌ OAuth token cache miss: ${key}`);
    return null;
  }

  // API Response Caching
  setApiResponse(endpoint, params, data) {
    const cacheKey = this.generateApiKey(endpoint, params);
    this.apiCache.set(cacheKey, data, this.ttl.api_response);
    console.error(`💾 API response cached: ${endpoint}`);
  }

  getApiResponse(endpoint, params) {
    const cacheKey = this.generateApiKey(endpoint, params);
    const data = this.apiCache.get(cacheKey);
    if (data) {
      this.stats.hits++;
      console.error(`✅ API cache hit: ${endpoint}`);
      return data;
    }
    this.stats.misses++;
    return null;
  }

  // Prospect Data Caching
  setProspectData(prospectId, data) {
    const cacheKey = `prospect:${prospectId}`;
    this.dataCache.set(cacheKey, data, this.ttl.prospect_data);
  }

  getProspectData(prospectId) {
    const cacheKey = `prospect:${prospectId}`;
    const data = this.dataCache.get(cacheKey);
    if (data) {
      this.stats.hits++;
      return data;
    }
    this.stats.misses++;
    return null;
  }

  // Sequence Data Caching
  setSequenceData(sequenceId, data) {
    const cacheKey = `sequence:${sequenceId}`;
    this.dataCache.set(cacheKey, data, this.ttl.sequence_data);
  }

  getSequenceData(sequenceId) {
    const cacheKey = `sequence:${sequenceId}`;
    const data = this.dataCache.get(cacheKey);
    if (data) {
      this.stats.hits++;
      return data;
    }
    this.stats.misses++;
    return null;
  }

  // Template Data Caching
  setTemplateData(templateId, data) {
    const cacheKey = `template:${templateId}`;
    this.dataCache.set(cacheKey, data, this.ttl.sequence_data);
  }

  getTemplateData(templateId) {
    const cacheKey = `template:${templateId}`;
    const data = this.dataCache.get(cacheKey);
    if (data) {
      this.stats.hits++;
      return data;
    }
    this.stats.misses++;
    return null;
  }

  // Utility Methods
  generateApiKey(endpoint, params) {
    const sortedParams = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `api:${endpoint}:${Buffer.from(sortedParams).toString('base64')}`;
  }

  // Cache Management
  invalidateApiCache() {
    this.apiCache.flushAll();
    console.error('🗑️ API cache invalidated');
  }

  invalidateProspectCache(prospectId = null) {
    if (prospectId) {
      this.dataCache.del(`prospect:${prospectId}`);
    } else {
      // Invalidate all prospect data
      const keys = this.dataCache.keys().filter(key => key.startsWith('prospect:'));
      this.dataCache.del(keys);
    }
  }

  // Statistics and Health
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      oauthCacheKeys: this.oauthCache.keys().length,
      apiCacheKeys: this.apiCache.keys().length,
      dataCacheKeys: this.dataCache.keys().length
    };
  }

  getHealth() {
    const stats = this.getStats();
    return {
      status: 'healthy',
      hitRate: stats.hitRate,
      totalKeys: stats.oauthCacheKeys + stats.apiCacheKeys + stats.dataCacheKeys,
      cacheTypes: {
        oauth: stats.oauthCacheKeys,
        api: stats.apiCacheKeys,
        data: stats.dataCacheKeys
      }
    };
  }

  // Cleanup
  close() {
    this.oauthCache.close();
    this.apiCache.close();
    this.dataCache.close();
    console.error('✅ Cache manager closed');
  }
}

export default CacheManager;