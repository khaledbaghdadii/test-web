import { computed, inject, Injectable, signal, Signal } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { FinalProduct, FinalProducts } from "../model/final-product";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import {
  FinalProductFilters,
  FinalProductState,
} from "../model/final-product-filters";
import { FinalProductDropdownOption } from "./final-product-dropdown-option.model";
import { FinalProductService } from "../final-product.service";
import { DropdownDefaultSelectionMode } from "../model/dropdown-default-selection-mode";
import { FinalProductDropdownInputLabelMode } from "./final-product-dropdown-input-label-mode";
import { GetBranchDetailsRequest, ScmService } from "@mxflow/features/scm";

@Injectable()
export class FinalProductDropdownStateService {
  private readonly finalProductService = inject(FinalProductService);
  private readonly scmService = inject(ScmService);
  readonly dropdownMaxNbOfDisplayedItems = 5;
  readonly dropDownItemHeight = 40;
  readonly dropDownItemsSize = 5;

  readonly dropdownHeight = computed(() => {
    if (this.finalProductDropdownOptions().length === 0) {
      return `${this.dropDownItemHeight}px`;
    } else if (
      this.finalProductDropdownOptions().length <
      this.dropdownMaxNbOfDisplayedItems
    ) {
      return `${
        this.finalProductDropdownOptions().length * this.dropDownItemHeight
      }px`;
    } else {
      return `${
        this.dropdownMaxNbOfDisplayedItems * this.dropDownItemHeight
      }px`;
    }
  });

  private readonly defaultPageIndex = 0;
  private readonly defaultPageSize = 10;
  private readonly defaultSortCriteria = "createdOn,desc";
  private readonly emptyPage: FinalProducts = {
    content: [],
    size: 0,
    number: 0,
    totalPages: 0,
    totalElements: 0,
    last: true,
  };
  private readonly debounceTime = 300;

  private readonly projectIdSubject = new Subject<string>();
  private readonly projectId$ = this.projectIdSubject.asObservable();

  private readonly pageIndexSubject = new BehaviorSubject<number>(
    this.defaultPageIndex
  );
  private readonly pageIndex$ = this.pageIndexSubject
    .asObservable()
    .pipe(distinctUntilChanged(), takeUntilDestroyed());
  readonly pageIndex: Signal<number>;

