import {
  Component,
  computed,
  forwardRef,
  inject,
  input,
  OnInit,
  output,
  ViewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Select, SelectChangeEvent, SelectModule } from "primeng/select";
import { ErpAllocationsDropdownStateService } from "./state-service/erp-allocations-dropdown-state.service";
import { ErpAllocationsDropdownDefaultSelectionMode } from "../model/erp-allocations-dropdown-default-selection-mode";
import { ErpAllocation } from "../model/erp-allocation";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ErpAllocationsDropdownOption } from "./erp-allocations-dropdown.option";
import { combineLatest } from "rxjs";

@Component({
  selector: "mxevolve-erp-allocations-dropdown",
  imports: [FormsModule, CommonModule, SelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ErpAllocationsDropdownInputComponent),
      multi: true,
    },
  ],
  templateUrl: "./erp-allocations-dropdown-input.component.html",
})
export class ErpAllocationsDropdownInputComponent
  implements OnInit, ControlValueAccessor
{
  @ViewChild(Select) dropdown: Select;
  private erpAllocationsDropdownStateService = inject(
    ErpAllocationsDropdownStateService
  );

  fieldRequired = input<boolean>(false);

  projectId = input.required<string>();

  clearEvent = output<void>();

  customErpAllocationId = input<string>();

  dropdownDefaultSelectionMode =
    input.required<ErpAllocationsDropdownDefaultSelectionMode>();

  selectedErpAllocationChange = output<ErpAllocation | undefined>();
  failureEvent = output<string>();
  erpAllocationsDropdownOptions =
    this.erpAllocationsDropdownStateService.erpAllocationsDropdownOptions;
  selectedOption = this.erpAllocationsDropdownStateService.selectedOption;
  selectedOptionValidity = computed(() => {
    const selectedOption = this.selectedOption();
    return (
      !this.fieldRequired() ||
      selectedOption === undefined ||
      selectedOption.label !== ""
    );
  });
  isLoadingData = this.erpAllocationsDropdownStateService.isLoadingData;
  private onChange: (selectedErpAllocation: ErpAllocation | null) => void =
    () => {};

  constructor() {
    this.setSelectedErpAllocation();
    this.emitSelectedErpAllocationOnChange();
    this.emitErrorMessageOnFailure();
  }

  ngOnInit(): void {
    this.initializeStateService();
  }

  private initializeStateService() {
    this.erpAllocationsDropdownStateService.setCustomErpAllocationId(
      this.customErpAllocationId()
    );
    this.erpAllocationsDropdownStateService.setProjectId(this.projectId());
    this.erpAllocationsDropdownStateService.setDropdownDefaultSelectionMode(
      this.dropdownDefaultSelectionMode()
    );
  }

  writeValue(selectedErpAllocation: ErpAllocation): void {
    if (selectedErpAllocation) {
      this.erpAllocationsDropdownStateService.setCustomErpAllocationId(
        selectedErpAllocation.id
      );
    }
  }

  registerOnChange(fn: (value: ErpAllocation | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {
    // Not implemented as we don't need to handle touched state
  }

  setDisabledState(): void {
    // Not implemented as we don't need to handle disabled state
  }

  clearSelectedOption() {
    this.erpAllocationsDropdownStateService.setSelectedOption({
      label: "",
      value: undefined,
    });
    this.onChange(null);
  }

  handleErpAllocationSelected(event: SelectChangeEvent) {
    const erpAllocation = event.value as ErpAllocation;
    this.selectErpAllocation(erpAllocation);
    this.onChange(erpAllocation);
  }

  private selectErpAllocation(erpAllocation: ErpAllocation) {
    if (erpAllocation) {
      this.erpAllocationsDropdownStateService.setSelectedOption(
        this.getErpAllocationsDropdownOption(erpAllocation)
      );
    } else {
      this.erpAllocationsDropdownStateService.setSelectedOption(undefined);
    }
  }

  setCustomErpAllocationId(customErpAllocationId: string | undefined) {
    this.erpAllocationsDropdownStateService.setCustomErpAllocationId(
      customErpAllocationId
    );
  }

  private setSelectedErpAllocation() {
    combineLatest([
      toObservable(this.erpAllocationsDropdownOptions),
      toObservable(
        this.erpAllocationsDropdownStateService
          .dropdownDefaultSelectionModeSignal
      ),
      toObservable(this.erpAllocationsDropdownStateService.customErpAllocation),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([options, dropdownSelectionMode, customErpAllocation]) => {
        if (
          dropdownSelectionMode ===
          ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
        ) {
          const option = customErpAllocation
            ? this.getErpAllocationsDropdownOption(customErpAllocation)
            : undefined;
          this.erpAllocationsDropdownStateService.setSelectedOption(option);
        } else {
          this.erpAllocationsDropdownStateService.setSelectedOption(options[0]);
        }
      });
  }

  private emitSelectedErpAllocationOnChange() {
    toObservable(this.selectedOption)
      .pipe(takeUntilDestroyed())
      .subscribe((selectedOption) => {
        if (selectedOption?.label === "") {
          this.clearEvent.emit();
        } else {
          this.selectedErpAllocationChange.emit(selectedOption?.value);
        }
      });
  }

  private emitErrorMessageOnFailure() {
    this.erpAllocationsDropdownStateService.errorMessageSubject
      .pipe(takeUntilDestroyed())
      .subscribe((errorMessage) => {
        this.failureEvent.emit(errorMessage);
      });
  }

  private getErpAllocationsDropdownOption(
    erpAllocation: ErpAllocation
  ): ErpAllocationsDropdownOption {
    return {
      label: `${erpAllocation.erpProjectId}-${erpAllocation.allocationName}`,
      value: erpAllocation,
    };
  }

  closeDialog() {
    this.dropdown.hide();
  }
}
