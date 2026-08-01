import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLog, Prisma, User } from '@prisma/client';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import {
  AuditLogResponse,
  CreateAuditLogResponse,
  FindAuditLogResponse,
  FindAuditLogsResponse,
  RemoveAuditLogResponse,
  UpdateAuditLogResponse,
} from './audit-logs.interface';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly actorSelect = {
    id: true,
    username: true,
    displayName: true,
    email: true,
    avatarUrl: true,
  } as const;

  private toResponse(
    auditLog: AuditLog & {
      user: Pick<
        User,
        'id' | 'username' | 'displayName' | 'email' | 'avatarUrl'
      > | null;
    },
  ): AuditLogResponse {
    const { user, ...log } = auditLog;
    return { ...log, actor: user };
  }

  async create(
    createAuditLogDto: CreateAuditLogDto,
  ): Promise<CreateAuditLogResponse> {
    const auditLog = await this.prisma.auditLog.create({
      data: createAuditLogDto,
      include: { user: { select: this.actorSelect } },
    });

    return this.toResponse(auditLog);
  }

  async findAll(query: AuditLogQueryDto): Promise<FindAuditLogsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AuditLogWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.action
        ? { action: { contains: query.action, mode: 'insensitive' } }
        : {}),
      ...(query.actorType ? { actorType: query.actorType } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: PaginationUtil.getSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: this.actorSelect } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return PaginationUtil.paginate(
      data.map((auditLog) => this.toResponse(auditLog)),
      total,
      { page, limit },
    );
  }

  async findOne(id: string): Promise<FindAuditLogResponse> {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: this.actorSelect } },
    });
    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }
    return this.toResponse(auditLog);
  }

  async update(
    id: string,
    updateAuditLogDto: UpdateAuditLogDto,
  ): Promise<UpdateAuditLogResponse> {
    try {
      const auditLog = await this.prisma.auditLog.update({
        where: { id },
        data: updateAuditLogDto,
        include: { user: { select: this.actorSelect } },
      });
      return this.toResponse(auditLog);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Audit log not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<RemoveAuditLogResponse> {
    try {
      const auditLog = await this.prisma.auditLog.delete({
        where: { id },
        include: { user: { select: this.actorSelect } },
      });
      return this.toResponse(auditLog);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Audit log not found');
      }
      throw error;
    }
  }
}
