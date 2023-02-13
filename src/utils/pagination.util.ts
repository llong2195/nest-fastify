import { PaginationResponse } from '@base/base.dto';
import { PAGE_SIZE } from '@config/config';

export const pagination = (items: any, total: number, page = 1, limit = PAGE_SIZE): PaginationResponse<any> => {
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
};
