import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/base.service';
import { CreateDemoDto } from './dto/create-demo.dto';
import { UpdateDemoDto } from './dto/update-demo.dto';
import { DemoRepository } from './demo.repository';
import { Demo } from './entities/demo.entity';
import { LoggerService } from '../../common/logger/custom.logger';

@Injectable()
export class DemoService extends BaseService<Demo, DemoRepository> {
  constructor(repository: DemoRepository, logger: LoggerService) {
    super(repository, logger);
  }

  create(createDemoDto: CreateDemoDto) {}

  findAll() {
    return this.repository.sortCus();
  }

  findOne(id: number) {
    return this.repository.findById(id);
  }

  update(id: number, updateDemoDto: UpdateDemoDto) {
    return `This action updates a #${id} demo`;
  }

  remove(id: number) {
    return `This action removes a #${id} demo`;
  }
}
