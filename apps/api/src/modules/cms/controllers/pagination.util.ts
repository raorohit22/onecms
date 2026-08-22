import { Request } from 'express';

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  sortField: string;
  sortDir: 1 | -1;
  filters: Record<string, any>;
}

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 10;

/**
 * Extracts, sanitizes, and bounds pagination and sorting parameters from Express Request query.
 * Enforces a strict upper limit (100) to prevent database denial-of-service / memory exhaustion.
 */
export function extractPagination(req: Request, defaultSortField: string = 'createdAt'): ParsedPagination {
  const rawPage = parseInt(req.query.page as string, 10);
  const rawLimit = parseInt(req.query.limit as string, 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_PAGE_LIMIT) : DEFAULT_PAGE_LIMIT;
  const skip = (page - 1) * limit;

  const sortField = typeof req.query.sort === 'string' && req.query.sort.length > 0 ? req.query.sort : defaultSortField;
  const sortDir: 1 | -1 = req.query.dir === 'asc' ? 1 : -1;

  const filters = { ...req.query };
  delete filters.page;
  delete filters.limit;
  delete filters.sort;
  delete filters.dir;

  return {
    page,
    limit,
    skip,
    sortField,
    sortDir,
    filters,
  };
}
