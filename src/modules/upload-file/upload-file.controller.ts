import { Controller, Post, UseInterceptors, HttpCode, UploadedFile, Req, UseGuards } from '@nestjs/common';
import { UploadFileService } from './upload-file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '@config/multer.config';
import { HttpStatus } from '@nestjs/common';
import { BaseResponseDto, AuthUserDto } from '../../base/base.dto';
import { UploadFile } from './entities/upload-file.entity';
import { plainToClass } from 'class-transformer';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from 'src/decorators/auth.user.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateUploadFileDto } from './dto/create-upload-file.dto';

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
}
