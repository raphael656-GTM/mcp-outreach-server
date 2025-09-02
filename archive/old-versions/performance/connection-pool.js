// Connection Pool Manager for Outreach API
import axios from 'axios';
import pkg from 'agentkeepalive';
const { HttpsAgent } = pkg;

class ConnectionPoolManager {
  constructor(config = {}) {
    this.maxSockets = config.maxSockets || 15;
    this.maxFreeSockets = config.maxFreeSockets || 10;
    this.timeout = config.timeout || 30000;
    this.keepAliveTimeout = config.keepAliveTimeout || 30000;
    
    // Create HTTP agent with connection pooling
    this.httpAgent = new HttpsAgent({
      maxSockets: this.maxSockets,
      maxFreeSockets: this.maxFreeSockets,
      timeout: this.timeout,
      freeSocketTimeout: this.keepAliveTimeout,
      keepAlive: true
    });

    // Create axios instance with connection pooling
    this.client = axios.create({
      httpAgent: this.httpAgent,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      }
    });

    this.stats = {
      totalRequests: 0,
      activeConnections: 0,
      poolHits: 0,
      poolMisses: 0
    };
  }

  // Get optimized axios client
  getClient() {
    return this.client;
  }

  // Get connection pool statistics
  getStats() {
    return {
      ...this.stats,
      activeConnections: this.httpAgent.getCurrentStatus?.()?.createSocketCount || 0,
      freeConnections: this.httpAgent.getCurrentStatus?.()?.freeSocketCount || 0
    };
  }

  // Update request statistics
  incrementStats() {
    this.stats.totalRequests++;
  }

  // Graceful shutdown
  async shutdown() {
    console.error('🔌 Shutting down connection pool...');
    this.httpAgent.destroy();
    console.error('✅ Connection pool shutdown complete');
  }

  // Health check for connection pool
  getHealth() {
    const stats = this.getStats();
    return {
      status: 'healthy',
      totalRequests: stats.totalRequests,
      activeConnections: stats.activeConnections,
      freeConnections: stats.freeConnections,
      maxSockets: this.maxSockets
    };
  }
}

export default ConnectionPoolManager;