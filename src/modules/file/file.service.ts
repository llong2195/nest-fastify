import { MultipartFile } from '@fastify/multipart';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlinkSync } from 'node:fs';
import { Repository } from 'typeorm';

import { BaseService } from '@base/base.service';
import { API_PREFIX, SERVER_URL, UPLOAD_LOCATION } from '@configs/config';
import { ErrorMessageCode } from '@constants/error-message-code';
import { FileEntity } from '@entities/file.entity';
import { FileType } from '@enums/file.enum';
import { NotFoundError } from '@exceptions/errors';
import { LoggerService } from '@logger/custom.logger';
import { cloudinary } from '@utils/cloudinary.util';

@Injectable()
export class FileService extends BaseService<FileEntity, Repository<FileEntity>> {
  constructor(@InjectRepository(FileEntity) repository: Repository<FileEntity>, logger: LoggerService) {
    super(repository, logger);
  }

  /**
   * It uploads a file, resizes it, and saves it to the database
   * @param {number} userId - number, file: MultipartFile
   * @param file - MultipartFile
   * @returns The file entity
   */
  async uploadFile(userId: number, file: MultipartFile): Promise<FileEntity> {
    if (!file) {
      throw new HttpException(`file is not null`, HttpStatus.BAD_REQUEST);
    }
    const createFile = new FileEntity(null);
    createFile.userId = userId;
    createFile.originUrl = `${SERVER_URL}/${API_PREFIX}/v1/file/${file.filename}`;
    createFile.type = FileType.IMAGE;
    return await this._store(createFile);
  }

  /**
   * It uploads a file to cloudinary, creates a file entity in the database, and returns the file
   * entity
   * @param file - MultipartFile - The file object that Multer has created for us.
   * @param {number} userId - The userId of the user who uploaded the image.
   * @param {string} [tags] - tags ? tags : `avatars`,
   * @returns The file entity
   */
  async uploadImageToCloudinary(file: MultipartFile, userId: number, tags?: string): Promise<FileEntity> {
    try {
      if (!file) {
        throw new NotFoundError(ErrorMessageCode.NOT_FOUND);
      }
      const path = process.cwd() + `/${UPLOAD_LOCATION}/${file.filename}`;
      const uniqueFileName = Date.now() + '-' + file.filename;
      const imagePublicId = `file/${uniqueFileName}`;

      const image = await cloudinary.uploader.upload(path, {
        public_id: imagePublicId,
        tags: tags ? tags : `avatars`,
        quality: 60,
      });

      const createFile = new FileEntity({});
      createFile.originUrl = image.url;
      createFile.width = image.width;
      createFile.height = image.height;
      createFile.size = image.bytes;
      createFile.publicId = image.public_id;
      createFile.userId = userId || null;
      createFile.data = JSON.stringify(image);
      await this._store(createFile);
      unlinkSync(path);
      return createFile;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
