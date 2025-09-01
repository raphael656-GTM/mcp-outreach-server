import { setTimeout as delay } from 'timers/promises';

interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  retryAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class OutreachRateLimiter {
  private config: RateLimitConfig;
  private requestHistory: RequestRecord[] = [];
  private currentBurst = 0;
  private lastResetTime = Date.now();
  
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      requestsPerMinute: 60, // Outreach typical limit
      burstLimit: 10, // Allow short bursts
      retryAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      ...config
    };
  }

  async executeWithRateLimit<T>(
    operation: () => Promise<T>,
    operationName: string = 'API Request'
  ): Promise<T> {
    let attempt = 0;
    
    while (attempt <= this.config.retryAttempts) {
      try {
        // Check if we can make the request
        await this.waitForRateLimit();
        
        // Record the request
        this.recordRequest();
        
        // Execute the operation
        const result = await operation();
        
        // Reset attempt counter on success
        if (attempt > 0) {
          console.error(`✅ ${operationName} succeeded after ${attempt} retries`);
        }
        
        return result;
        
      } catch (error: any) {
        attempt++;
        
        if (this.isRateLimitError(error)) {
          const retryAfter = this.extractRetryAfter(error);
          const delayMs = retryAfter || this.calculateBackoffDelay(attempt);
          
          console.error(`🚫 Rate limit hit for ${operationName} (attempt ${attempt}/${this.config.retryAttempts + 1})`);
          console.error(`⏳ Waiting ${delayMs}ms before retry...`);
          
          if (attempt <= this.config.retryAttempts) {
            await delay(delayMs);
            continue;
          }
        }
        
        // If not a rate limit error or max retries exceeded, throw
        if (attempt > this.config.retryAttempts) {
          console.error(`❌ ${operationName} failed after ${this.config.retryAttempts} retries`);
          throw new Error(`Rate limit exceeded for ${operationName}: ${error.message}`);
        }
        
        throw error;
      }
    }
    
    throw new Error(`Unexpected error in rate limiter for ${operationName}`);
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old records
    this.requestHistory = this.requestHistory.filter(record => record.timestamp > oneMinuteAgo);
    
    // Calculate current rate
    const currentRequests = this.requestHistory.reduce((sum, record) => sum + record.count, 0);
    
    // Reset burst counter if enough time has passed
    if (now - this.lastResetTime > 60000) {
      this.currentBurst = 0;
      this.lastResetTime = now;
    }
    
    // Check if we're over limits
    if (currentRequests >= this.config.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requestHistory.map(r => r.timestamp));
      const waitTime = oldestRequest + 60000 - now;
      console.error(`⏱️  Rate limit: waiting ${waitTime}ms (${currentRequests}/${this.config.requestsPerMinute} requests/min)`);
      await delay(Math.max(waitTime, 100));
    }
    
    // Check burst limit
    if (this.currentBurst >= this.config.burstLimit) {
      console.error(`💥 Burst limit reached, waiting 1 second...`);
      await delay(1000);
      this.currentBurst = 0;
    }
  }

  private recordRequest(): void {
    const now = Date.now();
    this.currentBurst++;
    
    // Add to history
    const existingRecord = this.requestHistory.find(record => 
      Math.abs(record.timestamp - now) < 1000 // Group requests within 1 second
    );
    
    if (existingRecord) {
      existingRecord.count++;
    } else {
      this.requestHistory.push({ timestamp: now, count: 1 });
    }
  }

  private isRateLimitError(error: any): boolean {
    if (!error.response) return false;
    
    const status = error.response.status;
    const message = error.message?.toLowerCase() || '';
    
    return (
      status === 429 || // Too Many Requests
      status === 503 || // Service Unavailable
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded')
    );
  }

  private extractRetryAfter(error: any): number | null {
    if (!error.response?.headers) return null;
    
    const retryAfter = error.response.headers['retry-after'] || error.response.headers['x-ratelimit-reset'];
    
    if (retryAfter) {
      const seconds = parseInt(retryAfter);
      return isNaN(seconds) ? null : seconds * 1000;
    }
    
    return null;
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.baseDelayMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * baseDelay; // 30% jitter
    const delay = Math.min(baseDelay + jitter, this.config.maxDelayMs);
    
    return Math.floor(delay);
  }

  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestHistory.filter(record => record.timestamp > oneMinuteAgo);
    const currentRequests = recentRequests.reduce((sum, record) => sum + record.count, 0);
    
    return {
      requestsLastMinute: currentRequests,
      requestsPerMinuteLimit: this.config.requestsPerMinute,
      currentBurst: this.currentBurst,
      burstLimit: this.config.burstLimit,
      utilizationPercent: Math.round((currentRequests / this.config.requestsPerMinute) * 100)
    };
  }

  reset(): void {
    this.requestHistory = [];
    this.currentBurst = 0;
    this.lastResetTime = Date.now();
    console.error('🔄 Rate limiter reset');
  }
}