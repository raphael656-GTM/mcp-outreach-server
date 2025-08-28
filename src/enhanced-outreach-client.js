// Enhanced Outreach Client with Performance Optimizations
import dotenv from 'dotenv';
import ConnectionPoolManager from './performance/connection-pool.js';
import CacheManager from './performance/cache-manager.js';
import BulkOperationsManager from './performance/bulk-operations.js';
import EnhancedOAuthManager from './performance/enhanced-oauth.js';
import PerformanceMonitor from './performance/performance-monitor.js';

dotenv.config();

class EnhancedOutreachClient {
  constructor() {
    this.clientId = process.env.OUTREACH_CLIENT_ID;
    this.clientSecret = process.env.OUTREACH_CLIENT_SECRET;
    this.redirectUri = process.env.OUTREACH_REDIRECT_URI || 'http://localhost:3000/callback';
    this.refreshToken = process.env.OUTREACH_REFRESH_TOKEN;
    this.baseURL = process.env.OUTREACH_API_BASE_URL || 'https://api.outreach.io/api/v2';
    
    // Initialize performance components
    this.connectionPool = new ConnectionPoolManager({
      maxSockets: 15,
      maxFreeSockets: 10,
      timeout: 30000
    });
    
    this.cacheManager = new CacheManager({
      oauthTtl: 3300,    // 55 minutes
      apiTtl: 300,       // 5 minutes
      sequenceTtl: 3600  // 1 hour
    });
    
    this.performanceMonitor = new PerformanceMonitor();
    
    this.oauthManager = new EnhancedOAuthManager(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
      this.refreshToken,
      this.cacheManager
    );
    
    // Get optimized HTTP client with connection pooling
    this.client = this.connectionPool.getClient();
    this.client.defaults.baseURL = this.baseURL;
    
    // Initialize bulk operations manager
    this.bulkOps = new BulkOperationsManager(this, {
      batchSize: 25,
      maxRetries: 3,
      parallelLimit: 5
    });

    // Add request interceptor for authentication and monitoring
    this.client.interceptors.request.use(
      async (config) => {
        const startTime = Date.now();
        config.metadata = { startTime };
        
        // Ensure valid token
        const token = await this.oauthManager.getAccessToken();
        config.headers['Authorization'] = `Bearer ${token}`;
        
        this.connectionPool.incrementStats();
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for monitoring and error handling
    this.client.interceptors.response.use(
      (response) => {
        // Record performance metrics
        const responseTime = Date.now() - response.config.metadata.startTime;
        const toolName = this.extractToolNameFromUrl(response.config.url);
        this.performanceMonitor.recordRequest(toolName, responseTime, true);
        
        return response;
      },
      async (error) => {
        // Record failed request
        if (error.config && error.config.metadata) {
          const responseTime = Date.now() - error.config.metadata.startTime;
          const toolName = this.extractToolNameFromUrl(error.config.url);
          this.performanceMonitor.recordRequest(toolName, responseTime, false);
        }

        const originalRequest = error.config;
        
        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            console.error('🔄 Refreshing token due to 401 error...');
            const token = await this.oauthManager.refreshAccessToken();
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError.message);
            return Promise.reject(error);
          }
        }
        
        return Promise.reject(error);
      }
    );

