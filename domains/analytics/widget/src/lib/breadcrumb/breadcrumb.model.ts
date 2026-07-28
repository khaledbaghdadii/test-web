/** A single selectable entry inside a bulk-level breadcrumb dropdown. */
export interface BreadcrumbDropdownEntry {
  /** The entry's display label (a business-process or merge-request title). */
  label: string;
  /** The client-built navigation URL for this entry. */
  url: string;
}

/**
 * A single rendered breadcrumb segment (view model produced by the
 * {@link BreadcrumbItemsBuilder} and consumed by the breadcrumb template).
 */
export interface BreadcrumbItem {
  /** The label shown for this segment. */
  label: string;
  /** The navigation URL; `undefined` means the segment is not clickable (leaf, static-only or unavailable). */
  url?: string;
  /** `true` when the underlying resource could not be resolved (rendered disabled). */
  disabled?: boolean;
  /** When present, the segment renders as a dropdown of alternatives (bulk level). */
  dropdown?: BreadcrumbDropdownEntry[];
}
