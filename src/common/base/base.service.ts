import { BaseEntity, Repository } from 'typeorm';
import { LoggerService } from '../logger/custom.logger';

// export interface IBaseService<T> {}

export class BaseService<T extends BaseEntity, R extends Repository<T>> {
  protected readonly repository: R;
  protected readonly logger: LoggerService;

  constructor(repository: R, logger: LoggerService) {
    this.repository = repository;
    this.logger = logger;
  }
}
