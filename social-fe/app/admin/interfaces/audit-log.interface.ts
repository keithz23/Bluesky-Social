export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  actorType: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  actorType?: string;
  from?: string;
  to?: string;
}
