import { BaseEntity, FindOptionsOrder, FindOptionsWhere, In, Repository } from 'typeorm';
import { LoggerService } from 'src/logger/custom.logger';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { PAGE_SIZE } from '@config/config';
import { IBaseService } from './i.base.service';
import { EntityId } from 'typeorm/repository/EntityId';

export class BaseService<T extends BaseEntity, R extends Repository<T>> implements IBaseService<T> {
  protected readonly repository: R;
  protected readonly logger: LoggerService;

  constructor(repository: R, logger: LoggerService) {
    this.repository = repository;
    this.logger = logger;
  }
  // ADMIN

  async _findByDeleted(deleted: boolean, sort: boolean, page: 0): Promise<T[] | null> {
    return await this.repository.find({
      where: { deleted: deleted } as unknown as FindOptionsWhere<T>,
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
      order: { createdAt: sort ? 1 : -1 } as unknown as FindOptionsOrder<T>,
    });
  }

  async _countByDeleted(deleted: boolean): Promise<number | null> {
    return await this.repository.count({
      where: { deleted: deleted } as unknown as FindOptionsWhere<T>,
    });
  }

  async _update(id: EntityId, data: QueryDeepPartialEntity<T>): Promise<T | null> {
    await this.repository.update(id, data as QueryDeepPartialEntity<T>);
    return await this.repository.findOne({
      where: { id: id } as unknown as FindOptionsWhere<T>,
    });
  }

  async _softDelete(id: EntityId): Promise<T | null> {
    await this.repository.update(id, {
      deleted: true,
    } as unknown as QueryDeepPartialEntity<T>);
    return await this.repository.findOne({
      where: { id: id } as unknown as FindOptionsWhere<T>,
    });
  }

  async _restore(id: EntityId): Promise<T | null> {
    await this.repository.update(id, {
      deleted: false,
    } as unknown as QueryDeepPartialEntity<T>);
    return await this.repository.findOne({
      where: { id: id } as unknown as FindOptionsWhere<T>,
    });
  }

  async _destroy(id: EntityId): Promise<T | null> {
    const entity = await this._findById(id);
    await this.repository.delete(id);
    return entity;
  }

  // USER

  async _store(data: any): Promise<T | null> {
    return this.repository.save(data, { transaction: true });
  }

  async _findById(id: EntityId): Promise<T | null> {
    return this.repository.findOne({
      where: { id: id } as unknown as FindOptionsWhere<T>,
    });
  }

  async _findByIds(ids: [EntityId]): Promise<T[] | null> {
    return this.repository.find({
      where: { id: In(ids) } as unknown as FindOptionsWhere<T>,
    });
  }
}
