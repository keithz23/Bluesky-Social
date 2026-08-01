import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleQueryDto } from './dto/rule-query.dto';
import { DeleteRuleDto } from './dto/delete-rule.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { RulesResponse, ActiveRuleResponse } from './rules.interface';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { CacheService } from 'src/modules/cache/cache.service';
import { CACHE_CHANNELS } from 'src/common/constants/cache-keys';

@Injectable()
export class RulesService {
  constructor(
    private prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  private async invalidateKeywordCache(): Promise<void> {
    await this.cacheService.publish(CACHE_CHANNELS.KEYWORDS_INVALIDATED);
  }

  private toRulesResponse(
    rule: Prisma.RuleGetPayload<{
      include: { _count: { select: { reports: true; keywords: true } } };
    }>,
  ): RulesResponse {
    return {
      ...rule,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }

  async create(createRuleDto: CreateRuleDto): Promise<RulesResponse> {
    try {
      const rule = await this.prisma.rule.create({
        data: createRuleDto,
        include: {
          _count: {
            select: { reports: true, keywords: true },
          },
        },
      });

      await this.invalidateKeywordCache();
      return this.toRulesResponse(rule);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This rule title already exists');
      }
      throw error;
    }
  }

  async findAll(query: RuleQueryDto): Promise<PaginatedResult<RulesResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const safePage = Math.max(1, page);
    const isAll = query.all ?? false;
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = PaginationUtil.getSkip(safePage, safeLimit);

    const where: Prisma.RuleWhereInput = {};
    if (query.severity) {
      where.severity = query.severity;
    }
    if (query.status) {
      where.isActive = query.status === 'active';
    }

    const [rulesData, total] = await Promise.all([
      this.prisma.rule.findMany({
        where,
        ...(isAll ? {} : { skip, take: safeLimit }),
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { reports: true, keywords: true } },
        },
      }),
      this.prisma.rule.count({ where }),
    ]);

    const mapped: RulesResponse[] = rulesData.map((rule) =>
      this.toRulesResponse(rule),
    );

    return PaginationUtil.paginate<RulesResponse>(mapped, total, {
      page: safePage,
      limit: safeLimit,
    });
  }

  async findActiveRulesForReport(): Promise<ActiveRuleResponse[]> {
    return this.prisma.rule.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
      },
    });
  }

  async findOne(ruleId: string): Promise<RulesResponse> {
    const rule = await this.prisma.rule.findUnique({
      where: { id: ruleId },
      include: {
        _count: { select: { reports: true, keywords: true } },
      },
    });
    if (!rule) {
      throw new NotFoundException('Rule not found');
    }
    return this.toRulesResponse(rule);
  }

  async update(
    ruleId: string,
    updateRuleDto: UpdateRuleDto,
  ): Promise<RulesResponse> {
    try {
      const rule = await this.prisma.rule.update({
        where: { id: ruleId },
        data: updateRuleDto,
        include: {
          _count: { select: { reports: true, keywords: true } },
        },
      });

      await this.invalidateKeywordCache();
      return this.toRulesResponse(rule);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Rule not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('This rule title already exists');
        }
      }
      throw error;
    }
  }

  async delete(deleteRuleDto: DeleteRuleDto): Promise<Prisma.BatchPayload> {
    const { ruleIds } = deleteRuleDto;

    // Rules are referenced by moderation history (Report.ruleId is RESTRICT).
    // Deactivating retains that history and prevents their keywords from being
    // used by the moderation cache after invalidation.
    const result = await this.prisma.rule.updateMany({
      where: { id: { in: ruleIds }, isActive: true },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new NotFoundException('No active rules found to deactivate');
    }

    await this.invalidateKeywordCache();
    return result;
  }
}
