import { Component, Input } from "@angular/core";
import { BuildAndTestProcessPrepareBuildStage } from "@mxflow/features/business-process";

@Component({
  selector: "mxflow-build-environment-section",
  templateUrl: "build-environment-section.component.html",
  standalone: false,
})
export class BuildEnvironmentSectionComponent {
  @Input() projectId: string;
  @Input() processId: string;
  @Input() prepareBuildStage: BuildAndTestProcessPrepareBuildStage;
  @Input() isUserInterventionDisabled: boolean;
}
