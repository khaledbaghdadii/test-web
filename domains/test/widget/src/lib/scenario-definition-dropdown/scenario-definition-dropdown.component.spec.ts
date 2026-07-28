import { Component } from "@angular/core";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { of } from "rxjs";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ScenarioDefinitionDropdownComponent } from "./scenario-definition-dropdown.component";

const PROJECT_ID = "project-1234";

const SCENARIO_DEFINITIONS: ScenarioDefinitionApiResponse[] = [
  {
    id: "scenario-definition-1",
    projectId: PROJECT_ID,
    name: "TPK 1",
    archived: false,
    tests: [],
    idempotent: false,
    nonFunctionalTest: false,
    bpcs: [],
    environmentDefinitionId: "env-definition-1",
    heaviness: "LIGHT",
  },
  {
    id: "scenario-definition-2",
    projectId: PROJECT_ID,
    name: "TPK 2",
    archived: false,
    tests: [],
    idempotent: false,
    nonFunctionalTest: false,
    bpcs: [],
    environmentDefinitionId: "env-definition-2",
    heaviness: "HEAVY",
  },
];

function mockScenarioDefinitionService(): Partial<ScenarioDefinitionService> {
  return {
    getScenarioDefinitions: jest.fn(() => of(SCENARIO_DEFINITIONS)),
  } as Partial<ScenarioDefinitionService>;
}

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-scenario-definition-dropdown
        [projectId]="projectId"
        formControlName="scenarioDefinitionId"
      />
    </form>
  `,
  imports: [ScenarioDefinitionDropdownComponent, ReactiveFormsModule],
})
class ScenarioDefinitionFormWrapperComponent {
  projectId = PROJECT_ID;
  form = new FormGroup({
    scenarioDefinitionId: new FormControl<string | null>(null),
  });
}

function getComponent(): ScenarioDefinitionDropdownComponent {
  return ngMocks.find<ScenarioDefinitionDropdownComponent>(
    ScenarioDefinitionDropdownComponent
  ).componentInstance;
}

describe("ScenarioDefinitionDropdownComponent", () => {
  let fixture: MockedComponentFixture<ScenarioDefinitionFormWrapperComponent>;
  let component: ScenarioDefinitionDropdownComponent;

  beforeEach(async () => {
    await MockBuilder(ScenarioDefinitionFormWrapperComponent)
      .keep(ScenarioDefinitionDropdownComponent)
      .keep(ReactiveFormsModule)
      .mock(MxevolveSingleSelectDropdownComponent)
      .mock(ScenarioDefinitionService, mockScenarioDefinitionService());

    fixture = MockRender(ScenarioDefinitionFormWrapperComponent);
    component = getComponent();

    component.stateProvider.setDataParams({ projectId: PROJECT_ID });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("given the component is rendered, then scenario definitions should be fetched with the correct project id", () => {
    const service = ngMocks.get(ScenarioDefinitionService);

    expect(service.getScenarioDefinitions).toHaveBeenCalledWith(PROJECT_ID);
  });

  it("given the scenario definitions are loaded, then dropdown options should be populated with their names", () => {
    const options = component.stateProvider.dropdownOptions();

    expect(options.length).toBe(2);
    expect(options.map((o) => o.label)).toEqual(["TPK 1", "TPK 2"]);
  });

  it("given the user selects a scenario definition, then the form value should be its id", () => {
    const formWrapper = fixture.componentInstance;

    component.onSelectionChange(SCENARIO_DEFINITIONS[0]);
    fixture.detectChanges();

    expect(formWrapper.form.value.scenarioDefinitionId).toBe(
      "scenario-definition-1"
    );
  });

  it("given the user clears the selection, then the form value should be null", () => {
    const formWrapper = fixture.componentInstance;

    component.onSelectionChange(SCENARIO_DEFINITIONS[0]);
    fixture.detectChanges();

    component.onSelectionChange(null);
    fixture.detectChanges();

    expect(formWrapper.form.value.scenarioDefinitionId).toBeNull();
  });

  it("given the form is prefilled with an id matching a loaded definition, then the matching item should be selected", () => {
    const formWrapper = fixture.componentInstance;

    formWrapper.form.patchValue({
      scenarioDefinitionId: "scenario-definition-2",
    });
    fixture.detectChanges();

    expect(component.stateProvider.selectedItem()).toEqual(
      SCENARIO_DEFINITIONS[1]
    );
  });

  it("given the form is reset to null, then the selected item should be cleared", () => {
    const formWrapper = fixture.componentInstance;

    component.onSelectionChange(SCENARIO_DEFINITIONS[0]);
    fixture.detectChanges();

    formWrapper.form.reset();
    fixture.detectChanges();

    expect(component.stateProvider.selectedItem()).toBeNull();
  });

  it("given an error occurs, then a failure event should be emitted", () => {
    const errorSpy = jest.fn();
    component.failureEvent.subscribe(errorSpy);

    component.onError("Failed to load scenario definitions");

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load scenario definitions"
    );
  });
});
