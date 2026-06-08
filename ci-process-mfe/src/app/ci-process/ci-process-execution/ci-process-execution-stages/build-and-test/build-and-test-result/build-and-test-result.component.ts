import { Component, Input } from "@angular/core";
import { BuildAndTestProcessStageStatus } from "@mxflow/features/business-process";

@Component({
  selector: "mxflow-build-and-test-result",
  templateUrl: "build-and-test-result.component.html",
  standalone: false,
})
export class BuildAndTestResultComponent {
  readonly ciProcessStageStatus = BuildAndTestProcessStageStatus;

  @Input() stageResult: BuildAndTestProcessStageStatus;
  @Input() requester: string;
}
