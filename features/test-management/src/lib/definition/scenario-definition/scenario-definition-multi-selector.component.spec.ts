import { Component, Type } from "@angular/core";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { of, Subject, throwError } from "rxjs";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { Toast } from "primeng/toast";
import { MxevolveMultiselectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import { ScenarioDefinitionMultiSelectorComponent } from "./scenario-definition-multi-selector.component";
import { ScenarioDefinitionService } from "./scenario-definition.service";
import { DomTestUtils } from "@mxevolve/testing";
import { Heaviness, ScenarioDefinition } from "./scenario-definition";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  EnvironmentDefinition,
  EnvironmentDefinitionStatus,
} from "@mxevolve/domains/test/model";

const PROJECT_ID = "project-123";

const defaultEnvironment: EnvironmentDefinition = {
  id: "env-1",
  name: "Dev Environment",
  status: EnvironmentDefinitionStatus.ACTIVE,
};

function createMockScenarioDefinition(
  overrides: Partial<ScenarioDefinition> & { id: string; name: string }
): ScenarioDefinition {
  return {
    archived: false,
    tests: [],
    bpcs: [],
    heaviness: Heaviness.LIGHT,
    environmentDefinition: defaultEnvironment,
    idempotent: true,
    nonFunctionalTest: false,
    ...overrides,
  };
}

const VALID_SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  createMockScenarioDefinition({ id: "sd-001", name: "scenario1" }),
  createMockScenarioDefinition({ id: "sd-004", name: "scenario4" }),
  createMockScenarioDefinition({ id: "sd-002", name: "scenario2" }),
];

function createMockArchivedApiResponse(id: string, name: string) {
  return {
    id,
    projectId: PROJECT_ID,
    name,
    archived: true,
    tests: [],
    idempotent: false,
    nonFunctionalTest: false,
    bpcs: [],
    environmentDefinitionId: "env-1",
    heaviness: "LIGHT",
  };
}

function mockScenarioDefinitionService(): Partial<ScenarioDefinitionService> {
  return {
    getScenarioDefinitions: jest.fn(() => of(VALID_SCENARIO_DEFINITIONS)),
    getScenarioDefinitionLite: jest.fn((id: string) =>
      of(createMockArchivedApiResponse(id, `ArchivedScenario-${id}`))
    ),
  } as Partial<ScenarioDefinitionService>;
}

