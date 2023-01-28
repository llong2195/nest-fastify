import { BaseEntity, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationResponse } from './base.dto';
import { toSnakeCase } from '@src/utils/util';
import qs from 'qs';

export class BaseRepository<T extends BaseEntity> extends Repository<T> {
    protected _repository: Repository<T>;

    constructor(repository: Repository<T>) {
        super(repository.target, repository.manager, repository.queryRunner);
        this._repository = repository;
    }

    async transactionWrap(operation: (...args) => unknown, manager?: EntityManager) {
        if (manager != undefined && manager != null) {
            return await operation(manager);
        } else {
            return await this._repository.manager.transaction(async manager => {
                return await operation(manager);
            });
        }
    }

    /**
     * @param {number} page
     * @param {number} limit
     * @param {string[]} fields
     * @returns Promise<PaginationResponse<T>>
     */
    async paginate(
        page: number,
        limit: number,
        fields?: string[],
        repository: Repository<T> = null,
    ): Promise<PaginationResponse<T>> {
        const totalRecords = await this.count({});
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
        if (!repository) repository = this._repository;
        const data = await repository.find({
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
    async iPaginateSelect(
        filters: T | unknown | any,
        page: number,
        limit: number,
        fields?: string[],
        orders?: Record<string, 'ASC' | 'DESC'>,
        repository: Repository<T> = null,
    ): Promise<PaginationResponse<T>> {
        if (!repository) repository = this._repository;
        const jobTable = repository.metadata.tableName;

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

        return await this.iPaginate(query, page, limit, qs.stringify(filters));
    }

    /**
     * @param queryBuilder
     * @param page
     * @param limit
     * @param queryString
     * @returns
     */
    async iPaginate<T>(
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
        const data = await queryBuilder.limit(limit).offset(skip).getMany();
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
