import { Component, inject, input, signal } from "@angular/core";
import { UpgradeProcessStateUpdaterService } from "@mxevolve/domains/business-process/data-access";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { ScenarioRunsComponent } from "@mxevolve/domains/test/widget";
import { PickReferenceScenarioComponent } from "@mxevolve/domains/business-process/composite-widget";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";
import { Message } from "primeng/message";

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
    Message,
  ],
  providers: [UpgradeProcessStateUpdaterService],
})
export class ConvertBinaryStageComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly stageStatus = input.required<StageStatus>();

  private readonly stateUpdater = inject(UpgradeProcessStateUpdaterService);
  showRefreshInfo = signal(false);

  reloadExecution() {
    this.stateUpdater.reloadProcessDetails(this.processId(), this.projectId());
  }

  handleScenarioRunsFetched(headScenarioRunIds: string[]) {
    if (headScenarioRunIds.length == 0) {
      this.showRefreshInfo.set(true);
    } else {
      this.showRefreshInfo.set(false);
    }
  }
}
