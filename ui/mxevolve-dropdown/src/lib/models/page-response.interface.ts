/**
 * Generic page response interface for paginated data
 */
export interface PageResponse<T> {
  content: T[];
  last: boolean;
}
