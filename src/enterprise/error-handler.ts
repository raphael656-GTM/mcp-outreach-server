import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export interface ErrorContext {
  operation: string;
  toolName?: string;
  userId?: string;
  timestamp: number;
  attempt: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByTool: Record<string, number>;
  recoverySuccessRate: number;
  avgRecoveryTime: number;
}

export class EnhancedErrorHandler {
  private errorHistory: Array<{
    context: ErrorContext;
    error: any;
    resolved: boolean;
    recoveryTime: number | undefined;
  }> = [];

  private maxHistorySize = 1000;
  
  constructor() {
    this.setupGlobalErrorHandlers();
  }

  async handleError(
    error: any,
    context: ErrorContext,
    recoveryStrategies: Array<() => Promise<any>> = []
  ): Promise<McpError> {
    const errorRecord = {
      context: { ...context, timestamp: Date.now() },
      error: this.serializeError(error),
      resolved: false,
      recoveryTime: undefined as number | undefined
    };

    this.errorHistory.push(errorRecord);
    this.trimHistory();

    console.error(`🚨 Error in ${context.operation}:`, {
      tool: context.toolName,
      attempt: context.attempt,
      error: error.message || error
    });

    // Try recovery strategies
    if (recoveryStrategies.length > 0) {
      const recoveryStart = Date.now();
      
      for (let i = 0; i < recoveryStrategies.length; i++) {
        try {
          console.error(`🔧 Attempting recovery strategy ${i + 1}/${recoveryStrategies.length}...`);
          const result = await recoveryStrategies[i]();
          
          const recoveryTime: number = Date.now() - recoveryStart;
          errorRecord.resolved = true;
          errorRecord.recoveryTime = recoveryTime;
          
          console.error(`✅ Recovery successful after ${recoveryTime}ms using strategy ${i + 1}`);
          return result;
          
        } catch (recoveryError: any) {
          console.error(`❌ Recovery strategy ${i + 1} failed:`, recoveryError.message);
          continue;
        }
      }
    }

    // Convert to standardized MCP error
    return this.createMcpError(error, context);
  }

  private createMcpError(error: any, context: ErrorContext): McpError {
    // Handle Axios/HTTP errors
    if (error.response) {
      const statusCode = error.response.status;
      const responseData = error.response.data;
      
      switch (statusCode) {
        case 400:
          return new McpError(
            ErrorCode.InvalidRequest,
            `Bad Request in ${context.operation}: ${responseData?.errors?.[0]?.detail || error.message}`,
            { statusCode, tool: context.toolName }
          );
        
        case 401:
          return new McpError(
            ErrorCode.InvalidRequest,
            `Authentication failed in ${context.operation}. Please check API credentials.`,
            { statusCode, tool: context.toolName }
          );
        
        case 403:
          return new McpError(
            ErrorCode.InvalidRequest,
            `Access denied in ${context.operation}. Please check API permissions.`,
            { statusCode, tool: context.toolName }
          );
        
        case 404:
          return new McpError(
            ErrorCode.InvalidRequest,
            `Resource not found in ${context.operation}: ${responseData?.errors?.[0]?.detail || 'The requested resource does not exist'}`,
            { statusCode, tool: context.toolName }
          );
        
        case 429:
          return new McpError(
            ErrorCode.InvalidRequest,
            `Rate limit exceeded in ${context.operation}. Please retry after a few moments.`,
            { statusCode, tool: context.toolName, retryAfter: error.response.headers['retry-after'] }
          );
        
        case 500:
        case 502:
        case 503:
        case 504:
          return new McpError(
            ErrorCode.InternalError,
            `Server error in ${context.operation}: ${responseData?.errors?.[0]?.detail || 'External service temporarily unavailable'}`,
            { statusCode, tool: context.toolName, retryable: true }
          );
        
        default:
          return new McpError(
            ErrorCode.InternalError,
            `HTTP ${statusCode} error in ${context.operation}: ${responseData?.errors?.[0]?.detail || error.message}`,
            { statusCode, tool: context.toolName }
          );
      }
    }

    // Handle network/connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      return new McpError(
        ErrorCode.InternalError,
        `Network error in ${context.operation}: ${error.message}. Please check your connection.`,
        { networkError: true, tool: context.toolName, retryable: true }
      );
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new McpError(
        ErrorCode.InternalError,
        `Timeout error in ${context.operation}: Request took too long to complete.`,
        { timeout: true, tool: context.toolName, retryable: true }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return new McpError(
        ErrorCode.InvalidRequest,
        `Validation error in ${context.operation}: ${error.message}`,
        { validation: true, tool: context.toolName }
      );
    }

    // Handle MCP errors (pass through)
    if (error instanceof McpError) {
      return error;
    }

    // Generic error fallback
    return new McpError(
      ErrorCode.InternalError,
      `Unexpected error in ${context.operation}: ${error.message || 'Unknown error occurred'}`,
      { 
        tool: context.toolName,
        originalError: error.name || 'UnknownError',
        attempt: context.attempt
      }
    );
  }

  private serializeError(error: any): any {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      stack: error.stack?.split('\n').slice(0, 5), // Limit stack trace
    };
  }

  private trimHistory(): void {
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Promise Rejection:', reason);
      this.handleError(reason, {
        operation: 'unhandled_promise_rejection',
        timestamp: Date.now(),
        attempt: 1
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught Exception:', error);
      this.handleError(error, {
        operation: 'uncaught_exception',
        timestamp: Date.now(),
        attempt: 1
      });
    });
  }

  getMetrics(): ErrorMetrics {
    const totalErrors = this.errorHistory.length;
    const resolvedErrors = this.errorHistory.filter(e => e.resolved).length;
    
    const errorsByType = this.errorHistory.reduce((acc, record) => {
      const errorType = record.error.name || 'Unknown';
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByTool = this.errorHistory.reduce((acc, record) => {
      const tool = record.context.toolName || 'unknown';
      acc[tool] = (acc[tool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recoveryTimes = this.errorHistory
      .filter(e => e.resolved && e.recoveryTime)
      .map(e => e.recoveryTime!);
    
    const avgRecoveryTime = recoveryTimes.length > 0 
      ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
      : 0;

    return {
      totalErrors,
      errorsByType,
      errorsByTool,
      recoverySuccessRate: totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0,
      avgRecoveryTime: Math.round(avgRecoveryTime)
    };
  }

  getRecentErrors(hours = 24): Array<any> {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.errorHistory
      .filter(record => record.context.timestamp > cutoff)
      .map(record => ({
        ...record,
        context: {
          ...record.context,
          timestamp: new Date(record.context.timestamp).toISOString()
        }
      }));
  }

  clearHistory(): void {
    this.errorHistory = [];
    console.error('🗑️ Error history cleared');
  }
}