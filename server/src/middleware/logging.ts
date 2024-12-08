import { Request, Response, NextFunction } from 'express';
import { logRequest, logError, logPerformance, logSecurity } from '../config/logger';

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the incoming request
  logRequest(req);

  // Track response time
  const start = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Log performance for slow requests (> 1000ms)
    if (duration > 1000) {
      logPerformance(
        `Slow request: ${req.method} ${req.path}`,
        duration,
        { statusCode }
      );
    }

    // Log security concerns for specific status codes
    if (statusCode === 401 || statusCode === 403) {
      logSecurity('Authentication/Authorization failure', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        statusCode,
      });
    }
  });

  next();
};

// Error logging middleware
export const errorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logError(error, req);
  next(error);
};

// Rate limit logging middleware
export const rateLimitLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const limit = req.rateLimit;
  
  if (limit && limit.remaining === 0) {
    logSecurity('Rate limit exceeded', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      limit: limit.limit,
      current: limit.current,
    });
  }
  
  next();
};

// Security events logging middleware
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log suspicious requests (potential security threats)
  const suspiciousPatterns = [
    /\.\.[\/\\]/,  // Directory traversal
    /<script>/i,   // XSS attempts
    /'/,           // SQL injection attempts
  ];

  const requestUrl = req.url;
  const requestBody = JSON.stringify(req.body);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestUrl) || pattern.test(requestBody)) {
      logSecurity('Suspicious request pattern detected', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        pattern: pattern.toString(),
      });
      break;
    }
  }

  next();
};

// Performance monitoring middleware
export const performanceLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Log memory usage before request processing
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const endMemory = process.memoryUsage();
    
    // Calculate memory difference
    const memoryDiff = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
      rss: endMemory.rss - startMemory.rss,
    };

    // Log significant memory usage
    if (memoryDiff.heapUsed > 50 * 1024 * 1024) { // 50MB threshold
      logPerformance(
        `High memory usage: ${req.method} ${req.path}`,
        duration,
        {
          memoryDiff,
          endpoint: `${req.method} ${req.path}`,
        }
      );
    }
  });

  next();
};

// Database query logging middleware
export const dbQueryLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Attach query logging to the request object
  (req as any).dbLogger = (operation: string, duration: number) => {
    logPerformance(`DB Query: ${operation}`, duration, {
      endpoint: `${req.method} ${req.path}`,
    });
  };

  next();
};
