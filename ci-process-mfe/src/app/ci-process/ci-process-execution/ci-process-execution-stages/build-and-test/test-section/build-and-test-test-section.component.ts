import { Component, inject, Input } from "@angular/core";
import { Divider } from "primeng/divider";
import { BuildAndTestRunScenarioComponent } from "./build-and-test-run-scenario/build-and-test-run-scenario.component";
import { BuildAndTestScenarioExecutionsComponent } from "./build-and-test-scenario-executions/build-and-test-scenario-executions.component";
import { BusinessProcessDefinitionService } from "@mxflow/features/business-process";
import { Panel } from "primeng/panel";

@Component({
  selector: "mxevolve-build-and-test-test-section",
  imports: [
    Divider,
    BuildAndTestRunScenarioComponent,
    BuildAndTestScenarioExecutionsComponent,
    Panel,
  ],
  templateUrl: "build-and-test-test-section.component.html",
})
export class BuildAndTestTestSectionComponent {
  definitionService = inject(BusinessProcessDefinitionService);

  @Input({ required: true }) projectId: string;
}
