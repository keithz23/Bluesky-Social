import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { ModerationModule } from './moderation/moderation.module';
import { KeywordsModule } from './keywords/keywords.module';
import { RulesModule } from './rules/rules.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SettingsModule } from './settings/settings.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    UsersModule,
    PostsModule,
    DashboardModule,
    ReportsModule,
    ModerationModule,
    KeywordsModule,
    RulesModule,
    AnalyticsModule,
    SettingsModule,
    AuditLogsModule,
    PermissionsModule,
    RouterModule.register([
      {
        path: 'admin',
        children: [
          UsersModule,
          PostsModule,
          DashboardModule,
          ReportsModule,
          ModerationModule,
          KeywordsModule,
          RulesModule,
          AnalyticsModule,
          SettingsModule,
          AuditLogsModule,
          PermissionsModule,
        ],
      },
    ]),
  ],
})
export class AdminModule {}
