import { DestroyRef, inject, Injectable, Signal, signal } from "@angular/core";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import {
  FinalProduct,
  FinalProductFilters,
  FinalProductLatestSyncState,
  FinalProducts,
  FinalProductService,
  FinalProductState,
} from "@mxflow/features/artifact-manager";
import { Project, ProjectService } from "@mxflow/features/project";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from "rxjs";
import { SyncFinalProductApiRequest } from "../model/sync-final-product-api-request";

export enum FinalProductScope {
  GLOBAL = "GLOBAL",
  PROJECT = "PROJECT",
}

@Injectable()
export class FinalProductStateService {
  private readonly EMPTY_FINAL_PRODUCTS: FinalProducts = {
    content: [],
    size: 0,
    number: 0,
    totalPages: 0,
    totalElements: 0,
    last: true,
  };
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly DEFAULT_PAGE_INDEX = 0;

  finalProducts = signal<FinalProducts>(this.EMPTY_FINAL_PRODUCTS);
  pageSize = signal<number>(this.DEFAULT_PAGE_SIZE);
  pageIndex = signal<number>(this.DEFAULT_PAGE_INDEX);
  fetchFinalProductsLoading = signal<boolean>(false);
  isSyncFinalProductLoading = signal<boolean>(false);
  isSyncFinalProductModalOpen = signal<boolean>(false);
  selectedFinalProductToBeSynced = signal<FinalProduct | undefined>(undefined);
  selectedFinalProduct = signal<FinalProduct | undefined>(undefined);
  private readonly destroyRef$ = new Subject();

  projects: Signal<Project[] | undefined>;

  private readonly finalProducts$: Observable<FinalProducts>;
  private readonly scopeSubject = new Subject<FinalProductScope>();
  private readonly scopeProjectIdSubject = new BehaviorSubject<
    string | undefined
  >(undefined);
  private readonly brachNameSearchSubject = new BehaviorSubject<
    string | undefined
  >(undefined);
  private readonly validationLevelSearchSubject = new BehaviorSubject<
    string[] | undefined
  >(undefined);
  private readonly mxBundleTypeSearchSubject = new BehaviorSubject<
    string | undefined
  >(undefined);
  private readonly isToolTypeFilterSubject = new BehaviorSubject<
    string[] | undefined
  >(undefined);
  private readonly configurationCommitIdSearchSubject = new BehaviorSubject<
    string | undefined
  >(undefined);
  private readonly projectIdsSubject = new BehaviorSubject<
    string[] | undefined
  >(undefined);
  private readonly searchKeySubject = new BehaviorSubject<string | undefined>(
    undefined
  );

  private readonly latestSyncStateSubject = new BehaviorSubject<
    FinalProductLatestSyncState | undefined
  >(undefined);

  private readonly finalProductStateSubject = new BehaviorSubject<
    FinalProductState[] | undefined
  >(undefined);

  private readonly errorMessageSubject = new Subject<string>();
  refreshTriggerSubject = new BehaviorSubject<boolean>(false);
  successMessageSubject = new Subject<string>();

  errorMessage$ = this.errorMessageSubject.asObservable();
  private readonly scope$ = this.scopeSubject.asObservable();
  private readonly scopeProjectId$ = this.scopeProjectIdSubject.asObservable();
  public brachNameSearch$ = this.brachNameSearchSubject.asObservable();
  public validationLevelSearch$ =
    this.validationLevelSearchSubject.asObservable();
  public mxBundleTypeFilter$ = this.mxBundleTypeSearchSubject.asObservable();
  public isToolTypeFilter$ = this.isToolTypeFilterSubject.asObservable();
  public latestSyncStateFilter$ = this.latestSyncStateSubject.asObservable();
  public finalProductState$ = this.finalProductStateSubject.asObservable();
  public configurationCommitIdSearch$ =
    this.configurationCommitIdSearchSubject.asObservable();
  public projectIds$ = this.projectIdsSubject.asObservable();
  public searchKey$ = this.searchKeySubject.asObservable();
  public refreshTrigger$ = this.refreshTriggerSubject.asObservable();
  readonly finalProductService = inject(FinalProductService);
  readonly projectService = inject(ProjectService);
  readonly destroyRef = inject(DestroyRef);

