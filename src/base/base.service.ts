import {
  BaseEntity,
  DeepPartial,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { LoggerService } from 'src/logger/custom.logger';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { PAGE_SIZE } from '@config/config';
import { IBaseService } from './i.base.service';
import { EntityId } from 'typeorm/repository/EntityId';

export class BaseService<T extends BaseEntity, R extends Repository<T>>
  implements IBaseService<T>
{
  protected readonly repository: R;
  protected readonly logger: LoggerService;

  constructor(repository: R, logger: LoggerService) {
    this.repository = repository;
    this.logger = logger;
  }
  // ADMIN

  async _findByAdmin(
    deleted: boolean,
    orderValue: 'ASC' | 'DESC',
    page: 0,
  ): Promise<T[] | null> {
    return await this.repository.find({
      where: { deleted: deleted } as unknown as FindOptionsWhere<T>,
      skip: page * PAGE_SIZE,
      order: { createdAt: orderValue } as unknown as FindOptionsOrder<T>,
    });
  }

  async _update(
    id: EntityId,
    data: QueryDeepPartialEntity<T>,
  ): Promise<T[] | null> {
    return await this.repository
      .update((id as any).id, data)
      .then(async (entity) => {
        return await this.repository.find((entity as any).id);
      })
      .catch((error) => Promise.reject(error));
  }

  async _softDelete(id: EntityId): Promise<T | null> {
    return await this.repository
      .update(id, {
        deleted: true,
      } as unknown as QueryDeepPartialEntity<T>)
      .then(async (entity) => {
        return await this.repository.findOne({
          where: { id: (entity as any).id } as unknown as FindOptionsWhere<T>,
        });
      });
  }

  async _restore(id: EntityId): Promise<T | null> {
    return await this.repository
      .update(id, {
        deleted: false,
      } as unknown as QueryDeepPartialEntity<T>)
      .then(async (entity) => {
        return await this.repository.findOne((entity as any).id);
      });
  }

  async _destroy(id: EntityId): Promise<T | null> {
    return await this.repository
      .delete(id)
      .then(async (entity) => {
        return await this.repository.findOne((entity as any).id);
      })
      .catch((error) => Promise.reject(error));
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

  async _findByIds(id: [EntityId]): Promise<T[] | null> {
    return this.repository.find({
      where: { id: In(id) } as unknown as FindOptionsWhere<T>,
    });
  }
}
