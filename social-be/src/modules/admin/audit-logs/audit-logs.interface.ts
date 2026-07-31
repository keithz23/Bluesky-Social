import { Prisma } from '@prisma/client';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';

export interface AuditActorResponse {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export interface AuditLogResponse {
  id: string;
  userId: string | null;
  action: string;
  actorType: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  actor: AuditActorResponse | null;
}

export type CreateAuditLogResponse = AuditLogResponse;
export type FindAuditLogResponse = AuditLogResponse;
export type UpdateAuditLogResponse = AuditLogResponse;
export type RemoveAuditLogResponse = AuditLogResponse;
export type FindAuditLogsResponse = PaginatedResult<AuditLogResponse>;
