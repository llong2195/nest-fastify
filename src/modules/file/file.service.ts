import { Repository } from 'typeorm';

import { BaseService } from '@/common/base/base.service';
import { FileType } from '@/common/enums';
import { LoggerService } from '@/common/logger/custom.logger';
import { API_PREFIX, SERVER_URL } from '@/configs';
import { FileEntity } from '@/database/pg/entities/entities';
import { MultipartFile } from '@fastify/multipart';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FileService extends BaseService<
  FileEntity,
  Repository<FileEntity>
> {
  constructor(
    @InjectRepository(FileEntity) repository: Repository<FileEntity>,
    logger: LoggerService,
  ) {
    super(repository, logger);
  }

  /**
   * It uploads a file, resizes it, and saves it to the database
   * @param {number} userId - number, file: MultipartFile
   * @param file - MultipartFile
   * @returns The file entity
   */
  async uploadFile(
    userId: number,
    file: MultipartFile,
  ): Promise<FileEntity | null> {
    if (!file) {
      throw new HttpException(`file is not null`, HttpStatus.BAD_REQUEST);
    }
    const createFile = new FileEntity({});
    createFile.userId = userId;
    createFile.originUrl = `${SERVER_URL ?? ''}/${API_PREFIX}/v1/file/${file.filename}`;
    createFile.type = FileType.IMAGE;
    return await this._store(createFile);
  }
}
