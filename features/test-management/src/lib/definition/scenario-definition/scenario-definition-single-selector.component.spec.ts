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
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import { ScenarioDefinitionSingleSelectorComponent } from "./scenario-definition-single-selector.component";
import { ScenarioDefinitionService } from "./scenario-definition.service";
import { DomTestUtils } from "@mxevolve/testing";
import { Heaviness, ScenarioDefinition } from "./scenario-definition";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  EnvironmentDefinition,
  EnvironmentDefinitionStatus,
} from "@mxevolve/domains/test/model";

const PROJECT_ID = "project-1234";

const environment: EnvironmentDefinition = {
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
    environmentDefinition: environment,
    idempotent: true,
    nonFunctionalTest: false,
    ...overrides,
  };
}

const VALID_SCENARIOS: ScenarioDefinition[] = [
  createMockScenarioDefinition({ id: "sd-002", name: "scenario2" }),
  createMockScenarioDefinition({ id: "sd-001", name: "scenario1" }),
  createMockScenarioDefinition({ id: "sd-004", name: "scenario4" }),
];

const ARCHIVED_SCENARIO_API_RESPONSE = {
  id: "sd-003",
  projectId: PROJECT_ID,
  name: "ArchivedScenario",
  archived: true,
  tests: [],
  idempotent: false,
  nonFunctionalTest: false,
  bpcs: [],
  environmentDefinitionId: "env-1",
  heaviness: "LIGHT",
};

function mockScenarioDefinitionService(): Partial<ScenarioDefinitionService> {
  return {
    getScenarioDefinitions: jest.fn(() => of(VALID_SCENARIOS)),
    getScenarioDefinitionLite: jest.fn(() =>
      of(ARCHIVED_SCENARIO_API_RESPONSE)
    ),
  } as Partial<ScenarioDefinitionService>;
}

