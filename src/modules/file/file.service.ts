import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseService } from '@base/base.service';
import { FileEntity } from './entities/file.entity';
import { FileRepository } from './file.repository';
import { LoggerService } from 'src/logger/custom.logger';
import sharp from 'sharp';
import { UPLOAD_LOCATION } from '@config/config';
import { EntityId } from 'typeorm/repository/EntityId';
import { cloudinary } from '@src/util/cloudinary';
import { ErrorCode } from '@src/constant';
import * as fs from 'fs';

@Injectable()
export class FileService extends BaseService<FileEntity, FileRepository> {
  constructor(repository: FileRepository, logger: LoggerService) {
    super(repository, logger);
  }

  async uploadFile(userId: number, file: Express.Multer.File): Promise<FileEntity> {
    if (!file) {
      throw new HttpException(`file is not null`, HttpStatus.BAD_REQUEST);
    }
    const createFile = new FileEntity(null);
    createFile.userId = userId;
    createFile.originUrl1 = `${file.filename}`;
    await sharp(file.path)
      .resize({
        width: 317,
        height: 262,
      })
      .toFile(UPLOAD_LOCATION + '/262x317-' + file.filename)
      .then(() => {
        createFile.thumbUrl = '262x317-' + file.filename;
      })
      .catch((err) => {
        console.log(err);
        throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
      });
    return await this._store(createFile);
  }

  async uploadImageToCloudinary(file: Express.Multer.File, userId: number): Promise<FileEntity> {
    try {
      if (!file) {
        throw new BadRequestException(ErrorCode.FILE_NOT_FOUND);
      }
      console.log(file);
      const path = process.cwd() + `/${UPLOAD_LOCATION}/${file.filename}`;
      const uniqueFileName = Date.now() + '-' + file.originalname;
      const imagePublicId = `file/${uniqueFileName}`;

      const image = await cloudinary.uploader.upload(path, {
        public_id: imagePublicId,
        tags: `avatars`,
        quality: 60,
      });

      const createFile = new FileEntity({});
      createFile.originUrl1 = image.url;
      createFile.originUrl2 = image.secure_url;
      createFile.width = image.width;
      createFile.height = image.height;
      createFile.size = image.bytes;
      createFile.publicId = image.public_id;
      createFile.userId = userId || null;
      createFile.data = JSON.stringify(image);
      await createFile.save();
      fs.unlinkSync(path);
      return createFile;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
