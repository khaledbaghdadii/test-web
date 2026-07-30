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
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import {
  FinalProduct,
  FinalProductApiService,
  FinalProductFilters,
  FinalProducts,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import {
  BranchService,
  CommitInfo,
  CommitsService,
  GetBranchDetailsRequest,
} from "@mxevolve/domains/scm/data-access";
import { FinalProductDropdownOption } from "./final-product-dropdown-option.model";
import { DropdownDefaultSelectionMode } from "./dropdown-default-selection-mode";
import { FinalProductDropdownInputLabelMode } from "./final-product-dropdown-input-label-mode";

@Injectable()
export class FinalProductDropdownStateService {
  private readonly finalProductService = inject(FinalProductApiService);
  private readonly branchService = inject(BranchService);
  private readonly commitsService = inject(CommitsService);
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
  private readonly rawFinalProductDropdownOptions: Signal<
    FinalProductDropdownOption[]
  >;
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

  private readonly commitMessageMaxLength = 60;
  private readonly headCommitMessageMaxLength = 40;
  private readonly commitsInfo$: Observable<Map<string, CommitInfo>>;
  private readonly commitsInfo: Signal<Map<string, CommitInfo>>;
  private readonly allCommitIds$: Observable<string[]>;
  private readonly commitsInfoMapSubject = new BehaviorSubject<
    Map<string, CommitInfo>
  >(new Map());
  private readonly loadingCommitsInfoSubject = new BehaviorSubject<boolean>(
    false
  );
  readonly isLoadingCommitsInfo: Signal<boolean>;
  private lastStableFinalProductDropdownOptions: FinalProductDropdownOption[] =
    [];

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
            repositoryId: repositoryId,
            branchName: branch,
          };
          return this.branchService.getBranchDetails(request).pipe(
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
              .getFinalProductById(projectId, customFinalProductId)
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
            projectId,
            this.getFinalProductFilters(
              pageIndex,
              fetchParent,
              branchCriteria,
              searchKey,
              validationLevel
            )
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
    this.allCommitIds$ = this.finalProducts$.pipe(
      map((finalProducts) => this.getUniqueCommitIds(finalProducts)),
      scan((accumulatedCommitIds: string[], currentPageCommitIds: string[]) => {
        if (this.pageIndex() === 0) {
          return currentPageCommitIds;
        }
        return Array.from(
          new Set([...accumulatedCommitIds, ...currentPageCommitIds])
        );
      }, [] as string[])
    );
    this.commitsInfo$ = combineLatest([
      this.projectId$,
      this.repositoryId$,
      this.allCommitIds$,
    ]).pipe(
      switchMap(([projectId, repositoryId, commitIds]) => {
        const cachedCommitsInfo = this.commitsInfoMapSubject.value;
        if (!repositoryId || commitIds.length === 0) {
          return of(cachedCommitsInfo);
        }
        const missingCommitIds = commitIds.filter(
          (commitId) => !cachedCommitsInfo.has(commitId)
        );
        if (missingCommitIds.length === 0) {
          return of(cachedCommitsInfo);
        }
        this.loadingCommitsInfoSubject.next(true);
        return this.commitsService
          .getCommitsInfo({
            projectId,
            repositoryId,
            commitIds: missingCommitIds,
          })
          .pipe(
            map((commitsInfo) =>
              this.mergeCommitsInfoMap(cachedCommitsInfo, commitsInfo)
            ),
            catchError(() => of(cachedCommitsInfo))
          );
      }),
      tap((commitsInfoMap) => {
        this.commitsInfoMapSubject.next(commitsInfoMap);
        this.loadingCommitsInfoSubject.next(false);
      }),
      takeUntilDestroyed()
    );
    this.commitsInfo = toSignal(this.commitsInfo$, {
      initialValue: new Map<string, CommitInfo>(),
    });
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
    this.rawFinalProductDropdownOptions = toSignal(
      finalProductDropdownOptions$,
      {
        initialValue: [],
      }
    );
    this.selectedOption = toSignal(this.selectedOption$);
    this.searchKey = toSignal(this.searchKeyCriteria$);
    this.headCommitId = toSignal(this.headCommitID$);
    this.isLoadingCommitsInfo = toSignal(
      this.loadingCommitsInfoSubject.asObservable(),
      { initialValue: false }
    );
    this.finalProductDropdownOptions = computed(() => {
      if (this.isLoadingCommitsInfo()) {
        return this.lastStableFinalProductDropdownOptions;
      }
      const options = this.rawFinalProductDropdownOptions().map((option) => ({
        label: this.getDropdownOptionLabel(option.value, this.headCommitId()),
        value: option.value,
      }));
      this.lastStableFinalProductDropdownOptions = options;
      return options;
    });
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
    this.commitsInfoMapSubject.next(new Map<string, CommitInfo>());
    this.loadingCommitsInfoSubject.next(false);
    this.lastStableFinalProductDropdownOptions = [];
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
    const commitInfo = this.commitsInfo().get(
      finalProduct.configurationCommitId
    );
    const shortCommitId =
      commitInfo?.displayId ?? finalProduct.configurationCommitId;
    const messageSuffix = this.buildCommitMessageSuffix(
      commitInfo?.message,
      isHeadCommit
    );
    const commitIdLabel = headLabelPrefix + shortCommitId + messageSuffix;
    if (
      this.dropdownLabelMode ===
      FinalProductDropdownInputLabelMode.TAG_COMMIT_ID
    ) {
      return finalProduct.tag
        ? finalProduct.tag + "-" + commitIdLabel
        : commitIdLabel;
    }
    return commitIdLabel;
  }

  private buildCommitMessageSuffix(
    message: string | undefined,
    isHeadCommit: boolean
  ): string {
    if (!message) {
      return "";
    }
    const maxLength = isHeadCommit
      ? this.headCommitMessageMaxLength
      : this.commitMessageMaxLength;
    const truncatedMessage =
      message.length > maxLength
        ? `${message.slice(0, maxLength)}...`
        : message;
    return ` ${truncatedMessage}`;
  }

  private getUniqueCommitIds(finalProducts: FinalProduct[]): string[] {
    return Array.from(
      new Set(
        finalProducts.map((finalProduct) => finalProduct.configurationCommitId)
      )
    );
  }

  private toCommitsInfoMap(
    commitsInfo: CommitInfo[]
  ): Map<string, CommitInfo> {
    return new Map(
      commitsInfo.map((commitInfo) => [commitInfo.id, commitInfo])
    );
  }

  private mergeCommitsInfoMap(
    existingCommitsInfo: Map<string, CommitInfo>,
    newCommitsInfo: CommitInfo[]
  ): Map<string, CommitInfo> {
    const merged = new Map(existingCommitsInfo);
    this.toCommitsInfoMap(newCommitsInfo).forEach((commitInfo, commitId) =>
      merged.set(commitId, commitInfo)
    );
    return merged;
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
            this.rawFinalProductDropdownOptions().concat(...newOptions)
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