  private readonly branchCriteriaSubject = new BehaviorSubject<
    string | undefined
  >(undefined);
  private readonly branchCriteria$ = this.branchCriteriaSubject.asObservable();
  private readonly repositoryIdSubject = new BehaviorSubject<
    string | undefined
  >(undefined);
  private readonly repositoryId$ = this.repositoryIdSubject.asObservable();
  private readonly validationLevelSubject = new BehaviorSubject<string[]>([]);
  private readonly validationLevel$ =
    this.validationLevelSubject.asObservable();
  private readonly fetchParentSubject = new BehaviorSubject<boolean>(false);
  private readonly fetchParent$ = this.fetchParentSubject.asObservable();
  private readonly customFinalProductIdSubject = new Subject<string>();
  private readonly customFinalProductId$ =
    this.customFinalProductIdSubject.asObservable();
  private readonly dropdownLabelModeSubject =
    new BehaviorSubject<FinalProductDropdownInputLabelMode>(
      FinalProductDropdownInputLabelMode.COMMIT_ID
    );
  private readonly dropdownLabelMode$ =
    this.dropdownLabelModeSubject.asObservable();
  private dropdownLabelMode: FinalProductDropdownInputLabelMode;
  private readonly dropdownDefaultSelectionModeSubject =
    new BehaviorSubject<DropdownDefaultSelectionMode>(
      DropdownDefaultSelectionMode.LATEST
    );
  private readonly dropdownDefaultSelectionMode$ =
    this.dropdownDefaultSelectionModeSubject.asObservable();
  readonly dropdownDefaultSelectionModeSignal: Signal<DropdownDefaultSelectionMode> =
    toSignal(this.dropdownDefaultSelectionMode$, {
      initialValue: DropdownDefaultSelectionMode.LATEST,
    });
  private readonly searchKeySubject = new BehaviorSubject<string | undefined>(
    undefined
  );
  private readonly searchKeyCriteria$ = this.searchKeySubject
    .asObservable()
    .pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      takeUntilDestroyed()
    );
  readonly searchKey: Signal<string | undefined>;

  private readonly finalProductsPage$: Observable<FinalProducts>;
  readonly finalProductsPage: Signal<FinalProducts>;

  private readonly customFinalProduct$: Observable<FinalProduct>;
  readonly customFinalProduct: Signal<FinalProduct | undefined>;

  private readonly headCommitID$: Observable<string>;
  readonly headCommitId: Signal<string | undefined>;

  private readonly finalProducts$: Observable<FinalProduct[]>;
  readonly finalProducts: Signal<FinalProduct[]>;

  private readonly selectedOptionSubject = new Subject<
    FinalProductDropdownOption | undefined
  >();
  private readonly selectedOption$ = this.selectedOptionSubject.asObservable();
  readonly selectedOption: Signal<FinalProductDropdownOption | undefined>;

  readonly errorMessage = signal<string | undefined>(undefined);

  readonly newFinalProductDropdownOptions = computed(() =>
    this.getDropdownOptions(this.finalProducts(), this.headCommitId())
  );
  readonly finalProductDropdownOptions: Signal<FinalProductDropdownOption[]>;
  readonly isLastPage = computed(() => this.finalProductsPage().last);
  readonly isLoadingData = signal(false);

  private readonly lastFetchedElementSubject = new BehaviorSubject<number>(-1);
  private readonly lastFetchedElement$ = this.lastFetchedElementSubject
    .asObservable()
    .pipe(distinctUntilChanged(), takeUntilDestroyed());
  readonly lastFetchedElement: Signal<number>;

  private readonly customFinalProductFailureSubject = new Subject<Error>();
  readonly customFinalProductFailure$ =
    this.customFinalProductFailureSubject.asObservable();

  constructor() {
    this.headCommitID$ = combineLatest([
      this.projectId$,
      this.repositoryId$,
      this.branchCriteria$,
    ]).pipe(
      switchMap(([projectId, repositoryId, branch]) => {
        if (repositoryId && branch) {
          const request: GetBranchDetailsRequest = {
            projectId: projectId,
            repoId: repositoryId,
            branchName: branch,
          };
          return this.scmService.getBranchDetails(request).pipe(
            map((branchDetails) => branchDetails?.latestCommitId),
            catchError(() => {
              return EMPTY;
            })
          );
        }
        return EMPTY;
      }),
      takeUntilDestroyed()
    );

    this.customFinalProduct$ = combineLatest([
      this.projectId$,
      this.customFinalProductId$,
    ]).pipe(
      switchMap(([projectId, customFinalProductId]) => {
        return customFinalProductId
          ? this.finalProductService
              .getFinalProductById(customFinalProductId, projectId)
              .pipe(
                catchError((error) => {
                  this.customFinalProductFailureSubject.next(error);
                  return EMPTY;
                })
              )
          : EMPTY;
      }),
      shareReplay(1),
      takeUntilDestroyed()
    );
    this.finalProductsPage$ = combineLatest([
      this.projectId$,
      this.pageIndex$,
      this.fetchParent$,
      this.branchCriteria$,
      this.searchKeyCriteria$,
      this.validationLevel$,
      this.dropdownLabelMode$,
    ]).pipe(
      tap(() => this.setLoadingData(true)),
      switchMap(
        ([
          projectId,
          pageIndex,
          fetchParent,
          branchCriteria,
          searchKey,
          validationLevel,
          dropdownLabelMode,
        ]) => {
          this.dropdownLabelMode = dropdownLabelMode;
          return this.finalProductService.getFinalProducts(
            this.getFinalProductFilters(
              pageIndex,
              fetchParent,
              branchCriteria,
              searchKey,
              validationLevel
            ),
            projectId
          );
        }
      ),
      tap(() => this.setLoadingData(false)),
      shareReplay(1),
      catchError((error) => {
        this.handleError(error);
        return EMPTY;
      }),
      takeUntilDestroyed()
    );
    this.finalProducts$ = combineLatest([
      this.customFinalProduct$.pipe(startWith(null)),
      this.finalProductsPage$,
      this.dropdownDefaultSelectionMode$,
      this.searchKeyCriteria$,
    ]).pipe(
      map(
        ([
          customFinalProduct,
          finalProductsPage,
          dropdownDefaultSelectionMode,
          searchKeyCriteria,
        ]) => {
          const finalProductsList = this.shouldIncludeCustomProduct(
            customFinalProduct,
            searchKeyCriteria
          )
            ? this.getFinalProductsList(customFinalProduct, finalProductsPage)
            : this.getFinalProductsList(null, finalProductsPage);
          return dropdownDefaultSelectionMode ==
            DropdownDefaultSelectionMode.CUSTOM
            ? finalProductsList
            : this.sortFinalProductsByCreationDateDesc(finalProductsList);
        }
      )
    );
    this.finalProducts = toSignal(this.finalProducts$, { initialValue: [] });
    this.customFinalProduct = toSignal(this.customFinalProduct$);
    const finalProductDropdownOptions$ = toObservable(
      this.newFinalProductDropdownOptions
    ).pipe(
      switchMap((newOptions) =>
        this.addNewFinalProductDropdownOptions(newOptions)
      ),
      takeUntilDestroyed()
    );
    this.pageIndex = toSignal(this.pageIndex$, { initialValue: 0 });
    this.lastFetchedElement = toSignal(this.lastFetchedElement$, {
      initialValue: -1,
    });
    this.finalProductsPage = toSignal(this.finalProductsPage$, {
      initialValue: this.emptyPage,
    });
    this.finalProductDropdownOptions = toSignal(finalProductDropdownOptions$, {
      initialValue: [],
    });
    this.selectedOption = toSignal(this.selectedOption$);
    this.searchKey = toSignal(this.searchKeyCriteria$);
    this.headCommitId = toSignal(this.headCommitID$);
  }

  private sortFinalProductsByCreationDateDesc(
    finalProductsList: FinalProduct[]
  ) {
    return finalProductsList.sort((fp1, fp2) => {
      return Date.parse(fp2.createdOn) - Date.parse(fp1.createdOn);
    });
  }

  private shouldIncludeCustomProduct(
    customFinalProduct: FinalProduct | null,
    searchKey: string | undefined
  ) {
    return (
      customFinalProduct &&
      (!searchKey ||
        customFinalProduct.configurationCommitId
          .toLowerCase()
          .includes(searchKey.toLowerCase()) ||
        customFinalProduct.tag?.toLowerCase().includes(searchKey.toLowerCase()))
    );
  }

  private getFinalProductsList(
    customFinalProduct: FinalProduct | null,
    finalProductsPage: FinalProducts
  ) {
    return customFinalProduct
      ? [customFinalProduct, ...(finalProductsPage.content || [])]
      : finalProductsPage.content || [];
  }

  setProjectId(projectId: string) {
    this.projectIdSubject.next(projectId);
  }

  setValidationLevel(validationLevel: string[]) {
    this.validationLevelSubject.next(validationLevel);
  }

  setDropdownLabelMode(dropdownLabelMode: FinalProductDropdownInputLabelMode) {
    this.dropdownLabelModeSubject.next(dropdownLabelMode);
  }

  setBranchCriteria(branch: string) {
    this.branchCriteriaSubject.next(branch);
  }

  setPageIndex(index: number) {
    this.pageIndexSubject.next(index);
  }

  setSelectedOption(option: FinalProductDropdownOption | undefined) {
    this.selectedOptionSubject.next(option);
  }

  setSearchKey(searchKey: string | undefined) {
    this.searchKeySubject.next(searchKey);
  }

  setLastFetchedElement(last: number) {
    this.lastFetchedElementSubject.next(last);
  }

  setFetchParent(fetchParent: boolean) {
    this.fetchParentSubject.next(fetchParent);
  }

  setCustomFinalProductId(customFinalProductId: string) {
    this.customFinalProductIdSubject.next(customFinalProductId);
  }

  setDropdownDefaultSelectionMode(
    dropdownDefaultSelectionMode: DropdownDefaultSelectionMode
  ) {
    this.dropdownDefaultSelectionModeSubject.next(dropdownDefaultSelectionMode);
  }

  private setErrorMessage(error: string) {
    this.errorMessage.set(error);
  }

  private setLoadingData(isLoading: boolean): void {
    this.isLoadingData.set(isLoading);
  }

  setRepositoryId(value: string) {
    this.repositoryIdSubject.next(value);
  }

  private getFinalProductFilters(
    pageIndex: number,
    fetchParent: boolean,
    branchCriteria: string | undefined,
    searchKey: string | undefined,
    validationLevel: string[]
  ): FinalProductFilters {
    return {
      page: pageIndex,
      size: this.defaultPageSize,
      sort: this.defaultSortCriteria,
      fetchParent: fetchParent,
      branchFilter: branchCriteria,
      searchKey: searchKey,
      validationLevelFilter: validationLevel,
      stateFilter: [FinalProductState.AVAILABLE],
    };
  }

  private getDropdownOptions(
    finalProducts: FinalProduct[],
    headCommitId: string | undefined
  ): FinalProductDropdownOption[] {
    if (finalProducts && finalProducts.length > 0) {
      return finalProducts.map((finalProduct) =>
        this.buildDropdownOption(finalProduct, headCommitId)
      );
    }
    return [];
  }

  private buildDropdownOption(
    finalProduct: FinalProduct,
    headCommitId: string | undefined
  ): FinalProductDropdownOption {
    return {
      label: this.getDropdownOptionLabel(finalProduct, headCommitId),
      value: finalProduct,
    };
  }

  private getDropdownOptionLabel(
    finalProduct: FinalProduct,
    headCommitId: string | undefined
  ): string {
    const isHeadCommit = headCommitId
      ? finalProduct.configurationCommitId === headCommitId
      : false;
    const headLabelPrefix = isHeadCommit ? "HEAD-" : "";
    if (this.dropdownLabelMode === FinalProductDropdownInputLabelMode.TAG) {
      return finalProduct.tag ?? "-";
    }
    if (
      this.dropdownLabelMode ===
      FinalProductDropdownInputLabelMode.TAG_COMMIT_ID
    ) {
      return finalProduct.tag
        ? finalProduct.tag +
            "-" +
            headLabelPrefix +
            finalProduct.configurationCommitId
        : headLabelPrefix + finalProduct.configurationCommitId;
    }
    return headLabelPrefix + finalProduct.configurationCommitId;
  }

  private addNewFinalProductDropdownOptions(
    newOptions: FinalProductDropdownOption[]
  ) {
    if (this.pageIndex() === 0) {
      return of(this.getUniqueDropdownOptions(newOptions));
    } else {
      return of(
        Array.from(
          this.getUniqueDropdownOptions(
            this.finalProductDropdownOptions().concat(...newOptions)
          )
        )
      );
    }
  }

  private getUniqueDropdownOptions(options: FinalProductDropdownOption[]) {
    return Array.from(
      new Map(options.map((option) => [option.value.id, option])).values()
    );
  }

  private handleError(error: string) {
    this.setErrorMessage(error);
    this.setLoadingData(false);
  }
}
