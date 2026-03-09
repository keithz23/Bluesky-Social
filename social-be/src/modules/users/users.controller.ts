import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { SearchUserDto } from './dto/search-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  searchUser(
    @CurrentUser('id') userId: string,
    @Query() searchUserDto: SearchUserDto,
  ) {
    return this.usersService.searchUser(userId, searchUserDto);
  }

  @Get(':username')
  getProfile(
    @Param('username') username: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.getProfile(username, userId);
  }
}
