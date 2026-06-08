import { ErpAllocation } from "../model/erp-allocation";

export interface ErpAllocationsDropdownOption {
  label: string;
  value: ErpAllocation | undefined;
}
