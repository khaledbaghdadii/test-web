import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ScenarioExecutionService } from "@mxflow/test-management";
import { Subject, takeUntil } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxflow-prepare-build-scenario",
  templateUrl: "prepare-build-scenario.component.html",
  standalone: false,
})
export class PrepareBuildScenarioComponent implements OnInit, OnDestroy {
  @Input() processId: string;
  @Input() projectId: string;
  @Input() scenarioId?: string;
  @Input() isUserInterventionDisabled: boolean;

  environmentId: string;
  isViewEnvironmentDisabled = false;

  private readonly destroy$ = new Subject();

  constructor(
    private scenarioExecutionService: ScenarioExecutionService,
    private toastMessageService: ToastMessageService
  ) {}

  ngOnInit(): void {
    if (this.scenarioId) {
      this.getEnvironmentIdFromScenario(this.scenarioId);
    } else {
      this.isViewEnvironmentDisabled = true;
    }
  }

  private getEnvironmentIdFromScenario(scenarioId: string) {
    this.scenarioExecutionService
      .getScenarioExecution(this.projectId, scenarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (scenarioExecution) => {
          this.environmentId = scenarioExecution.environmentId;
          if (!this.environmentId) {
            this.isViewEnvironmentDisabled = true;
          }
        },
        error: (error) => {
          this.isViewEnvironmentDisabled = true;
          this.toastMessageService.showError(error.message);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
