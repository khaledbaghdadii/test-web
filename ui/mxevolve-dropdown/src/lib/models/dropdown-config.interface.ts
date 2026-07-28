/**
 * Configuration options for the MxEvolve dropdown
 */
export interface MxEvolveDropdownConfig {
  /** Placeholder text for the dropdown. Default: "Select Items" */
  placeholder?: string;

  /** Show clear button. Default: true */
  showClear?: boolean;

  /** Disable the dropdown. Default: false */
  disabled?: boolean;

  /** Number of items per page. Default: 10 */
  pageSize?: number;

  /** Debounce time for search in milliseconds. Default: 200 */
  debounceTime?: number;

  /** Virtual scroll item size in pixels. Default: 45 */
  virtualScrollItemSize?: number;

  /** Virtual scroll step (items loaded per chunk). Default: 8 */
  virtualScrollStep?: number;

  /** Maximum number of items that can be selected. Default: undefined (no limit) */
  selectionLimit?: number;

  /** Maximum number of selected labels to display before showing count. Default: 3 */
  maxSelectedLabels?: number;

  /** Append the dropdown panel to a specific element. Default: "body" (appends to body) */
  appendTo?: string | null;

  /** Inline styles applied to the overlay panel. */
  panelStyle?: Record<string, string>;
}

/**
 * Default configuration values
 */
export const DEFAULT_DROPDOWN_CONFIG: Required<MxEvolveDropdownConfig> = {
  placeholder: "Select Items",
  showClear: true,
  disabled: false,
  pageSize: 10,
  debounceTime: 200,
  virtualScrollItemSize: 45,
  virtualScrollStep: 8,
  selectionLimit: undefined as unknown as number,
  maxSelectedLabels: 3,
  appendTo: "body",
  panelStyle: {},
};
