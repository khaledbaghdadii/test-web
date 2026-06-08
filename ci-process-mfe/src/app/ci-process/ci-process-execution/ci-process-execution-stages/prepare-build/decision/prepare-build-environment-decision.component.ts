import { Component, Input } from "@angular/core";

@Component({
  selector: "mxflow-prepare-build-environment-decision",
  templateUrl: "./prepare-build-environment-decision.component.html",
  standalone: false,
})
export class PrepareBuildEnvironmentDecisionComponent {
  @Input() requester: string;
}
