// src/outreach-client.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class OutreachClient {
  constructor() {
    this.clientId = process.env.OUTREACH_CLIENT_ID;
    this.clientSecret = process.env.OUTREACH_CLIENT_SECRET;
    this.redirectUri = process.env.OUTREACH_REDIRECT_URI || 'http://localhost:3000/callback';
    this.refreshToken = process.env.OUTREACH_REFRESH_TOKEN;
    this.baseURL = process.env.OUTREACH_API_BASE_URL || 'https://api.outreach.io/api/v2';
    this.tokenURL = 'https://api.outreach.io/oauth/token';
    
    this.accessToken = null;
    this.tokenExpiry = null;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    // Add request interceptor to handle authentication
    this.client.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.refreshAccessToken();
          originalRequest.headers['Authorization'] = `Bearer ${this.accessToken}`;
          return this.client(originalRequest);
        }
        
        return Promise.reject(error);
      }
    );
  }

  async ensureValidToken() {
    if (!this.accessToken || this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
  }

  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  async refreshAccessToken() {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      });

      const response = await axios.post(this.tokenURL, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || this.refreshToken;
      // Set expiry time with 5 minute buffer
      this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

      // Optionally save the new refresh token if it changed
      if (response.data.refresh_token && response.data.refresh_token !== this.refreshToken) {
        console.error('New refresh token received:', response.data.refresh_token);
        console.error('Update your OUTREACH_REFRESH_TOKEN in .env file');
      }

      return this.accessToken;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  // Prospect Management
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
      
      const response = await this.client.post('/prospects', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create prospect: ${error.message}`);
    }
  }

  async searchProspects(criteria) {
    try {
      const params = new URLSearchParams();
      
      if (criteria.email) {
        params.append('filter[email]', criteria.email);
      }
      if (criteria.company) {
        params.append('filter[company]', criteria.company);
      }
      if (criteria.tags && criteria.tags.length > 0) {
        params.append('filter[tags]', criteria.tags.join(','));
      }
      if (criteria.limit) {
        params.append('page[limit]', criteria.limit);
      }
      
      const response = await this.client.get(`/prospects?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search prospects: ${error.message}`);
    }
  }

  async updateProspect(prospectId, updates) {
    try {
      const payload = {
        data: {
          type: 'prospect',
          id: prospectId,
          attributes: updates
        }
      };
      
      const response = await this.client.patch(`/prospects/${prospectId}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update prospect: ${error.message}`);
    }
  }

  async tagProspect(prospectId, tags) {
    try {
      // Get current prospect to preserve existing tags
      const prospect = await this.client.get(`/prospects/${prospectId}`);
      const currentTags = prospect.data.data.attributes.tags || [];
      const newTags = [...new Set([...currentTags, ...tags])];
      
      return await this.updateProspect(prospectId, { tags: newTags });
    } catch (error) {
      throw new Error(`Failed to tag prospect: ${error.message}`);
    }
  }

  // Sequence Management
  async getSequences(limit = 25) {
    try {
      const response = await this.client.get(`/sequences?page[limit]=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get sequences: ${error.message}`);
    }
  }

  async findSequence(name) {
    try {
      const response = await this.client.get(`/sequences?filter[name]=${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to find sequence: ${error.message}`);
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
            shareType: sequenceData.shareType || 'shared'  // Default to shared for visibility
          }
        }
      };

      const response = await this.client.post('/sequences', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create sequence: ${error.message}`);
    }
  }

  async createSequenceStep(stepData) {
    try {
      // First get existing steps to determine order
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
            interval: stepData.intervalInDays ? stepData.intervalInDays * 24 * 60 : 0, // Convert days to minutes
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

      const response = await this.client.post('/sequenceSteps', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create sequence step: ${error.message}`);
    }
  }

  async getSequenceSteps(sequenceId) {
    try {
      const response = await this.client.get(`/sequenceSteps?filter[sequence][id]=${sequenceId}&sort=order`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get sequence steps: ${error.message}`);
    }
  }

  // Template Management Methods
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
            shareType: templateData.shareType || 'shared',  // Default to shared for visibility
            archived: false,  // Ensure template is not archived
            trackLinks: templateData.trackLinks !== false,
            trackOpens: templateData.trackOpens !== false
          }
        }
      };

      const response = await this.client.post('/templates', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  async getSequenceTemplates(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('page[limit]', options.limit);
      if (options.search) {
        params.append('filter[name]', `*${options.search}*`);
      }

      const response = await this.client.get(`/templates?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }
  }

  async findSequenceTemplate(name) {
    try {
      const response = await this.client.get(`/templates?filter[name]=${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to find template: ${error.message}`);
    }
  }

  async updateSequenceTemplate(templateId, updates) {
    try {
      const payload = {
        data: {
          type: 'template',
          id: templateId,
          attributes: updates
        }
      };

      const response = await this.client.patch(`/templates/${templateId}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  async linkTemplateToStep(sequenceStepId, templateId) {
    try {
      // Create a sequenceTemplate resource to link template to step
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

      const response = await this.client.post('/sequenceTemplates', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to link template to step: ${error.message}`);
    }
  }

  async getSequenceTemplates() {
    try {
      const response = await this.client.get('/sequenceTemplates');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get sequence templates: ${error.message}`);
    }
  }

  async unlinkTemplateFromStep(sequenceTemplateId) {
    try {
      const response = await this.client.delete(`/sequenceTemplates/${sequenceTemplateId}`);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to unlink template from step: ${error.message}`);
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
      
      const response = await this.client.post('/sequenceStates', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add prospect to sequence: ${error.message}`);
    }
  }

  async removeProspectFromSequence(sequenceStateId) {
    try {
      const payload = {
        data: {
          type: 'sequenceState',
          id: sequenceStateId,
          attributes: {
            state: 'finished'
          }
        }
      };
      
      const response = await this.client.patch(`/sequenceStates/${sequenceStateId}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to remove prospect from sequence: ${error.message}`);
    }
  }

  // Account Management
  async createAccount(data) {
    try {
      const payload = {
        data: {
          type: 'account',
          attributes: {
            name: data.name,
            domain: data.domain,
            industry: data.industry,
            size: data.size,
            customFields: data.customFields || {}
          }
        }
      };
      
      const response = await this.client.post('/accounts', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }

  async searchAccounts(criteria) {
    try {
      const params = new URLSearchParams();
      
      if (criteria.name) {
        params.append('filter[name]', criteria.name);
      }
      if (criteria.domain) {
        params.append('filter[domain]', criteria.domain);
      }
      
      const response = await this.client.get(`/accounts?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search accounts: ${error.message}`);
    }
  }

  // Mailbox Management
  async getMailboxes() {
    try {
      const response = await this.client.get('/mailboxes');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get mailboxes: ${error.message}`);
    }
  }
}

export default OutreachClient;
