import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { BaseResponseDto } from '@base/base.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { plainToClass } from 'class-transformer';
import { UpdateUserDto } from '../dto/update-user.dto';
import { DeleteResult } from 'typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';

@ApiTags('/v1/admin')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('v1/admin')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async index(): Promise<BaseResponseDto<UserEntity[]>> {
    const users = await this.userService._findForDeleted(false, true, 0);
    return new BaseResponseDto<UserEntity[]>(users);
  }

  @Get('/inactive')
  async getInactiveUser(): Promise<BaseResponseDto<UserEntity[]>> {
    const users = await this.userService.getInactiveUsers();
    return new BaseResponseDto<UserEntity[]>(users);
  }

  @Get('/:id')
  async show(@Param('id') id: number): Promise<BaseResponseDto<UserEntity>> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException();
    }
    return new BaseResponseDto<UserEntity>(user);
  }

  @Post()
  async create(@Body() userData: CreateUserDto): Promise<BaseResponseDto<UserEntity>> {
    const createdUser = await this.userService._store(userData);
    return new BaseResponseDto<UserEntity>(plainToClass(UserEntity, createdUser));
  }

  @Put('/:id')
  async update(@Param('id') id: number, @Body() userData: UpdateUserDto): Promise<BaseResponseDto<UserEntity>> {
    const createdUser = this.userService._update(id, userData);
    return new BaseResponseDto<UserEntity>(plainToClass(UserEntity, createdUser));
  }

  @Delete('/:id')
  async destroy(@Param('id') id: number): Promise<BaseResponseDto<DeleteResult>> {
    await this.userService._softDelete(id);
    return new BaseResponseDto<DeleteResult>(null);
  }
}
