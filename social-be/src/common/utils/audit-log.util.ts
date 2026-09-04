import { Prisma } from '@prisma/client';
import { AuditRequestContext } from '../audit/audit-context.service';

export const createAuditLogData = ({
  userId,
  action,
  actorType,
  userAgent,
  ipAddress,
  metadata,
}: AuditRequestContext & {
  userId?: string;
  action: string;
  metadata?: Prisma.InputJsonObject;
}) => {
  return {
    userId,
    action,
    userAgent,
    ipAddress,
    actorType,
    metadata,
  };
};
