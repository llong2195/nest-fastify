import { Injectable } from '@nestjs/common';
import { UploadFile } from './entities/upload-file.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UploadFileRepository extends Repository<UploadFile> {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UploadFile) private repository: Repository<UploadFile>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  /**
   * Add a basic where clause to the query and return the first result.
   */

  async findAll() {
    return this.repository.find();
  }
}
