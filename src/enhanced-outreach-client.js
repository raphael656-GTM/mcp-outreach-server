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

  // ===== HIGH-LEVEL WORKFLOW METHODS =====

  // Create complete email sequence with templates and steps in one call
  async createCompleteEmailSequence(data) {
    try {
      console.error(`🎯 Creating complete email sequence: ${data.sequenceName}`);
      
      const results = {
        sequence: null,
        templates: [],
        steps: [],
        links: [],
        summary: {
          sequenceName: data.sequenceName,
          emailCount: data.emails.length,
          success: false,
          errors: []
        }
      };

      // Step 1: Check if sequence already exists
      try {
        const existing = await this.findSequence(data.sequenceName);
        if (existing.data && existing.data.length > 0) {
          throw new Error(`Sequence "${data.sequenceName}" already exists`);
        }
      } catch (error) {
        // If find fails, that's ok - sequence doesn't exist
        if (!error.message.includes('already exists')) {
          console.error('Warning: Could not check for existing sequence:', error.message);
        } else {
          throw error;
        }
      }

      // Step 2: Create the main sequence
      const sequenceData = {
        name: data.sequenceName,
        description: data.description,
        tags: data.tags || [],
        shareType: 'shared'
      };
      
      results.sequence = await this.createSequence(sequenceData);
      const sequenceId = results.sequence.data.id.toString();
      
      console.error(`✅ Created sequence ID: ${sequenceId}`);

      // Step 3: Create all email templates
      for (let i = 0; i < data.emails.length; i++) {
        const email = data.emails[i];
        
        const templateData = {
          name: email.templateName,
          subject: email.subject,
          bodyHtml: email.bodyHtml,
          tags: email.tags || [],
          trackLinks: true,
          trackOpens: true
        };
        
        const template = await this.createSequenceTemplate(templateData);
        results.templates.push(template);
        console.error(`✅ Created template ${i + 1}: ${template.data.id}`);
      }

      // Step 4: Create sequence steps with proper timing
      for (let i = 0; i < data.emails.length; i++) {
        const email = data.emails[i];
        
        const stepData = {
          sequenceId: sequenceId,
          stepType: 'auto_email',
          order: i + 1,
          intervalInDays: email.intervalInDays
        };
        
        const step = await this.createSequenceStep(stepData);
        results.steps.push(step);
        console.error(`✅ Created step ${i + 1}: ${step.data.id}`);
      }

      // Step 5: Link templates to steps
      for (let i = 0; i < results.templates.length; i++) {
        const templateId = results.templates[i].data.id.toString();
        const stepId = results.steps[i].data.id.toString();
        
        const link = await this.linkTemplateToStep(stepId, templateId);
        results.links.push(link);
        console.error(`✅ Linked template ${i + 1} to step ${i + 1}`);
      }

      results.summary.success = true;
      console.error(`🎉 Complete sequence created successfully: ${data.emails.length} emails, ${results.steps.length} steps`);
      
      return results;

    } catch (error) {
      console.error(`❌ Failed to create complete email sequence: ${error.message}`);
      throw new Error(`Failed to create complete email sequence: ${error.message}`);
    }
  }

  // Create prospect and immediately enroll in sequence
  async createAndEnrollProspect(data) {
    try {
      console.error(`👤 Creating and enrolling prospect: ${data.prospect.firstName} ${data.prospect.lastName}`);
      
      const results = {
        prospect: null,
        sequence: null,
        enrollment: null,
        summary: {
          prospectEmail: data.prospect.email,
          sequenceName: data.sequenceName,
          success: false
        }
      };

      // Step 1: Find the sequence
      const sequenceResults = await this.findSequence(data.sequenceName);
      if (!sequenceResults.data || sequenceResults.data.length === 0) {
        throw new Error(`Sequence "${data.sequenceName}" not found`);
      }
      
      results.sequence = sequenceResults.data[0];
      const sequenceId = results.sequence.id.toString();
      console.error(`✅ Found sequence ID: ${sequenceId}`);

      // Step 2: Create the prospect
      results.prospect = await this.createProspect(data.prospect);
      const prospectId = results.prospect.data.id.toString();
      console.error(`✅ Created prospect ID: ${prospectId}`);

      // Step 3: Enroll prospect in sequence
      const enrollmentOptions = data.options || {};
      results.enrollment = await this.addProspectToSequence(prospectId, sequenceId, enrollmentOptions);
      console.error(`✅ Enrolled prospect in sequence`);

      results.summary.success = true;
      console.error(`🎉 Prospect created and enrolled successfully`);
      
      return results;

    } catch (error) {
      console.error(`❌ Failed to create and enroll prospect: ${error.message}`);
      throw new Error(`Failed to create and enroll prospect: ${error.message}`);
    }
  }

  // Create complete campaign with sequence, templates, and prospects
  async createCampaignWithProspects(data) {
    try {
      console.error(`🚀 Creating complete campaign: ${data.sequenceName} with ${data.prospects.length} prospects`);
      
      const results = {
        sequence: null,
        templates: [],
        steps: [],
        links: [],
        prospects: {
          successful: [],
          failed: []
        },
        enrollments: {
          successful: [],
          failed: []
        },
        summary: {
          sequenceName: data.sequenceName,
          emailCount: data.emails.length,
          prospectCount: data.prospects.length,
          success: false,
          prospectsCreated: 0,
          prospectsEnrolled: 0
        }
      };

      // Step 1: Create the complete email sequence
      console.error(`📧 Creating email sequence...`);
      const sequenceResults = await this.createCompleteEmailSequence({
        sequenceName: data.sequenceName,
        description: data.description,
        tags: data.tags,
        emails: data.emails
      });
      
      results.sequence = sequenceResults.sequence;
      results.templates = sequenceResults.templates;
      results.steps = sequenceResults.steps;
      results.links = sequenceResults.links;
      
      const sequenceId = results.sequence.data.id.toString();
      console.error(`✅ Email sequence created with ID: ${sequenceId}`);

      // Step 2: Bulk create prospects
      console.error(`👥 Creating ${data.prospects.length} prospects...`);
      const prospectResults = await this.bulkCreateProspects(data.prospects, {
        batchSize: 25,
        continueOnError: true
      });
      
      results.prospects = prospectResults;
      results.summary.prospectsCreated = prospectResults.successful.length;
      console.error(`✅ Created ${prospectResults.successful.length}/${data.prospects.length} prospects`);

      // Step 3: Bulk enroll successful prospects
      if (prospectResults.successful.length > 0) {
        console.error(`📬 Enrolling ${prospectResults.successful.length} prospects in sequence...`);
        
        const enrollmentData = prospectResults.successful.map(prospect => ({
          prospectId: prospect.data.id.toString(),
          sequenceId: sequenceId
        }));

        const enrollmentResults = await this.bulkEnrollProspects(enrollmentData);
        results.enrollments = enrollmentResults;
        results.summary.prospectsEnrolled = enrollmentResults.successful.length;
        console.error(`✅ Enrolled ${enrollmentResults.successful.length}/${prospectResults.successful.length} prospects`);
      }

      results.summary.success = true;
      console.error(`🎉 Complete campaign created: ${results.summary.prospectsEnrolled} prospects enrolled in ${data.emails.length}-email sequence`);
      
      return results;

    } catch (error) {
      console.error(`❌ Failed to create complete campaign: ${error.message}`);
      throw new Error(`Failed to create complete campaign: ${error.message}`);
    }
  }

  // Helper method to find sequence by name (used by workflows)
  async findSequence(name) {
    try {
      const params = new URLSearchParams();
      params.append('filter[name]', name);
      
      const response = await this.makeApiCall('GET', `/sequences?${params.toString()}`, null, true);
      return response;
    } catch (error) {
      throw new Error(`Failed to find sequence: ${error.message}`);
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