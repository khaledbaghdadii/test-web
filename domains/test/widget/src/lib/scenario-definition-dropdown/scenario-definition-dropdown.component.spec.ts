import { Component } from "@angular/core";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { waitFor } from "@testing-library/angular";
import { of, throwError } from "rxjs";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ScenarioDefinitionActivityStatus } from "@mxevolve/domains/test/model";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
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

const ARCHIVED_SCENARIO = {
  id: "st2",
  name: "st2",
} as ScenarioDefinitionApiResponse;

const mockScenarioDefinitionService = {
  getScenarioDefinitions: jest.fn(),
  getScenarioDefinitionById: jest.fn(),
};

const mockToastMessageService = {
  showWarning: jest.fn(),
  showError: jest.fn(),
};

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-scenario-definition-dropdown
        [projectId]="projectId"
        [clearArchived]="clearArchived"
        formControlName="scenarioDefinitionId"
      />
    </form>
  `,
  imports: [ScenarioDefinitionDropdownComponent, ReactiveFormsModule],
})
class ScenarioDefinitionFormWrapperComponent {
  projectId = PROJECT_ID;
  clearArchived = false;
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
    jest.clearAllMocks();
    mockScenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
      of(SCENARIO_DEFINITIONS)
    );
    mockScenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
      of(ARCHIVED_SCENARIO)
    );

    await MockBuilder(ScenarioDefinitionFormWrapperComponent)
      .keep(ScenarioDefinitionDropdownComponent)
      .keep(ReactiveFormsModule)
      .mock(MxevolveSingleSelectDropdownComponent)
      .mock(ScenarioDefinitionService, mockScenarioDefinitionService)
      .mock(ToastMessageService, mockToastMessageService);

    fixture = MockRender(ScenarioDefinitionFormWrapperComponent);
    component = getComponent();

    component.stateProvider.setDataParams({ projectId: PROJECT_ID });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("given the component is rendered, then only active scenario definitions should be offered for the project", () => {
    const service = ngMocks.get(ScenarioDefinitionService);

    expect(service.getScenarioDefinitions).toHaveBeenCalledWith(
      PROJECT_ID,
      ScenarioDefinitionActivityStatus.ACTIVE
    );
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

  it("warns that a prefilled scenario is archived, naming it", async () => {
    fixture.componentInstance.form.patchValue({
      scenarioDefinitionId: "st2",
    });
    fixture.detectChanges();

    await waitFor(() =>
      expect(mockToastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario 'st2' is archived and may no longer be valid.",
        "Archived Scenario Selected"
      )
    );
  });

  it("keeps an archived scenario in the form when it is not cleared", async () => {
    fixture.componentInstance.form.patchValue({
      scenarioDefinitionId: "st2",
    });
    fixture.detectChanges();

    await waitFor(() =>
      expect(mockToastMessageService.showWarning).toHaveBeenCalled()
    );
    expect(fixture.componentInstance.form.value.scenarioDefinitionId).toBe(
      "st2"
    );
  });

  it("drops an archived scenario from the form when clearing is requested", async () => {
    fixture.componentInstance.clearArchived = true;
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      scenarioDefinitionId: "st2",
    });
    fixture.detectChanges();

    await waitFor(() =>
      expect(
        fixture.componentInstance.form.value.scenarioDefinitionId
      ).toBeNull()
    );
  });

  it("reports that the archived scenario has been cleared when clearing is requested", async () => {
    fixture.componentInstance.clearArchived = true;
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      scenarioDefinitionId: "st2",
    });
    fixture.detectChanges();

    await waitFor(() =>
      expect(mockToastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario 'st2' is archived and has been cleared.",
        "Archived Scenario Selected"
      )
    );
  });

  it("warns without a name when the archived scenario cannot be looked up", async () => {
    mockScenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
      throwError(() => new Error("gone"))
    );

    fixture.componentInstance.form.patchValue({
      scenarioDefinitionId: "st2",
    });
    fixture.detectChanges();

    await waitFor(() =>
      expect(mockToastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario is archived and may no longer be valid.",
        "Archived Scenario Selected"
      )
    );
  });

  it("does not warn when the prefilled scenario is available", async () => {
    fixture.componentInstance.form.patchValue({
      scenarioDefinitionId: "scenario-definition-2",
    });
    fixture.detectChanges();

    await waitFor(() =>
      expect(component.stateProvider.selectedItem()).toEqual(
        SCENARIO_DEFINITIONS[1]
      )
    );
    expect(mockToastMessageService.showWarning).not.toHaveBeenCalled();
  });
});
