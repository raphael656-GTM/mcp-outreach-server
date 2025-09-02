#!/usr/bin/env node

/**
 * Simple Outreach MCP Server - Based on Successful Lemlist Pattern
 * Dual-mode: STDIO for local, HTTP for Railway deployment
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

class OutreachMCPServer {
  constructor() {
    this.server = new Server({
      name: 'outreach-mcp-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  // Create Outreach API client with access token
  createOutreachClient(accessToken) {
    const baseURL = process.env.OUTREACH_API_BASE_URL || 'https://api.outreach.io/api/v2';
    
    return axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      },
      timeout: 30000
    });
  }

  // Get OAuth access token using refresh token
  async getAccessToken(refreshToken) {
    try {
      const clientId = process.env.OUTREACH_CLIENT_ID;
      const clientSecret = process.env.OUTREACH_CLIENT_SECRET;
      
      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('OAuth credentials missing: OUTREACH_CLIENT_ID, OUTREACH_CLIENT_SECRET, and refresh token required');
      }

      const response = await axios.post('https://api.outreach.io/oauth/token', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('OAuth token refresh failed:', error.response?.data || error.message);
      throw new Error(`OAuth authentication failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getToolsList() {
    return {
      tools: [
        // ACCOUNTS
        {
          name: 'list_accounts',
          description: 'List all accounts in Outreach',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of accounts to return', default: 50 },
              name: { type: 'string', description: 'Filter by account name' },
              domain: { type: 'string', description: 'Filter by account domain' }
            }
          }
        },
        {
          name: 'get_account',
          description: 'Get specific account by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Account ID' } },
            required: ['id']
          }
        },
        {
          name: 'create_account',
          description: 'Create a new account',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Account name' },
              domain: { type: 'string', description: 'Account domain' },
              description: { type: 'string', description: 'Account description' }
            },
            required: ['name']
          }
        },
        {
          name: 'update_account',
          description: 'Update an existing account',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Account ID' },
              name: { type: 'string', description: 'Account name' },
              domain: { type: 'string', description: 'Account domain' },
              description: { type: 'string', description: 'Account description' }
            },
            required: ['id']
          }
        },
        
        // AUDIT LOGS
        {
          name: 'list_audit_logs',
          description: 'List audit logs',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of logs to return', default: 50 },
              userId: { type: 'number', description: 'Filter by user ID' }
            }
          }
        },
        
        // BATCHES
        {
          name: 'list_batches',
          description: 'List all batches',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of batches to return', default: 50 }
            }
          }
        },
        {
          name: 'get_batch',
          description: 'Get specific batch by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Batch ID' } },
            required: ['id']
          }
        },
        
        // BATCH ITEMS
        {
          name: 'list_batch_items',
          description: 'List batch items',
          inputSchema: {
            type: 'object',
            properties: {
              batchId: { type: 'number', description: 'Filter by batch ID' },
              limit: { type: 'number', description: 'Number of items to return', default: 50 }
            }
          }
        },
        
        // CALLS
        {
          name: 'list_calls',
          description: 'List all calls',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of calls to return', default: 50 },
              prospectId: { type: 'number', description: 'Filter by prospect ID' }
            }
          }
        },
        {
          name: 'create_call',
          description: 'Create a new call record',
          inputSchema: {
            type: 'object',
            properties: {
              prospectId: { type: 'number', description: 'Prospect ID' },
              note: { type: 'string', description: 'Call notes' },
              outcome: { type: 'string', description: 'Call outcome' }
            },
            required: ['prospectId']
          }
        },
        
        // CONTENT CATEGORIES
        {
          name: 'list_content_categories',
          description: 'List content categories',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of categories to return', default: 50 }
            }
          }
        },
        {
          name: 'create_content_category',
          description: 'Create a content category',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Category name' },
              description: { type: 'string', description: 'Category description' }
            },
            required: ['name']
          }
        },
        
        // CONTENT CATEGORY MEMBERSHIPS
        {
          name: 'list_content_category_memberships',
          description: 'List content category memberships',
          inputSchema: {
            type: 'object',
            properties: {
              categoryId: { type: 'number', description: 'Filter by category ID' },
              limit: { type: 'number', description: 'Number of memberships to return', default: 50 }
            }
          }
        },
        
        // CONTENT CATEGORY OWNERSHIPS
        {
          name: 'list_content_category_ownerships',
          description: 'List content category ownerships',
          inputSchema: {
            type: 'object',
            properties: {
              categoryId: { type: 'number', description: 'Filter by category ID' },
              limit: { type: 'number', description: 'Number of ownerships to return', default: 50 }
            }
          }
        },
        
        // CURRENCY TYPES
        {
          name: 'list_currency_types',
          description: 'List currency types',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of currency types to return', default: 50 }
            }
          }
        },
        
        // CUSTOM OBJECT RECORDS
        {
          name: 'list_custom_object_records',
          description: 'List custom object records',
          inputSchema: {
            type: 'object',
            properties: {
              objectType: { type: 'string', description: 'Custom object type' },
              limit: { type: 'number', description: 'Number of records to return', default: 50 }
            }
          }
        },
        
        // DATED CONVERSION RATES
        {
          name: 'list_dated_conversion_rates',
          description: 'List dated conversion rates',
          inputSchema: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Filter by date (YYYY-MM-DD)' },
              limit: { type: 'number', description: 'Number of rates to return', default: 50 }
            }
          }
        },
        
        // EMAIL ADDRESSES
        {
          name: 'list_email_addresses',
          description: 'List email addresses',
          inputSchema: {
            type: 'object',
            properties: {
              prospectId: { type: 'number', description: 'Filter by prospect ID' },
              limit: { type: 'number', description: 'Number of email addresses to return', default: 50 }
            }
          }
        },
        {
          name: 'create_email_address',
          description: 'Create an email address',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Email address' },
              prospectId: { type: 'number', description: 'Associated prospect ID' }
            },
            required: ['email', 'prospectId']
          }
        },
        
        // FAVORITES
        {
          name: 'list_favorites',
          description: 'List user favorites',
          inputSchema: {
            type: 'object',
            properties: {
              resourceType: { type: 'string', description: 'Type of favorited resource' },
              limit: { type: 'number', description: 'Number of favorites to return', default: 50 }
            }
          }
        },
        
        // JOB ROLES
        {
          name: 'list_job_roles',
          description: 'List job roles',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of job roles to return', default: 50 }
            }
          }
        },
        
        // MAILBOXES
        {
          name: 'list_mailboxes',
          description: 'List mailboxes',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'number', description: 'Filter by user ID' },
              limit: { type: 'number', description: 'Number of mailboxes to return', default: 50 }
            }
          }
        },
        {
          name: 'get_mailbox',
          description: 'Get specific mailbox by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Mailbox ID' } },
            required: ['id']
          }
        },
        
        // MAILINGS
        {
          name: 'list_mailings',
          description: 'List mailings',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'Filter by sequence ID' },
              limit: { type: 'number', description: 'Number of mailings to return', default: 50 }
            }
          }
        },
        {
          name: 'get_mailing',
          description: 'Get specific mailing by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Mailing ID' } },
            required: ['id']
          }
        },
        
        // MAIL ALIASES
        {
          name: 'list_mail_aliases',
          description: 'List mail aliases',
          inputSchema: {
            type: 'object',
            properties: {
              mailboxId: { type: 'number', description: 'Filter by mailbox ID' },
              limit: { type: 'number', description: 'Number of aliases to return', default: 50 }
            }
          }
        },
        
        // OPPORTUNITIES
        {
          name: 'list_opportunities',
          description: 'List opportunities',
          inputSchema: {
            type: 'object',
            properties: {
              accountId: { type: 'number', description: 'Filter by account ID' },
              limit: { type: 'number', description: 'Number of opportunities to return', default: 50 }
            }
          }
        },
        {
          name: 'get_opportunity',
          description: 'Get specific opportunity by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Opportunity ID' } },
            required: ['id']
          }
        },
        {
          name: 'create_opportunity',
          description: 'Create a new opportunity',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Opportunity name' },
              accountId: { type: 'number', description: 'Associated account ID' },
              amount: { type: 'number', description: 'Opportunity amount' },
              stageId: { type: 'number', description: 'Stage ID' }
            },
            required: ['name', 'accountId']
          }
        },
        
        // OPPORTUNITY PROSPECT ROLES
        {
          name: 'list_opportunity_prospect_roles',
          description: 'List opportunity prospect roles',
          inputSchema: {
            type: 'object',
            properties: {
              opportunityId: { type: 'number', description: 'Filter by opportunity ID' },
              limit: { type: 'number', description: 'Number of roles to return', default: 50 }
            }
          }
        },
        
        // OPPORTUNITY STAGES
        {
          name: 'list_opportunity_stages',
          description: 'List opportunity stages',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of stages to return', default: 50 }
            }
          }
        },
        
        // PERSONAS
        {
          name: 'list_personas',
          description: 'List personas',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of personas to return', default: 50 }
            }
          }
        },
        {
          name: 'create_persona',
          description: 'Create a new persona',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Persona name' },
              description: { type: 'string', description: 'Persona description' }
            },
            required: ['name']
          }
        },
        
        // PHONE NUMBERS
        {
          name: 'list_phone_numbers',
          description: 'List phone numbers',
          inputSchema: {
            type: 'object',
            properties: {
              prospectId: { type: 'number', description: 'Filter by prospect ID' },
              limit: { type: 'number', description: 'Number of phone numbers to return', default: 50 }
            }
          }
        },
        {
          name: 'create_phone_number',
          description: 'Create a phone number',
          inputSchema: {
            type: 'object',
            properties: {
              number: { type: 'string', description: 'Phone number' },
              prospectId: { type: 'number', description: 'Associated prospect ID' }
            },
            required: ['number', 'prospectId']
          }
        },
        
        // PROSPECTS
        {
          name: 'list_prospects',
          description: 'List all prospects',
          inputSchema: {
            type: 'object',
            properties: {
              accountId: { type: 'number', description: 'Filter by account ID' },
              limit: { type: 'number', description: 'Number of prospects to return', default: 50 }
            }
          }
        },
        {
          name: 'get_prospect',
          description: 'Get specific prospect by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Prospect ID' } },
            required: ['id']
          }
        },
        {
          name: 'create_prospect',
          description: 'Create a new prospect',
          inputSchema: {
            type: 'object',
            properties: {
              firstName: { type: 'string', description: 'First name' },
              lastName: { type: 'string', description: 'Last name' },
              email: { type: 'string', description: 'Email address' },
              company: { type: 'string', description: 'Company name' },
              title: { type: 'string', description: 'Job title' }
            },
            required: ['firstName', 'lastName', 'email']
          }
        },
        {
          name: 'update_prospect',
          description: 'Update an existing prospect',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Prospect ID' },
              firstName: { type: 'string', description: 'First name' },
              lastName: { type: 'string', description: 'Last name' },
              email: { type: 'string', description: 'Email address' },
              company: { type: 'string', description: 'Company name' },
              title: { type: 'string', description: 'Job title' }
            },
            required: ['id']
          }
        },
        {
          name: 'search_prospects',
          description: 'Search for prospects',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Email to search for' },
              company: { type: 'string', description: 'Company name to search for' },
              limit: { type: 'number', description: 'Number of prospects to return', default: 25 }
            }
          }
        },
        
        // SEQUENCES
        {
          name: 'list_sequences',
          description: 'List all sequences in Outreach',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of sequences to return', default: 50 }
            }
          }
        },
        {
          name: 'get_sequence',
          description: 'Get specific sequence by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Sequence ID' } },
            required: ['id']
          }
        },
        {
          name: 'create_sequence',
          description: 'Create a new sequence in Outreach with email templates',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the sequence' },
              description: { type: 'string', description: 'Description of the sequence' },
              emailSteps: {
                type: 'array',
                description: 'Array of email steps with template content',
                items: {
                  type: 'object',
                  properties: {
                    templateName: { type: 'string', description: 'Name for the email template' },
                    subject: { type: 'string', description: 'Email subject line' },
                    bodyText: { type: 'string', description: 'Email body text' },
                    bodyHtml: { type: 'string', description: 'Email body HTML (optional)' },
                    order: { type: 'number', description: 'Step order in sequence' },
                    intervalDays: { type: 'number', description: 'Days to wait before this step', default: 3 }
                  },
                  required: ['templateName', 'subject', 'bodyText', 'order']
                }
              }
            },
            required: ['name']
          }
        },
        {
          name: 'update_sequence',
          description: 'Update an existing sequence',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Sequence ID' },
              name: { type: 'string', description: 'Name of the sequence' },
              description: { type: 'string', description: 'Description of the sequence' },
              enabled: { type: 'boolean', description: 'Whether sequence is enabled' }
            },
            required: ['id']
          }
        },
        {
          name: 'delete_sequence',
          description: 'Delete a sequence',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Sequence ID' } },
            required: ['id']
          }
        },
        
        // SEQUENCE STATES
        {
          name: 'list_sequence_states',
          description: 'List sequence states',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'Filter by sequence ID' },
              prospectId: { type: 'number', description: 'Filter by prospect ID' },
              limit: { type: 'number', description: 'Number of states to return', default: 50 }
            }
          }
        },
        {
          name: 'create_sequence_state',
          description: 'Add prospect to sequence',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'Sequence ID' },
              prospectId: { type: 'number', description: 'Prospect ID' },
              mailboxId: { type: 'number', description: 'Mailbox ID to use for sending' }
            },
            required: ['sequenceId', 'prospectId']
          }
        },
        
        // SEQUENCE STEPS
        {
          name: 'list_sequence_steps',
          description: 'List sequence steps',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'Filter by sequence ID' },
              limit: { type: 'number', description: 'Number of steps to return', default: 50 }
            }
          }
        },
        {
          name: 'create_sequence_step',
          description: 'Create a sequence step',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'Sequence ID' },
              order: { type: 'number', description: 'Step order in sequence' },
              stepType: { type: 'string', description: 'Step type (email, call, task, etc.)' },
              interval: { type: 'number', description: 'Days to wait before step', default: 1 },
              subject: { type: 'string', description: 'Email subject (for email steps)' },
              body: { type: 'string', description: 'Step content' }
            },
            required: ['sequenceId', 'order', 'stepType']
          }
        },
        {
          name: 'update_sequence_step',
          description: 'Update a sequence step',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Step ID' },
              subject: { type: 'string', description: 'Email subject' },
              body: { type: 'string', description: 'Step content' },
              interval: { type: 'number', description: 'Days to wait before step' }
            },
            required: ['id']
          }
        },
        {
          name: 'delete_sequence_step',
          description: 'Delete a sequence step',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Step ID' } },
            required: ['id']
          }
        },
        
        // SEQUENCE TEMPLATES
        {
          name: 'list_sequence_templates',
          description: 'List sequence templates',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of templates to return', default: 50 }
            }
          }
        },
        {
          name: 'create_sequence_template',
          description: 'Link a template to a sequence step',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceStepId: { type: 'number', description: 'Sequence step ID' },
              templateId: { type: 'number', description: 'Template ID to link' }
            },
            required: ['sequenceStepId', 'templateId']
          }
        },
        
        // SNIPPETS
        {
          name: 'list_snippets',
          description: 'List snippets',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of snippets to return', default: 50 }
            }
          }
        },
        {
          name: 'create_snippet',
          description: 'Create a snippet',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Snippet name' },
              bodyText: { type: 'string', description: 'Snippet content' },
              shortcode: { type: 'string', description: 'Snippet shortcode' }
            },
            required: ['name', 'bodyText']
          }
        },
        
        // STAGES
        {
          name: 'list_stages',
          description: 'List stages',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of stages to return', default: 50 }
            }
          }
        },
        
        // TASKS
        {
          name: 'list_tasks',
          description: 'List tasks',
          inputSchema: {
            type: 'object',
            properties: {
              prospectId: { type: 'number', description: 'Filter by prospect ID' },
              completed: { type: 'boolean', description: 'Filter by completion status' },
              limit: { type: 'number', description: 'Number of tasks to return', default: 50 }
            }
          }
        },
        {
          name: 'create_task',
          description: 'Create a new task',
          inputSchema: {
            type: 'object',
            properties: {
              subject: { type: 'string', description: 'Task subject/description' },
              note: { type: 'string', description: 'Additional task notes' },
              dueAt: { type: 'string', description: 'Due date (ISO 8601)' },
              taskType: { type: 'string', description: 'Type of task', default: 'manual' }
            },
            required: ['subject']
          }
        },
        {
          name: 'update_task',
          description: 'Update a task',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Task ID' },
              subject: { type: 'string', description: 'Task subject' },
              note: { type: 'string', description: 'Task notes' },
              completed: { type: 'boolean', description: 'Task completion status' }
            },
            required: ['id']
          }
        },
        
        // TASK DISPOSITIONS
        {
          name: 'list_task_dispositions',
          description: 'List task dispositions',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of dispositions to return', default: 50 }
            }
          }
        },
        
        // TASK PURPOSES
        {
          name: 'list_task_purposes',
          description: 'List task purposes',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of purposes to return', default: 50 }
            }
          }
        },
        
        // TEMPLATES
        {
          name: 'list_templates',
          description: 'List email templates',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of templates to return', default: 50 }
            }
          }
        },
        {
          name: 'get_template',
          description: 'Get specific template by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'Template ID' } },
            required: ['id']
          }
        },
        {
          name: 'create_template',
          description: 'Create a new template',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Template name' },
              subject: { type: 'string', description: 'Email subject' },
              bodyText: { type: 'string', description: 'Plain text content (will be converted to HTML if bodyHtml not provided)' },
              bodyHtml: { type: 'string', description: 'HTML email content (optional, will auto-generate bodyText)' }
            },
            required: ['name', 'subject']
          }
        },
        {
          name: 'create_sequence_with_email_templates',
          description: 'Create a complete sequence with multiple email templates (recommended for email campaigns)',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceName: { type: 'string', description: 'Name of the sequence' },
              sequenceDescription: { type: 'string', description: 'Description of the sequence' },
              emailTemplates: {
                type: 'array',
                description: 'Array of email templates to create and link to sequence steps',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Template name (e.g., "Follow-up Email 1")' },
                    subject: { type: 'string', description: 'Email subject line' },
                    bodyText: { type: 'string', description: 'Plain text email body' },
                    bodyHtml: { type: 'string', description: 'HTML email body (optional)' },
                    stepOrder: { type: 'number', description: 'Order of this step in sequence (1, 2, 3...)' },
                    delayDays: { type: 'number', description: 'Days to wait before sending this email', default: 3 }
                  },
                  required: ['name', 'subject', 'bodyText', 'stepOrder']
                }
              }
            },
            required: ['sequenceName', 'emailTemplates']
          }
        },
        {
          name: 'create_sequence_manual_setup',
          description: 'Create sequence with manual template linking instructions (workaround for OAuth scope limitations)',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceName: { type: 'string', description: 'Name of the sequence' },
              sequenceDescription: { type: 'string', description: 'Description of the sequence' },
              emailTemplates: {
                type: 'array',
                description: 'Array of email templates to create',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Template name' },
                    subject: { type: 'string', description: 'Email subject line' },
                    bodyText: { type: 'string', description: 'Plain text email body' },
                    bodyHtml: { type: 'string', description: 'HTML email body (optional)' },
                    stepOrder: { type: 'number', description: 'Order of this step in sequence (1, 2, 3...)' },
                    delayDays: { type: 'number', description: 'Days to wait before sending this email', default: 3 }
                  },
                  required: ['name', 'subject', 'bodyText', 'stepOrder']
                }
              }
            },
            required: ['sequenceName', 'emailTemplates']
          }
        },
        
        // USERS
        {
          name: 'list_users',
          description: 'List users',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of users to return', default: 50 }
            }
          }
        },
        {
          name: 'get_user',
          description: 'Get specific user by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'number', description: 'User ID' } },
            required: ['id']
          }
        },
        {
          name: 'get_current_user',
          description: 'Get current authenticated user info',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  }

  async callTool(params, outreachClient) {
    const { name, arguments: args = {} } = params;

    try {
      switch (name) {
        // ACCOUNTS
        case 'list_accounts': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.name) params_obj['filter[name]'] = args.name;
          if (args.domain) params_obj['filter[domain]'] = args.domain;
          const response = await outreachClient.get('/accounts', { params: params_obj });
          return this.formatResponse('accounts', response.data.data);
        }
        case 'get_account': {
          const response = await outreachClient.get(`/accounts/${args.id}`);
          return this.formatResponse('account', response.data.data);
        }
        case 'create_account': {
          const response = await outreachClient.post('/accounts', {
            data: { type: 'account', attributes: { name: args.name, domain: args.domain, description: args.description } }
          });
          return this.formatResponse('account', response.data.data, true);
        }
        case 'update_account': {
          const response = await outreachClient.patch(`/accounts/${args.id}`, {
            data: { type: 'account', id: args.id.toString(), attributes: { name: args.name, domain: args.domain, description: args.description } }
          });
          return this.formatResponse('account', response.data.data, true);
        }
        
        // AUDIT LOGS
        case 'list_audit_logs': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.userId) params_obj['filter[user][id]'] = args.userId;
          const response = await outreachClient.get('/auditLogs', { params: params_obj });
          return this.formatResponse('auditLogs', response.data.data);
        }
        
        // BATCHES
        case 'list_batches': {
          const response = await outreachClient.get('/batches', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('batches', response.data.data);
        }
        case 'get_batch': {
          const response = await outreachClient.get(`/batches/${args.id}`);
          return this.formatResponse('batch', response.data.data);
        }
        
        // BATCH ITEMS
        case 'list_batch_items': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.batchId) params_obj['filter[batch][id]'] = args.batchId;
          const response = await outreachClient.get('/batchItems', { params: params_obj });
          return this.formatResponse('batchItems', response.data.data);
        }
        
        // CALLS
        case 'list_calls': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.prospectId) params_obj['filter[prospect][id]'] = args.prospectId;
          const response = await outreachClient.get('/calls', { params: params_obj });
          return this.formatResponse('calls', response.data.data);
        }
        case 'create_call': {
          const response = await outreachClient.post('/calls', {
            data: {
              type: 'call',
              attributes: { note: args.note, outcome: args.outcome },
              relationships: { prospect: { data: { type: 'prospect', id: args.prospectId.toString() } } }
            }
          });
          return this.formatResponse('call', response.data.data, true);
        }
        
        // CONTENT CATEGORIES
        case 'list_content_categories': {
          const response = await outreachClient.get('/contentCategories', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('contentCategories', response.data.data);
        }
        case 'create_content_category': {
          const response = await outreachClient.post('/contentCategories', {
            data: { type: 'contentCategory', attributes: { name: args.name, description: args.description } }
          });
          return this.formatResponse('contentCategory', response.data.data, true);
        }
        
        // CONTENT CATEGORY MEMBERSHIPS
        case 'list_content_category_memberships': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.categoryId) params_obj['filter[contentCategory][id]'] = args.categoryId;
          const response = await outreachClient.get('/contentCategoryMemberships', { params: params_obj });
          return this.formatResponse('contentCategoryMemberships', response.data.data);
        }
        
        // CONTENT CATEGORY OWNERSHIPS
        case 'list_content_category_ownerships': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.categoryId) params_obj['filter[contentCategory][id]'] = args.categoryId;
          const response = await outreachClient.get('/contentCategoryOwnerships', { params: params_obj });
          return this.formatResponse('contentCategoryOwnerships', response.data.data);
        }
        
        // CURRENCY TYPES
        case 'list_currency_types': {
          const response = await outreachClient.get('/currencyTypes', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('currencyTypes', response.data.data);
        }
        
        // CUSTOM OBJECT RECORDS
        case 'list_custom_object_records': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.objectType) params_obj['filter[objectType]'] = args.objectType;
          const response = await outreachClient.get('/customObjectRecords', { params: params_obj });
          return this.formatResponse('customObjectRecords', response.data.data);
        }
        
        // DATED CONVERSION RATES
        case 'list_dated_conversion_rates': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.date) params_obj['filter[date]'] = args.date;
          const response = await outreachClient.get('/datedConversionRates', { params: params_obj });
          return this.formatResponse('datedConversionRates', response.data.data);
        }
        
        // EMAIL ADDRESSES
        case 'list_email_addresses': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.prospectId) params_obj['filter[prospect][id]'] = args.prospectId;
          const response = await outreachClient.get('/emailAddresses', { params: params_obj });
          return this.formatResponse('emailAddresses', response.data.data);
        }
        case 'create_email_address': {
          const response = await outreachClient.post('/emailAddresses', {
            data: {
              type: 'emailAddress',
              attributes: { email: args.email },
              relationships: { prospect: { data: { type: 'prospect', id: args.prospectId.toString() } } }
            }
          });
          return this.formatResponse('emailAddress', response.data.data, true);
        }
        
        // FAVORITES
        case 'list_favorites': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.resourceType) params_obj['filter[resourceType]'] = args.resourceType;
          const response = await outreachClient.get('/favorites', { params: params_obj });
          return this.formatResponse('favorites', response.data.data);
        }
        
        // JOB ROLES
        case 'list_job_roles': {
          const response = await outreachClient.get('/jobRoles', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('jobRoles', response.data.data);
        }
        
        // MAILBOXES
        case 'list_mailboxes': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.userId) params_obj['filter[user][id]'] = args.userId;
          const response = await outreachClient.get('/mailboxes', { params: params_obj });
          return this.formatResponse('mailboxes', response.data.data);
        }
        case 'get_mailbox': {
          const response = await outreachClient.get(`/mailboxes/${args.id}`);
          return this.formatResponse('mailbox', response.data.data);
        }
        
        // MAILINGS
        case 'list_mailings': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.sequenceId) params_obj['filter[sequence][id]'] = args.sequenceId;
          const response = await outreachClient.get('/mailings', { params: params_obj });
          return this.formatResponse('mailings', response.data.data);
        }
        case 'get_mailing': {
          const response = await outreachClient.get(`/mailings/${args.id}`);
          return this.formatResponse('mailing', response.data.data);
        }
        
        // MAIL ALIASES
        case 'list_mail_aliases': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.mailboxId) params_obj['filter[mailbox][id]'] = args.mailboxId;
          const response = await outreachClient.get('/mailAliases', { params: params_obj });
          return this.formatResponse('mailAliases', response.data.data);
        }
        
        // OPPORTUNITIES
        case 'list_opportunities': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.accountId) params_obj['filter[account][id]'] = args.accountId;
          const response = await outreachClient.get('/opportunities', { params: params_obj });
          return this.formatResponse('opportunities', response.data.data);
        }
        case 'get_opportunity': {
          const response = await outreachClient.get(`/opportunities/${args.id}`);
          return this.formatResponse('opportunity', response.data.data);
        }
        case 'create_opportunity': {
          const response = await outreachClient.post('/opportunities', {
            data: {
              type: 'opportunity',
              attributes: { name: args.name, amount: args.amount },
              relationships: {
                account: { data: { type: 'account', id: args.accountId.toString() } },
                ...(args.stageId && { stage: { data: { type: 'stage', id: args.stageId.toString() } } })
              }
            }
          });
          return this.formatResponse('opportunity', response.data.data, true);
        }
        
        // OPPORTUNITY PROSPECT ROLES
        case 'list_opportunity_prospect_roles': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.opportunityId) params_obj['filter[opportunity][id]'] = args.opportunityId;
          const response = await outreachClient.get('/opportunityProspectRoles', { params: params_obj });
          return this.formatResponse('opportunityProspectRoles', response.data.data);
        }
        
        // OPPORTUNITY STAGES
        case 'list_opportunity_stages': {
          const response = await outreachClient.get('/opportunityStages', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('opportunityStages', response.data.data);
        }
        
        // PERSONAS
        case 'list_personas': {
          const response = await outreachClient.get('/personas', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('personas', response.data.data);
        }
        case 'create_persona': {
          const response = await outreachClient.post('/personas', {
            data: { type: 'persona', attributes: { name: args.name, description: args.description } }
          });
          return this.formatResponse('persona', response.data.data, true);
        }
        
        // PHONE NUMBERS
        case 'list_phone_numbers': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.prospectId) params_obj['filter[prospect][id]'] = args.prospectId;
          const response = await outreachClient.get('/phoneNumbers', { params: params_obj });
          return this.formatResponse('phoneNumbers', response.data.data);
        }
        case 'create_phone_number': {
          const response = await outreachClient.post('/phoneNumbers', {
            data: {
              type: 'phoneNumber',
              attributes: { number: args.number },
              relationships: { prospect: { data: { type: 'prospect', id: args.prospectId.toString() } } }
            }
          });
          return this.formatResponse('phoneNumber', response.data.data, true);
        }
        
        // PROSPECTS
        case 'list_prospects': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.accountId) params_obj['filter[account][id]'] = args.accountId;
          const response = await outreachClient.get('/prospects', { params: params_obj });
          return this.formatResponse('prospects', response.data.data);
        }
        case 'get_prospect': {
          const response = await outreachClient.get(`/prospects/${args.id}`);
          return this.formatResponse('prospect', response.data.data);
        }
        case 'create_prospect': {
          const response = await outreachClient.post('/prospects', {
            data: {
              type: 'prospect',
              attributes: {
                firstName: args.firstName,
                lastName: args.lastName,
                email: args.email,
                company: args.company,
                title: args.title
              }
            }
          });
          return this.formatResponse('prospect', response.data.data, true);
        }
        case 'update_prospect': {
          const attributes = {};
          if (args.firstName) attributes.firstName = args.firstName;
          if (args.lastName) attributes.lastName = args.lastName;
          if (args.email) attributes.email = args.email;
          if (args.company) attributes.company = args.company;
          if (args.title) attributes.title = args.title;
          
          const response = await outreachClient.patch(`/prospects/${args.id}`, {
            data: { type: 'prospect', id: args.id.toString(), attributes }
          });
          return this.formatResponse('prospect', response.data.data, true);
        }
        case 'search_prospects': {
          const params_obj = { 'page[size]': args.limit || 25 };
          if (args.email) params_obj['filter[emails]'] = args.email;
          if (args.company) params_obj['filter[company]'] = args.company;
          const response = await outreachClient.get('/prospects', { params: params_obj });
          return this.formatResponse('prospects', response.data.data);
        }
        
        // SEQUENCES
        case 'list_sequences': {
          const response = await outreachClient.get('/sequences', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('sequences', response.data.data);
        }
        case 'get_sequence': {
          const response = await outreachClient.get(`/sequences/${args.id}`);
          return this.formatResponse('sequence', response.data.data);
        }
        case 'create_sequence': {
          // Enhanced sequence creation with template-first workflow
          const createdTemplates = [];
          let sequence = null;

          try {
            // 1. Create email templates first (if provided)
            if (args.emailSteps && args.emailSteps.length > 0) {
              for (const emailStep of args.emailSteps) {
                const templateResponse = await outreachClient.post('/templates', {
                  data: {
                    type: 'template',
                    attributes: {
                      name: emailStep.templateName,
                      subject: emailStep.subject,
                      bodyHtml: emailStep.bodyHtml || this.formatEmailBody(emailStep.bodyText)
                    }
                  }
                });
                createdTemplates.push({
                  template: templateResponse.data.data,
                  order: emailStep.order,
                  intervalDays: emailStep.intervalDays ?? 3,
                  intervalMinutes: (emailStep.intervalDays ?? 3) * 1440  // 1440 minutes = 1 day (24 * 60), ?? handles 0 correctly
                });
              }
            }

            // 2. Create sequence structure
            const sequenceResponse = await outreachClient.post('/sequences', {
              data: {
                type: 'sequence',
                attributes: {
                  name: args.name,
                  description: args.description || '',
                  shareType: 'private'
                }
              }
            });
            sequence = sequenceResponse.data.data;

            // 3. Create sequence steps and link templates
            if (createdTemplates.length > 0) {
              for (const templateData of createdTemplates) {
                // Create the sequence step
                const stepResponse = await outreachClient.post('/sequenceSteps', {
                  data: {
                    type: 'sequenceStep',
                    attributes: {
                      order: templateData.order,
                      stepType: 'auto_email',
                      interval: templateData.intervalMinutes  // Using minutes as required by Outreach API
                    },
                    relationships: {
                      sequence: { data: { type: 'sequence', id: sequence.id } }
                    }
                  }
                });

                // Link the template to the step using sequenceTemplate
                await outreachClient.post('/sequenceTemplates', {
                  data: {
                    type: 'sequenceTemplate',
                    relationships: {
                      sequenceStep: { data: { type: 'sequenceStep', id: stepResponse.data.data.id } },
                      template: { data: { type: 'template', id: templateData.template.id } }
                    }
                  }
                });
              }
            }

            return this.formatResponse('sequence', {
              sequence: sequence,
              templates: createdTemplates.map(t => t.template),
              success: true,
              message: `Sequence created with ${createdTemplates.length} email templates`,
              sequenceUrl: `https://web.outreach.io/sequences/${sequence.id}/overview`
            }, true);

          } catch (error) {
            // Rollback: delete any created templates if sequence creation fails
            for (const templateData of createdTemplates) {
              try {
                await outreachClient.delete(`/templates/${templateData.template.id}`);
              } catch (rollbackError) {
                console.error('Template rollback failed:', rollbackError);
              }
            }
            throw error;
          }
        }
        case 'update_sequence': {
          const attributes = {};
          if (args.name) attributes.name = args.name;
          if (args.description) attributes.description = args.description;
          if (args.enabled !== undefined) attributes.enabled = args.enabled;
          
          const response = await outreachClient.patch(`/sequences/${args.id}`, {
            data: { type: 'sequence', id: args.id.toString(), attributes }
          });
          return this.formatResponse('sequence', response.data.data, true);
        }
        case 'delete_sequence': {
          await outreachClient.delete(`/sequences/${args.id}`);
          return this.formatResponse('deleted', { id: args.id, type: 'sequence' }, true);
        }
        
        // SEQUENCE STATES
        case 'list_sequence_states': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.sequenceId) params_obj['filter[sequence][id]'] = args.sequenceId;
          if (args.prospectId) params_obj['filter[prospect][id]'] = args.prospectId;
          const response = await outreachClient.get('/sequenceStates', { params: params_obj });
          return this.formatResponse('sequenceStates', response.data.data);
        }
        case 'create_sequence_state': {
          const response = await outreachClient.post('/sequenceStates', {
            data: {
              type: 'sequenceState',
              relationships: {
                sequence: { data: { type: 'sequence', id: args.sequenceId.toString() } },
                prospect: { data: { type: 'prospect', id: args.prospectId.toString() } },
                ...(args.mailboxId && { mailbox: { data: { type: 'mailbox', id: args.mailboxId.toString() } } })
              }
            }
          });
          return this.formatResponse('sequenceState', response.data.data, true);
        }
        
        // SEQUENCE STEPS
        case 'list_sequence_steps': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.sequenceId) params_obj['filter[sequence][id]'] = args.sequenceId;
          const response = await outreachClient.get('/sequenceSteps', { params: params_obj });
          return this.formatResponse('sequenceSteps', response.data.data);
        }
        case 'create_sequence_step': {
          const response = await outreachClient.post('/sequenceSteps', {
            data: {
              type: 'sequenceStep',
              attributes: {
                order: args.order,
                stepType: args.stepType,
                interval: args.interval || 1,
                subject: args.subject,
                body: args.body
              },
              relationships: {
                sequence: { data: { type: 'sequence', id: args.sequenceId.toString() } }
              }
            }
          });
          return this.formatResponse('sequenceStep', response.data.data, true);
        }
        case 'update_sequence_step': {
          const attributes = {};
          if (args.subject) attributes.subject = args.subject;
          if (args.body) attributes.body = args.body;
          if (args.interval) attributes.interval = args.interval;
          
          const response = await outreachClient.patch(`/sequenceSteps/${args.id}`, {
            data: { type: 'sequenceStep', id: args.id.toString(), attributes }
          });
          return this.formatResponse('sequenceStep', response.data.data, true);
        }
        case 'delete_sequence_step': {
          await outreachClient.delete(`/sequenceSteps/${args.id}`);
          return this.formatResponse('deleted', { id: args.id, type: 'sequenceStep' }, true);
        }
        
        // SEQUENCE TEMPLATES
        case 'list_sequence_templates': {
          const response = await outreachClient.get('/sequenceTemplates', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('sequenceTemplates', response.data.data);
        }
        case 'create_sequence_template': {
          const response = await outreachClient.post('/sequenceTemplates', {
            data: {
              type: 'sequenceTemplate',
              relationships: {
                sequenceStep: { data: { type: 'sequenceStep', id: args.sequenceStepId.toString() } },
                template: { data: { type: 'template', id: args.templateId.toString() } }
              }
            }
          });
          return this.formatResponse('sequenceTemplate', response.data.data, true);
        }
        
        // SNIPPETS
        case 'list_snippets': {
          const response = await outreachClient.get('/snippets', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('snippets', response.data.data);
        }
        case 'create_snippet': {
          const response = await outreachClient.post('/snippets', {
            data: {
              type: 'snippet',
              attributes: {
                name: args.name,
                bodyText: args.bodyText,
                shortcode: args.shortcode
              }
            }
          });
          return this.formatResponse('snippet', response.data.data, true);
        }
        
        // STAGES
        case 'list_stages': {
          const response = await outreachClient.get('/stages', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('stages', response.data.data);
        }
        
        // TASKS
        case 'list_tasks': {
          const params_obj = { 'page[size]': args.limit || 50 };
          if (args.prospectId) params_obj['filter[prospect][id]'] = args.prospectId;
          if (args.completed !== undefined) params_obj['filter[completed]'] = args.completed;
          const response = await outreachClient.get('/tasks', { params: params_obj });
          return this.formatResponse('tasks', response.data.data);
        }
        case 'create_task': {
          const response = await outreachClient.post('/tasks', {
            data: {
              type: 'task',
              attributes: {
                note: args.subject + (args.note ? '\n\n' + args.note : ''),
                dueAt: args.dueAt,
                taskType: args.taskType || 'manual'
              }
            }
          });
          return this.formatResponse('task', response.data.data, true);
        }
        case 'update_task': {
          const attributes = {};
          if (args.subject) attributes.subject = args.subject;
          if (args.note) attributes.note = args.note;
          if (args.completed !== undefined) attributes.completed = args.completed;
          
          const response = await outreachClient.patch(`/tasks/${args.id}`, {
            data: { type: 'task', id: args.id.toString(), attributes }
          });
          return this.formatResponse('task', response.data.data, true);
        }
        
        // TASK DISPOSITIONS
        case 'list_task_dispositions': {
          const response = await outreachClient.get('/taskDispositions', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('taskDispositions', response.data.data);
        }
        
        // TASK PURPOSES
        case 'list_task_purposes': {
          const response = await outreachClient.get('/taskPurposes', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('taskPurposes', response.data.data);
        }
        
        // TEMPLATES
        case 'list_templates': {
          const response = await outreachClient.get('/templates', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('templates', response.data.data);
        }
        case 'get_template': {
          const response = await outreachClient.get(`/templates/${args.id}`);
          return this.formatResponse('template', response.data.data);
        }
        case 'create_template': {
          const response = await outreachClient.post('/templates', {
            data: {
              type: 'template',
              attributes: {
                name: args.name,
                subject: args.subject,
                bodyHtml: args.bodyHtml || args.bodyText
              }
            }
          });
          return this.formatResponse('template', response.data.data, true);
        }
        
        // USERS
        case 'list_users': {
          const response = await outreachClient.get('/users', { params: { 'page[size]': args.limit || 50 } });
          return this.formatResponse('users', response.data.data);
        }
        case 'get_user': {
          const response = await outreachClient.get(`/users/${args.id}`);
          return this.formatResponse('user', response.data.data);
        }
        case 'get_current_user': {
          const response = await outreachClient.get('/users/me');
          return this.formatResponse('currentUser', response.data.data);
        }

        case 'create_sequence_manual_setup': {
          // Workaround for OAuth scope limitations - creates all components but provides manual linking instructions
          const createdTemplates = [];
          let sequence = null;
          const createdSteps = [];

          try {
            // 1. Create all email templates
            for (const emailTemplate of args.emailTemplates) {
              const templateResponse = await outreachClient.post('/templates', {
                data: {
                  type: 'template',
                  attributes: {
                    name: emailTemplate.name,
                    subject: emailTemplate.subject,
                    bodyHtml: emailTemplate.bodyHtml || emailTemplate.bodyText
                  }
                }
              });
              
              createdTemplates.push({
                template: templateResponse.data.data,
                stepOrder: emailTemplate.stepOrder,
                delayDays: emailTemplate.delayDays ?? 3
              });
            }

            // 2. Create sequence
            const sequenceResponse = await outreachClient.post('/sequences', {
              data: {
                type: 'sequence',
                attributes: {
                  name: args.sequenceName,
                  description: args.sequenceDescription || `Email sequence with ${createdTemplates.length} steps`,
                  shareType: 'private'
                }
              }
            });
            sequence = sequenceResponse.data.data;

            // 3. Create sequence steps (without template linking due to OAuth scope limitation)
            for (const templateData of createdTemplates.sort((a, b) => a.stepOrder - b.stepOrder)) {
              const stepResponse = await outreachClient.post('/sequenceSteps', {
                data: {
                  type: 'sequenceStep',
                  attributes: {
                    order: templateData.stepOrder,
                    stepType: 'auto_email',
                    interval: templateData.delayDays * 24 * 60  // Convert days to minutes for Outreach API
                  },
                  relationships: {
                    sequence: { data: { type: 'sequence', id: sequence.id } }
                  }
                }
              });
              createdSteps.push({
                step: stepResponse.data.data,
                template: templateData.template
              });
            }

            // Return success with manual instructions
            return this.formatResponse('sequenceManualSetup', {
              success: true,
              sequence: sequence,
              templates: createdTemplates.map(t => t.template),
              steps: createdSteps.map(s => s.step),
              message: 'Sequence and templates created successfully. Manual template linking required due to OAuth scope limitations.',
              manualInstructions: {
                summary: `Created sequence "${args.sequenceName}" with ${createdTemplates.length} templates and ${createdSteps.length} steps`,
                nextSteps: [
                  '1. Open Outreach and navigate to your sequence',
                  '2. Edit each sequence step to add the corresponding email template',
                  '3. Match templates to steps based on the mapping below'
                ],
                templateMapping: createdSteps.map(item => ({
                  stepOrder: item.step.attributes.order,
                  stepId: item.step.id,
                  templateId: item.template.id,
                  templateName: item.template.attributes.name,
                  templateSubject: item.template.attributes.subject,
                  instruction: `Step ${item.step.attributes.order}: Link template "${item.template.attributes.name}" (ID: ${item.template.id})`
                }))
              },
              oauthScopeHelp: {
                missingScope: 'sequenceTemplates.write',
                solution: 'Update OAuth application with sequenceTemplates.write scope to enable automatic template linking',
                helpFile: 'See OAUTH-SCOPE-UPDATE.md for detailed instructions'
              }
            }, true);

          } catch (error) {
            // Cleanup on error
            for (const templateData of createdTemplates) {
              try {
                await outreachClient.delete(`/templates/${templateData.template.id}`);
              } catch (rollbackError) {
                console.error('Template cleanup failed:', rollbackError);
              }
            }
            
            if (sequence) {
              try {
                await outreachClient.delete(`/sequences/${sequence.id}`);
              } catch (rollbackError) {
                console.error('Sequence cleanup failed:', rollbackError);
              }
            }
            
            throw new Error(`Sequence setup failed: ${error.message}. All resources cleaned up.`);
          }
        }

        case 'create_sequence_with_email_templates': {
          // Dedicated tool for creating sequences with complete email workflow
          const createdTemplates = [];
          let sequence = null;

          try {
            // Sort email templates by step order
            const sortedTemplates = args.emailTemplates.sort((a, b) => a.stepOrder - b.stepOrder);

            // 1. Create all email templates first
            for (const emailTemplate of sortedTemplates) {
              const templateResponse = await outreachClient.post('/templates', {
                data: {
                  type: 'template',
                  attributes: {
                    name: emailTemplate.name,
                    subject: emailTemplate.subject,
                    bodyHtml: emailTemplate.bodyHtml || emailTemplate.bodyText
                  }
                }
              });
              
              createdTemplates.push({
                template: templateResponse.data.data,
                stepOrder: emailTemplate.stepOrder,
                delayDays: emailTemplate.delayDays ?? 3
              });
            }

            // 2. Create sequence structure
            const sequenceResponse = await outreachClient.post('/sequences', {
              data: {
                type: 'sequence',
                attributes: {
                  name: args.sequenceName,
                  description: args.sequenceDescription || `Email sequence with ${createdTemplates.length} steps`,
                  shareType: 'private'
                }
              }
            });
            sequence = sequenceResponse.data.data;

            // 3. Create sequence steps and link templates
            const createdSteps = [];
            for (const templateData of createdTemplates) {
              // Create the sequence step
              const stepResponse = await outreachClient.post('/sequenceSteps', {
                data: {
                  type: 'sequenceStep',
                  attributes: {
                    order: templateData.stepOrder,
                    stepType: 'auto_email',
                    interval: templateData.delayDays * 24 * 60  // Convert days to minutes for Outreach API
                  },
                  relationships: {
                    sequence: { data: { type: 'sequence', id: sequence.id } }
                  }
                }
              });
              
              // Link the template to the step using sequenceTemplate
              await outreachClient.post('/sequenceTemplates', {
                data: {
                  type: 'sequenceTemplate',
                  relationships: {
                    sequenceStep: { data: { type: 'sequenceStep', id: stepResponse.data.data.id } },
                    template: { data: { type: 'template', id: templateData.template.id } }
                  }
                }
              });
              
              createdSteps.push(stepResponse.data.data);
            }

            // Return comprehensive success response
            return this.formatResponse('sequenceWithTemplates', {
              sequence: sequence,
              templates: createdTemplates.map(t => t.template),
              steps: createdSteps,
              success: true,
              message: `Complete sequence created: '${args.sequenceName}' with ${createdTemplates.length} email templates`,
              summary: {
                sequenceId: sequence.id,
                sequenceName: sequence.attributes.name,
                templateCount: createdTemplates.length,
                stepCount: createdSteps.length,
                sequenceUrl: `https://web.outreach.io/sequences/${sequence.id}/overview`,
                emailFlow: createdTemplates.map(t => ({
                  order: t.stepOrder,
                  templateName: t.template.attributes.name,
                  subject: t.template.attributes.subject,
                  delayDays: t.delayDays
                }))
              }
            }, true);

          } catch (error) {
            // Rollback: delete any created templates and sequence on failure
            for (const templateData of createdTemplates) {
              try {
                await outreachClient.delete(`/templates/${templateData.template.id}`);
              } catch (rollbackError) {
                console.error('Template rollback failed:', rollbackError);
              }
            }
            
            if (sequence) {
              try {
                await outreachClient.delete(`/sequences/${sequence.id}`);
              } catch (rollbackError) {
                console.error('Sequence rollback failed:', rollbackError);
              }
            }
            
            throw new Error(`Sequence creation failed: ${error.message}. All created resources have been cleaned up.`);
          }
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            details: error.response?.data || 'Unknown error',
            tool: name
          }, null, 2)
        }]
      };
    }
  }

  formatEmailBody(bodyText) {
    if (!bodyText) return '';
    
    // Format for Outreach - ensure proper paragraph spacing
    return bodyText
      .split('\n\n')  // Split on double line breaks (paragraphs)
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .join('\n\n');  // Rejoin with double line breaks for paragraph spacing
  }

  formatResponse(resourceType, data, created = false) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          [resourceType]: data,
          count: Array.isArray(data) ? data.length : 1,
          ...(created && { created: true })
        }, null, 2)
      }]
    };
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return await this.getToolsList();
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // For STDIO mode, use environment variables
      const refreshToken = process.env.OUTREACH_REFRESH_TOKEN;
      if (!refreshToken) {
        throw new Error('OUTREACH_REFRESH_TOKEN environment variable is required');
      }

      const accessToken = await this.getAccessToken(refreshToken);
      const outreachClient = this.createOutreachClient(accessToken);
      
      return await this.callTool(request.params, outreachClient);
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('Server error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    // Dual-mode: HTTP for Railway, STDIO for local
    if (process.env.PORT || process.env.RAILWAY_ENVIRONMENT) {
      await this.runHttpServer();
    } else {
      await this.runStdioServer();
    }
  }

  async runStdioServer() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Simple Outreach MCP server running on stdio');
  }

  async runHttpServer() {
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(express.json());
    
    // CORS
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Outreach-Refresh-Token');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      next();
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'outreach-mcp-server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // OAuth callback endpoint
    app.get('/callback', async (req, res) => {
      const { code, error } = req.query;
      
      if (error) {
        return res.status(400).send(`
          <html>
            <body style="font-family: system-ui; padding: 40px;">
              <h1 style="color: red;">❌ Authorization Failed</h1>
              <p>Error: ${error}</p>
            </body>
          </html>
        `);
      }

      if (!code) {
        return res.status(400).send(`
          <html>
            <body style="font-family: system-ui; padding: 40px;">
              <h1 style="color: red;">❌ No Authorization Code</h1>
              <p>Authorization code is required to complete OAuth flow.</p>
            </body>
          </html>
        `);
      }

      try {
        // Exchange code for tokens
        const params = new URLSearchParams({
          client_id: process.env.OUTREACH_CLIENT_ID,
          client_secret: process.env.OUTREACH_CLIENT_SECRET,
          redirect_uri: 'https://mcp-outreach-server-production.up.railway.app/callback',
          grant_type: 'authorization_code',
          code: code
        });

        const response = await axios.post('https://api.outreach.io/oauth/token', params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const { access_token, refresh_token, expires_in } = response.data;

        res.send(`
          <html>
            <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
              <h1 style="color: green;">✅ Authorization Successful!</h1>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>New Token Information:</h3>
                <p><strong>Access Token:</strong> ${access_token.substring(0, 20)}...</p>
                <p><strong>Refresh Token:</strong> <code>${refresh_token}</code></p>
                <p><strong>Expires In:</strong> ${expires_in} seconds</p>
              </div>
              <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>⚠️ Important:</h3>
                <p>Copy the refresh token above and update your Railway environment variables:</p>
                <pre style="background: #000; color: #0f0; padding: 10px; border-radius: 4px;">railway variables set OUTREACH_REFRESH_TOKEN="${refresh_token}"</pre>
              </div>
              <button onclick="window.close()" style="padding: 12px 24px; background: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Close Window
              </button>
            </body>
          </html>
        `);

      } catch (error) {
        console.error('OAuth token exchange error:', error.response?.data || error.message);
        res.status(500).send(`
          <html>
            <body style="font-family: system-ui; padding: 40px;">
              <h1 style="color: red;">❌ Token Exchange Failed</h1>
              <p>Error: ${error.message}</p>
              <pre>${JSON.stringify(error.response?.data, null, 2)}</pre>
            </body>
          </html>
        `);
      }
    });

    // Main MCP endpoint
    app.post('/mcp', async (req, res) => {
      try {
        // Get Outreach refresh token from header
        const refreshToken = req.headers['x-outreach-refresh-token'] || process.env.OUTREACH_REFRESH_TOKEN;
        if (!refreshToken) {
          return res.status(400).json({ error: 'Outreach refresh token required' });
        }

        const { method, params } = req.body;
        
        try {
          if (method === 'tools/list') {
            const toolsResponse = await this.getToolsList();
            res.json(toolsResponse);
          } else if (method === 'tools/call') {
            const accessToken = await this.getAccessToken(refreshToken);
            const outreachClient = this.createOutreachClient(accessToken);
            const toolResponse = await this.callTool(params, outreachClient);
            res.json(toolResponse);
          } else {
            res.status(400).json({ error: 'Invalid method' });
          }
        } catch (toolError) {
          console.error('Tool execution error:', toolError);
          res.status(500).json({ 
            error: 'Tool execution failed',
            details: toolError.message 
          });
        }
      } catch (error) {
        console.error('MCP endpoint error:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          details: error.message 
        });
      }
    });

    app.listen(port, '0.0.0.0', () => {
      console.log(`Simple Outreach MCP Server listening on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
    });
  }
}

// Start the server
const server = new OutreachMCPServer();
server.run().catch(console.error);