import { computed, Injectable, signal, Signal } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  map,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
} from "rxjs";
import { ErpAllocation } from "../../model/erp-allocation";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ErpAllocationsDropdownOption } from "../erp-allocations-dropdown.option";
import { ErpService } from "../../erp.service";
import { tap } from "rxjs/operators";
import { ErpAllocationsDropdownDefaultSelectionMode } from "../../model/erp-allocations-dropdown-default-selection-mode";

@Injectable()
export class ErpAllocationsDropdownStateService {
  private projectIdSubject = new Subject<string>();
  private projectId$ = this.projectIdSubject.asObservable();

  errorMessageSubject = new Subject<string>();

  private customErpAllocationIdSubject = new Subject<string | undefined>();
  private customErpAllocationId$ =
    this.customErpAllocationIdSubject.asObservable();

  private dropdownDefaultSelectionModeSubject =
    new BehaviorSubject<ErpAllocationsDropdownDefaultSelectionMode>(
      ErpAllocationsDropdownDefaultSelectionMode.LATEST
    );
  private dropdownDefaultSelectionMode$ =
    this.dropdownDefaultSelectionModeSubject.asObservable();
  readonly dropdownDefaultSelectionModeSignal: Signal<ErpAllocationsDropdownDefaultSelectionMode> =
    toSignal(this.dropdownDefaultSelectionMode$, {
      initialValue: ErpAllocationsDropdownDefaultSelectionMode.LATEST,
    });

  readonly customErpAllocation$: Observable<ErpAllocation | undefined>;
  readonly customErpAllocation: Signal<ErpAllocation | undefined>;

  private retrievedErpAllocations$: Observable<ErpAllocation[]>;
  readonly retrievedErpAllocations: Signal<ErpAllocation[]>;

  private erpAllocations$: Observable<ErpAllocation[]>;
  readonly erpAllocations: Signal<ErpAllocation[]>;

  private selectedOptionSubject = new Subject<
    ErpAllocationsDropdownOption | undefined
  >();
  private selectedOption$ = this.selectedOptionSubject.asObservable();
  readonly selectedOption: Signal<ErpAllocationsDropdownOption | undefined>;

  readonly erpAllocationsDropdownOptions = computed(() =>
    this.getDropdownOptions(this.erpAllocations())
  );

  readonly isLoadingData = signal(false);

  constructor(private erpService: ErpService) {
    this.retrievedErpAllocations$ = this.projectId$.pipe(
      switchMap((projectId) => {
        this.setLoadingData(true);
        return this.erpService.getAllErpAllocations(projectId).pipe(
          catchError(() => {
            this.setLoadingData(false);
            this.errorMessageSubject.next("Failed to fetch ERP Allocations");
            return EMPTY;
          }),
          tap(() => this.setLoadingData(false))
        );
      }),
      shareReplay(1),
      takeUntilDestroyed()
    );

    this.customErpAllocation$ = combineLatest([
      this.customErpAllocationId$,
      this.retrievedErpAllocations$,
    ]).pipe(
      map(([customErpAllocationId, retrievedErpAllocations]) => {
        if (customErpAllocationId) {
          const customErpAllocation = retrievedErpAllocations.find(
            (erpAllocation) => erpAllocation.id === customErpAllocationId
          );
          return customErpAllocation || undefined;
        }
        return undefined;
      })
    );
    this.retrievedErpAllocations = toSignal(this.retrievedErpAllocations$, {
      initialValue: [],
    });

    this.erpAllocations$ = combineLatest([
      this.customErpAllocation$.pipe(startWith(null)),
      this.retrievedErpAllocations$,
      this.dropdownDefaultSelectionMode$,
    ]).pipe(
      map(
        ([
          customErpAllocation,
          retrievedErpAllocations,
          dropdownDefaultSelectionMode,
        ]) => {
          return customErpAllocation
            ? this.getErpAllocationsList(
                customErpAllocation,
                retrievedErpAllocations,
                dropdownDefaultSelectionMode
              )
            : this.getErpAllocationsList(
                null,
                retrievedErpAllocations,
                dropdownDefaultSelectionMode
              );
        }
      )
    );
    this.erpAllocations = toSignal(this.erpAllocations$, {
      initialValue: [],
    });
    this.customErpAllocation = toSignal(this.customErpAllocation$);

    this.retrievedErpAllocations = toSignal(this.retrievedErpAllocations$, {
      initialValue: [],
    });

    this.selectedOption = toSignal(this.selectedOption$);
  }

  setCustomErpAllocationId(customErpAllocationId: string | undefined) {
    this.customErpAllocationIdSubject.next(customErpAllocationId);
  }

  setDropdownDefaultSelectionMode(
    dropdownDefaultSelectionMode: ErpAllocationsDropdownDefaultSelectionMode
  ) {
    this.dropdownDefaultSelectionModeSubject.next(dropdownDefaultSelectionMode);
  }

  setProjectId(projectId: string) {
    this.projectIdSubject.next(projectId);
  }

  setSelectedOption(option: ErpAllocationsDropdownOption | undefined) {
    this.selectedOptionSubject.next(option);
  }

  private setLoadingData(isLoading: boolean): void {
    this.isLoadingData.set(isLoading);
  }

  private getDropdownOptions(
    erpAllocations: ErpAllocation[]
  ): ErpAllocationsDropdownOption[] {
    if (erpAllocations && erpAllocations.length > 0) {
      return erpAllocations.map((erpAllocation) =>
        this.buildDropdownOption(erpAllocation)
      );
    }
    return [];
  }

  private buildDropdownOption(
    erpAllocation: ErpAllocation
  ): ErpAllocationsDropdownOption {
    return {
      label: `${erpAllocation.erpProjectId}-${erpAllocation.allocationName}`,
      value: erpAllocation,
    };
  }

  private getErpAllocationsList(
    customErpAllocation: ErpAllocation | null,
    retrievedErpAllocations: ErpAllocation[],
    dropdownDefaultSelectionMode: ErpAllocationsDropdownDefaultSelectionMode
  ) {
    return customErpAllocation &&
      dropdownDefaultSelectionMode ===
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      ? [
          customErpAllocation,
          ...retrievedErpAllocations.filter(
            (a) => a.id !== customErpAllocation.id
          ),
        ]
      : retrievedErpAllocations || [];
  }
}
