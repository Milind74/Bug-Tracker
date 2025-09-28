import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
  
  // Log request body in development (excluding sensitive data)
  if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    // Remove sensitive fields from logs
    if (logBody.password) logBody.password = '[REDACTED]';
    if (logBody.token) logBody.token = '[REDACTED]';
    console.log('Request Body:', JSON.stringify(logBody, null, 2));
  }
  
  next();
};