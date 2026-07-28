/**
 * Configuration options for the MxEvolve single-select dropdown
 */
export interface MxEvolveSingleSelectDropdownConfig {
  /** Placeholder text for the dropdown. Default: "Select Item" */
  placeholder?: string;

  /** Show clear button. Default: true */
  showClear?: boolean;

  /** Disable the dropdown. Default: false */
  disabled?: boolean;

  /** Debounce time for search in milliseconds. Default: 200 */
  debounceTime?: number;

  /** Enable filtering/search. Default: true */
  filter?: boolean;

  /** Placeholder text for the filter input. Default: "Search" */
  filterPlaceholder?: string;

  /** Enable virtual scrolling for large lists. Default: false */
  virtualScroll?: boolean;

  /** Virtual scroll item size in pixels (only used when virtualScroll is true). Default: 45 */
  virtualScrollItemSize?: number;

  /** Enable lazy loading with virtual scroll for backend pagination. Default: false */
  lazyLoad?: boolean;

  /** Number of items per lazy load step (only used when lazyLoad is true). Default: 8 */
  virtualScrollStep?: number;

  /** Size variant for the dropdown. Default: undefined (standard size) */
  size?: "small" | "large";
}

type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

/**
 * Resolved configuration with all defaults applied.
 * All fields are required except size which remains optional.
 */
export type MxEvolveSingleSelectDropdownResolvedConfig = RequiredExcept<
  MxEvolveSingleSelectDropdownConfig,
  "size"
>;

/**
 * Default configuration values for single-select dropdown
 */
export const DEFAULT_SINGLE_SELECT_DROPDOWN_CONFIG: MxEvolveSingleSelectDropdownResolvedConfig =
  {
    placeholder: "Select Item",
    showClear: true,
    disabled: false,
    debounceTime: 200,
    filter: true,
    filterPlaceholder: "Search",
    virtualScroll: false,
    virtualScrollItemSize: 45,
    lazyLoad: false,
    virtualScrollStep: 8,
  };
