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
import { BaseResponseDto } from '../../../base/base.dto';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { plainToClass } from 'class-transformer';
import { UpdateUserDto } from '../dto/update-user.dto';
import { DeleteResult } from 'typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('/v1/admin')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('v1/admin')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async index(): Promise<BaseResponseDto<User[]>> {
    const users = await this.userService._findByAdmin(false, true, 0);
    return new BaseResponseDto<User[]>(users);
  }

  @Get('/inactive')
  async getInactiveUser(): Promise<BaseResponseDto<User[]>> {
    const users = await this.userService.getInactiveUsers();
    return new BaseResponseDto<User[]>(users);
  }

  @Get('/:id')
  async show(@Param('id') id: number): Promise<BaseResponseDto<User>> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException();
    }
    return new BaseResponseDto<User>(user);
  }

  @Post()
  async create(@Body() userData: CreateUserDto): Promise<BaseResponseDto<User>> {
    const createdUser = await this.userService._store(userData);
    return new BaseResponseDto<User>(plainToClass(User, createdUser));
  }

  @Put('/:id')
  async update(@Param('id') id: number, @Body() userData: UpdateUserDto): Promise<BaseResponseDto<User>> {
    const createdUser = this.userService._update(id, userData);
    return new BaseResponseDto<User>(plainToClass(User, createdUser));
  }

  @Delete('/:id')
  async destroy(@Param('id') id: number): Promise<BaseResponseDto<DeleteResult>> {
    await this.userService._softDelete(id);
    return new BaseResponseDto<DeleteResult>(null);
  }
}
