import { plainToInstance } from 'class-transformer';
import contentDisposition from 'content-disposition';
import { FastifyReply, FastifyRequest } from 'fastify';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'fs';
import mime from 'mime-types';
import { join } from 'path';
import { AuthUser } from 'src/decorators/auth.user.decorator';

import { AuthUserDto, BaseResponseDto, iPaginationOption, PaginationResponse } from '@base/base.dto';
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
    UploadedFile,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MAX_FILE_SIZE_IMAGE, UPLOAD_LOCATION } from '@src/configs/config';
import { Roles } from '@src/decorators/role.decorators';
import { RoleEnum } from '@src/enums';
import { FileEntity } from '@src/modules/file/entities/file.entity';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { FileService } from './file.service';
import util from 'util';
import { pipeline } from 'stream';
import { getFullDate } from '@utils/index';

const pump = util.promisify(pipeline);
export type MultipartFile = {
    data: Buffer;
    filename: string;
    encoding: string;
    mimetype: string;
    limit: boolean;
};

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
    async local(@Req() req: FastifyRequest, @AuthUser() authUser?: AuthUserDto) {
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
        const uploadfile = await this.uploadFileService.uploadFile(authUser?.id, file);
        return new BaseResponseDto<FileEntity>(plainToInstance(FileEntity, uploadfile));
    }

    // @UseGuards(JwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'file image',
        type: CreateFileDto,
    })
    @HttpCode(HttpStatus.OK)
    @Post('/upload-image-cloud')
    async cloud(@Req() req: FastifyRequest, @AuthUser() authUser?: AuthUserDto): Promise<BaseResponseDto<FileEntity>> {
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

    @Get('/:path')
    async stream(
        @Param('path') path: string,
        @Headers() headers,
        @Req() req: FastifyRequest,
        @Res({ passthrough: true }) res: FastifyReply,
        @Query('download') download = 'false',
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
            if (download === 'true') {
                header['Content-Disposition'] = contentDisposition(filePath);
            }
            // console.log(header);
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
            console.log(error);
        }
    }
}
