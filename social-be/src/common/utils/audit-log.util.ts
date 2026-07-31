import { Prisma } from '@prisma/client';
import { AuditContext } from '../interfaces/auth.interface';

export const createAuditLogData = ({
  userId,
  action,
  actorType,
  userAgent,
  ipAddress,
  metadata,
}: AuditContext & {
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