describe("ScenarioDefinitionMultiSelectorComponent", () => {
  let fixture: MockedComponentFixture<MultiSelectFormWrapperComponent>;
  let component: ScenarioDefinitionMultiSelectorComponent;
  let toastMessageService: ToastMessageService;

  describe("multi select mode  with clear archived disabled", () => {
    beforeEach(async () => {
      await MockBuilder(MultiSelectFormWrapperComponent)
        .keep(ScenarioDefinitionMultiSelectorComponent)
        .keep(ReactiveFormsModule)
        .provide(provideNoopAnimations())
        .mock(MxevolveMultiselectDropdownComponent)
        .mock(Toast)
        .mock(ToastMessageService)
        .mock(ScenarioDefinitionService, mockScenarioDefinitionService());

      fixture = MockRender(MultiSelectFormWrapperComponent);
      component = getComponent(ScenarioDefinitionMultiSelectorComponent);
      toastMessageService = ngMocks.get(ToastMessageService);
      jest.spyOn(toastMessageService, "showWarning");

      component.stateProvider.setDataParams({
        projectId: PROJECT_ID,
      });
      fixture.detectChanges();
    });

    it("should create", () => {
      expect(component).toBeTruthy();
    });

    it("should fetch scenario definitions with correct project id in multi select", () => {
      const service = ngMocks.get(ScenarioDefinitionService);

      expect(service.getScenarioDefinitions).toHaveBeenCalledWith(PROJECT_ID);
    });

    it("should populate dropdown scenario options after data is loaded", () => {
      const options = component.stateProvider.dropdownOptions();

      expect(options.length).toBe(3);
      expect(options.map((o) => o.label)).toEqual([
        "scenario1",
        "scenario4",
        "scenario2",
      ]);
    });

    it("given the user selects options, then the parent form value should be updated with the list of scenarios ids", () => {
      const formWrapper = fixture.componentInstance;

      component.onSelectionChange([
        VALID_SCENARIO_DEFINITIONS[0],
        VALID_SCENARIO_DEFINITIONS[1],
      ]);
      fixture.detectChanges();

      expect(formWrapper.form.value.scenarioDefinitions).toEqual([
        "sd-001",
        "sd-004",
      ]);
    });

    it("given the user clears the scenario selections, then the parent form value should be undefined", () => {
      const formWrapper = fixture.componentInstance;

      component.onSelectionChange([VALID_SCENARIO_DEFINITIONS[0]]);
      fixture.detectChanges();

      component.onSelectionChange([]);
      fixture.detectChanges();

      expect(formWrapper.form.value.scenarioDefinitions).toBeUndefined();
    });

    it("given the form is prefilled with only active ids, then no warning should be shown", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({
        scenarioDefinitions: ["sd-001", "sd-002"],
      });
      fixture.detectChanges();

      expect(toastMessageService.showWarning).not.toHaveBeenCalled();
    });

    it("given the form is prefilled with values including an archived id, then the warning should include the archived scenario name", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({
        scenarioDefinitions: ["sd-001", "sd-003"],
      });
      fixture.detectChanges();

      expect(toastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario(s) 'ArchivedScenario-sd-003' are archived and may no longer be valid.",
        "Archived Scenario Selected"
      );
    });

    it("given the form is prefilled with multiple archived ids, then the warning should include all archived scenario names", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({
        scenarioDefinitions: ["sd-001", "sd-003", "sd-005"],
      });
      fixture.detectChanges();

      expect(toastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario(s) 'ArchivedScenario-sd-003', 'ArchivedScenario-sd-005' are archived and may no longer be valid.",
        "Archived Scenario Selected"
      );
    });

    it("given the form is prefilled with an archived id and the fetch fails, then the warning should show a generic message", () => {
      const service = ngMocks.get(ScenarioDefinitionService);
      jest
        .spyOn(service, "getScenarioDefinitionLite")
        .mockReturnValue(throwError(() => new Error("Not Found")));
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({
        scenarioDefinitions: ["sd-001", "sd-003", "sd-005"],
      });
      fixture.detectChanges();

      expect(toastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario(s) are archived and may no longer be valid.",
        "Archived Scenario Selected"
      );
    });

    it("given the form is prefilled with an archived id, then the form should remain  valid", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({
        scenarioDefinitions: ["sd-001", "sd-003"],
      });
      fixture.detectChanges();

      expect(formWrapper.form.valid).toBe(true);
    });

    it("should emit failure event when onError is called", () => {
      const errorSpy = jest.fn();
      component.failureEvent.subscribe(errorSpy);

      component.onError("Something went wrong");

      expect(errorSpy).toHaveBeenCalledWith("Something went wrong");
    });

    it("given that user selected an item, and then search for a key that does not match the selected item, then the system should not evaluate again the scenario validity", () => {
      component.onSelectionChange([VALID_SCENARIO_DEFINITIONS[0]]);
      fixture.detectChanges();

      component.stateProvider.setSearchKey("randomsearchkey");
      fixture.detectChanges();

      expect(toastMessageService.showWarning).not.toHaveBeenCalled();
    });
  });

  describe("multi select mode with clear archived enabled", () => {
    let fixture: MockedComponentFixture<ArchivedModeMultiSelectFormWrapperComponent>;
    let component: ScenarioDefinitionMultiSelectorComponent;

    beforeEach(async () => {
      await MockBuilder(ArchivedModeMultiSelectFormWrapperComponent)
        .keep(ScenarioDefinitionMultiSelectorComponent)
        .keep(ReactiveFormsModule)
        .provide(provideNoopAnimations())
        .mock(MxevolveMultiselectDropdownComponent)
        .mock(Toast)
        .mock(ToastMessageService)
        .mock(ScenarioDefinitionService, mockScenarioDefinitionService());

      fixture = MockRender(ArchivedModeMultiSelectFormWrapperComponent);
      component = DomTestUtils.getElementByType(
        fixture,
        ScenarioDefinitionMultiSelectorComponent
      ).getInstance();
      toastMessageService = ngMocks.get(ToastMessageService);
      jest.spyOn(toastMessageService, "showWarning");

      component.stateProvider.setDataParams({
        projectId: PROJECT_ID,
      });
      fixture.detectChanges();
    });

    it("given clear archived is enabled and prefilled with mixed ids, then only archived ids should be removed and warning shows name", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({
        scenarioDefinitions: ["sd-001", "sd-003", "sd-004"],
      });
      fixture.detectChanges();

      expect(formWrapper.form.value.scenarioDefinitions).toEqual([
        "sd-001",
        "sd-004",
      ]);
      expect(toastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario(s) 'ArchivedScenario-sd-003' are archived and have been cleared.",
        "Archived Scenario Selected"
      );
    });

    it("given clear archived is enabled and prefilled with only archived ids, then the value should be cleared to undefined", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({
        scenarioDefinitions: ["sd-003"],
      });
      fixture.detectChanges();

      expect(formWrapper.form.value.scenarioDefinitions).toBeUndefined();
      expect(toastMessageService.showWarning).toHaveBeenCalled();
    });

    it("given clear archived is enabled and prefilled with only active ids, then no warning and value stays", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({
        scenarioDefinitions: ["sd-001", "sd-002"],
      });
      fixture.detectChanges();

      expect(formWrapper.form.value.scenarioDefinitions).toEqual([
        "sd-001",
        "sd-002",
      ]);
      expect(toastMessageService.showWarning).not.toHaveBeenCalled();
    });
  });

  describe("Cleanup on Destroy", () => {
    let scenarioSubject: Subject<ScenarioDefinition[]>;

    beforeEach(async () => {
      scenarioSubject = new Subject<ScenarioDefinition[]>();

      await MockBuilder(MultiSelectFormWrapperComponent)
        .keep(ScenarioDefinitionMultiSelectorComponent)
        .keep(ReactiveFormsModule)
        .provide(provideNoopAnimations())
        .mock(MxevolveMultiselectDropdownComponent)
        .mock(Toast)
        .mock(ToastMessageService)
        .mock(ScenarioDefinitionService, {
          getScenarioDefinitions: jest.fn(() => scenarioSubject.asObservable()),
        });

      fixture = MockRender(MultiSelectFormWrapperComponent);
      component = getComponent(ScenarioDefinitionMultiSelectorComponent);
      fixture.detectChanges();
    });

    it("given the component is destroyed before scenarios are fetched, then no scenario should be loaded", () => {
      component.stateProvider.setDataParams({
        projectId: PROJECT_ID,
      });
      fixture.destroy();

      scenarioSubject.next(VALID_SCENARIO_DEFINITIONS);

      expect(component.stateProvider.items()).toBeUndefined();
    });
  });

  function getComponent<S>(type: Type<S>): S {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-scenario-definition-multi-selector
        [projectId]="projectId"
        formControlName="scenarioDefinitions"
      />
    </form>
  `,
  imports: [ReactiveFormsModule, ScenarioDefinitionMultiSelectorComponent],
})
class MultiSelectFormWrapperComponent {
  projectId = PROJECT_ID;
  form = new FormGroup({
    scenarioDefinitions: new FormControl<string[] | undefined>(undefined),
  });
}

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-scenario-definition-multi-selector
        [projectId]="projectId"
        [clearArchived]="true"
        formControlName="scenarioDefinitions"
      />
    </form>
  `,
  imports: [ReactiveFormsModule, ScenarioDefinitionMultiSelectorComponent],
})
class ArchivedModeMultiSelectFormWrapperComponent {
  projectId = PROJECT_ID;
  form = new FormGroup({
    scenarioDefinitions: new FormControl<string[] | undefined>(undefined),
  });
}
