import {
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { useCallback } from 'react';

export type SortDirection = "asc" | "desc";

export type TableQueryState = {
  sort: string;
  dir: SortDirection;
  page: number;
  pageSize: number;
  setPageSize?: (size: number) => void;
  tab: string;
  tabId?: string;
  filters: Record<string, string>;
  toggleSort: (id: string) => void;
  setSort: (id: string) => void;
  setDir: (dir: SortDirection) => void;
  setPage: (page: number) => void;
  setTab: (value: string) => void;
  setFilter: (id: string, value: string) => void;
};

export function useTableQuery(options?: {
  defaultSort?: string;
  defaultDir?: SortDirection;
  defaultPageSize?: number;
}): TableQueryState {
  const [page, setPageStr] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true, history: 'push' })
  );

  const [sort, setSortState] = useQueryState(
    'sort',
    parseAsString.withDefault(options?.defaultSort || 'createdAt').withOptions({ clearOnDefault: true, history: 'replace' })
  );

  const [dir, setDirState] = useQueryState(
    'dir',
    parseAsString.withDefault(options?.defaultDir || 'desc').withOptions({ clearOnDefault: true, history: 'replace' })
  );

  const [pageSize, setPageSizeState] = useQueryState(
    'limit',
    parseAsInteger.withDefault(options?.defaultPageSize || 10).withOptions({ clearOnDefault: true, history: 'replace' })
  );

  const [tab, setTabState] = useQueryState(
    'tab',
    parseAsString.withDefault('all').withOptions({ clearOnDefault: true, history: 'replace' })
  );

  // For complex dynamic filters, we can just grab the whole search params, 
  // but for TableQueryState we'll keep it simple for now, relying on explicit query states if needed.
  // We'll leave `filters` empty initially unless specific filters are registered.
  const filters: Record<string, string> = {};

  const setPage = useCallback((newPage: number) => {
    setPageStr(newPage);
  }, [setPageStr]);

  const setSort = useCallback((newSort: string) => {
    setSortState(newSort);
    setPage(1); // Reset page on sort change
  }, [setSortState, setPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, [setPageSizeState, setPage]);

  const setDir = useCallback((newDir: SortDirection) => {
    setDirState(newDir);
    setPage(1); // Reset page on dir change
  }, [setDirState, setPage]);

  const toggleSort = useCallback((id: string) => {
    if (sort === id) {
      setDir(dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(id);
      setDir('asc');
    }
  }, [sort, dir, setSort, setDir]);

  const setTab = useCallback((newTab: string) => {
    setTabState(newTab);
    setPage(1); // Reset page on tab change
  }, [setTabState, setPage]);

  const setFilter = useCallback((id: string, value: string) => {
    // Basic implementation; for real filters we would track them in useQueryStates.
  }, []);

  return {
    sort,
    dir: dir as SortDirection,
    page,
    pageSize: options?.defaultPageSize || 10,
    tab,
    filters,
    toggleSort,
    setSort,
    setDir,
    setPage,
    setTab,
    setFilter,
  };
}
