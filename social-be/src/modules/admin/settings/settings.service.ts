import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from 'src/modules/cache/cache.service';
import { CACHE_CHANNELS } from 'src/common/constants/cache-keys';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

const SETTING_DEFINITIONS = {
  'account.registration_enabled': {
    category: 'Account access',
    label: 'Allow new registrations',
    description: 'When disabled, new account sign-up requests are rejected.',
    defaultValue: true,
  },
  'account.require_email_verification': {
    category: 'Account access',
    label: 'Require verified email before sign-in',
    description:
      'When enabled, users must verify their email address before logging in.',
    defaultValue: true,
  },
  'content.max_post_length': {
    category: 'Content',
    label: 'Maximum post and reply length',
    description:
      'Applies to new posts, edits, and replies. The allowed range is 100–10,000 characters.',
    defaultValue: 300,
  },
  'moderation.keyword_scan_enabled': {
    category: 'Moderation',
    label: 'Automatic keyword scanning',
    description:
      'When enabled, new and edited posts/replies are checked against active keyword rules.',
    defaultValue: true,
  },
} as const;

type SettingKey = keyof typeof SETTING_DEFINITIONS;
type SettingValue = boolean | number;

type SystemSettingResponse = {
  key: SettingKey;
  category: string;
  label: string;
  description: string;
  value: SettingValue;
  defaultValue: SettingValue;
  isDefault: boolean;
  updatedAt: Date | null;
  updatedById: string | null;
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private values = new Map<SettingKey, SettingValue>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    this.resetMemoryToDefaults();
  }

  async onModuleInit(): Promise<void> {
    await this.cacheService.subscribe(
      CACHE_CHANNELS.SYSTEM_SETTINGS_INVALIDATED,
      async () => this.refreshCache(),
    );
    await this.refreshCache();
  }

  async findAll(): Promise<SystemSettingResponse[]> {
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: Object.keys(SETTING_DEFINITIONS) } },
      select: { key: true, value: true, updatedAt: true, updatedById: true },
    });
    const rowByKey = new Map(rows.map((row) => [row.key, row]));

    return (Object.keys(SETTING_DEFINITIONS) as SettingKey[]).map((key) => {
      const definition = SETTING_DEFINITIONS[key];
      const row = rowByKey.get(key);
      const value = this.readValue(key, row?.value) ?? definition.defaultValue;
      return {
        key,
        category: definition.category,
        label: definition.label,
        description: definition.description,
        value,
        defaultValue: definition.defaultValue,
        isDefault: !row,
        updatedAt: row?.updatedAt ?? null,
        updatedById: row?.updatedById ?? null,
      };
    });
  }

  async update(
    dto: UpdateSystemSettingsDto,
    updatedById: string,
  ): Promise<SystemSettingResponse[]> {
    const updates: Array<[SettingKey, SettingValue]> = [];
    if (dto.registrationEnabled !== undefined) {
      updates.push(['account.registration_enabled', dto.registrationEnabled]);
    }
    if (dto.requireEmailVerification !== undefined) {
      updates.push([
        'account.require_email_verification',
        dto.requireEmailVerification,
      ]);
    }
    if (dto.maxPostLength !== undefined) {
      updates.push(['content.max_post_length', dto.maxPostLength]);
    }
    if (dto.keywordScanEnabled !== undefined) {
      updates.push(['moderation.keyword_scan_enabled', dto.keywordScanEnabled]);
    }

    if (updates.length === 0) return this.findAll();

    await this.prisma.$transaction(
      updates.map(([key, value]) => {
        const definition = SETTING_DEFINITIONS[key];
        return this.prisma.systemSetting.upsert({
          where: { key },
          update: {
            value,
            category: definition.category,
            description: definition.description,
            updatedById,
          },
          create: {
            key,
            value,
            category: definition.category,
            description: definition.description,
            updatedById,
          },
        });
      }),
    );

    await this.invalidateSettingsCache();
    return this.findAll();
  }

  async reset(updatedById: string): Promise<SystemSettingResponse[]> {
    await this.prisma.systemSetting.deleteMany({
      where: { key: { in: Object.keys(SETTING_DEFINITIONS) } },
    });
    // Keep the actor in the automatic audit context; this argument documents
    // that reset is an administrative mutation and mirrors update().
    void updatedById;
    await this.invalidateSettingsCache();
    return this.findAll();
  }

  async getBoolean(key: Extract<SettingKey, string>): Promise<boolean> {
    const value = await this.getValue(key);
    return typeof value === 'boolean' ? value : Boolean(value);
  }

  async getNumber(key: Extract<SettingKey, string>): Promise<number> {
    const value = await this.getValue(key);
    return typeof value === 'number' ? value : Number(value);
  }

  private async getValue(key: SettingKey): Promise<SettingValue> {
    return this.values.get(key) ?? SETTING_DEFINITIONS[key].defaultValue;
  }

  private async invalidateSettingsCache(): Promise<void> {
    await this.refreshCache();
    await this.cacheService.publish(CACHE_CHANNELS.SYSTEM_SETTINGS_INVALIDATED);
  }

  private resetMemoryToDefaults(): void {
    this.values = new Map(
      (Object.keys(SETTING_DEFINITIONS) as SettingKey[]).map((key) => [
        key,
        SETTING_DEFINITIONS[key].defaultValue,
      ]),
    );
  }

  private async refreshCache(): Promise<void> {
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: Object.keys(SETTING_DEFINITIONS) } },
      select: { key: true, value: true },
    });
    this.resetMemoryToDefaults();
    rows.forEach((row) => {
      const key = row.key as SettingKey;
      const value = this.readValue(key, row.value);
      if (value !== undefined) this.values.set(key, value);
    });
  }

  private readValue(
    key: SettingKey,
    value: unknown,
  ): SettingValue | undefined {
    const defaultValue = SETTING_DEFINITIONS[key].defaultValue;
    return typeof value === typeof defaultValue ? (value as SettingValue) : undefined;
  }
}
