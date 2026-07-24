import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
import { UserQueryDto } from './dto/user-query.dto';
import { DeleteUserDto } from './dto/delete-usr.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('user:create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions('user:read')
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions('user:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('user:update')
  update(
    @CurrentUser('id') currentUserId: string,
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(currentUserId, userId, updateUserDto);
  }

  @Delete()
  @Permissions('user:delete')
  remove(
    @CurrentUser('id') currentUserId: string,
    @Body() deleteUserDto: DeleteUserDto,
  ) {
    return this.usersService.delete(currentUserId, deleteUserDto);
  }
}
