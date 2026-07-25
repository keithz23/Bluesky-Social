import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { RateLimitGuard } from 'src/rate-limit/rate-limit.guard';
import { RateLimit } from 'src/rate-limit/token.decorator';

// @UseGuards(RateLimitGuard)
// @RateLimit({ capacity: 1000, refillRate: 100 / 30 })
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('create-notification')
  createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get('get-notifications')
  getNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.getNotifications(userId, query);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':notificationId/read')
  markAsRead(
    @CurrentUser('id') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
