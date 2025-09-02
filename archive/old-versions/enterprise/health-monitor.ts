export interface HealthMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  eventLoopDelay: number;
  activeHandles: number;
  activeRequests: number;
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime?: number;
  errorRate?: number;
  details?: any;
}

export interface HealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: string;
  metrics: HealthMetrics;
  components: ComponentHealth[];
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
    component?: string;
  }>;
}

export class MCPHealthMonitor {
  private startTime = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCpuUsage = process.cpuUsage();
  private healthCheckers: Map<string, () => Promise<ComponentHealth>> = new Map();
  
  constructor() {
    this.startMonitoring();
    this.registerDefaultHealthCheckers();
  }

  private startMonitoring(): void {
    // Monitor every 30 seconds
    this.checkInterval = setInterval(() => {
      this.performHealthCheck().catch(console.error);
    }, 30000);
  }

  private registerDefaultHealthCheckers(): void {
    // Memory health checker
    this.healthCheckers.set('memory', async () => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (heapUsedMB > 512) status = 'warning';
      if (heapUsedMB > 1024) status = 'critical';
      
      return {
        name: 'memory',
        status,
        details: {
          heapUsedMB,
          heapTotalMB,
          utilizationPercent: Math.round((heapUsedMB / heapTotalMB) * 100)
        }
      };
    });

    // Event loop health checker
    this.healthCheckers.set('event-loop', async () => {
      const eventLoopDelay = await this.measureEventLoopDelay();
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (eventLoopDelay > 100) status = 'warning';
      if (eventLoopDelay > 500) status = 'critical';
      
      return {
        name: 'event-loop',
        status,
        details: {
          delayMs: Math.round(eventLoopDelay),
          threshold: { warning: 100, critical: 500 }
        }
      };
    });
  }

  registerHealthChecker(name: string, checker: () => Promise<ComponentHealth>): void {
    this.healthCheckers.set(name, checker);
  }

  private async measureEventLoopDelay(): Promise<number> {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const delta = process.hrtime.bigint() - start;
        resolve(Number(delta) / 1_000_000); // Convert to milliseconds
      });
    });
  }

  async getHealthReport(): Promise<HealthReport> {
    const now = Date.now();
    const uptime = now - this.startTime;
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();

    // Run all health checkers
    const componentResults = await Promise.allSettled(
      Array.from(this.healthCheckers.entries()).map(async ([name, checker]) => {
        try {
          return await checker();
        } catch (error: any) {
          return {
            name,
            status: 'critical' as const,
            details: { error: error.message }
          };
        }
      })
    );

    const components = componentResults.map(result => 
      result.status === 'fulfilled' ? result.value : {
        name: 'unknown',
        status: 'critical' as const,
        details: { error: 'Health check failed' }
      }
    );

    // Determine overall health
    const criticalCount = components.filter(c => c.status === 'critical').length;
    const warningCount = components.filter(c => c.status === 'warning').length;
    
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalCount > 0) overall = 'critical';
    else if (warningCount > 0) overall = 'warning';

    // Generate alerts
    const alerts = [];
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (memUsageMB > 1024) {
      alerts.push({
        type: 'critical' as const,
        message: `High memory usage: ${memUsageMB}MB`,
        component: 'memory'
      });
    } else if (memUsageMB > 512) {
      alerts.push({
        type: 'warning' as const,
        message: `Elevated memory usage: ${memUsageMB}MB`,
        component: 'memory'
      });
    }

    // Add component-specific alerts
    components.forEach(component => {
      if (component.status === 'critical') {
        alerts.push({
          type: 'critical',
          message: `Component ${component.name} is in critical state`,
          component: component.name
        });
      } else if (component.status === 'warning') {
        alerts.push({
          type: 'warning',
          message: `Component ${component.name} shows warnings`,
          component: component.name
        });
      }
    });

    const eventLoopDelay = await this.measureEventLoopDelay();

    return {
      overall,
      timestamp: new Date().toISOString(),
      uptime: this.formatUptime(uptime),
      metrics: {
        uptime,
        memoryUsage: memUsage,
        cpuUsage,
        eventLoopDelay,
        activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
        activeRequests: (process as any)._getActiveRequests?.()?.length || 0
      },
      components,
      alerts
    };
  }

  private async performHealthCheck(): Promise<void> {
    const report = await this.getHealthReport();
    
    if (report.overall === 'critical') {
      console.error('🚨 CRITICAL: MCP Server health is critical!', {
        alerts: report.alerts.filter(a => a.type === 'critical')
      });
    } else if (report.overall === 'warning') {
      console.error('⚠️  WARNING: MCP Server health shows warnings', {
        alerts: report.alerts.filter(a => a.type === 'warning')
      });
    }
  }

  private formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getQuickStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    memoryMB: number;
  } {
    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (memoryMB > 1024) status = 'critical';
    else if (memoryMB > 512) status = 'warning';

    return {
      status,
      uptime: this.formatUptime(uptime),
      memoryMB
    };
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.healthCheckers.clear();
    console.error('🏥 Health monitor destroyed');
  }
}