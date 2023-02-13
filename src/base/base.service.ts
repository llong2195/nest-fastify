import { LoggerService } from 'src/logger/custom.logger';
import {
    BaseEntity,
    EntityManager,
    FindManyOptions,
    FindOptionsOrder,
    FindOptionsSelect,
    FindOptionsWhere,
    In,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { EntityId } from 'typeorm/repository/EntityId';

import { PAGE_SIZE } from '@src/configs/config';

import { PaginationResponse } from './base.dto';
import { IBaseService } from './i.base.service';

export class BaseService<T extends BaseEntity, R extends Repository<T>> implements IBaseService<T> {
    protected readonly repository: R;
    protected readonly logger: LoggerService;

    constructor(repository: R, logger: LoggerService) {
        this.repository = repository;
        this.logger = logger;
    }

    /**
     *
     * @param operation
     * @param manager
     * @returns
     */
    async transactionWrap(operation: (...args) => unknown, manager?: EntityManager) {
        if (manager != undefined) {
            return await operation(manager);
        } else {
            return await this.repository.manager.transaction(async manager => {
                return await operation(manager);
            });
        }
    }

    /**
     *
     * @param deleted
     * @param sort
     * @param page
     * @returns
     */
    async _findByDeleted(deleted: boolean, sort: boolean, page: 0): Promise<T[] | null> {
        return await this.repository.find({
            where: { deleted: deleted } as unknown as FindOptionsWhere<T>,
            skip: page * PAGE_SIZE,
            take: PAGE_SIZE,
            order: { createdAt: sort ? 1 : -1 } as unknown as FindOptionsOrder<T>,
        });
    }

    /**
     *
     * @param deleted
     * @returns
     */
    async _countByDeleted(deleted: boolean): Promise<number | null> {
        return await this.repository.count({
            where: { deleted: deleted } as unknown as FindOptionsWhere<T>,
        });
    }

    /**
     *
     * @param id
     * @param data
     * @returns
     */
    async _update(id: EntityId, data: QueryDeepPartialEntity<T>): Promise<T | null> {
        await this.repository.update(id, data as QueryDeepPartialEntity<T>);
        return await this.repository.findOne({
            where: { id: id } as unknown as FindOptionsWhere<T>,
        });
    }

    /**
     *
     * @param id
     * @returns
     */
    async _softDelete(id: EntityId): Promise<T | null> {
        await this.repository.update(id, {
            deleted: true,
        } as unknown as QueryDeepPartialEntity<T>);
        return await this.repository.findOne({
            where: { id: id } as unknown as FindOptionsWhere<T>,
        });
    }

    /**
     *
     * @param id
     * @returns
     */
    async _restore(id: EntityId): Promise<T | null> {
        await this.repository.update(id, {
            deleted: false,
        } as unknown as QueryDeepPartialEntity<T>);
        return await this.repository.findOne({
            where: { id: id } as unknown as FindOptionsWhere<T>,
        });
    }

    /**
     *
     * @param id
     * @returns
     */
    async _destroy(id: EntityId): Promise<T | null> {
        const entity = await this._findById(id);
        await this.repository.delete(id);
        return entity;
    }

    // USER

    /**
     *
     * @param data
     * @returns
     */
    async _store(data: any): Promise<T | null> {
        return this.repository.save(data, { transaction: true });
    }

    /**
     *
     * @param id
     * @returns
     */
    async _findById(id: EntityId): Promise<T | null> {
        return this.repository.findOne({
            where: { id: id } as unknown as FindOptionsWhere<T>,
        });
    }

    /**
     *
     * @param ids
     * @returns
     */
    async _findByIds(ids: [EntityId]): Promise<T[] | null> {
        return this.repository.find({
            where: { id: In(ids) } as unknown as FindOptionsWhere<T>,
        });
    }

    /**
     * @param {number} page
     * @param {number} limit
     * @param {FindOptionsWhere<T> | FindOptionsWhere<T>[]} options
     * @param {string[]} fields
     * @param {FindManyOptions<T>} manyOptions
     * @returns Promise<PaginationResponse<T>>
     */
    async _paginate(
        page: number,
        limit: number = PAGE_SIZE,
        options?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
        fields?: FindOptionsSelect<T>,
        manyOptions?: FindManyOptions<T>,
    ): Promise<PaginationResponse<T>> {
        const totalRecords = await this.repository.count({ where: options });
        const totalPage = totalRecords % limit === 0 ? totalRecords / limit : Math.floor(totalRecords / limit) + 1;

        if (page > totalPage || page <= 0) {
            return new PaginationResponse([], {
                pagination: {
                    currentPage: 0,
                    limit: limit,
                    total: 0,
                    totalPages: 0,
                },
            });
        }

        const offset = page === 1 ? 0 : limit * (page - 1);
        const data = await this.repository.find({
            where: options,
            select: fields,
            skip: offset,
            take: limit,
            ...manyOptions,
        });

        return new PaginationResponse({
            body: data,
            meta: {
                pagination: {
                    currentPage: Number(page),
                    limit: limit,
                    total: totalRecords,
                    totalPages: totalPage,
                },
            },
        });
    }

    /**
     * @param queryBuilder
     * @param page
     * @param limit
     * @param queryString
     * @returns
     */
    async _iPaginate<T>(
        queryBuilder: SelectQueryBuilder<T>,
        page: number,
        limit: number,
    ): Promise<PaginationResponse<T>> {
        const skip = (page - 1) * limit;
        const [items, total] = await queryBuilder.take(limit).skip(skip).getManyAndCount();

        if (total <= 0) {
            return new PaginationResponse<T>([], {
                pagination: {
                    currentPage: 0,
                    limit: limit,
                    total: 0,
                    totalPages: 0,
                },
            });
        }

        const totalPage = Math.ceil(total / limit);
        return new PaginationResponse(items, {
            pagination: {
                currentPage: Number(page),
                limit: limit,
                total: total,
                totalPages: totalPage,
            },
        });
    }

    /**
     *
     * @param second
     * @returns
     */
    async currentTimestamp(second = true): Promise<number> {
        const date = new Date();
        if (second) {
            const now = Math.floor(date.getTime() / 1000);
            return now;
        }
        return Date.now();
    }
}
