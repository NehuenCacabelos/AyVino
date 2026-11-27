export interface PagedResponse<T> {
  items: T[];
  totalCount: number | null;
}
