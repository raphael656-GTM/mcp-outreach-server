import axios, { AxiosInstance } from 'axios';

export class OutreachClient {
  private client: AxiosInstance;

  constructor(apiToken: string, baseURL: string) {
    if (!apiToken) {
      throw new Error('OUTREACH_API_TOKEN environment variable is required');
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
    });
  }

  async createSequence(
    name: string,
    description?: string,
    enabled: boolean = true,
    shareType: string = 'private'
  ) {
    const payload = {
      data: {
        type: 'sequence',
        attributes: {
          name,
          description: description || '',
          enabled,
          shareType,
          sequenceType: 'outbound',
        },
      },
    };

    try {
      const response = await this.client.post('/sequences', payload);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Failed to create sequence: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async listSequences(limit: number = 50, offset: number = 0) {
    const response = await this.client.get('/sequences', {
      params: {
        'page[limit]': limit,
        'page[offset]': offset,
        'sort': '-createdAt',
      },
    });
    return response.data;
  }

  async getAccountProspects(
    accountId?: number,
    accountName?: string,
    limit: number = 100
  ) {
    let filter: any = {};
    
    if (accountId) {
      filter['account[id]'] = accountId;
    } else if (accountName) {
      const accounts = await this.searchAccounts(accountName, 1);
      if (accounts.data && accounts.data.length > 0) {
        filter['account[id]'] = accounts.data[0].id;
      } else {
        throw new Error(`Account not found: ${accountName}`);
      }
    } else {
      throw new Error('Either accountId or accountName must be provided');
    }

    const response = await this.client.get('/prospects', {
      params: {
        ...filter,
        'page[limit]': limit,
        'include': 'account',
      },
    });
    return response.data;
  }

  async searchAccounts(query: string, limit: number = 20) {
    const response = await this.client.get('/accounts', {
      params: {
        'filter[name]': query,
        'page[limit]': limit,
      },
    });
    
    if (!response.data.data || response.data.data.length === 0) {
      const domainResponse = await this.client.get('/accounts', {
        params: {
          'filter[domain]': query,
          'page[limit]': limit,
        },
      });
      return domainResponse.data;
    }
    
    return response.data;
  }

  async addProspectsToSequence(
    sequenceId: number,
    prospectIds: number[],
    mailboxId?: number
  ) {
    const sequenceStates = await Promise.all(
      prospectIds.map(async (prospectId) => {
        const payload: any = {
          data: {
            type: 'sequenceState',
            relationships: {
              sequence: {
                data: {
                  type: 'sequence',
                  id: sequenceId.toString(),
                },
              },
              prospect: {
                data: {
                  type: 'prospect',
                  id: prospectId.toString(),
                },
              },
            },
          },
        };

        if (mailboxId) {
          payload.data.relationships.mailbox = {
            data: {
              type: 'mailbox',
              id: mailboxId.toString(),
            },
          };
        }

        try {
          const response = await this.client.post('/sequenceStates', payload);
          return { success: true, prospectId, data: response.data };
        } catch (error: any) {
          return { 
            success: false, 
            prospectId, 
            error: error.response?.data || error.message 
          };
        }
      })
    );

    return {
      results: sequenceStates,
      summary: {
        total: prospectIds.length,
        successful: sequenceStates.filter(s => s.success).length,
        failed: sequenceStates.filter(s => !s.success).length,
      },
    };
  }

  async createSequenceStep(
    sequenceId: number,
    order: number,
    interval: number = 1,
    stepType: string,
    subject?: string,
    body?: string
  ) {
    const payload: any = {
      data: {
        type: 'sequenceStep',
        attributes: {
          order,
          interval,
          stepType,
        },
        relationships: {
          sequence: {
            data: {
              type: 'sequence',
              id: sequenceId.toString(),
            },
          },
        },
      },
    };

    if (stepType.includes('email') && subject) {
      payload.data.attributes.subject = subject;
    }

    if (body) {
      payload.data.attributes.body = body;
    }

    const response = await this.client.post('/sequenceSteps', payload);
    return response.data;
  }

  async getMailboxes(limit: number = 100) {
    const response = await this.client.get('/mailboxes', {
      params: {
        'page[limit]': limit,
      },
    });
    return response.data;
  }

  // Phase 2: Additional sequence management methods
  async getSequenceById(sequenceId: number) {
    const response = await this.client.get(`/sequences/${sequenceId}`);
    return response.data;
  }

  async updateSequence(
    sequenceId: number,
    name?: string,
    description?: string,
    enabled?: boolean
  ) {
    const payload: any = {
      data: {
        type: 'sequence',
        id: sequenceId.toString(),
        attributes: {},
      },
    };

    if (name !== undefined) payload.data.attributes.name = name;
    if (description !== undefined) payload.data.attributes.description = description;
    if (enabled !== undefined) payload.data.attributes.enabled = enabled;

    const response = await this.client.patch(`/sequences/${sequenceId}`, payload);
    return response.data;
  }

  async deleteSequence(sequenceId: number) {
    const response = await this.client.delete(`/sequences/${sequenceId}`);
    return { success: true, sequenceId };
  }

  async getSequenceSteps(sequenceId: number) {
    const response = await this.client.get('/sequenceSteps', {
      params: {
        'filter[sequence][id]': sequenceId,
        'sort': 'order',
      },
    });
    return response.data;
  }

  async updateSequenceStep(
    stepId: number,
    subject?: string,
    body?: string,
    interval?: number
  ) {
    const payload: any = {
      data: {
        type: 'sequenceStep',
        id: stepId.toString(),
        attributes: {},
      },
    };

    if (subject !== undefined) payload.data.attributes.subject = subject;
    if (body !== undefined) payload.data.attributes.body = body;
    if (interval !== undefined) payload.data.attributes.interval = interval;

    const response = await this.client.patch(`/sequenceSteps/${stepId}`, payload);
    return response.data;
  }

  async deleteSequenceStep(stepId: number) {
    const response = await this.client.delete(`/sequenceSteps/${stepId}`);
    return { success: true, stepId };
  }

  // Phase 2: Prospect management methods
  async createProspect(
    firstName: string,
    lastName: string,
    email: string,
    company?: string,
    title?: string
  ) {
    const payload = {
      data: {
        type: 'prospect',
        attributes: {
          firstName,
          lastName,
          email,
          ...(company && { company }),
          ...(title && { title }),
        },
      },
    };

    const response = await this.client.post('/prospects', payload);
    return response.data;
  }

  async updateProspect(
    prospectId: number,
    firstName?: string,
    lastName?: string,
    email?: string,
    company?: string,
    title?: string
  ) {
    const payload: any = {
      data: {
        type: 'prospect',
        id: prospectId.toString(),
        attributes: {},
      },
    };

    if (firstName !== undefined) payload.data.attributes.firstName = firstName;
    if (lastName !== undefined) payload.data.attributes.lastName = lastName;
    if (email !== undefined) payload.data.attributes.email = email;
    if (company !== undefined) payload.data.attributes.company = company;
    if (title !== undefined) payload.data.attributes.title = title;

    const response = await this.client.patch(`/prospects/${prospectId}`, payload);
    return response.data;
  }

  async getProspectById(prospectId: number) {
    const response = await this.client.get(`/prospects/${prospectId}`, {
      params: {
        'include': 'account',
      },
    });
    return response.data;
  }

  async searchProspects(email?: string, company?: string, limit: number = 25) {
    const params: any = {
      'page[limit]': limit,
    };

    if (email) {
      params['filter[email]'] = email;
    }
    if (company) {
      params['filter[company]'] = company;
    }

    const response = await this.client.get('/prospects', { params });
    return response.data;
  }

  // Phase 2: Template methods
  async getTemplates(limit: number = 50) {
    const response = await this.client.get('/templates', {
      params: {
        'page[limit]': limit,
        'sort': '-createdAt',
      },
    });
    return response.data;
  }
}