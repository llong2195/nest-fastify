import {
  Controller,
  Post,
  UseInterceptors,
  HttpCode,
  UploadedFile,
  Req,
  UseGuards,
  Get,
  Res,
  StreamableFile,
  Param,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { UploadFileService } from './upload-file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '@config/multer.config';
import { HttpStatus } from '@nestjs/common';
import { BaseResponseDto, AuthUserDto } from '@base/base.dto';
import { UploadFile } from './entities/upload-file.entity';
import { plainToClass } from 'class-transformer';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from 'src/decorators/auth.user.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateUploadFileDto } from './dto/create-upload-file.dto';
import fs, { createReadStream } from 'fs';
import { UPLOAD_LOCATION } from '@config/config';
import { join } from 'path';
import { ErrorCode } from '@src/constant/errorCode.enum';
import { diskStorage } from 'multer';
import { cloudinary } from '@src/util/cloudinary';

@ApiTags('/v1/upload-file')
@Controller('v1/upload-file')
export class UploadFileController {
  constructor(private readonly uploadFileService: UploadFileService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'file image',
    type: CreateUploadFileDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('/image')
  async create(@AuthUser() authUser: AuthUserDto, @UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const uploadfile = await this.uploadFileService.uploadFile(
      authUser.id,
      file,
      `${req.protocol}://${req.get('Host')}`,
    );
    return new BaseResponseDto<UploadFile>(plainToClass(UploadFile, uploadfile));
  }

  @Get('/image/download/:path')
  async GetImage(@Param('path') path: string): Promise<StreamableFile> {
    console.log(process.cwd());

    const file = createReadStream(join(process.cwd(), UPLOAD_LOCATION, path));

    return new StreamableFile(file);
  }

  @Get('/image/read/:path')
  async readImage(@Param('path') path: string, @Res() res: Response): Promise<any> {
    const file = createReadStream(join(process.cwd(), UPLOAD_LOCATION, path));

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    file.pipe(res);
  }

  @Get()
  async getAll(): Promise<UploadFile[]> {
    return this.uploadFileService._findByDeleted(false, true, 0);
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  public async uploadImage(@Req() req: Request, @UploadedFile() file: any) {
    try {
      if (!file) {
        throw new BadRequestException(ErrorCode.FILE_NOT_FOUND);
      }
      // Transaction avatar & user thumbnail
      const path = process.cwd() + `/public/upload/${file.filename}`;
      const uniqueFileName = Date.now() + '-' + file.originalname;
      const imagePublicId = `file/${uniqueFileName}`;

      const image = await cloudinary.uploader.upload(path, {
        public_id: imagePublicId,
        tags: `avatars`,
        quality: 60,
      });

      fs.unlinkSync(path);
      return image;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
