import {
  PaginationParams,
  PaginatedResult,
} from '../interfaces/pagination.interface';

export class PaginationUtil {
  static paginate<T>(
    data: T[],
    total: number,
    params: PaginationParams,
  ): PaginatedResult<T> {
    const { page, limit } = params;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
