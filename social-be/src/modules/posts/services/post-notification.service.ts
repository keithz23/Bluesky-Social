import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class PostNotificationService {
  private readonly logger = new Logger(PostNotificationService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  sendSafely(
    data: Parameters<NotificationsService['sendNotification']>[0],
  ): void {
    void this.notificationsService
      .sendNotification(data)
      .catch((error: unknown) => {
        this.logger.error(
          'Failed to create notification',
          error instanceof Error ? error.stack : String(error),
        );
      });
  }
}
