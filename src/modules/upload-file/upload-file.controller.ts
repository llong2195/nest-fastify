import {
  Controller,
  Post,
  UseInterceptors,
  HttpCode,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { UploadFileService } from './upload-file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '@config/multer.config';
import { HttpStatus } from '@nestjs/common';
import { BaseResponseDto } from '../../base/base.dto';
import { UploadFile } from './entities/upload-file.entity';
import { plainToClass } from 'class-transformer';
import { Request } from 'express';

@Controller('v1/upload-file')
export class UploadFileController {
  constructor(private readonly uploadFileService: UploadFileService) {}

  @UseInterceptors(FileInterceptor('file', multerOptions))
  @HttpCode(HttpStatus.OK)
  @Post()
  async create(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const uploadfile = await this.uploadFileService.uploadFile(
      1,
      file,
      `${req.protocol}://${req.get('Host')}`,
    );
    return new BaseResponseDto<UploadFile>(
      'Success',
      plainToClass(UploadFile, uploadfile),
    );
  }
}
