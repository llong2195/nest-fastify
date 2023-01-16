import {
    Controller,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Res,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '@config/multer.config';
import { AuthUserDto, BaseResponseDto } from '@base/base.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from 'src/decorators/auth.user.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateFileDto } from './dto/create-file.dto';
import { FileEntity } from '@src/modules/file/entities/file.entity';
import { Roles } from '@src/decorators/role.decorators';
import { Role } from '@src/constant';
import { PaginationResponse } from '../../base/base.dto';
import { UPLOAD_LOCATION } from '@config/config';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';

@ApiTags('/v1/file')
@Controller('v1/file')
export class FileController {
    constructor(private readonly uploadFileService: FileService) {}

    // @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', multerOptions))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'file image',
        type: CreateFileDto,
    })
    @HttpCode(HttpStatus.OK)
    @Post('/upload-local')
    async local(@UploadedFile() file: Express.Multer.File, @AuthUser() authUser?: AuthUserDto) {
        const uploadfile = await this.uploadFileService.uploadFile(authUser?.id, file);
        return new BaseResponseDto<FileEntity>(plainToClass(FileEntity, uploadfile));
    }

    // @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'file image',
        type: CreateFileDto,
    })
    @HttpCode(HttpStatus.OK)
    @Post('/upload-cloud')
    @UseInterceptors(FileInterceptor('file', multerOptions))
    async cloud(
        @UploadedFile() file: Express.Multer.File,
        @AuthUser() authUser?: AuthUserDto,
    ): Promise<BaseResponseDto<FileEntity>> {
        try {
            const data = await this.uploadFileService.uploadImageToCloudinary(file, authUser?.id);
            return new BaseResponseDto<FileEntity>(plainToInstance(FileEntity, data));
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Roles(Role.ADMIN)
    @Get('/get-all')
    async getAll(): Promise<PaginationResponse<FileEntity>> {
        const data = await this.uploadFileService._findByDeleted(false, true, 0);
        const total = await this.uploadFileService._countByDeleted(false);
        return new PaginationResponse<FileEntity>(plainToInstance(FileEntity, data), 0);
    }

    @Get('/image/download/:path')
    async GetImage(@Param('path') path: string): Promise<StreamableFile> {
        const filePath = join(process.cwd(), UPLOAD_LOCATION, path);
        if (!existsSync(filePath)) {
            throw new NotFoundException();
        }
        const file = createReadStream(filePath);

        return new StreamableFile(file);
    }

    @Get('/image/read/:path')
    async readImage(@Param('path') path: string, @Res() res: Response) {
        const filePath = join(process.cwd(), UPLOAD_LOCATION, path);
        if (!existsSync(filePath)) {
            throw new NotFoundException();
        }
        console.log(filePath);
        const file = createReadStream(filePath);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        file.pipe(res);
    }
}
