import { DataSource, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@src/modules/user/entities/user.entity';

/**
 * Template Custom Repository: TemplateRepository extends Repository<Entity>
 *
 **/
@Injectable()
export class TemplateRepository extends Repository<UserEntity> {
    constructor(@InjectRepository(UserEntity) userRepo: Repository<UserEntity>) {
        super(userRepo.target, userRepo.manager, userRepo.queryRunner);
    }
}

/**
 * Template Custom Repository: TemplateRepository extends Repository<Entity>
 *
 **/
@Injectable()
export class Template2Repository extends Repository<UserEntity> {
    constructor(private dataSource: DataSource) {
        super(UserEntity, dataSource.manager);
    }
}