    console.error('✅ Enhanced Outreach Client initialized with performance optimizations');
  }

  // Extract tool name from URL for monitoring
  extractToolNameFromUrl(url) {
    if (!url) return 'unknown';
    
    const path = url.replace(this.baseURL, '');
    if (path.includes('/prospects')) return 'prospects';
    if (path.includes('/sequences')) return 'sequences';
    if (path.includes('/templates')) return 'templates';
    if (path.includes('/sequenceSteps')) return 'sequenceSteps';
    if (path.includes('/sequenceTemplates')) return 'sequenceTemplates';
    if (path.includes('/accounts')) return 'accounts';
    if (path.includes('/mailboxes')) return 'mailboxes';
    
    return 'other';
  }

  // Enhanced API call with caching
  async makeApiCall(method, endpoint, data = null, useCache = false) {
    const cacheKey = useCache ? `${method}:${endpoint}:${JSON.stringify(data)}` : null;
    
    // Check cache first
    if (useCache && method === 'GET') {
      const cached = this.cacheManager.getApiResponse(endpoint, data);
      if (cached) {
        console.error(`🎯 Cache hit for ${endpoint}`);
        return cached;
      }
    }

    try {
      let response;
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await this.client.get(endpoint, { params: data });
          break;
        case 'post':
          response = await this.client.post(endpoint, data);
          break;
        case 'patch':
          response = await this.client.patch(endpoint, data);
          break;
        case 'delete':
          response = await this.client.delete(endpoint);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Cache GET responses
      if (useCache && method === 'GET') {
        this.cacheManager.setApiResponse(endpoint, data, response.data);
      }

      return response.data;
      
    } catch (error) {
      console.error(`❌ API call failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  // ===== BULK OPERATIONS (New Enhanced Features) =====

  // Bulk create prospects
  async bulkCreateProspects(prospectsData, options = {}) {
    console.error(`📦 Bulk creating ${prospectsData.length} prospects...`);
    return await this.bulkOps.bulkCreateProspects(prospectsData, options);
  }

  // Bulk create sequences
  async bulkCreateSequences(sequencesData, options = {}) {
    console.error(`📦 Bulk creating ${sequencesData.length} sequences...`);
    return await this.bulkOps.bulkCreateSequences(sequencesData, options);
  }

  // Bulk create templates
  async bulkCreateTemplates(templatesData, options = {}) {
    console.error(`📦 Bulk creating ${templatesData.length} templates...`);
    return await this.bulkOps.bulkCreateTemplates(templatesData, options);
  }

  // Bulk enroll prospects
  async bulkEnrollProspects(enrollmentData, options = {}) {
    console.error(`📦 Bulk enrolling ${enrollmentData.length} prospects...`);
    return await this.bulkOps.bulkEnrollProspects(enrollmentData, options);
  }

  // ===== EXISTING METHODS WITH CACHING =====

  // Enhanced prospect methods
  async createProspect(data) {
    try {
      const payload = {
        data: {
          type: 'prospect',
          attributes: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            company: data.company,
            title: data.title,
            tags: data.tags || [],
            customFields: data.customFields || {}
          }
        }
      };
      
      const response = await this.makeApiCall('POST', '/prospects', payload);
      
      // Cache the created prospect
      if (response.data && response.data.id) {
        this.cacheManager.setProspectData(response.data.id, response.data);
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to create prospect: ${error.message}`);
    }
  }

  async searchProspects(criteria) {
    try {
      const params = new URLSearchParams();
      
      if (criteria.email) params.append('filter[email]', criteria.email);
      if (criteria.company) params.append('filter[company]', criteria.company);
      if (criteria.tags && criteria.tags.length > 0) params.append('filter[tags]', criteria.tags.join(','));
      if (criteria.limit) params.append('page[limit]', criteria.limit);
      
      const response = await this.makeApiCall('GET', `/prospects?${params.toString()}`, null, true);
      return response;
    } catch (error) {
      throw new Error(`Failed to search prospects: ${error.message}`);
    }
  }

  // Enhanced sequence methods with caching
  async getSequences(limit = 25) {
    try {
      const response = await this.makeApiCall('GET', `/sequences?page[limit]=${limit}`, null, true);
      return response;
    } catch (error) {
      throw new Error(`Failed to get sequences: ${error.message}`);
    }
  }

  async createSequence(sequenceData) {
    try {
      const payload = {
        data: {
          type: 'sequence',
          attributes: {
            name: sequenceData.name,
            description: sequenceData.description || '',
            tags: sequenceData.tags || [],
            shareType: sequenceData.shareType || 'shared'
          }
        }
      };

      const response = await this.makeApiCall('POST', '/sequences', payload);
      
      // Cache the created sequence
      if (response.data && response.data.id) {
        this.cacheManager.setSequenceData(response.data.id, response.data);
        response._uiLink = `https://web.outreach.io/sequences/${response.data.id}/overview`;
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to create sequence: ${error.message}`);
    }
  }

  // Template methods with caching
  async createSequenceTemplate(templateData) {
    try {
      const payload = {
        data: {
          type: 'template',
          attributes: {
            name: templateData.name,
            subject: templateData.subject,
            ...(templateData.bodyHtml && { bodyHtml: templateData.bodyHtml }),
            ...(templateData.bodyText && { bodyText: templateData.bodyText }),
            ...(templateData.tags && { tags: templateData.tags }),
            shareType: templateData.shareType || 'shared',
            archived: false,
            trackLinks: templateData.trackLinks !== false,
            trackOpens: templateData.trackOpens !== false
          }
        }
      };

      const response = await this.makeApiCall('POST', '/templates', payload);
      
      // Cache the created template
      if (response.data && response.data.id) {
        this.cacheManager.setTemplateData(response.data.id, response.data);
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  // All other existing methods remain the same...
  // (Including createSequenceStep, linkTemplateToStep, addProspectToSequence, etc.)
  // I'll keep the existing implementations for compatibility

  async createSequenceStep(stepData) {
    try {
      let order = stepData.order;
      if (!order) {
        const existingSteps = await this.getSequenceSteps(stepData.sequenceId);
        order = existingSteps.data ? existingSteps.data.length + 1 : 1;
      }

      const payload = {
        data: {
          type: 'sequenceStep',
          attributes: {
            stepType: stepData.stepType === 'email' ? 'auto_email' : stepData.stepType || 'auto_email',
            order: order,
            interval: stepData.intervalInDays ? stepData.intervalInDays * 24 * 60 : 0,
            ...(stepData.taskNote && { taskNote: stepData.taskNote })
          },
          relationships: {
            sequence: {
              data: {
                type: 'sequence',
                id: stepData.sequenceId
              }
            }
          }
        }
      };

      const response = await this.makeApiCall('POST', '/sequenceSteps', payload);
      return response;
    } catch (error) {
      throw new Error(`Failed to create sequence step: ${error.message}`);
    }
  }

  async getSequenceSteps(sequenceId) {
    try {
      const response = await this.makeApiCall('GET', `/sequenceSteps?filter[sequence][id]=${sequenceId}&sort=order`, null, true);
      return response;
    } catch (error) {
      throw new Error(`Failed to get sequence steps: ${error.message}`);
    }
  }

  async linkTemplateToStep(sequenceStepId, templateId) {
    try {
      const payload = {
        data: {
          type: 'sequenceTemplate',
          relationships: {
            sequenceStep: {
              data: {
                type: 'sequenceStep',
                id: sequenceStepId.toString()
              }
            },
            template: {
              data: {
                type: 'template',
                id: templateId.toString()
              }
            }
          }
        }
      };

      const response = await this.makeApiCall('POST', '/sequenceTemplates', payload);
      return response;
    } catch (error) {
      throw new Error(`Failed to link template to step: ${error.message}`);
    }
  }

  async addProspectToSequence(prospectId, sequenceId, options = {}) {
    try {
      const payload = {
        data: {
          type: 'sequenceState',
          attributes: {
            state: 'active',
            ...options
          },
          relationships: {
            prospect: {
              data: {
                type: 'prospect',
                id: prospectId
              }
            },
            sequence: {
              data: {
                type: 'sequence',
                id: sequenceId
              }
            }
          }
        }
      };
      
      if (options.mailboxId) {
        payload.data.relationships.mailbox = {
          data: {
            type: 'mailbox',
            id: options.mailboxId
          }
        };
      }
      
      const response = await this.makeApiCall('POST', '/sequenceStates', payload);
      return response;
    } catch (error) {
      throw new Error(`Failed to add prospect to sequence: ${error.message}`);
    }
  }

  async getMailboxes() {
    try {
      const response = await this.makeApiCall('GET', '/mailboxes', null, true);
      return response;
    } catch (error) {
      throw new Error(`Failed to get mailboxes: ${error.message}`);
    }
  }

  // ===== MONITORING AND HEALTH =====

  // Get comprehensive health status
  getHealth() {
    return {
      timestamp: new Date().toISOString(),
      oauth: this.oauthManager.getHealth(),
      connectionPool: this.connectionPool.getHealth(),
      cache: this.cacheManager.getHealth(),
      bulkOps: this.bulkOps.getHealth(),
      performance: this.performanceMonitor.getHealth()
    };
  }

  // Get detailed performance metrics
  getPerformanceMetrics() {
    return {
      timestamp: new Date().toISOString(),
      oauth: this.oauthManager.getStats(),
      connectionPool: this.connectionPool.getStats(),
      cache: this.cacheManager.getStats(),
      bulkOps: this.bulkOps.getStats(),
      performance: this.performanceMonitor.getMetrics()
    };
  }

  // Generate performance report
  generatePerformanceReport() {
    return this.performanceMonitor.generateReport();
  }

  // Cleanup method
  async shutdown() {
    console.error('🔄 Shutting down Enhanced Outreach Client...');
    
    if (this.oauthManager) {
      this.oauthManager.destroy();
    }
    
    if (this.connectionPool) {
      await this.connectionPool.shutdown();
    }
    
    if (this.cacheManager) {
      this.cacheManager.close();
    }
    
    if (this.performanceMonitor) {
      this.performanceMonitor.destroy();
    }
    
    console.error('✅ Enhanced Outreach Client shutdown complete');
  }
}

export default EnhancedOutreachClient;