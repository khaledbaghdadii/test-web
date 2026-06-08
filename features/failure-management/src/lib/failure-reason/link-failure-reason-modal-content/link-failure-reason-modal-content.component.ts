import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
} from "@angular/core";

import { BehaviorSubject, filter, Subject, takeUntil } from "rxjs";
import { FailureReasonSelectionTableComponent } from "../failure-reason-selection-table/failure-reason-selection-table.component";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  FailureReasonLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { toObservable } from "@angular/core/rxjs-interop";
import { FailureReason } from "../failure-reason";

@Component({
  selector: "mxevolve-link-failure-reason-modal-content",
  imports: [FailureReasonSelectionTableComponent],
  templateUrl: "./link-failure-reason-modal-content.component.html",
})
export class LinkFailureReasonModalContentComponent implements OnDestroy {
  destroy$ = new Subject<void>();
  refresh$ = new BehaviorSubject<boolean>(false);
  private failureReasonLinkingStateService = inject(
    FailureReasonLinkingStateService
  );
  isLinking = this.failureReasonLinkingStateService.isLinking;

  @Input()
  initiallySelectedFailureReasons: AnalysisObjectSelectionState<AnalysisObject>[] =
    [];
  @Input({ required: true }) selectedFailureReasonIdsLoading: boolean;
  @Output() selectedFailureReasonsChange = new EventEmitter<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >();

  constructor() {
    toObservable(this.isLinking)
      .pipe(
        filter((isLinking) => isLinking),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.refresh$.next(true);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFailureReasonSelectionChange(
    selectedFailureReasons: AnalysisObjectSelectionState<FailureReason>[]
  ) {
    this.selectedFailureReasonsChange.emit(selectedFailureReasons);
  }
}
