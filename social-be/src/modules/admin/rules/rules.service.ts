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

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService) {}

  async create(createRuleDto: CreateRuleDto) {
    try {
      return await this.prisma.rule.create({
        data: createRuleDto,
      });
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

  async findAll(query: RuleQueryDto) {
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
        skip,
        ...(isAll ? {} : { skip, take: safeLimit }),
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { reports: true, keywords: true } },
        },
      }),
      this.prisma.rule.count({ where }),
    ]);

    return PaginationUtil.paginate(rulesData, total, {
      page: safePage,
      limit: safeLimit,
    });
  }

  async findActiveRulesForReport() {
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

  async findOne(ruleId: string) {
    const rule = await this.prisma.rule.findUnique({
      where: { id: ruleId },
      include: {
        _count: { select: { reports: true, keywords: true } },
      },
    });
    if (!rule) {
      throw new NotFoundException('Rule not found');
    }
    return rule;
  }

  async update(ruleId: string, updateRuleDto: UpdateRuleDto) {
    try {
      return await this.prisma.rule.update({
        where: { id: ruleId },
        data: updateRuleDto,
      });
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

  async delete(deleteRuleDto: DeleteRuleDto) {
    const { ruleIds } = deleteRuleDto;

    const rules = await this.prisma.rule.findMany({
      where: { id: { in: ruleIds } },
      include: { _count: { select: { reports: true } } },
    });

    const ruleInUse = rules.find((r) => r._count.reports > 0);
    if (ruleInUse) {
      throw new ConflictException(
        `Rule "${ruleInUse.title}" is still referenced by existing reports. Deactivate it instead of deleting.`,
      );
    }

    return await this.prisma.rule.deleteMany({
      where: { id: { in: ruleIds } },
    });
  }
}
