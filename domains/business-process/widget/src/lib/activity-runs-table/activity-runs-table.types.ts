import type { ColDef, ICellRendererParams } from "ag-grid-enterprise";

/**
 * Request emitted by {@link ActivityRunsTableComponent} for a single page of
 * runs. The consumer's `loadPage` maps it onto the per-activity executions
 * service (status split + owner filter + sort + column filters).
 */
export interface ActivityRunsPageRequest {
  page: number;
  pageSize: number;
  /** active: [running, pending_input, aborting]; history: the rest. */
  statuses: string[];
  /** My Builds toggle (owner filter — NOT a free-text search box). */
  ownerPhrase?: string;
  /** Spring sort param, e.g. "startDate,desc"; undefined when unsorted. */
  sort?: string;
  /** Column filter values keyed by the consumer's `filterKey`. */
  filters: Record<string, unknown>;
}

/** A single page of rows plus the total row count for pagination. */
export interface ActivityRunsPage<T = unknown> {
  rows: T[];
  total: number;
}

/**
 * Configuration for the sticky (pinned-right) Actions column. The consumer
 * supplies the cell renderer (abort + repush) and, optionally, per-row params.
 */
export interface ActivityRunsActionsColumn<T = unknown> {
  cellRenderer: ColDef<T>["cellRenderer"];
  cellRendererParams?: ColDef<T>["cellRendererParams"];
  headerName?: string;
  width?: number;
}

/** The kind of control a custom header filter renders. */
export type ActivityRunsHeaderFilterType = "text" | "multiselect" | "dateRange";

/** An option for a multiselect header filter. */
export interface ActivityRunsHeaderFilterOption {
  label: string;
  value: string;
}

/**
 * Params passed to {@link ActivityRunsHeaderFilterComponent} through a column's
 * `headerComponentParams`. `filterKey` is the key written into the request's
 * `filters` map.
 */
export interface ActivityRunsHeaderFilterParams {
  filterKey: string;
  filterType: ActivityRunsHeaderFilterType;
  options?: ActivityRunsHeaderFilterOption[];
  placeholder?: string;
}

/**
 * The grid `context` shared with custom header filter components so they can
 * read the current filter value and publish changes back to the table.
 */
export interface ActivityRunsTableContext {
  getFilterValue(key: string): unknown;
  setFilterValue(key: string, value: unknown): void;
}

/** Narrow a cell-renderer params object that may carry a `terminal` flag. */
export type ActivityRunsCellRendererParams<T = unknown> =
  ICellRendererParams<T>;
