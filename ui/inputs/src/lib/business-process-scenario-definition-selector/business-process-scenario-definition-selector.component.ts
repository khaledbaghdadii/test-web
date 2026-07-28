import { Component, Input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  ScenarioDefinitionSingleSelectorComponent,
  ScenarioDefinitionMultiSelectorComponent,
} from "@mxflow/test-management/definition";
import { StreamsService } from "@mxflow/features/streams";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-business-process-scenario-definition-selector",
  templateUrl: "business-process-scenario-definition-selector.component.html",
  imports: [
    ReactiveFormsModule,
    ScenarioDefinitionSingleSelectorComponent,
    ScenarioDefinitionMultiSelectorComponent,
  ],
  providers: [TestDefinitionService, StreamsService],
})
export class BusinessProcessScenarioDefinitionSelectorComponent {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) testScenarioFormControl: FormControl;
  @Input({ required: true }) testScenariosFormControlName: string;
  @Input() multiValue = true;
  @Input() clearArchived = false;
}
