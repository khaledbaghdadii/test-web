import { computed, inject, Injectable, Signal, signal } from "@angular/core";
import { DefectService } from "../defect.service";
import { FetchDefectResult } from "../model/defect.model";
import { FetchDefectsQuery } from "../model/fetch-defects-query.model";
import { catchError, combineLatest, of, switchMap, tap } from "rxjs";
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import { DefectTableQuery } from "./defect-table-query.model";
import { ValidationScope } from "../../validation-scope/model/validation-scope.model";

@Injectable({
  providedIn: "root",
})
export class DefectTableStateService {
  private defectService = inject(DefectService);
  private defaultSort = "submissionDate,desc";
  private emptyResult: FetchDefectResult = {
    defects: {
      content: [],
      size: 0,
      number: 0,
      totalPages: 0,
      totalElements: 0,
      last: true,
    },
  };

  private pageIndex = signal<number>(0);
  private size = signal<number>(10);
  private idPhrase = signal<string | undefined>(undefined);
  private titlePhrase = signal<string | undefined>(undefined);
  private descriptionPhrase = signal<string | undefined>(undefined);
  private developerPhrase = signal<string | undefined>(undefined);
  private currentVersionCriteria = signal<string | undefined>(undefined);
  private referenceVersionCriteria = signal<string | undefined>(undefined);
  private fetchDefectsQuery = computed<FetchDefectsQuery>(() => ({
    page: this.pageIndex(),
    size: this.size(),
    sort: this.defaultSort,
    idPhrase: this.idPhrase(),
    titlePhrase: this.titlePhrase(),
    descriptionPhrase: this.descriptionPhrase(),
    developerPhrase: this.developerPhrase(),
    currentVersion: this.currentVersionCriteria(),
    referenceVersion: this.referenceVersionCriteria(),
  }));
  private isVisible = signal<boolean>(false);

  readonly fetchDefectResult: Signal<FetchDefectResult>;
  readonly errorMessage = signal<string | undefined>(undefined);
  readonly isLoading = signal<boolean>(false);
  page = this.pageIndex.asReadonly();
  pageSize = this.size.asReadonly();
  defectsPage = computed(() => this.fetchDefectResult().defects);
  warningMessage = computed(() => this.fetchDefectResult().warningMessage);
  defects = computed(() => this.defectsPage().content);
  totalElements = computed(() => this.defectsPage().totalElements);

  constructor() {
    const fetchDefectsQuery$ = toObservable(this.fetchDefectsQuery).pipe(
      takeUntilDestroyed()
    );
    const isVisible$ = toObservable(this.isVisible).pipe(takeUntilDestroyed());

    const fetchDefectResult$ = combineLatest([
      fetchDefectsQuery$,
      isVisible$,
    ]).pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(([query, isVisible]) => {
        if (isVisible) {
          return this.defectService.fetchAll(query).pipe(
            catchError((error) => {
              this.errorMessage.set(error);
              this.isLoading.set(false);
              return of(this.emptyResult);
            })
          );
        }
        return of(this.emptyResult);
      }),
      tap(() => this.isLoading.set(false)),
      takeUntilDestroyed()
    );

    this.fetchDefectResult = toSignal(fetchDefectResult$, {
      initialValue: this.emptyResult,
    });
  }

  setValidationScope(validationScope: ValidationScope | undefined) {
    this.currentVersionCriteria.set(validationScope?.currentVersion);
    this.referenceVersionCriteria.set(validationScope?.referenceVersion);
    this.pageIndex.set(0);
  }

  setIsVisible(isVisible: boolean) {
    this.isVisible.set(isVisible);
  }

  setDefectTableQuery(query: DefectTableQuery) {
    this.pageIndex.set(query.page ?? 0);
    this.size.set(query.pageSize ?? 10);
    this.idPhrase.set(this.filterUndefinedAndEmptyString(query.idPhrase));
    this.titlePhrase.set(this.filterUndefinedAndEmptyString(query.titlePhrase));
    this.descriptionPhrase.set(
      this.filterUndefinedAndEmptyString(query.descriptionPhrase)
    );
    this.developerPhrase.set(
      this.filterUndefinedAndEmptyString(query.developerPhrase)
    );
  }

  private filterUndefinedAndEmptyString(value?: string | undefined) {
    return value?.trim() ? value : undefined;
  }
}
