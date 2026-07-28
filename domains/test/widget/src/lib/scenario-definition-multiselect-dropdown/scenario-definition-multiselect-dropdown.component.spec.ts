import { Component } from "@angular/core";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MxevolveMultiselectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ScenarioDefinitionMultiselectDropdownComponent } from "./scenario-definition-multiselect-dropdown.component";
import { ScenarioDefinitionParams } from "../scenario-definition-dropdown/scenario-definition-data-provider";

const SCENARIO_ONE = {
  id: "s1",
  name: "Scenario One",
} as ScenarioDefinitionApiResponse;
const SCENARIO_TWO = {
  id: "s2",
  name: "Scenario Two",
} as ScenarioDefinitionApiResponse;

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-scenario-definition-multiselect-dropdown
        [projectId]="'project-1'"
        formControlName="scenarios"
      />
    </form>
  `,
  imports: [
    ScenarioDefinitionMultiselectDropdownComponent,
    ReactiveFormsModule,
  ],
})
class ScenarioFormHostComponent {
  form = new FormGroup({
    scenarios: new FormControl<string[]>([]),
  });
}

function getDropdown() {
  return ngMocks.find<
    MxevolveMultiselectDropdownComponent<
      ScenarioDefinitionApiResponse,
      ScenarioDefinitionParams
    >
  >(MxevolveMultiselectDropdownComponent);
}

describe("ScenarioDefinitionMultiselectDropdownComponent", () => {
  let fixture: MockedComponentFixture<ScenarioFormHostComponent>;

  beforeEach(async () => {
    await MockBuilder(ScenarioFormHostComponent)
      .keep(ScenarioDefinitionMultiselectDropdownComponent)
      .keep(ReactiveFormsModule)
      .mock(MxevolveMultiselectDropdownComponent)
      .mock(ScenarioDefinitionService);

    fixture = MockRender(ScenarioFormHostComponent);
    fixture.detectChanges();
  });

  it("renders the multiselect dropdown with a state provider", () => {
    const dropdown = getDropdown();
    expect(dropdown).toBeTruthy();
    expect(dropdown.componentInstance.stateProvider).toBeDefined();
  });

  it("stores the selected scenario ids in the form", () => {
    getDropdown().componentInstance.selectionChange.emit([
      SCENARIO_ONE,
      SCENARIO_TWO,
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.value.scenarios).toEqual([
      "s1",
      "s2",
    ]);
  });

  it("empties the form when all selections are cleared", () => {
    getDropdown().componentInstance.selectionChange.emit([SCENARIO_ONE]);
    fixture.detectChanges();

    getDropdown().componentInstance.selectionChange.emit([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.value.scenarios).toEqual([]);
  });
});
