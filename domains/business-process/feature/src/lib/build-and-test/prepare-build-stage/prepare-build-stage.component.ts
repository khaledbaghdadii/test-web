import { Component, inject, input } from "@angular/core";
import { BuildAndTestProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import type { StepStatus } from "@mxevolve/shared/ui/primitive";

const PREPARE_BUILD_ENVIRONMENT_SUB_CONTEXT_ID = "PREPARE_BUILD_ENVIRONMENT";

@Component({
  selector: "mxevolve-prepare-build-stage",
  templateUrl: "./prepare-build-stage.component.html",
  imports: [
    BusinessProcessContentContainerComponent,
    ScenarioRunsComponent,
    StageContainerComponent,
  ],
  providers: [BuildAndTestProcessStateUpdaterService],
  host: {
    style: "display: contents;",
  },
})
export class PrepareBuildStageComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<StepStatus>();

  private readonly stateUpdater = inject(BuildAndTestProcessStateUpdaterService);

  readonly subContextId = PREPARE_BUILD_ENVIRONMENT_SUB_CONTEXT_ID;

  reloadExecution(): void {
    this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId());
  }
}