  constructor() {
    const pageSize$ = toObservable(this.pageSize);
    const pageIndex$ = toObservable(this.pageIndex);

    this.finalProducts$ = combineLatest([
      pageIndex$,
      pageSize$,
      this.brachNameSearch$,
      this.validationLevelSearch$,
      this.configurationCommitIdSearch$,
      this.searchKey$,
      this.projectIds$,
      this.mxBundleTypeFilter$,
      this.isToolTypeFilter$,
      this.latestSyncStateFilter$,
      this.finalProductState$,
      this.refreshTrigger$,
      this.scope$,
      this.scopeProjectId$,
    ]).pipe(
      tap(() => this.fetchFinalProductsLoading.set(true)),
      switchMap(
        ([
          pageIndex,
          pageSize,
          branchName,
          validationLevel,
          configurationCommitId,
          searchKey,
          projectIds,
          mxBundleType,
          isToolType,
          latestSyncState,
          finalProductState,
          ,
          scope,
          scopeProjectId,
        ]) =>
          this.fetchFinalProducts(
            {
              page: pageIndex,
              size: pageSize,
              sort: "createdOn,desc",
              branchFilter: branchName,
              validationLevelFilter: validationLevel,
              configurationCommitIdSearch: configurationCommitId,
              searchKey: searchKey,
              projectIds: projectIds,
              bundleTypeSearchKey: mxBundleType,
              isToolTypeFilters: isToolType,
              latestSyncStateFilter: latestSyncState,
              stateFilter: finalProductState,
            },
            scope,
            scopeProjectId
          )
      ),
      tap(() => this.fetchFinalProductsLoading.set(false)),
      takeUntilDestroyed(),
      takeUntil(this.destroyRef$)
    );

    this.finalProducts$
      .pipe(takeUntilDestroyed())
      .subscribe((finalProducts) => {
        this.finalProducts.set(finalProducts);
      });

    this.projects = toSignal(
      this.projectService.getAllProjects().pipe(
        catchError(() => {
          this.setErrorMessage("Failed to fetch projects");
          return EMPTY;
        })
      ),
      { initialValue: undefined }
    );
  }

  setPageSize(pageSize: number) {
    this.pageSize.set(pageSize);
  }

  setPageIndex(pageIndex: number) {
    this.pageIndex.set(pageIndex);
  }

  setScope(scope: FinalProductScope) {
    this.scopeSubject.next(scope);
  }

  setScopeProjectId(projectId: string | undefined) {
    this.scopeProjectIdSubject.next(projectId);
  }

  setSelectedFinalProductToBeSynced(finalProduct: FinalProduct | undefined) {
    this.selectedFinalProductToBeSynced.set(finalProduct);
  }

  setSelectedFinalProduct(finalProduct: FinalProduct | undefined) {
    this.selectedFinalProduct.set(finalProduct);
  }

  syncFinalProduct(
    projectId: string,
    finalProductId: string,
    request: SyncFinalProductApiRequest
  ) {
    this.setSyncFinalProductLoading(true);
    return this.finalProductService
      .syncFinalProduct(projectId, finalProductId, request)
      .pipe(
        tap(() => {
          this.successMessageSubject.next(
            "Request to sync final product has been sent"
          );
          this.setSyncFinalProductLoading(false);
          this.refreshTriggerSubject.next(true);
        }),
        catchError((error) => {
          const errorMessage = error.error?.message
            ? "Sync of final product failed: " + error.error.message
            : "Sync of final product failed";
          this.setErrorMessage(errorMessage);
          this.setSyncFinalProductLoading(false);
          return throwError(() => error);
        }),
        takeUntilDestroyed(this.destroyRef)
      );
  }

