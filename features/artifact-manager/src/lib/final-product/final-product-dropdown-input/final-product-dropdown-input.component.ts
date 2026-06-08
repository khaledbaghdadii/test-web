import {
  Component,
  EventEmitter,
  inject,
  input,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { FinalProductDropdownStateService } from "./final-product-dropdown-state.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { LazyLoadEvent } from "primeng/api";
import { combineLatest, first, skipWhile } from "rxjs";
import { FormsModule } from "@angular/forms";
import { FinalProduct } from "../model/final-product";
import { InputTextModule } from "primeng/inputtext";

import { DropdownDefaultSelectionMode } from "../model/dropdown-default-selection-mode";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { SelectChangeEvent, SelectModule } from "primeng/select";
import { FormatDatePipe, FormatDatePipeModule } from "@mxflow/pipe";
import { FinalProductDropdownInputLabelMode } from "./final-product-dropdown-input-label-mode";
import { ScmService } from "@mxflow/features/scm";

@Component({
  selector: "mxevolve-final-product-dropdown-input",
  imports: [
    FormsModule,
    InputTextModule,
    IconField,
    InputIcon,
    SelectModule,
    FormatDatePipeModule,
  ],
  providers: [
    FinalProductDropdownStateService,
    ToastMessageService,
    ScmService,
  ],
  templateUrl: "./final-product-dropdown-input.component.html",
})
export class FinalProductDropdownInputComponent implements OnInit {
  readonly finalProductStateService: FinalProductDropdownStateService = inject(
    FinalProductDropdownStateService
  );
  readonly formatDatePipe: FormatDatePipe = inject(FormatDatePipe);

  handleScroll = (event: LazyLoadEvent): void => {
    const { first, last } = event;
    if (this.shouldLoadMoreData(first, last)) {
      this.finalProductStateService.setLastFetchedElement(last ?? 0);
      this.finalProductStateService.setPageIndex(this.pageIndex() + 1);
    }
  };

  @Input() set validationLevel(value: string[]) {
    this.finalProductStateService.setValidationLevel(value);
  }

  labelMode = input<FinalProductDropdownInputLabelMode>(
    FinalProductDropdownInputLabelMode.COMMIT_ID
  );

  @Input() set projectId(value: string) {
    if (value) {
      this.finalProductStateService.setProjectId(value);
      this.resetScroll();
    }
  }

  @Input() set branchFilter(value: string) {
    if (value) {
      this.finalProductStateService.setBranchCriteria(value);
      this.resetScroll();
    }
  }

  @Input() set fetchParent(value: boolean) {
    this.finalProductStateService.setFetchParent(value);
  }

  @Input() set customFinalProductId(value: string) {
    this.finalProductStateService.setCustomFinalProductId(value);
  }

  @Input() set dropdownDefaultSelectionMode(
    value: DropdownDefaultSelectionMode
  ) {
    this.finalProductStateService.setDropdownDefaultSelectionMode(value);
  }

  @Input() set repositoryId(value: string) {
    this.finalProductStateService.setRepositoryId(value);
  }

  @Output() selectedFinalProductChange = new EventEmitter<
    FinalProduct | undefined
  >();
  @Output() dataReadyChange = new EventEmitter<boolean>();
  @Output() errorMessageChange = new EventEmitter<string>();
  @Output() selectedFinalProductExpiryDateNotification =
    new EventEmitter<string>();
  pageIndex = this.finalProductStateService.pageIndex;
  lastFetchedElement = this.finalProductStateService.lastFetchedElement;
  finalProductDropdownOptions =
    this.finalProductStateService.finalProductDropdownOptions;
  isLastPage = this.finalProductStateService.isLastPage;
  selectedOption = this.finalProductStateService.selectedOption;
  searchKey = this.finalProductStateService.searchKey;
  isLoadingData = this.finalProductStateService.isLoadingData;
  errorMessage = this.finalProductStateService.errorMessage;

  itemsSize = this.finalProductStateService.dropDownItemsSize;
  itemHeight = this.finalProductStateService.dropDownItemHeight;
  dropDownHeight = this.finalProductStateService.dropdownHeight;

  constructor() {
    this.setSelectedFinalProduct();
    this.emitMessageOnError();
    this.emitSelectedFinalProductOnChange();
    this.emitDataReadiness();
  }

  ngOnInit(): void {
    this.finalProductStateService.setDropdownLabelMode(this.labelMode());
  }

  handleFinalProductSelected(event: SelectChangeEvent) {
    const finalProduct = event.value as FinalProduct;
    if (finalProduct) {
      this.finalProductStateService.setSelectedOption({
        label: finalProduct.configurationCommitId,
        value: finalProduct,
      });
    } else {
      this.finalProductStateService.setSelectedOption(undefined);
    }
  }

  clearSelectedOption() {
    this.finalProductStateService.setSelectedOption(undefined);
  }

  handleSearchKeyInputChange(input: string) {
    this.finalProductStateService.setSearchKey(input);
    this.resetScroll();
  }

  clearSearchKey(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    this.finalProductStateService.setSearchKey(undefined);
    this.resetScroll();
  }

  private emitMessageOnError() {
    toObservable(this.errorMessage)
      .pipe(takeUntilDestroyed())
      .subscribe((error) => {
        if (error) this.errorMessageChange.emit(error);
      });
  }

  private setSelectedFinalProduct() {
    combineLatest([
      toObservable(this.finalProductDropdownOptions),
      toObservable(
        this.finalProductStateService.dropdownDefaultSelectionModeSignal
      ),
      toObservable(this.finalProductStateService.customFinalProduct),
    ])
      .pipe(
        first(([options]) => options && options.length > 0),
        takeUntilDestroyed()
      )
      .subscribe(([options, dropdownSelectionMode, customFinalProduct]) => {
        if (
          dropdownSelectionMode === DropdownDefaultSelectionMode.CUSTOM &&
          !customFinalProduct
        ) {
          this.finalProductStateService.setSelectedOption(undefined);
        } else {
          this.finalProductStateService.setSelectedOption(options[0]);
        }
      });
  }

  private emitFinalProductExpiryDateNotification(expiryDate: Date | undefined) {
    if (!expiryDate) return;
    this.selectedFinalProductExpiryDateNotification.emit(
      `The selected final product will expire on ${this.formatDatePipe.transform(
        expiryDate
      )}`
    );
  }

  private emitSelectedFinalProductOnChange() {
    toObservable(this.selectedOption)
      .pipe(takeUntilDestroyed())
      .subscribe((selectedOption) => {
        this.selectedFinalProductChange.emit(selectedOption?.value);
        this.emitFinalProductExpiryDateNotification(
          selectedOption?.value.expiryDate
        );
      });
  }

  private emitDataReadiness() {
    toObservable(this.isLoadingData)
      .pipe(
        skipWhile((isLoading) => isLoading === false),
        takeUntilDestroyed()
      )
      .subscribe((isLoading) => {
        this.dataReadyChange.emit(!isLoading);
      });
  }

  private resetScroll() {
    this.finalProductStateService.setPageIndex(0);
    this.finalProductStateService.setLastFetchedElement(-1);
  }

  private shouldLoadMoreData(
    first: number | undefined,
    last: number | undefined
  ) {
    return (
      first &&
      last &&
      !this.isLoadingData() &&
      !this.isLastPage() &&
      this.lastFetchedElement() < last
    );
  }
}
