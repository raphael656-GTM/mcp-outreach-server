// Tool definitions for MCP Outreach server

export const tools = [
  // Prospect Management Tools
  {
    name: 'create_prospect',
    description: 'Create a new prospect in Outreach',
    inputSchema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          description: 'First name of the prospect'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the prospect'
        },
        email: {
          type: 'string',
          description: 'Email address of the prospect'
        },
        company: {
          type: 'string',
          description: 'Company name'
        },
        title: {
          type: 'string',
          description: 'Job title of the prospect'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to assign to the prospect'
        },
        customFields: {
          type: 'object',
          description: 'Custom fields as key-value pairs'
        }
      },
      required: ['firstName', 'lastName', 'email']
    }
  },

  {
    name: 'search_prospects',
    description: 'Search for prospects based on criteria',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Search by email address'
        },
        company: {
          type: 'string',
          description: 'Search by company name'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Search by tags'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 25
        }
      }
    }
  },

  {
    name: 'update_prospect',
    description: 'Update an existing prospect',
    inputSchema: {
      type: 'object',
      properties: {
        prospectId: {
          type: 'string',
          description: 'ID of the prospect to update'
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            company: { type: 'string' },
            title: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            customFields: { type: 'object' }
          }
        }
      },
      required: ['prospectId', 'updates']
    }
  },

  {
    name: 'tag_prospect',
    description: 'Add tags to a prospect',
    inputSchema: {
      type: 'object',
      properties: {
        prospectId: {
          type: 'string',
          description: 'ID of the prospect'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to add to the prospect'
        }
      },
      required: ['prospectId', 'tags']
    }
  },

  // Sequence Management Tools
  {
    name: 'get_sequences',
    description: 'Get all sequences from Outreach',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of sequences to return',
          default: 25
        }
      }
    }
  },

  {
    name: 'find_sequence',
    description: 'Find a sequence by name',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the sequence to find'
        }
      },
      required: ['name']
    }
  },

  {
    name: 'create_sequence',
    description: 'Create a new sequence in Outreach',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the sequence'
        },
        description: {
          type: 'string',
          description: 'Description of the sequence'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for the sequence'
        },
        shareType: {
          type: 'string',
          description: 'Share type: shared (recommended), private, or team',
          enum: ['shared', 'private', 'team'],
          default: 'shared'
        }
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
        sequenceId: {
          type: 'string',
          description: 'ID of the sequence to add the step to'
        },
        stepType: {
          type: 'string',
          description: 'Type of step: auto_email, manual_email, call, or task',
          enum: ['email', 'auto_email', 'manual_email', 'call', 'task'],
          default: 'auto_email'
        },
        intervalInDays: {
          type: 'number',
          description: 'Days to wait before this step (0 for immediate)',
          default: 0
        },
        taskNote: {
          type: 'string',
          description: 'Note for call/task steps'
        },
        order: {
          type: 'number',
          description: 'Step order in sequence (auto-calculated if not provided)'
        }
      },
      required: ['sequenceId']
    }
  },

  {
    name: 'get_sequence_steps',
    description: 'Get all steps for a sequence',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceId: {
          type: 'string',
          description: 'ID of the sequence'
        }
      },
      required: ['sequenceId']
    }
  },

  // Template Management Tools
  {
    name: 'create_sequence_template',
    description: 'Create an email template for sequence steps',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the template'
        },
        subject: {
          type: 'string',
          description: 'Email subject line (use {{first_name}} and {{account.name}} for variables)'
        },
        bodyHtml: {
          type: 'string',
          description: 'HTML email body (primary content)'
        },
        bodyText: {
          type: 'string',
          description: 'Plain text email body (optional fallback)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for organizing templates'
        },
        trackLinks: {
          type: 'boolean',
          description: 'Whether to track link clicks',
          default: true
        },
        trackOpens: {
          type: 'boolean',
          description: 'Whether to track email opens',
          default: true
        }
      },
      required: ['name', 'subject']
    }
  },

  {
    name: 'get_sequence_templates',
    description: 'Get all available sequence templates',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of templates to return',
          default: 25
        },
        search: {
          type: 'string',
          description: 'Search templates by name or subject'
        }
      }
    }
  },

  {
    name: 'find_sequence_template',
    description: 'Find a template by name',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the template to find'
        }
      },
      required: ['name']
    }
  },

  {
    name: 'update_sequence_template',
    description: 'Update an existing sequence template',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'string',
          description: 'ID of the template to update'
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            name: { type: 'string' },
            subject: { type: 'string' },
            bodyText: { type: 'string' },
            bodyHtml: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      },
      required: ['templateId', 'updates']
    }
  },

  {
    name: 'link_template_to_step',
    description: 'Link an existing template to a sequence step',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceStepId: {
          type: 'string',
          description: 'ID of the sequence step'
        },
        templateId: {
          type: 'string',
          description: 'ID of the template to link'
        }
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
        prospectId: {
          type: 'string',
          description: 'ID of the prospect'
        },
        sequenceId: {
          type: 'string',
          description: 'ID of the sequence'
        },
        options: {
          type: 'object',
          description: 'Additional options',
          properties: {
            mailboxId: {
              type: 'string',
              description: 'ID of the mailbox to use for sending'
            }
          }
        }
      },
      required: ['prospectId', 'sequenceId']
    }
  },

  {
    name: 'remove_prospect_from_sequence',
    description: 'Remove a prospect from a sequence',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceStateId: {
          type: 'string',
          description: 'ID of the sequence state to remove'
        }
      },
      required: ['sequenceStateId']
    }
  },

  // Account Management Tools
  {
    name: 'create_account',
    description: 'Create a new account in Outreach',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the account/company'
        },
        domain: {
          type: 'string',
          description: 'Company domain'
        },
        industry: {
          type: 'string',
          description: 'Industry category'
        },
        size: {
          type: 'string',
          description: 'Company size'
        },
        customFields: {
          type: 'object',
          description: 'Custom fields as key-value pairs'
        }
      },
      required: ['name']
    }
  },

  {
    name: 'search_accounts',
    description: 'Search for accounts by name or domain',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Search by account name'
        },
        domain: {
          type: 'string',
          description: 'Search by domain'
        }
      }
    }
  },

  // Mailbox Management Tools
  {
    name: 'get_mailboxes',
    description: 'Get all available mailboxes',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // Health Check
  {
    name: 'health_check',
    description: 'Check the health status of the MCP server and Outreach API connection',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];