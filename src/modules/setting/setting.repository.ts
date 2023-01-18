import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@base/base.repository';
import { SettingEntity } from './entities/setting.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SettingRepository extends BaseRepository<SettingEntity> {
    constructor(@InjectRepository(SettingEntity) private repository: Repository<SettingEntity>) {
        super(repository);
    }
}
