import {
  Component,
  computed,
  inject,
  Input,
  model,
  OnDestroy,
  signal,
} from "@angular/core";

import { TableModule } from "primeng/table";
import { finalize, Observable, Subject, takeUntil } from "rxjs";
import { Skeleton } from "primeng/skeleton";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CheckboxChangeEvent, CheckboxModule } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { FormsModule } from "@angular/forms";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  SelectedAnalysisObject,
  SelectedAnalysisObjectsListingComponent,
} from "@mxflow/features/analysis-objects";
import { FailureReasonsDataService } from "../failure-reasons-data.service";
import { FailureReason } from "../failure-reason";

export interface FailureReasonTableRowSelectionState {
  failureReason: FailureReason;
  checked: boolean;
}

@Component({
  selector: "mxevolve-failure-reason-selection-table",
  imports: [
    TableModule,
    Skeleton,
    TableEmptyMessageComponent,
    CheckboxModule,
    TooltipModule,
    FormsModule,
    SelectedAnalysisObjectsListingComponent,
  ],
  templateUrl: "./failure-reason-selection-table.component.html",
})
export class FailureReasonSelectionTableComponent implements OnDestroy {
  private failureReasonDataService = inject(FailureReasonsDataService);
  private toastMessageService = inject(ToastMessageService);

  private readonly destroy$ = new Subject();
  protected readonly Array = Array;
  listOfFailureReasons = signal<FailureReason[]>([]);
  isTableLoading = false;
  selectedFailureReasons = model<AnalysisObjectSelectionState<FailureReason>[]>(
    []
  );

  tableRowSelectionState = computed<FailureReasonTableRowSelectionState[]>(() =>
    this.listOfFailureReasons().map((failureReason) => {
      const initiallySelectedFailureReason = this.selectedFailureReasons().find(
        (selectionState) =>
          selectionState.analysisObject.id === failureReason.id
      );
      return {
        failureReason: failureReason,
        checked:
          initiallySelectedFailureReason?.selectionType ===
          AnalysisObjectSelectionType.FULL,
      } as FailureReasonTableRowSelectionState;
    })
  );

  @Input({ required: true })
  set refresh(refresh$: Observable<boolean>) {
    refresh$.pipe(takeUntil(this.destroy$)).subscribe((refresh) => {
      if (refresh) {
        this.fetchAndInitTable();
      }
    });
  }

  @Input() selectedFailureReasonIdsLoading = false;
  @Input()
  initiallySelectedFailureReasons: AnalysisObjectSelectionState<AnalysisObject>[] =
    [];

  selectedAnalysisObjects = computed(() => {
    return this.selectedFailureReasons().map((selectionState) => {
      return {
        id: selectionState.analysisObject.id,
        title: selectionState.analysisObject.title,
        selectionType: AnalysisObjectSelectionType.FULL,
        selectionMessage: undefined,
      } as SelectedAnalysisObject;
    });
  });

  fetchAndInitTable() {
    this.listOfFailureReasons.set([]);
    this.isTableLoading = true;
    this.failureReasonDataService
      .getFailureReasons()
      .pipe(
        finalize(() => {
          this.isTableLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (failureReasons) => {
          this.listOfFailureReasons.set(
            failureReasons.filter((failureReason) => failureReason.isEnabled)
          );
          this.selectedFailureReasons.set(
            this.initiallySelectedFailureReasons.map((selectionState) => {
              return this.toSelectedAnalysisObject(
                failureReasons,
                selectionState
              );
            })
          );
        },
        error: (error) => {
          this.toastMessageService.showError(error.message);
          this.selectedFailureReasons.set([]);
        },
      });
  }

  private toSelectedAnalysisObject(
    failureReasons: FailureReason[],
    selectionState: AnalysisObjectSelectionState<AnalysisObject>
  ) {
    return {
      analysisObject: failureReasons.find(
        (fr) => fr.id === selectionState.analysisObject.id
      ) as FailureReason,
      selectionType: AnalysisObjectSelectionType.FULL,
      selectionMessage: undefined,
    };
  }

  handleSelectionChange(
    event: CheckboxChangeEvent,
    failureReason: FailureReason
  ) {
    if (event.checked) {
      this.addFailureReasonToSelection(failureReason);
    } else {
      this.removeFailureReasonFromSelection(failureReason.id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  removeFailureReasonFromSelection(failureReasonId: string) {
    this.selectedFailureReasons.update((current) =>
      current.filter((fr) => fr.analysisObject.id !== failureReasonId)
    );
  }

  private addFailureReasonToSelection(failureReason: FailureReason) {
    this.selectedFailureReasons.update((current) => [
      ...current,
      {
        analysisObject: failureReason,
        selectionType: AnalysisObjectSelectionType.FULL,
        selectionMessage: undefined,
      } as AnalysisObjectSelectionState<FailureReason>,
    ]);
  }
}
