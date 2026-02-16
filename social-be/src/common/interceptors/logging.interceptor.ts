import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  private readonly skipPaths = new Set<string>(['/health', '/healthz']);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const method = req.method;
    const url = req.originalUrl || req.url;

    if (this.skipPaths.has(url)) return next.handle();

    // request id: reuse header if present
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    res.setHeader('X-Request-Id', requestId);

    const userAgent = this.sanitizeUserAgent(req.get('user-agent') || '');
    const userId = (req as any).user?.id ?? 'anonymous';
    const ip = this.getClientIp(req);
    const started = Date.now();

    // only log bodies for mutating methods; redact + cap
    const safeBody =
      method === 'POST' ||
      method === 'PUT' ||
      method === 'PATCH' ||
      method === 'DELETE'
        ? this.redactAndTruncate(req.body)
        : undefined;

    const safeQuery = this.redactAndTruncate(req.query);

    this.logger.log(
      `[${requestId}] ➜ ${method} ${url} | user=${userId} | ip=${ip} | ua="${userAgent}"` +
        (safeQuery ? ` | query=${JSON.stringify(safeQuery)}` : '') +
        (safeBody ? ` | body=${JSON.stringify(safeBody)}` : ''),
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - started;
          const statusCode = res.statusCode;
          this.logger.log(
            `[${requestId}] ✓ ${method} ${url} -> ${statusCode} (${ms}ms)`,
          );
        },
        error: (err) => {
          const ms = Date.now() - started;

          // try to get status/message consistently
          const status =
            err instanceof HttpException
              ? err.getStatus()
              : (err?.status as number) || res.statusCode || 500;

          const message =
            err instanceof HttpException
              ? ((err.getResponse() as any)?.message ?? err.message)
              : (err?.message ?? 'Unknown error');

          this.logger.error(
            `[${requestId}] ✗ ${method} ${url} -> ${status} (${ms}ms) - ${message}`,
            err?.stack,
          );
        },
      }),
    );
  }

  /**
   * Get client IP address (handles proxies, load balancers, CDN)
   */
  private getClientIp(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = String(xForwardedFor).split(',');
      return ips[0].trim();
    }
    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) return String(xRealIp);

    const cfConnectingIp = request.headers['cf-connecting-ip'];
    if (cfConnectingIp) return String(cfConnectingIp);

    return (
      (request.ip as string) ||
      (request.socket?.remoteAddress as string) ||
      (request.connection as any)?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Sanitize user agent (truncate if too long)
   */
  private sanitizeUserAgent(userAgent: string): string {
    if (!userAgent) return 'unknown';
    return userAgent.length > 200 ? userAgent.slice(0, 200) + '…' : userAgent;
  }

  /**
   * Redact sensitive keys and truncate large values/objects
   */
  private redactAndTruncate<T extends Record<string, any>>(
    obj: T | undefined,
    maxLen = 2_000,
  ): T | undefined {
    if (!obj || typeof obj !== 'object') return obj;

    const SENSITIVE_KEYS = new Set([
      'password',
      'pass',
      'pwd',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      'cookies',
      'secret',
      'apiKey',
      'x-api-key',
      'otp',
      'code',
    ]);

    const walk = (value: any): any => {
      if (value == null) return value;

      if (Array.isArray(value)) {
        return value.slice(0, 50).map(walk); // cap large arrays
      }

      if (typeof value === 'object') {
        const out: Record<string, any> = {};
        const entries = Object.entries(value).slice(0, 100); // cap object size
        for (const [k, v] of entries) {
          if (SENSITIVE_KEYS.has(k.toLowerCase())) {
            out[k] = '[REDACTED]';
          } else {
            out[k] = walk(v);
          }
        }
        return out;
      }

      if (typeof value === 'string') {
        return value.length > 500 ? value.slice(0, 500) + '…' : value;
      }

      return value;
    };

    const cleaned = walk(obj);

    // final safety: cap total JSON length
    try {
      let json = JSON.stringify(cleaned);
      if (json.length > maxLen) {
        json = json.slice(0, maxLen) + '…';
        return JSON.parse(json + '"');
      }
      return cleaned as T;
    } catch {
      return undefined;
    }
  }
}
