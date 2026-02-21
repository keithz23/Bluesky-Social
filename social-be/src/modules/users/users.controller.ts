import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  getProfile(
    @Param('username') username: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.getProfile(username, userId);
  }
}
