import { MultipartFile } from '@fastify/multipart';
import { plainToInstance } from 'class-transformer';
import contentDisposition from 'content-disposition';
import { FastifyReply, FastifyRequest } from 'fastify';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'fs';
import mime from 'mime-types';
import { join } from 'path';
import { pipeline } from 'stream';
import util from 'util';

import { BaseResponseDto, CurrentUserDto } from '@base/base.dto';
import { PaginationOption, PaginationResponse } from '@base/pagination.dto';
import { MAX_FILE_SIZE_IMAGE, UPLOAD_LOCATION } from '@configs/config';
import { CurrentUser, Roles } from '@decorators/index';
import { FileEntity } from '@entities/file.entity';
import { RoleEnum } from '@enums/role.enum';
import {
    BadRequestException,
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
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { getFullDate } from '@utils/index';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { FilterFileDto } from './dto/get-file.dto';
import { FileService } from './file.service';

const pump = util.promisify(pipeline);

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
    @Post('/upload-image-local')
    async local(@Req() req: FastifyRequest, @CurrentUser() currentUser?: CurrentUserDto) {
        try {
            const file = await await this.uploadImageService(req);
            const uploadfile = await this.uploadFileService.uploadFile(currentUser?.id, file);
            return new BaseResponseDto<FileEntity>(plainToInstance(FileEntity, uploadfile));
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    // @UseGuards(JwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'file image',
        type: CreateFileDto,
    })
    @HttpCode(HttpStatus.OK)
    @Post('/upload-image-cloud')
    async cloud(
        @Req() req: FastifyRequest,
        @CurrentUser() currentUser?: CurrentUserDto,
    ): Promise<BaseResponseDto<FileEntity>> {
        try {
            const file = await this.uploadImageService(req);
            const data = await this.uploadFileService.uploadImageToCloudinary(file, currentUser?.id);
            return new BaseResponseDto<FileEntity>(plainToInstance(FileEntity, data));
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Roles(RoleEnum.ADMIN)
    @Get('/get-all')
    async getAll(@Query() filter: PaginationOption): Promise<PaginationResponse<FileEntity>> {
        const data = await this.uploadFileService._paginate(filter.page, filter.limit, { deleted: filter.deleted });
        return new PaginationResponse<FileEntity>(data.body, data.meta);
    }

    @Get('/:path')
    async stream(
        @Param('path') path: string,
        @Headers() headers,
        @Req() req: FastifyRequest,
        @Res({ passthrough: true }) res: FastifyReply,
        @Query() filter: FilterFileDto,
    ): Promise<any> {
        try {
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
            if (filter.download === true) {
                header['Content-Disposition'] = contentDisposition(filePath);
            }
            if (contentType.includes('video')) {
                const videoRange = headers.range;
                const CHUNK_SIZE = 10 * 10 ** 6; // 10 MB
                if (videoRange) {
                    const start = Number(videoRange.replace(/\D/g, ''));
                    const end = Math.min(start + CHUNK_SIZE, size - 1);
                    const contentLength = end - start + 1;
                    const readStreamfile = createReadStream(filePath, {
                        start,
                        end,
                    });
                    const head = {
                        'Accept-Ranges': 'bytes',
                        'Content-Type': contentType,
                        'Content-Range': `bytes ${start}-${end}/${size}`,
                        'Content-Length': contentLength,
                    };
                    res.status(HttpStatus.PARTIAL_CONTENT).headers(head); //206
                    return new StreamableFile(readStreamfile);
                } else {
                    const head = {
                        'Accept-Ranges': 'bytes',
                        'Content-Type': contentType,
                        'Content-Length': size,
                    };
                    res.status(HttpStatus.OK).headers(head); //200
                    // createReadStream(videoPath).pipe(res);
                    const readStreamfile = createReadStream(filePath);
                    return new StreamableFile(readStreamfile);
                }
            } else {
                res.headers(header);
                const file = createReadStream(filePath);
                return new StreamableFile(file);
            }
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * It takes a request, checks if the request has a file, if it does, it checks if the file is an
     * image, if it is, it saves the file to the server
     * @param {FastifyRequest} req - FastifyRequest - The request object
     * @returns A MultipartFile object
     */
    async uploadImageService(req: FastifyRequest): Promise<MultipartFile> {
        try {
            const file = await req.file({
                limits: {
                    files: 1,
                    fileSize: MAX_FILE_SIZE_IMAGE,
                },
                isPartAFile: (fieldName, contentType, fileName) => {
                    if (fieldName !== 'file') {
                        return false;
                    }
                    if (contentType.match(/\/(jpg|jpeg|png|gif)$/) || fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
                        // Allow storage of file
                        return true;
                    } else {
                        // Reject file
                        return false;
                    }
                },
            });
            if (!file || file == undefined || file == null) {
                throw new BadRequestException();
            } else {
                const path = join(process.cwd(), UPLOAD_LOCATION);
                if (!existsSync(path)) {
                    mkdirSync(path, { recursive: true });
                }
                file.filename = `${getFullDate()}-${file.filename}`;
                await pump(file.file, createWriteStream(join(path, `${file.filename}`)));
            }
            return file;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }
}
