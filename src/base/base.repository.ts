import {
    BaseEntity,
    EntityManager,
    FindOptionsSelect,
    FindOptionsWhere,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';

import { PAGE_SIZE } from '@config/index';

import { PaginationResponse } from './base.dto';

export class BaseRepository<T extends BaseEntity> extends Repository<T> {
    protected _repository: Repository<T>;

    constructor(repository: Repository<T>) {
        super(repository.target, repository.manager, repository.queryRunner);
        this._repository = repository;
    }

    /**
     * It wraps a function in a transaction, and if a transaction manager is passed in, it uses that,
     * otherwise it creates a new one
     * @param operation - (...args) => unknown
     * @param {EntityManager} [manager] - The entity manager that is passed in from the transactionWrap
     * function.
     * @returns The return value of the operation function.
     */
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
     * It returns a paginated response of the data from the database
     * @param {number} page - number - The page number to return
     * @param {number} limit - number = PAGE_SIZE,
     * @param {FindOptionsWhere<T> | FindOptionsWhere<T>[]} [options] - This is the where clause. It
     * can be a single object or an array of objects.
     * @param [fields] - The fields you want to select from the database.
     * @returns A pagination response object.
     */
    async _paginate(
        page: number,
        limit: number = PAGE_SIZE,
        options?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
        fields?: FindOptionsSelect<T>,
    ): Promise<PaginationResponse<T>> {
        const totalRecords = await this.count({ where: options });
        const totalPage = totalRecords % limit === 0 ? totalRecords / limit : Math.floor(totalRecords / limit) + 1;

        if (page > totalPage || page <= 0) {
            return new PaginationResponse({
                body: [],
                meta: {
                    pagination: {
                        currentPage: 0,
                        limit: limit,
                        total: 0,
                        totalPages: 0,
                    },
                },
            });
        }

        const offset = page === 1 ? 0 : limit * (page - 1);
        const data = await this._repository.find({
            where: options,
            select: fields,
            skip: offset,
            take: limit,
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
     * It takes a query builder, a page number, and a limit, and returns a paginated response
     * @param queryBuilder - SelectQueryBuilder<T>
     * @param {number} page - The current page number
     * @param {number} limit - number = PAGE_SIZE,
     * @returns A pagination response object
     */
    async _iPaginate<T>(
        queryBuilder: SelectQueryBuilder<T>,
        page: number,
        limit: number = PAGE_SIZE,
    ): Promise<PaginationResponse<T>> {
        const skip = (page - 1) * limit;
        const [items, total] = await queryBuilder.take(limit).skip(skip).getManyAndCount();

        if (total <= 0) {
            return new PaginationResponse([], {
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
     * It returns the current timestamp in seconds or milliseconds.
     * @param [second=true] - boolean - If true, the timestamp will be in seconds. If false, the
     * timestamp will be in milliseconds.
     * @returns A promise that resolves to a number.
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
