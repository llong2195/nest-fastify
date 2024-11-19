import { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import contentDisposition from 'content-disposition';
import { FastifyReply, FastifyRequest } from 'fastify';
import mime from 'mime-types';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream';
import util from 'node:util';

import { BaseController } from '@/base/base.controller';
import { BaseResponseDto } from '@/base/base.dto';
import { PaginationOption, PaginationResponse } from '@/base/pagination.dto';
import { I18nService } from '@/components/i18n.service';
import { MAX_FILE_SIZE_IMAGE, UPLOAD_LOCATION } from '@/configs';
import { Authorize } from '@/decorators';
import { ApiFile } from '@/decorators/swagger.decorator';
import { FileEntity } from '@/entities';
import { RoleEnum } from '@/enums';
import { getFullDate } from '@/utils';
import { CreateFileDto } from './dto/create-file.dto';
import { FilterFileDto } from './dto/get-file.dto';
import { FileService } from './file.service';

const pump = util.promisify(pipeline);

@ApiBearerAuth()
@ApiTags('/v1/file')
@Controller({ version: '1', path: 'file' })
export class FileController extends BaseController {
  constructor(
    private readonly uploadFileService: FileService,
    i18n: I18nService,
  ) {
    super(i18n);
  }

  @ApiFile({
    description: 'Upload file',
    type: CreateFileDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('/upload-image-local')
  async local(
    @Req() req: FastifyRequest,
    // @CurrentUser() currentUser: CurrentUserDto,
  ) {
    try {
      const file = await this.uploadImageService(req);
      const uploadfile = await this.uploadFileService.uploadFile(
        // currentUser.id,
        0,
        file,
      );
      return new BaseResponseDto<FileEntity>(uploadfile);
    } catch (error) {
      this.throwErrorProcess(error);
    }
  }

  @Authorize(RoleEnum.ADMIN)
  @Get('/get-all')
  async getAll(
    @Query() filter: PaginationOption,
  ): Promise<PaginationResponse<FileEntity>> {
    const data = await this.uploadFileService._paginate(
      filter.page,
      filter.limit,
      { deleted: filter.deleted },
    );
    return new PaginationResponse<FileEntity>(data.body, data.meta);
  }

  @Get('/:path')
  stream(
    @Param('path') path: string,
    @Headers() headers: FastifyRequest['headers'],
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Query() filter: FilterFileDto,
  ) {
    try {
      // Sanitize the path to prevent directory traversal
      let sanitizedPath = path;
      while (sanitizedPath.includes('../')) {
        sanitizedPath = sanitizedPath.replace(/\.\.\//g, '');
      }
      const filePath = join(
        process.cwd(),
        UPLOAD_LOCATION || '',
        sanitizedPath,
      );
      if (!existsSync(filePath)) {
        throw new NotFoundException();
      }
      const { size } = statSync(filePath);
      const contentType =
        mime.contentType(filePath.split('.').pop() || '') ||
        'application/octet-stream';
      const header: Record<string, string | number> = {
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
      this.throwErrorProcess(error);
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
          if (
            (contentType && contentType.match(/\/(jpg|jpeg|png|gif)$/)) ||
            (fileName && fileName.match(/\.(jpg|jpeg|png|gif)$/))
          ) {
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
        const path = join(process.cwd(), UPLOAD_LOCATION || '');
        if (!existsSync(path)) {
          mkdirSync(path, { recursive: true });
        }
        file.filename = `${getFullDate()}-${file.filename}`;
        await pump(
          file.file,
          createWriteStream(join(path, `${file.filename}`)),
        );
      }
      return file;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
