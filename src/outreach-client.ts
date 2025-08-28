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

  async getMailboxes() {
    const response = await this.client.get('/mailboxes', {
      params: {
        'page[limit]': 100,
      },
    });
    return response.data;
  }
}