  setBranchNameSearchValue(branchName: string) {
    this.brachNameSearchSubject.next(branchName);
    this.setPageIndex(0);
  }

  setValidationLevelSearchValue(validationLevel: string[]) {
    this.validationLevelSearchSubject.next(validationLevel);
    this.setPageIndex(0);
  }

  setConfigurationCommitIdSearchValue(configurationCommitId: string) {
    this.configurationCommitIdSearchSubject.next(configurationCommitId);
    this.setPageIndex(0);
  }

  setSearchKeyValue(searchKey: string) {
    this.searchKeySubject.next(searchKey);
    this.setPageIndex(0);
  }

  setProjectIds(projectIds: string[] | undefined) {
    this.projectIdsSubject.next(projectIds);
    this.setPageIndex(0);
  }

  setIsToolTypes(isToolTypes: string[] | undefined) {
    this.isToolTypeFilterSubject.next(isToolTypes);
    this.setPageIndex(0);
  }

  setMxBundlesType(mxBundlesType: string | undefined) {
    this.mxBundleTypeSearchSubject.next(mxBundlesType);
    this.setPageIndex(0);
  }

  setLatestSyncState(latestSyncState: FinalProductLatestSyncState | undefined) {
    this.latestSyncStateSubject.next(latestSyncState);
    this.setPageIndex(0);
  }

  setFinalProductStates(finalProductState: FinalProductState[] | undefined) {
    this.finalProductStateSubject.next(finalProductState);
    this.setPageIndex(0);
  }

  setErrorMessage(errorMessage: string) {
    this.errorMessageSubject.next(errorMessage);
  }

  setIsSyncFinalProductModalOpen(isOpen: boolean) {
    this.isSyncFinalProductModalOpen.set(isOpen);
  }

  resetState(): void {
    this.selectedFinalProduct.set(undefined);
    this.selectedFinalProductToBeSynced.set(undefined);
    this.isSyncFinalProductModalOpen.set(false);
    this.fetchFinalProductsLoading.set(false);
    this.isSyncFinalProductLoading.set(false);
    this.pageSize.set(this.DEFAULT_PAGE_SIZE);
    this.pageIndex.set(this.DEFAULT_PAGE_INDEX);
    this.brachNameSearchSubject.next(undefined);
    this.validationLevelSearchSubject.next(undefined);
    this.mxBundleTypeSearchSubject.next(undefined);
    this.isToolTypeFilterSubject.next(undefined);
    this.configurationCommitIdSearchSubject.next(undefined);
    this.projectIdsSubject.next(undefined);
    this.searchKeySubject.next(undefined);
    this.errorMessageSubject.next("");
    this.successMessageSubject.next("");
  }

  private fetchFinalProducts(
    finalProductFilters: FinalProductFilters,
    scope: FinalProductScope,
    scopeProjectId: string | undefined
  ): Observable<FinalProducts> {
    if (scope === FinalProductScope.PROJECT && !scopeProjectId) {
      return this.handleError(
        "Project ID is required when scope is set to PROJECT"
      );
    }

    const observable$ =
      scope === FinalProductScope.PROJECT
        ? this.finalProductService.getFinalProducts(
            finalProductFilters,
            scopeProjectId!
          )
        : this.finalProductService.getFilteredFinalProducts(
            finalProductFilters
          );

    return observable$.pipe(
      catchError((error) => {
        const errorMessage = error.error?.message
          ? "Failed to fetch final products: " + error.error.message
          : "Failed to fetch final products";
        return this.handleError(errorMessage);
      })
    );
  }

  private handleError(error: string): Observable<FinalProducts> {
    this.fetchFinalProductsLoading.set(false);
    this.setErrorMessage(error);
    return of(this.EMPTY_FINAL_PRODUCTS);
  }

  public setSyncFinalProductLoading(isLoading: boolean) {
    this.isSyncFinalProductLoading.set(isLoading);
  }

  public destroyService() {
    this.destroyRef$.next({});
  }
}
