import { Module } from '@nestjs/common';
import { ListItemService } from './list-item.service';
import { ListItemController } from './list-item.controller';

@Module({
  controllers: [ListItemController],
  providers: [ListItemService],
})
export class ListItemModule {}
