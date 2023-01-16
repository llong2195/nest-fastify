import { Injectable } from '@nestjs/common';
import { FileEntity } from './entities/file.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FileRepository extends Repository<FileEntity> {
    constructor(
        private dataSource: DataSource,
        @InjectRepository(FileEntity) private repository: Repository<FileEntity>,
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
