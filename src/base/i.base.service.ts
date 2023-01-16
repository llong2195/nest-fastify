import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export interface IBaseService<T> {
    _findByDeleted(deleted: boolean, sort: boolean, page: number): Promise<T[] | T | unknown | null>;

    _countByDeleted(deleted: boolean): Promise<number | unknown | null>;

    _update(id: number, data: QueryDeepPartialEntity<T>): Promise<T | T[] | unknown | null>;

    _softDelete(id: number): Promise<T | unknown | null>;

    _restore(id: number): Promise<T | unknown | null>;

    _destroy(id: number): Promise<T | unknown | null>;

    _store(data: any): Promise<T | unknown | null>;

    _findById(id: number): Promise<T | unknown | null>;

    _findByIds(ids: [number]): Promise<T[] | unknown | null>;
}
