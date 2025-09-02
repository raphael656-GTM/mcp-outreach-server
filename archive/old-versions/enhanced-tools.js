// Enhanced Tool definitions for MCP Outreach server with bulk operations

export const enhancedTools = [
  // ===== HIGH-LEVEL WORKFLOW TOOLS (Seamless User Experience) =====
  
  {
    name: 'create_complete_email_sequence',
    description: 'Create a complete email sequence with templates and timing in one call - no need for multiple steps',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceName: {
          type: 'string',
          description: 'Name of the sequence (e.g., "TechCorp - Security Platform - Steve Jobs Style")'
        },
        description: {
          type: 'string', 
          description: 'Description of the sequence purpose and target audience'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for organizing the sequence (e.g., ["security", "enterprise", "cold outreach"])'
        },
        emails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string', description: 'Name of the email template' },
              subject: { type: 'string', description: 'Email subject line with personalization variables' },
              bodyHtml: { type: 'string', description: 'HTML email content with {{first_name}} and {{account.name}} variables' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags for this specific email' },
              intervalInDays: { type: 'number', description: 'Days to wait before sending this email (0 for first email)' }
            },
            required: ['templateName', 'subject', 'bodyHtml', 'intervalInDays']
          },
          minItems: 1,
          maxItems: 10,
          description: 'Array of email templates with timing'
        }
      },
      required: ['sequenceName', 'description', 'emails']
    }
  },

  {
    name: 'create_and_enroll_prospect',
    description: 'Create a prospect and immediately enroll them in a sequence - combines two steps into one',
    inputSchema: {
      type: 'object',
      properties: {
        prospect: {
          type: 'object',
          properties: {
            firstName: { type: 'string', description: 'Prospect first name' },
            lastName: { type: 'string', description: 'Prospect last name' },
            email: { type: 'string', description: 'Prospect email address' },
            company: { type: 'string', description: 'Company name' },
            title: { type: 'string', description: 'Job title' },
            tags: { type: 'array', items: { type: 'string' } },
            customFields: { type: 'object' }
          },
          required: ['firstName', 'lastName', 'email']
        },
        sequenceName: {
          type: 'string',
          description: 'Name of the sequence to enroll prospect in'
        },
        options: {
          type: 'object',
          properties: {
            mailboxId: { type: 'string', description: 'ID of mailbox to use for sending (optional)' }
          }
        }
      },
      required: ['prospect', 'sequenceName']
    }
  },

  {
    name: 'create_campaign_with_prospects',
    description: 'Create complete campaign: sequence with emails + prospects + enrollment - full campaign setup in one call',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceName: {
          type: 'string',
          description: 'Name of the sequence/campaign'
        },
        description: {
          type: 'string',
          description: 'Campaign description and target audience'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campaign tags for organization'
        },
        emails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string' },
              subject: { type: 'string' },
              bodyHtml: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              intervalInDays: { type: 'number' }
            },
            required: ['templateName', 'subject', 'bodyHtml', 'intervalInDays']
          },
          minItems: 1,
          maxItems: 10
        },
        prospects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
              company: { type: 'string' },
              title: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['firstName', 'lastName', 'email']
          },
          minItems: 1,
          maxItems: 100,
          description: 'List of prospects to create and enroll'
        }
      },
      required: ['sequenceName', 'description', 'emails', 'prospects']
    }
  },

  // ===== BULK OPERATIONS (New Performance Tools) =====
  
  {
    name: 'bulk_create_prospects',
    description: 'Create multiple prospects in batch (25-50 at once) for improved performance',
    inputSchema: {
      type: 'object',
      properties: {
        prospects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              firstName: { type: 'string', description: 'First name' },
              lastName: { type: 'string', description: 'Last name' },
              email: { type: 'string', description: 'Email address' },
              company: { type: 'string', description: 'Company name' },
              title: { type: 'string', description: 'Job title' },
              tags: { type: 'array', items: { type: 'string' } },
              customFields: { type: 'object' }
            },
            required: ['firstName', 'lastName', 'email']
          },
          minItems: 1,
          maxItems: 50,
          description: 'Array of prospect objects to create'
        },
        options: {
          type: 'object',
          properties: {
            batchSize: { type: 'number', default: 25, description: 'Number of prospects per batch' },
            continueOnError: { type: 'boolean', default: true, description: 'Continue processing if some fail' }
          }
        }
      },
      required: ['prospects']
    }
  },

  {
    name: 'bulk_create_sequences',
    description: 'Create multiple sequences in batch for improved performance',
    inputSchema: {
      type: 'object',
      properties: {
        sequences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Sequence name' },
              description: { type: 'string', description: 'Sequence description' },
              tags: { type: 'array', items: { type: 'string' } },
              shareType: { type: 'string', enum: ['shared', 'private', 'team'], default: 'shared' }
            },
            required: ['name']
          },
          minItems: 1,
          maxItems: 25,
          description: 'Array of sequence objects to create'
        }
      },
      required: ['sequences']
    }
  },

  {
    name: 'bulk_create_templates',
    description: 'Create multiple email templates in batch for improved performance',
    inputSchema: {
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Template name' },
              subject: { type: 'string', description: 'Email subject line' },
              bodyHtml: { type: 'string', description: 'HTML email body' },
              bodyText: { type: 'string', description: 'Plain text email body' },
              tags: { type: 'array', items: { type: 'string' } },
              shareType: { type: 'string', enum: ['shared', 'private'], default: 'shared' }
            },
            required: ['name', 'subject']
          },
          minItems: 1,
          maxItems: 20,
          description: 'Array of template objects to create'
        }
      },
      required: ['templates']
    }
  },

  {
    name: 'bulk_enroll_prospects',
    description: 'Enroll multiple prospects in sequences in batch for improved performance',
    inputSchema: {
      type: 'object',
      properties: {
        enrollments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prospectId: { type: 'string', description: 'Prospect ID' },
              sequenceId: { type: 'string', description: 'Sequence ID' },
              options: {
                type: 'object',
                properties: {
                  mailboxId: { type: 'string', description: 'Mailbox ID for sending' },
                  state: { type: 'string', default: 'active' }
                }
              }
            },
            required: ['prospectId', 'sequenceId']
          },
          minItems: 1,
          maxItems: 100,
          description: 'Array of prospect enrollment objects'
        }
      },
      required: ['enrollments']
    }
  },

  // ===== PERFORMANCE MONITORING TOOLS =====

  {
    name: 'get_performance_metrics',
    description: 'Get detailed performance metrics for the MCP server',
    inputSchema: {
      type: 'object',
      properties: {
        includeDetails: {
          type: 'boolean',
          default: false,
          description: 'Include detailed breakdown by tool and component'
        }
      }
    }
  },

  {
    name: 'get_health_status',
    description: 'Get comprehensive health status of all MCP server components',
    inputSchema: {
      type: 'object',
      properties: {
        includeAlerts: {
          type: 'boolean',
          default: true,
          description: 'Include performance alerts and warnings'
        }
      }
    }
  },

  {
    name: 'generate_performance_report',
    description: 'Generate detailed performance report with recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['summary', 'detailed', 'json'],
          default: 'summary',
          description: 'Report format and detail level'
        }
      }
    }
  },

  // ===== CACHE MANAGEMENT TOOLS =====

  {
    name: 'clear_cache',
    description: 'Clear cached data to force fresh API calls',
    inputSchema: {
      type: 'object',
      properties: {
        cacheType: {
          type: 'string',
          enum: ['all', 'api', 'prospects', 'sequences', 'templates'],
          default: 'api',
          description: 'Type of cache to clear'
        }
      }
    }
  },

  {
    name: 'get_cache_stats',
    description: 'Get cache performance statistics and hit rates',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // ===== EXISTING TOOLS (Enhanced versions) =====
  
  {
    name: 'create_prospect',
    description: 'Create a new prospect in Outreach (enhanced with caching)',
    inputSchema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', description: 'First name of the prospect' },
        lastName: { type: 'string', description: 'Last name of the prospect' },
        email: { type: 'string', description: 'Email address of the prospect' },
        company: { type: 'string', description: 'Company name' },
        title: { type: 'string', description: 'Job title of the prospect' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to assign to the prospect' },
        customFields: { type: 'object', description: 'Custom fields as key-value pairs' }
      },
      required: ['firstName', 'lastName', 'email']
    }
  },

  {
    name: 'search_prospects',
    description: 'Search for prospects based on criteria (enhanced with caching)',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Search by email address' },
        company: { type: 'string', description: 'Search by company name' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Search by tags' },
        limit: { type: 'number', description: 'Maximum number of results', default: 25 }
      }
    }
  },

  {
    name: 'get_sequences',
    description: 'Get all sequences from Outreach (enhanced with caching)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of sequences', default: 25 }
      }
    }
  },

  {
    name: 'create_sequence',
    description: 'Create a new sequence in Outreach (enhanced with caching)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the sequence' },
        description: { type: 'string', description: 'Description of the sequence' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the sequence' },
        shareType: { type: 'string', description: 'Share type', enum: ['shared', 'private', 'team'], default: 'shared' }
      },
      required: ['name']
    }
  },

  {
    name: 'create_sequence_step',
    description: 'Add a step to a sequence (email, call, or task)',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceId: { type: 'string', description: 'ID of the sequence' },
        stepType: { type: 'string', description: 'Type of step', enum: ['email', 'auto_email', 'manual_email', 'call', 'task'], default: 'auto_email' },
        intervalInDays: { type: 'number', description: 'Days to wait before this step', default: 0 },
        taskNote: { type: 'string', description: 'Note for call/task steps' },
        order: { type: 'number', description: 'Step order in sequence' }
      },
      required: ['sequenceId']
    }
  },

  {
    name: 'create_sequence_template',
    description: 'Create an email template for sequence steps (enhanced with caching)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the template' },
        subject: { type: 'string', description: 'Email subject line (use {{first_name}} and {{account.name}} for variables)' },
        bodyHtml: { type: 'string', description: 'HTML email body' },
        bodyText: { type: 'string', description: 'Plain text email body' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for organizing templates' },
        trackLinks: { type: 'boolean', description: 'Whether to track link clicks', default: true },
        trackOpens: { type: 'boolean', description: 'Whether to track email opens', default: true }
      },
      required: ['name', 'subject']
    }
  },

  {
    name: 'link_template_to_step',
    description: 'Link an existing template to a sequence step',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceStepId: { type: 'string', description: 'ID of the sequence step' },
        templateId: { type: 'string', description: 'ID of the template to link' }
      },
      required: ['sequenceStepId', 'templateId']
    }
  },

  {
    name: 'add_prospect_to_sequence',
    description: 'Add a prospect to a sequence',
    inputSchema: {
      type: 'object',
      properties: {
        prospectId: { type: 'string', description: 'ID of the prospect' },
        sequenceId: { type: 'string', description: 'ID of the sequence' },
        options: {
          type: 'object',
          properties: {
            mailboxId: { type: 'string', description: 'ID of the mailbox to use for sending' }
          }
        }
      },
      required: ['prospectId', 'sequenceId']
    }
  },

  {
    name: 'get_mailboxes',
    description: 'Get all available mailboxes (enhanced with caching)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  {
    name: 'health_check',
    description: 'Check the health status of the MCP server and Outreach API connection',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];