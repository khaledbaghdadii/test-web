import { Component, input } from "@angular/core";
import { Button } from "primeng/button";
import { ReferenceScenariosTableComponent } from "@mxevolve/domains/business-process/widget";

@Component({
  selector: "mxevolve-upgrade-process-reference-scenarios",
  imports: [Button, ReferenceScenariosTableComponent],
  templateUrl: "./reference-scenarios.component.html",
})
export class ReferenceScenariosComponent {
  readonly projectId = input.required<string>();
  readonly referenceScenarioExecutionGroupId = input.required<string>();
}
