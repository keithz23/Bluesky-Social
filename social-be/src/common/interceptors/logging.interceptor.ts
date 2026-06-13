import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RuntimeMetrics } from '../monitoring/runtime-metrics';

type LogLevel = 'log' | 'warn' | 'error';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  private readonly skipPathPrefixes = [
    '/health',
    '/healthz',
    '/metrics',
    '/api/v1/health',
    '/api/v1/healthz',
    '/api/v1/metrics',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const method = req.method;
    const url = req.originalUrl || req.url;

    if (this.shouldSkip(url)) return next.handle();

    const requestId = this.getRequestId(req);
    const route = this.getRoutePath(req, url);
    const startedAt = Date.now();

    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    RuntimeMetrics.onRequestStart();

    this.write('log', {
      event: 'http.request.started',
      requestId,
      method,
      url,
      route,
      userId: (req as any).user?.id ?? null,
      ip: this.getClientIp(req),
      userAgent: this.truncate(req.get('user-agent') || 'unknown', 200),
      query: this.redactAndTruncate(req.query),
      body: this.shouldLogBody(method)
        ? this.redactAndTruncate(req.body)
        : undefined,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          const statusCode = res.statusCode;
          RuntimeMetrics.onRequestEnd({
            method,
            route,
            statusCode,
            durationMs,
          });

          this.write(statusCode >= 500 ? 'error' : 'log', {
            event: 'http.request.completed',
            requestId,
            method,
            url,
            route,
            statusCode,
            durationMs,
          });
        },
        error: (error) => {
          const durationMs = Date.now() - startedAt;
          const statusCode = this.getErrorStatus(error, res);
          RuntimeMetrics.onRequestEnd({
            method,
            route,
            statusCode,
            durationMs,
          });

          this.write(statusCode >= 500 ? 'error' : 'warn', {
            event: 'http.request.failed',
            requestId,
            method,
            url,
            route,
            statusCode,
            durationMs,
            errorName: error?.name,
            message: this.getErrorMessage(error),
            stack:
              process.env.NODE_ENV === 'production' ? undefined : error?.stack,
          });
        },
      }),
    );
  }

  private shouldSkip(url: string) {
    return this.skipPathPrefixes.some((path) => url.startsWith(path));
  }

  private shouldLogBody(method: string) {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  }

  private getRequestId(req: Request) {
    const header = req.headers['x-request-id'];
    if (Array.isArray(header)) return header[0] || randomUUID();
    return header || randomUUID();
  }

  private getRoutePath(req: Request, url: string) {
    const routePath = (req as any).route?.path;
    if (typeof routePath === 'string') {
      return `${req.baseUrl || ''}${routePath}`;
    }

    return url.split('?')[0];
  }

  private getErrorStatus(error: unknown, res: Response) {
    if (error instanceof HttpException) return error.getStatus();
    return ((error as any)?.status as number) || res.statusCode || 500;
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      return (response as any)?.message ?? error.message;
    }

    return error instanceof Error ? error.message : 'Unknown error';
  }

  private getClientIp(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) return String(xForwardedFor).split(',')[0].trim();

    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) return String(xRealIp);

    const cfConnectingIp = request.headers['cf-connecting-ip'];
    if (cfConnectingIp) return String(cfConnectingIp);

    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  private redactAndTruncate(value: unknown, maxLength = 2_000): unknown {
    const sensitiveKeys = new Set([
      'password',
      'pass',
      'pwd',
      'token',
      'accesstoken',
      'refreshtoken',
      'authorization',
      'cookie',
      'cookies',
      'secret',
      'apikey',
      'x-api-key',
      'otp',
      'code',
    ]);

    const walk = (input: unknown): unknown => {
      if (input == null) return input;
      if (Array.isArray(input)) return input.slice(0, 50).map(walk);

      if (typeof input === 'object') {
        const output: Record<string, unknown> = {};
        for (const [key, nestedValue] of Object.entries(input).slice(0, 100)) {
          output[key] = sensitiveKeys.has(key.toLowerCase())
            ? '[REDACTED]'
            : walk(nestedValue);
        }
        return output;
      }

      if (typeof input === 'string') return this.truncate(input, 500);
      return input;
    };

    const cleaned = walk(value);
    const serialized = JSON.stringify(cleaned);
    if (!serialized || serialized.length <= maxLength) return cleaned;

    return {
      truncated: true,
      preview: this.truncate(serialized, maxLength),
    };
  }

  private truncate(value: string, maxLength: number) {
    return value.length > maxLength
      ? `${value.slice(0, Math.max(0, maxLength - 3))}...`
      : value;
  }

  private write(level: LogLevel, payload: Record<string, unknown>) {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'social-be',
      ...payload,
    });

    if (level === 'error') this.logger.error(line);
    else if (level === 'warn') this.logger.warn(line);
    else this.logger.log(line);
  }
}
