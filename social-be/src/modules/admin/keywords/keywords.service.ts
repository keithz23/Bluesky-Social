import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Keyword } from '@prisma/client';
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { UpdateKeywordDto } from './dto/update-keyword.dto';
import { KeywordQueryDto } from './dto/keyword-query.dto';
import { DeleteKeywordDto } from './dto/delete-keyword.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { CacheService } from 'src/modules/cache/cache.service';
import { CACHE_CHANNELS } from 'src/common/constants/cache-keys';

type KeywordWithRule = Keyword & {
  rule: { id: string; title: string; severity: string };
};

@Injectable()
export class KeywordsService implements OnModuleInit {
  private keywordCache: KeywordWithRule[] = [];

  constructor(
    private prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit() {
    await this.cacheService.subscribe(
      CACHE_CHANNELS.KEYWORDS_INVALIDATED,
      async () => this.refreshCache(),
    );
    await this.refreshCache();
  }

  private async refreshCache() {
    this.keywordCache = await this.prisma.keyword.findMany({
      where: { rule: { isActive: true } },
      include: {
        rule: { select: { id: true, title: true, severity: true } },
      },
    });
  }

  private async invalidateKeywordCache(): Promise<void> {
    await this.refreshCache();
    await this.cacheService.publish(CACHE_CHANNELS.KEYWORDS_INVALIDATED);
  }

  async create(createKeywordDto: CreateKeywordDto) {
    const rule = await this.prisma.rule.findUnique({
      where: { id: createKeywordDto.ruleId },
      select: { id: true },
    });
    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    try {
      const created = await this.prisma.keyword.create({
        data: {
          word: createKeywordDto.word.trim().toLowerCase(),
          ruleId: createKeywordDto.ruleId,
          action: createKeywordDto.action,
        },
        include: {
          rule: { select: { id: true, title: true, severity: true } },
        },
      });
      await this.invalidateKeywordCache();
      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This keyword already exists');
      }
      throw error;
    }
  }

  async findAll(query: KeywordQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = PaginationUtil.getSkip(safePage, safeLimit);

    const where: Prisma.KeywordWhereInput = {
      ...(query.ruleId && { ruleId: query.ruleId }),
      ...(query.action && { action: query.action }),
      ...(query.search && {
        word: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [keywordsData, total] = await Promise.all([
      this.prisma.keyword.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          rule: {
            select: {
              id: true,
              title: true,
              description: true,
              severity: true,
            },
          },
        },
      }),
      this.prisma.keyword.count({ where }),
    ]);

    return PaginationUtil.paginate(keywordsData, total, {
      page: safePage,
      limit: safeLimit,
    });
  }

  async findOne(keywordId: string) {
    const keyword = await this.prisma.keyword.findUnique({
      where: { id: keywordId },
      include: { rule: true },
    });
    if (!keyword) {
      throw new NotFoundException('Keyword not found');
    }
    return keyword;
  }

  async update(keywordId: string, updateKeywordDto: UpdateKeywordDto) {
    if (updateKeywordDto.ruleId) {
      const rule = await this.prisma.rule.findUnique({
        where: { id: updateKeywordDto.ruleId },
        select: { id: true },
      });
      if (!rule) {
        throw new NotFoundException('Rule not found');
      }
    }

    try {
      const updated = await this.prisma.keyword.update({
        where: { id: keywordId },
        data: {
          ...updateKeywordDto,
          ...(updateKeywordDto.word && {
            word: updateKeywordDto.word.trim().toLowerCase(),
          }),
        },
        include: {
          rule: { select: { id: true, title: true, severity: true } },
        },
      });
      await this.invalidateKeywordCache();
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Keyword not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('This keyword already exists');
        }
      }
      throw error;
    }
  }

  async delete(deleteKeywordDto: DeleteKeywordDto) {
    const { keywordIds } = deleteKeywordDto;
    const result = await this.prisma.keyword.deleteMany({
      where: { id: { in: keywordIds } },
    });
    if (result.count === 0) {
      throw new NotFoundException('No keywords found to delete');
    }
    await this.invalidateKeywordCache();
    return result;
  }

  scanContent(content: string) {
    const normalized = content.toLowerCase();
    const matched = this.keywordCache.filter((k) =>
      normalized.includes(k.word),
    );

    if (matched.length === 0) {
      return { matched: false as const, action: null, matches: [] };
    }

    const actionPriority: Record<string, number> = {
      AUTO_HIDE: 3,
      WARN: 2,
      FLAG: 1,
    };
    const strongestMatch = matched.reduce((a, b) =>
      actionPriority[a.action] >= actionPriority[b.action] ? a : b,
    );

    return {
      matched: true as const,
      action: strongestMatch.action,
      matches: matched.map((m) => ({
        word: m.word,
        ruleId: m.ruleId,
        ruleTitle: m.rule.title,
        action: m.action,
      })),
    };
  }
}
