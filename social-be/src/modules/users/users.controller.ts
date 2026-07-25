import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { SearchUserDto } from './dto/search-user.dto';
import { RateLimit } from 'src/rate-limit/token.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @RateLimit({ capacity: 1000, refillRate: 100 / 60 })
  searchUser(
    @CurrentUser('id') userId: string,
    @Query() searchUserDto: SearchUserDto,
  ) {
    return this.usersService.searchUser(userId, searchUserDto);
  }

  @Get(':username')
  @RateLimit({ capacity: 100, refillRate: 100 / 60 })
  getProfile(
    @Param('username') username: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.getProfile(username, userId);
  }
}
