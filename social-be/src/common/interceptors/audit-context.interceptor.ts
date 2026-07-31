import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import {
  AuditContextService,
  AuditRequestContext,
} from '../audit/audit-context.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createAuditLogData } from '../utils/audit-log.util';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditContextInterceptor.name);

  constructor(
    private readonly auditContext: AuditContextService,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const auditRequestContext: AuditRequestContext = {
      userId: (request as any).user?.id,
      actorType: (request as any).user ? 'USER' : 'SYSTEM',
      ipAddress: this.getClientIp(request),
      userAgent: request.get('user-agent') || undefined,
    };

    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();
    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    return new Observable((subscriber) =>
      this.auditContext.run(auditRequestContext, () =>
        next
          .handle()
          .pipe(
            tap({
              next: () => {
                // Do not let the audit-log listing create a new row every time
                // the admin UI polls for updates.
                if (
                  request.method === 'GET' &&
                  controller !== 'AuditLogsController'
                ) {
                  this.logReadRequest(
                    auditRequestContext,
                    request,
                    response.statusCode,
                    controller,
                    handler,
                  );
                }
              },
            }),
          )
          .subscribe(subscriber),
      ),
    );
  }

  private logReadRequest(
    auditContext: AuditRequestContext,
    request: Request,
    statusCode: number,
    controller: string,
    handler: string,
  ): void {
    void this.prisma.auditLog
      .create({
        data: createAuditLogData({
          userId: auditContext.userId,
          actorType: auditContext.actorType,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          action: `GET ${controller}.${handler}`,
          metadata: {
            httpMethod: 'GET',
            path: request.path,
            statusCode,
          },
        }),
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to create GET audit log for ${controller}.${handler}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  private getClientIp(request: Request): string | undefined {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) return String(forwardedFor).split(',')[0].trim();

    const realIp = request.headers['x-real-ip'];
    if (realIp) return String(realIp);

    return request.ip || request.socket?.remoteAddress;
  }
}
