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
import { MxevolveMultiselectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ScenarioDefinitionMultiselectDropdownComponent } from "./scenario-definition-multiselect-dropdown.component";
import { ScenarioDefinitionParams } from "../scenario-definition-dropdown/scenario-definition-data-provider";

const PROJECT_ID = "project-1";

const SCENARIO_ONE = {
  id: "s1",
  name: "Scenario One",
} as ScenarioDefinitionApiResponse;
const SCENARIO_TWO = {
  id: "s2",
  name: "Scenario Two",
} as ScenarioDefinitionApiResponse;
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
      <mxevolve-scenario-definition-multiselect-dropdown
        [projectId]="projectId"
        [clearArchived]="clearArchived"
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
  projectId = PROJECT_ID;
  clearArchived = false;
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

function getComponent(): ScenarioDefinitionMultiselectDropdownComponent {
  return ngMocks.find<ScenarioDefinitionMultiselectDropdownComponent>(
    ScenarioDefinitionMultiselectDropdownComponent
  ).componentInstance;
}

async function prefill(
  fixture: MockedComponentFixture<ScenarioFormHostComponent>,
  scenarios: string[]
): Promise<void> {
  getComponent().stateProvider.setDataParams({ projectId: PROJECT_ID });
  fixture.componentInstance.form.patchValue({ scenarios });
  fixture.detectChanges();
  await waitFor(() =>
    expect(getComponent().stateProvider.items()?.length).toBeGreaterThan(0)
  );
}

describe("ScenarioDefinitionMultiselectDropdownComponent", () => {
  let fixture: MockedComponentFixture<ScenarioFormHostComponent>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockScenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
      of([SCENARIO_ONE, SCENARIO_TWO])
    );
    mockScenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
      of(ARCHIVED_SCENARIO)
    );

    await MockBuilder(ScenarioFormHostComponent)
      .keep(ScenarioDefinitionMultiselectDropdownComponent)
      .keep(ReactiveFormsModule)
      .mock(MxevolveMultiselectDropdownComponent)
      .mock(ScenarioDefinitionService, mockScenarioDefinitionService)
      .mock(ToastMessageService, mockToastMessageService);

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

  it("selects the prefilled scenarios in the order they were prefilled", async () => {
    await prefill(fixture, ["s2", "s1"]);

    await waitFor(() =>
      expect(getComponent().stateProvider.selectedItems()).toEqual([
        SCENARIO_TWO,
        SCENARIO_ONE,
      ])
    );
  });

  it("leaves the form untouched when every prefilled scenario is available", async () => {
    await prefill(fixture, ["s1", "s2"]);

    await waitFor(() =>
      expect(getComponent().stateProvider.selectedItems()).toHaveLength(2)
    );
    expect(mockToastMessageService.showWarning).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.value.scenarios).toEqual([
      "s1",
      "s2",
    ]);
  });

  it("warns that a prefilled scenario is archived, naming it", async () => {
    await prefill(fixture, ["s1", "st2"]);

    await waitFor(() =>
      expect(mockToastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario(s) 'st2' are archived and may no longer be valid.",
        "Archived Scenario Selected"
      )
    );
  });

  it("keeps an archived scenario in the form when it is not cleared", async () => {
    await prefill(fixture, ["s1", "st2"]);

    await waitFor(() =>
      expect(mockToastMessageService.showWarning).toHaveBeenCalled()
    );
    expect(fixture.componentInstance.form.value.scenarios).toEqual([
      "s1",
      "st2",
    ]);
  });

  it("drops an archived scenario from the form when clearing is requested", async () => {
    fixture.componentInstance.clearArchived = true;
    fixture.detectChanges();

    await prefill(fixture, ["s1", "st2"]);

    await waitFor(() =>
      expect(fixture.componentInstance.form.value.scenarios).toEqual(["s1"])
    );
  });

  it("reports that the archived scenarios have been cleared when clearing is requested", async () => {
    fixture.componentInstance.clearArchived = true;
    fixture.detectChanges();

    await prefill(fixture, ["s1", "st2"]);

    await waitFor(() =>
      expect(mockToastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario(s) 'st2' are archived and have been cleared.",
        "Archived Scenario Selected"
      )
    );
  });

  it("warns without a name when the archived scenario cannot be looked up", async () => {
    mockScenarioDefinitionService.getScenarioDefinitionById.mockReturnValue(
      throwError(() => new Error("gone"))
    );

    await prefill(fixture, ["s1", "st2"]);

    await waitFor(() =>
      expect(mockToastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario(s) are archived and may no longer be valid.",
        "Archived Scenario Selected"
      )
    );
  });
});
