// Performance Monitor for tracking MCP server metrics
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: []
      },
      tools: {},
      system: {
        startTime: Date.now(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    // Start periodic memory monitoring
    this.startSystemMonitoring();
  }

  // Start system monitoring
  startSystemMonitoring() {
    this.systemInterval = setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Every 30 seconds

    console.log('📊 Performance monitoring started');
  }

  // Update system metrics
  updateSystemMetrics() {
    this.metrics.system.memoryUsage = process.memoryUsage();
    this.metrics.system.cpuUsage = process.cpuUsage(this.metrics.system.cpuUsage);
  }

  // Record API request
  recordRequest(toolName, responseTime, success = true) {
    // Update overall metrics
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track response times (keep last 100 for average)
    this.metrics.requests.responseTimes.push(responseTime);
    if (this.metrics.requests.responseTimes.length > 100) {
      this.metrics.requests.responseTimes.shift();
    }

    // Calculate average response time
    const sum = this.metrics.requests.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.requests.avgResponseTime = Math.round(sum / this.metrics.requests.responseTimes.length);

    // Track per-tool metrics
    if (!this.metrics.tools[toolName]) {
      this.metrics.tools[toolName] = {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: []
      };
    }

    const toolMetrics = this.metrics.tools[toolName];
    toolMetrics.total++;
    if (success) {
      toolMetrics.successful++;
    } else {
      toolMetrics.failed++;
    }

    toolMetrics.responseTimes.push(responseTime);
    if (toolMetrics.responseTimes.length > 50) {
      toolMetrics.responseTimes.shift();
    }

    // Calculate tool-specific average
    const toolSum = toolMetrics.responseTimes.reduce((a, b) => a + b, 0);
    toolMetrics.avgResponseTime = Math.round(toolSum / toolMetrics.responseTimes.length);
  }

  // Get current metrics
  getMetrics() {
    const uptime = Date.now() - this.metrics.system.startTime;
    const successRate = this.metrics.requests.total > 0 
      ? ((this.metrics.requests.successful / this.metrics.requests.total) * 100).toFixed(2)
      : 0;

    return {
      uptime: {
        milliseconds: uptime,
        seconds: Math.round(uptime / 1000),
        minutes: Math.round(uptime / 1000 / 60),
        hours: Math.round(uptime / 1000 / 60 / 60)
      },
      requests: {
        ...this.metrics.requests,
        successRate: `${successRate}%`,
        requestsPerMinute: this.calculateRequestsPerMinute(),
        responseTimes: undefined // Don't include array in summary
      },
      tools: this.getToolMetricsSummary(),
      system: {
        ...this.metrics.system,
        memoryUsageFormatted: this.formatMemoryUsage(this.metrics.system.memoryUsage)
      }
    };
  }

  // Calculate requests per minute
  calculateRequestsPerMinute() {
    const uptimeMinutes = (Date.now() - this.metrics.system.startTime) / 1000 / 60;
    return uptimeMinutes > 0 ? Math.round(this.metrics.requests.total / uptimeMinutes) : 0;
  }

  // Get tool metrics summary
  getToolMetricsSummary() {
    const summary = {};
    Object.keys(this.metrics.tools).forEach(toolName => {
      const tool = this.metrics.tools[toolName];
      const successRate = tool.total > 0 
        ? ((tool.successful / tool.total) * 100).toFixed(2)
        : 0;

      summary[toolName] = {
        total: tool.total,
        successful: tool.successful,
        failed: tool.failed,
        successRate: `${successRate}%`,
        avgResponseTime: `${tool.avgResponseTime}ms`
      };
    });
    return summary;
  }

  // Format memory usage
  formatMemoryUsage(memUsage) {
    return {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    };
  }

  // Get performance alerts
  getAlerts() {
    const alerts = [];
    const metrics = this.getMetrics();

    // High response time alert
    if (metrics.requests.avgResponseTime > 2000) {
      alerts.push({
        type: 'warning',
        message: `High average response time: ${metrics.requests.avgResponseTime}ms`,
        threshold: 2000,
        current: metrics.requests.avgResponseTime
      });
    }

    // High error rate alert
    const errorRate = (metrics.requests.failed / metrics.requests.total) * 100;
    if (errorRate > 5) {
      alerts.push({
        type: 'error',
        message: `High error rate: ${errorRate.toFixed(2)}%`,
        threshold: 5,
        current: errorRate
      });
    }

    // High memory usage alert (>500MB heap)
    const heapUsedMB = metrics.system.memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      alerts.push({
        type: 'warning',
        message: `High memory usage: ${Math.round(heapUsedMB)}MB`,
        threshold: 500,
        current: Math.round(heapUsedMB)
      });
    }

    return alerts;
  }

  // Get health status
  getHealth() {
    const alerts = this.getAlerts();
    const metrics = this.getMetrics();
    
    let status = 'healthy';
    if (alerts.some(alert => alert.type === 'error')) {
      status = 'unhealthy';
    } else if (alerts.length > 0) {
      status = 'warning';
    }

    return {
      status: status,
      uptime: metrics.uptime,
      performance: {
        avgResponseTime: `${metrics.requests.avgResponseTime}ms`,
        successRate: metrics.requests.successRate,
        requestsPerMinute: metrics.requests.requestsPerMinute
      },
      alerts: alerts.length,
      alertDetails: alerts
    };
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getMetrics();
    const health = this.getHealth();
    const timestamp = new Date().toISOString();

    return {
      timestamp: timestamp,
      health: health,
      metrics: metrics,
      summary: {
        totalRequests: metrics.requests.total,
        successRate: metrics.requests.successRate,
        avgResponseTime: `${metrics.requests.avgResponseTime}ms`,
        uptime: `${metrics.uptime.hours}h ${metrics.uptime.minutes % 60}m`,
        toolCount: Object.keys(metrics.tools).length,
        memoryUsage: metrics.system.memoryUsageFormatted.heapUsed
      }
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: []
      },
      tools: {},
      system: {
        startTime: Date.now(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
    console.log('📊 Performance metrics reset');
  }

  // Cleanup
  destroy() {
    if (this.systemInterval) {
      clearInterval(this.systemInterval);
      this.systemInterval = null;
    }
    console.log('📊 Performance monitor cleanup complete');
  }
}

export default PerformanceMonitor;