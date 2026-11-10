// utils/queryHelpers.ts
import { Request } from "express";

export const getPagination = (req: Request) => {
    const page = Number(req.query.page) || 1;
    const take = Number(req.query.limit) || 10;
    const skip = (page - 1) * take;
    return { page, take, skip };
};

export const createPaginatedResponse = (
    results: any[],
    totalCount: number,
    page: number,
    take: number
) => {
    const hasNext = page * take < totalCount;
    const hasPrevious = page > 1;

    return {
        results,
        count: totalCount,
        next: hasNext ? page + 1 : null,
        previous: hasPrevious ? page - 1 : null,
    };
};
