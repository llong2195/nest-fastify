import {
    BaseEntity,
    EntityManager,
    FindOptionsSelect,
    FindOptionsWhere,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { PaginationResponse } from './base.dto';
import { PAGE_SIZE } from '@config/index';

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
     * @param queryBuilder
     * @param page
     * @param limit
     * @param queryString
     * @returns
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
