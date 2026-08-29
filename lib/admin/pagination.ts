export const DEFAULT_PAGE_SIZE = 10;

export type PaginationResult<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
};

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    startIndex: totalItems === 0 ? 0 : offset + 1,
    endIndex: Math.min(offset + pageSize, totalItems),
  };
}

export type PageToken = number | "ellipsis";

export function buildPageTokens(
  currentPage: number,
  totalPages: number,
): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: PageToken[] = [1];

  if (currentPage > 3) {
    tokens.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    tokens.push(page);
  }

  if (currentPage < totalPages - 2) {
    tokens.push("ellipsis");
  }

  tokens.push(totalPages);
  return tokens;
}
