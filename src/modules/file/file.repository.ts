import { DataSource, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FileEntity } from './entities/file.entity';

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

    /**
     * It returns a promise that resolves to an array of all the documents in the collection
     * @returns The find() method returns a promise.
     */
    async findAll() {
        return this.repository.find();
    }
}