describe("ScenarioDefinitionSingleSelectorComponent", () => {
  let fixture: MockedComponentFixture<SingleSelectFormWrapperComponent>;
  let component: ScenarioDefinitionSingleSelectorComponent;
  let toastMessageService: ToastMessageService;

  describe("single select with clear archived disabled", () => {
    beforeEach(async () => {
      await MockBuilder(SingleSelectFormWrapperComponent)
        .keep(ScenarioDefinitionSingleSelectorComponent)
        .keep(ReactiveFormsModule)
        .provide(provideNoopAnimations())
        .mock(MxevolveSingleSelectDropdownComponent)
        .mock(Toast)
        .mock(ToastMessageService)
        .mock(ScenarioDefinitionService, mockScenarioDefinitionService());

      fixture = MockRender(SingleSelectFormWrapperComponent);
      component = getComponent(ScenarioDefinitionSingleSelectorComponent);
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

    it("should fetch scenario definitions with correct project id", () => {
      const service = ngMocks.get(ScenarioDefinitionService);

      expect(service.getScenarioDefinitions).toHaveBeenCalledWith(PROJECT_ID);
    });

    it("should populate dropdown options after data is loaded", () => {
      const options = component.stateProvider.dropdownOptions();

      expect(options.length).toBe(3);
      expect(options.map((o) => o.label)).toEqual([
        "scenario2",
        "scenario1",
        "scenario4",
      ]);
    });

    it("given the user selects an option, then the parent form value should be the scenario iD", () => {
      const formWrapper = fixture.componentInstance;
      const loginFlow = VALID_SCENARIOS[0];

      component.onSelectionChange(loginFlow);
      fixture.detectChanges();

      expect(formWrapper.form.value.scenarioDefinition).toBe("sd-002");
    });

    it("given the user clears the selection, then the parent form value should be undefined", () => {
      const formWrapper = fixture.componentInstance;

      component.onSelectionChange(VALID_SCENARIOS[0]);
      fixture.detectChanges();

      component.onSelectionChange(null);
      fixture.detectChanges();

      expect(formWrapper.form.value.scenarioDefinition).toBeUndefined();
    });

    it("given the form is prefilled with a non-archived scenario id, then the item should be selected and no warning shown", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({ scenarioDefinition: "sd-002" });
      fixture.detectChanges();

      expect(component.stateProvider.selectedItem()).toEqual(
        VALID_SCENARIOS[0]
      );
      expect(toastMessageService.showWarning).not.toHaveBeenCalled();
    });

    it("given the form is prefilled with an archived scenario id, then the value should be kept and a warning toast that includes the scenario name", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({ scenarioDefinition: "sd-003" });
      fixture.detectChanges();

      expect(formWrapper.form.value.scenarioDefinition).toBe("sd-003");
      expect(toastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario 'ArchivedScenario' is archived and may no longer be valid.",
        "Archived Scenario Selected"
      );
    });

    it("given the form is prefilled with an archived scenario id and the fetch fails, then the warning toast should show a generic message", () => {
      const service = ngMocks.get(ScenarioDefinitionService);
      jest
        .spyOn(service, "getScenarioDefinitionLite")
        .mockReturnValue(throwError(() => new Error()));
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({ scenarioDefinition: "sd-003" });
      fixture.detectChanges();

      expect(toastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario is archived and may no longer be valid.",
        "Archived Scenario Selected"
      );
    });

    it("given the form is prefilled with an archived scenario, then the form should remain valid", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({ scenarioDefinition: "sd-003" });
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
      component.onSelectionChange(VALID_SCENARIOS[0]);
      fixture.detectChanges();

      component.stateProvider.setSearchKey("random");
      fixture.detectChanges();

      expect(toastMessageService.showWarning).not.toHaveBeenCalled();
    });
  });

  describe("single select with clear archived enabled", () => {
    let fixture: MockedComponentFixture<ClearArchiveModeFormWrapperComponent>;
    let component: ScenarioDefinitionSingleSelectorComponent;

    beforeEach(async () => {
      await MockBuilder(ClearArchiveModeFormWrapperComponent)
        .keep(ScenarioDefinitionSingleSelectorComponent)
        .keep(ReactiveFormsModule)
        .provide(provideNoopAnimations())
        .mock(MxevolveSingleSelectDropdownComponent)
        .mock(Toast)
        .mock(ToastMessageService)
        .mock(ScenarioDefinitionService, mockScenarioDefinitionService());

      fixture = MockRender(ClearArchiveModeFormWrapperComponent);
      component = DomTestUtils.getElementByType(
        fixture,
        ScenarioDefinitionSingleSelectorComponent
      ).getInstance();
      toastMessageService = ngMocks.get(ToastMessageService);
      jest.spyOn(toastMessageService, "showWarning");

      component.stateProvider.setDataParams({
        projectId: PROJECT_ID,
      });
      fixture.detectChanges();
    });

    it("given clear archived is enabled and prefilled with an archived id, then the value should be cleared and the warning should include the scenario name", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({ scenarioDefinition: "sd-003" });
      fixture.detectChanges();

      expect(component.stateProvider.selectedItem()).toBeNull();
      expect(formWrapper.form.value.scenarioDefinition).toBeUndefined();
      expect(toastMessageService.showWarning).toHaveBeenCalledWith(
        "The prefilled scenario 'ArchivedScenario' is archived and has been cleared.",
        "Archived Scenario Selected"
      );
    });

    it("given clear archived is enabled and prefilled with a non-archived id, then the value should remain", () => {
      const formWrapper = fixture.componentInstance;

      formWrapper.form.patchValue({ scenarioDefinition: "sd-002" });
      fixture.detectChanges();

      expect(component.stateProvider.selectedItem()).toEqual(
        VALID_SCENARIOS[0]
      );
      expect(formWrapper.form.value.scenarioDefinition).toBe("sd-002");
      expect(toastMessageService.showWarning).not.toHaveBeenCalled();
    });
  });

  describe("Cleanup on Destroy", () => {
    let scenarioSubject: Subject<ScenarioDefinition[]>;

    beforeEach(async () => {
      scenarioSubject = new Subject<ScenarioDefinition[]>();

      await MockBuilder(SingleSelectFormWrapperComponent)
        .keep(ScenarioDefinitionSingleSelectorComponent)
        .keep(ReactiveFormsModule)
        .provide(provideNoopAnimations())
        .mock(MxevolveSingleSelectDropdownComponent)
        .mock(Toast)
        .mock(ToastMessageService)
        .mock(ScenarioDefinitionService, {
          getScenarioDefinitions: jest.fn(() => scenarioSubject.asObservable()),
        });

      fixture = MockRender(SingleSelectFormWrapperComponent);
      component = getComponent(ScenarioDefinitionSingleSelectorComponent);
      fixture.detectChanges();
    });

    it("given the component is destroyed before scenarios are fetched, then no scenarios should be loaded", () => {
      component.stateProvider.setDataParams({
        projectId: PROJECT_ID,
      });
      fixture.destroy();

      scenarioSubject.next(VALID_SCENARIOS);

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
      <mxevolve-scenario-definition-single-selector
        [projectId]="projectId"
        formControlName="scenarioDefinition"
      />
    </form>
  `,
  imports: [ReactiveFormsModule, ScenarioDefinitionSingleSelectorComponent],
})
class SingleSelectFormWrapperComponent {
  projectId = PROJECT_ID;
  form = new FormGroup({
    scenarioDefinition: new FormControl<string | undefined>(undefined),
  });
}

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-scenario-definition-single-selector
        [projectId]="projectId"
        [clearArchived]="true"
        formControlName="scenarioDefinition"
      />
    </form>
  `,
  imports: [ReactiveFormsModule, ScenarioDefinitionSingleSelectorComponent],
})
class ClearArchiveModeFormWrapperComponent {
  projectId = PROJECT_ID;
  form = new FormGroup({
    scenarioDefinition: new FormControl<string | undefined>(undefined),
  });
}
