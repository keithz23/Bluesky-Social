import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuditRequestContext {
  userId?: string;
  actorType: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditRequestContext>();

  run<T>(context: AuditRequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): AuditRequestContext | undefined {
    return this.storage.getStore();
  }
}
