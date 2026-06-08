import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { ScenarioExecutionService } from "@mxflow/test-management";
import { Store } from "@ngrx/store";
import { CiProcessActions } from "../../../../../state";

@Component({
  selector: "mxflow-build-scenario-details",
  templateUrl: "build-scenario-details.component.html",
  standalone: false,
})
export class BuildScenarioDetailsComponent implements OnInit, OnDestroy {
  @Input() projectId: string;
  @Input() processId: string;
  @Input() scenarioId: string;
  @Input() isUserInterventionDisabled: boolean;

  environmentId: string;
  private readonly destroy$ = new Subject();

  constructor(
    private readonly store: Store,
    private readonly scenarioExecutionService: ScenarioExecutionService
  ) {}

  ngOnInit(): void {
    this.scenarioExecutionService
      .getScenarioExecution(this.projectId, this.scenarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (scenarioExecution) => {
          this.environmentId = scenarioExecution.environmentId;
        },
        error: (errorMessage) => {
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: errorMessage })
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
