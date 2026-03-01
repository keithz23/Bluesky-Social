import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private eventEmitter: EventEmitter2) {
    super();

    const extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // 1. Run the original query for get result from db
            const result = await query(args);

            // 2. Sort actions changed data
            const mutateActions = [
              'create',
              'update',
              'delete',
              'upsert',
              'createMany',
              'updateMany',
              'deleteMany',
            ];

            if (mutateActions.includes(operation)) {
              // 3. broadcast
              eventEmitter.emit('database.changed', {
                model,
                action: operation,
                data: result,
              });
            }

            return result;
          },
        },
      },
    });

    return extendedClient as this;
  }

  async onModuleInit() {
    await this.$connect();
  }
}
