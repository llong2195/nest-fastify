import { plainToClass } from 'class-transformer';
import { DeleteResult } from 'typeorm';

import { BaseResponseDto, iPaginationOption, PaginationResponse } from '@base/base.dto';
import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { UserService } from '../user.service';

@ApiTags('/v1/admin/user')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('v1/admin/user')
export class AdminUserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    async index(@Query() filter: iPaginationOption): Promise<PaginationResponse<UserEntity>> {
        const data = await this.userService._paginate(filter.page, filter.limit, { deleted: filter.deleted });
        return new PaginationResponse<UserEntity>(data.body, data.meta);
    }

    @Get('/inactive')
    async getInactiveUser(@Query() filter: iPaginationOption): Promise<PaginationResponse<UserEntity>> {
        const data = await this.userService.getInactiveUsers(filter);
        return new PaginationResponse<UserEntity>(data.body, data.meta);
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

    @Patch('/:id')
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
