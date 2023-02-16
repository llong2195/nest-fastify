import { plainToClass, plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';
import { createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';
import mime from 'mime-types';
import contentDisposition from 'content-disposition';
import { AuthUser } from 'src/decorators/auth.user.decorator';

import { AuthUserDto, BaseResponseDto, iPaginationOption, PaginationResponse } from '@base/base.dto';
import {
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpException,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Query,
    Req,
    Res,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UPLOAD_LOCATION } from '@src/configs/config';
import { multerOptions } from '@src/configs/multer.config';
import { Roles } from '@src/decorators/role.decorators';
import { RoleEnum } from '@src/enums';
import { FileEntity } from '@src/modules/file/entities/file.entity';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { FileService } from './file.service';

@ApiBearerAuth()
@ApiTags('/v1/file')
@Controller('v1/file')
export class FileController {
    constructor(private readonly uploadFileService: FileService) {}

    // @UseGuards(JwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'file image',
        type: CreateFileDto,
    })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file', multerOptions))
    @Post('/upload-image-local')
    async local(@UploadedFile() file: Express.Multer.File, @AuthUser() authUser?: AuthUserDto) {
        const uploadfile = await this.uploadFileService.uploadFile(authUser?.id, file);
        return new BaseResponseDto<FileEntity>(plainToClass(FileEntity, uploadfile));
    }

    // @UseGuards(JwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'file image',
        type: CreateFileDto,
    })
    @HttpCode(HttpStatus.OK)
    @Post('/upload-image-cloud')
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

    @UseGuards(JwtAuthGuard)
    @Roles(RoleEnum.ADMIN)
    @Get('/get-all')
    async getAll(@Query() filter: iPaginationOption): Promise<PaginationResponse<FileEntity>> {
        const data = await this.uploadFileService._paginate(filter.page, filter.limit, { deleted: filter.deleted });
        return new PaginationResponse<FileEntity>(data.body, data.meta);
    }

    @Get('/stream/:path')
    async stream(
        @Param('path') path: string,
        @Headers() headers,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Query('download') download = 'false',
    ): Promise<any> {
        const filePath = join(process.cwd(), UPLOAD_LOCATION, path);
        if (!existsSync(filePath)) {
            throw new NotFoundException();
        }
        const { size } = statSync(filePath);
        const contentType = mime.contentType(filePath.split('.').pop());
        const header = {
            'Content-Type': contentType,
            'Content-Length': size,
        };
        console.log(header);
        // if (contentType.includes('video')) {
        //     const videoRange = req.headers.range;
        //     const CHUNK_SIZE = 10 * 10 ** 6; // 10 MB
        //     console.log('videoRange', videoRange);

        //     if (videoRange) {
        //         const start = parseInt(videoRange.replace(/bytes=/, '').split('-')[0], 10) || 0;
        //         const end = Math.min(start + CHUNK_SIZE, size - 1);
        //         const contentLength = end - start + 1;
        //         const readStreamfile = createReadStream(filePath, {
        //             start,
        //             end,
        //         });
        //         const head = {
        //             'Accept-Ranges': 'bytes',
        //             'Content-Range': `bytes ${start}-${end}/${size}`,
        //             'Content-Length': contentLength,
        //             'Content-Type': contentType,
        //         };
        //         console.log(head);
        //         res.writeHead(HttpStatus.PARTIAL_CONTENT, head);
        //         return readStreamfile.pipe(res);
        //     } else {
        //         const head = {
        //             'Accept-Ranges': 'bytes',
        //             'Content-Length': size,
        //             'Content-Type': contentType,
        //         };
        //         res.writeHead(HttpStatus.OK, head); //200
        //         // createReadStream(videoPath).pipe(res);
        //         const readStreamfile = createReadStream(filePath);
        //         return readStreamfile.pipe(res);
        //     }
        // }
        if (download === 'true') {
            header['Content-Disposition'] = contentDisposition(filePath);
        }
        res.set(header);
        const file = createReadStream(filePath);
        return new StreamableFile(file);
    }
}