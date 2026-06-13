import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from 'src/common/constants/queue.constant';
import { RuntimeMetrics } from 'src/common/monitoring/runtime-metrics';
import { PrismaService } from 'src/prisma/prisma.service';

type HealthCheck = {
  status: 'ok' | 'error';
  latencyMs?: number;
  details?: Record<string, unknown>;
  error?: string;
};

@Injectable()
export class MonitoringService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @InjectQueue(QUEUE_NAMES.IMAGE_PROCESSING)
    private readonly imageQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private readonly cleanupQueue: Queue,
    @InjectQueue('mail')
    private readonly mailQueue: Queue,
  ) {}

  live() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const checks = {
      database: await this.checkDatabase(),
      queues: await this.checkQueues(),
    };

    const status = Object.values(checks).every((check) => check.status === 'ok')
      ? 'ok'
      : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  async health() {
    const readiness = await this.ready();

    return {
      ...this.live(),
      status: readiness.status,
      environment: this.configService.get<string>('config.nodeEnv'),
      checks: readiness.checks,
      metrics: RuntimeMetrics.snapshot(),
    };
  }

  metricsText() {
    return RuntimeMetrics.toPrometheus();
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkQueues(): Promise<HealthCheck> {
    const startedAt = Date.now();

    try {
      const queues = await Promise.all([
        this.getQueueStats(QUEUE_NAMES.IMAGE_PROCESSING, this.imageQueue),
        this.getQueueStats(QUEUE_NAMES.CLEANUP, this.cleanupQueue),
        this.getQueueStats('mail', this.mailQueue),
      ]);

      return {
        status: 'ok',
        latencyMs: Date.now() - startedAt,
        details: { queues },
      };
    } catch (error) {
      return {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Queue check failed',
      };
    }
  }

  private async getQueueStats(name: string, queue: Queue) {
    const counts = await queue.getJobCounts(
      'active',
      'waiting',
      'delayed',
      'completed',
      'failed',
      'paused',
    );

    return {
      name,
      counts,
    };
  }
}
