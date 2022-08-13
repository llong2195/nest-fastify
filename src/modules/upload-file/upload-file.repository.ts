import { Injectable } from '@nestjs/common';
import { UploadFile } from './entities/upload-file.entity';
import { BaseRepository } from '../../base/base.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class UploadFileRepository extends BaseRepository<UploadFile> {
  constructor(private dataSource: DataSource) {
    super(UploadFile, dataSource);
  }

  /**
   * Add a basic where clause to the query and return the first result.
   */
}
