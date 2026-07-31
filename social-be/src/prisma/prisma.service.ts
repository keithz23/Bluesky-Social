import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AuditContextService } from 'src/common/audit/audit-context.service';
import { createAuditLogData } from 'src/common/utils/audit-log.util';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly auditedActions = new Set([
    'create',
    'createMany',
    'update',
    'updateMany',
    'upsert',
    'delete',
    'deleteMany',
  ]);

  constructor(private readonly auditContext: AuditContextService) {
    super();
    const auditLog = this.auditLog;
    const createAuditMetadata = this.createAuditMetadata.bind(this);
    const auditedActions = this.auditedActions;
    const getAuditContext = () => this.auditContext.get();

    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const result = await query(args);

            if (model !== 'AuditLog' && auditedActions.has(operation)) {
              const context = getAuditContext();
              await auditLog.create({
                data: createAuditLogData({
                  userId: context?.userId,
                  action: `${model}.${operation}`.toUpperCase(),
                  actorType: context?.actorType ?? 'SYSTEM',
                  ipAddress: context?.ipAddress,
                  userAgent: context?.userAgent,
                  metadata: createAuditMetadata(model, operation, result),
                }),
              });
            }

            return result;
          },
        },
      },
    }) as this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private createAuditMetadata(
    model: string | undefined,
    operation: string,
    result: unknown,
  ): Prisma.InputJsonObject {
    const resultData = result as { id?: unknown; count?: unknown } | null;
    const recordId =
      resultData && typeof resultData.id === 'string' ? resultData.id : null;
    const affectedCount =
      resultData && typeof resultData.count === 'number'
        ? resultData.count
        : undefined;

    return {
      model: model ?? 'UNKNOWN',
      operation,
      recordId,
      ...(affectedCount === undefined ? {} : { affectedCount }),
    };
  }
}
