import { Component, input } from "@angular/core";
import {
  BuildAndTestBackport,
  CherryPickStatus,
} from "@mxevolve/domains/business-process/util";
import { MergeRequestStepperComponent } from "@mxevolve/domains/scm/widget";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { Message } from "primeng/message";
import { BuildAndTestBackportManualCherryPickComponent } from "./build-and-test-backport-manual-cherry-pick.component";

@Component({
  selector: "mxevolve-build-and-test-backport-cherry-pick-and-merge-request",
  imports: [
    BuildAndTestBackportManualCherryPickComponent,
    MergeRequestStepperComponent,
    Message,
    MxevolveIconComponent,
  ],
  templateUrl:
    "./build-and-test-backport-cherry-pick-and-merge-request.component.html",
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestBackportCherryPickAndMergeRequestComponent {
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly processId = input.required<string>();
  readonly backport = input.required<BuildAndTestBackport>();

  protected readonly CherryPickStatus = CherryPickStatus;
}
