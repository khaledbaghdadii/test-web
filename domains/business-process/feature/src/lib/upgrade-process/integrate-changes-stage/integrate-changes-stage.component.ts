import { Component, input } from "@angular/core";
import {
  FixIssuesComponent,
  RetryMergeRequestComponent,
} from "@mxevolve/domains/business-process/composite-widget";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import {
  BusinessProcessContentContainerComponent,
  StageContainerComponent,
} from "@mxevolve/domains/business-process/ui";

@Component({
  selector: "mxevolve-integrate-changes-stage",
  templateUrl: "./integrate-changes-stage.component.html",
  imports: [
    MergeRequestStepperComponent,
    RetryMergeRequestComponent,
    FixIssuesComponent,
    BusinessProcessContentContainerComponent,
    StageContainerComponent,
  ],
  host: {
    style: "display: contents;",
  },
})
export class IntegrateChangesStageComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly latestMergeRequestId = input.required<string>();
  readonly developmentId = input.required<string>();
  readonly stageStatus = input.required<StageStatus>();
  readonly supportsResourceManagement = input.required<boolean>();
  readonly parentBranchName = input.required<string>();
}
