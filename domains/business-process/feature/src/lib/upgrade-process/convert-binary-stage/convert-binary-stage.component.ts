import { Component, inject, input } from "@angular/core";
import { UpgradeProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import { PickReferenceScenarioComponent } from "@mxevolve/domains/business-process/composite-widget";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";

@Component({
  selector: "mxevolve-convert-binary-stage",
  templateUrl: "./convert-binary-stage.component.html",
  host: {
    style: "display: contents;",
  },
  imports: [
    ScenarioRunsComponent,
    PickReferenceScenarioComponent,
    StageContainerComponent,
    BusinessProcessContentContainerComponent,
  ],
  providers: [UpgradeProcessStateUpdaterService],
})
export class ConvertBinaryStageComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<StageStatus>();

  private readonly stateUpdater = inject(UpgradeProcessStateUpdaterService);

  reloadExecution() {
    this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId());
  }
}
