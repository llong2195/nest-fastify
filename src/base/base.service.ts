import {
    BaseEntity,
    EntityManager,
    FindOptionsOrder,
    FindOptionsWhere,
    In,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { LoggerService } from 'src/logger/custom.logger';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { PAGE_SIZE } from '@src/configs/config';
import { IBaseService } from './i.base.service';
import { EntityId } from 'typeorm/repository/EntityId';
import { toSnakeCase } from '@src/utils/util';
import qs from 'qs';
import { PaginationResponse } from './base.dto';

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
     * @param {string[]} fields
     * @returns Promise<PaginationResponse<T>>
     */
    async _paginate(page: number, limit: number, fields?: string[]): Promise<PaginationResponse<T>> {
        const totalRecords = await this.repository.count({});
        const totalPage = totalRecords % limit === 0 ? totalRecords / limit : Math.floor(totalRecords / limit) + 1;

        if (page > totalPage || page <= 0) {
            return {
                body: [],
                meta: {
                    pagination: {
                        currentPage: 0,
                        links: {
                            next: '',
                            prev: '',
                        },
                        limit: limit,
                        total: 0,
                        totalPages: 0,
                    },
                },
            };
        }

        const offset = page === 1 ? 0 : limit * (page - 1);
        const data = await this.repository.find({
            select: fields ? (fields as (keyof T)[]) : null,
            skip: offset,
            take: limit,
        });

        const next = page < totalPage ? `page=${page - -1}&limit=${limit}` : '';
        const prev = page > 1 ? `page=${page - 1}&limit=${limit}` : '';

        return {
            body: data,
            meta: {
                pagination: {
                    currentPage: Number(page),

                    links: {
                        next: next,
                        prev: prev,
                    },
                    limit: limit,
                    total: totalRecords,
                    totalPages: totalPage,
                },
            },
        };
    }

    /**
     * @param page
     * @param limit
     * @param fields
     * @returns
     */
    async _iPaginateSelect(
        filters: T | unknown | any,
        page: number,
        limit: number,
        fields?: string[],
        orders?: Record<string, 'ASC' | 'DESC'>,
        repository: Repository<T> = null,
    ): Promise<PaginationResponse<T>> {
        const jobTable = this.repository.metadata.tableName;

        const query = repository.createQueryBuilder(jobTable);

        Object.keys(filters).forEach((key: string) => {
            const obj: Record<string, unknown> = {};
            obj[key] = filters[key];

            query.andWhere(`${jobTable}.${toSnakeCase(key)}=:${key}`, obj);
        });

        if (orders) {
            query.orderBy(orders);
        }

        //this.logger.debug(query.getSql())

        return await this._iPaginate(query, page, limit, qs.stringify(filters));
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
        queryString?: string,
    ): Promise<PaginationResponse<T>> {
        const skip = (page - 1) * limit;
        const [items, total] = await queryBuilder.take(limit).skip(skip).getManyAndCount();

        if (total <= 0) {
            return {
                body: [],
                meta: {
                    pagination: {
                        currentPage: 0,
                        links: {
                            next: '',
                            prev: '',
                        },
                        limit: limit,
                        total: 0,
                        totalPages: 0,
                    },
                },
            };
        }

        const totalPage = Math.ceil(total / limit);
        const next = page < totalPage ? `${queryString ? queryString + '&' : ''}page=${page - -1}&limit=${limit}` : '';
        const prev = page > 1 ? `${queryString ? queryString + '&' : ''}page=${page - 1}&limit=${limit}` : '';

        return {
            body: items,
            meta: {
                pagination: {
                    currentPage: Number(page),
                    links: {
                        next: next,
                        prev: prev,
                    },
                    limit: limit,
                    total: total,
                    totalPages: totalPage,
                },
            },
        };
    }

    /**
     * @param queryBuilder
     * @param page
     * @param limit
     * @param queryString
     * @returns
     */
    async iPaginateCustom<T>(
        queryBuilder: SelectQueryBuilder<T>,
        page: number,
        limit: number,
        queryString?: string,
    ): Promise<PaginationResponse<T>> {
        const skip = (page - 1) * limit;
        const total = await queryBuilder.getCount();
        const data = await queryBuilder.limit(limit).offset(skip).getManyAndCount();
        if (total <= 0) {
            return {
                body: [],
                meta: {
                    pagination: {
                        currentPage: 0,
                        links: {
                            next: '',
                            prev: '',
                        },
                        limit: limit,
                        total: 0,
                        totalPages: 0,
                    },
                },
            };
        }

        const totalPage = Math.ceil(total / limit);
        const next =
            page < totalPage
                ? `${queryString ? queryString + '&' : ''}page=${page - -1}&limit=${limit}`
                : queryString ?? '';
        const prev =
            page > 1 ? `${queryString ? queryString + '&' : ''}page=${page - 1}&limit=${limit}` : queryString ?? '';

        return {
            body: data,
            meta: {
                pagination: {
                    currentPage: Number(page),
                    links: {
                        next: next,
                        prev: prev,
                    },
                    limit: limit,
                    total: total,
                    totalPages: totalPage,
                },
            },
        };
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
