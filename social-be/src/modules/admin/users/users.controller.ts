import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
<<<<<<< HEAD
  Query,
=======
>>>>>>> origin/feat/add-staging
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorators/permission.decorator';
<<<<<<< HEAD
import { UserQueryDto } from './dto/user-query.dto';
import { DeleteUserDto } from './dto/delete-usr.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RateLimit } from 'src/rate-limit/token.decorator';

@UseGuards(PermissionsGuard)
=======

>>>>>>> origin/feat/add-staging
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

<<<<<<< HEAD
  @RateLimit({ capacity: 100, refillRate: 10 / 60 })
  @Post()
  @Permissions('user:create')
=======
  @Post()
>>>>>>> origin/feat/add-staging
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

<<<<<<< HEAD
  @RateLimit({ capacity: 200, refillRate: 10 / 60 })
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
=======
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('user:update')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
>>>>>>> origin/feat/add-staging
  }
}
