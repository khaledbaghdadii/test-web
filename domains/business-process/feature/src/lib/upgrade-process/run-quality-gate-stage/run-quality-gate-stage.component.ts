import { Component, effect, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ProceedFromQualityGateWizardComponent } from "@mxevolve/domains/business-process/composite-widget";
import { UpgradeProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import {
  BusinessProcessContentContainerComponent,
  QualityGateValidationBannerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import {
  QualityGateValidationResult,
  StageStatus,
} from "@mxevolve/domains/business-process/util";
import {
  ScenarioRunsComponent,
  ScenarioRunsSummaryComponent,
  SummaryFilterEvent,
} from "@mxevolve/domains/test/widget";
import { ScenarioExecutionService } from "@mxflow/test-management";
import { Chip } from "primeng/chip";
import { PanelModule } from "primeng/panel";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-run-quality-gate-stage",
  templateUrl: "./run-quality-gate-stage.component.html",
  host: {
    style: "display: contents;",
  },
  imports: [
    ProceedFromQualityGateWizardComponent,
    ScenarioRunsComponent,
    ScenarioRunsSummaryComponent,
    Chip,
    PanelModule,
    BusinessProcessContentContainerComponent,
    StageContainerComponent,
    QualityGateValidationBannerComponent,
  ],
  providers: [
    UpgradeProcessStateUpdaterService,
    ScenarioExecutionService,
    ToastMessageService,
  ],
})
export class RunQualityGateStageComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly processName = input.required<string>();
  readonly developmentId = input.required<string>();
  readonly stageStatus = input.required<StageStatus>();
  readonly supportsResourceManagement = input.required<boolean>();
  readonly parentBranchName = input.required<string>();
  readonly validationResult = input.required<
    QualityGateValidationResult | undefined
  >();
  readonly referenceScenarioExecutionId = input.required<string>();
  readonly keptResourcesDecisionMade = input.required<boolean>();

  readonly activeFilter = signal<SummaryFilterEvent | undefined>(undefined);

  private readonly stateUpdater = inject(UpgradeProcessStateUpdaterService);
  private readonly scenarioExecutionService = inject(ScenarioExecutionService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly referenceScenarioExecution = rxResource({
    params: () => ({
      projectId: this.projectId(),
      scenarioExecutionId: this.referenceScenarioExecutionId(),
    }),
    stream: ({ params }) =>
      this.scenarioExecutionService.getScenarioExecution(
        params.projectId,
        params.scenarioExecutionId
      ),
  });

  constructor() {
    effect(() => {
      if (this.referenceScenarioExecution.status() === "error") {
        this.toastMessageService.showError(
          "Failed to fetch the MX Version of the picked reference Scenario."
        );
      }
    });
  }

  reloadExecution() {
    this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId());
  }
}
