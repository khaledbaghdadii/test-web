/**
 * Generic dropdown option interface
 */
export interface DropdownOption<T> {
  label: string;
  value: T;
  tooltip?: string;
}
