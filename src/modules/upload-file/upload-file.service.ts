import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BaseService } from '@base/base.service';
import { UploadFile } from './entities/upload-file.entity';
import { UploadFileRepository } from './upload-file.repository';
import { LoggerService } from 'src/logger/custom.logger';
import sharp from 'sharp';
import { UPLOAD_LOCATION } from '@config/config';
import { EntityId } from 'typeorm/repository/EntityId';

@Injectable()
export class UploadFileService extends BaseService<UploadFile, UploadFileRepository> {
  constructor(repository: UploadFileRepository, logger: LoggerService) {
    super(repository, logger);
  }

  async uploadFile(userId: EntityId, file: Express.Multer.File, serverUrl: string): Promise<UploadFile> {
    if (!file) {
      throw new HttpException(`file is not null`, HttpStatus.BAD_REQUEST);
    }
    const createUploadFile = new UploadFile(null);
    createUploadFile.ownerId = <string>userId;
    createUploadFile.originUrl = `${file.filename}`;

    await sharp(file.path)
      .resize({
        width: 317,
        height: 262,
      })
      .toFile(UPLOAD_LOCATION + '/262x317-' + file.filename)
      .then(() => {
        createUploadFile.thumbUrl = '262x317-' + file.filename;
      })
      .catch((err) => {
        console.log(err);
        throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
      });
    return await this._store(createUploadFile);
  }
}
