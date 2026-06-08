import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Store } from "@ngrx/store";
import {
  ScenarioExecutionRepushModalComponent,
  ScenarioExecutionRepushModalInput,
} from "./scenario-execution-repush-modal.component";
import {
  RepushScenarioExecutionRequest,
  ScenarioExecutionService,
} from "@mxflow/test-management";
import {
  FormBuilder,
  ReactiveFormsModule,
  UntypedFormBuilder,
} from "@angular/forms";
import { of, throwError } from "rxjs";
import { DialogModule } from "primeng/dialog";
import { CommonModule } from "@angular/common";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { By } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SelectModule } from "primeng/select";
import { MockComponent } from "ng-mocks";
import { FactoryProductInputComponent } from "../../../../../../../../artifact-manager/src/lib/factory-product-input/factory-product-input-component";
import { KeepServicesCheckboxComponent } from "../keep-services-checkbox/keep-services-checkbox.component";
import { DomTestUtils } from "@mxevolve/testing";
import { Message, MessageModule } from "primeng/message";

const MX_VERSION = "mxversion";
const PROJECT_ID = "projectId123";
const MX_BUILD_ID = "mxBuildId";
const COMMIT_ID_2 = "5678";
const FACTORY_PRODUCT_ID_2 = "factory produt id 2";
const FACTORY_PRODUCT_ID = "factory produt id";
const SCENARIO_EXECUTION_ID = "id1";
const EXECUTION_GROUP_ID = "executionGroupId";
const REPUSHED_SCENARIO_EXECUTION_ID = "id2";
const scenarioExecution = getComponentInput();
const repushedScenario = {
  testExecutionId: REPUSHED_SCENARIO_EXECUTION_ID,
};

describe("ScenarioExecutionRepushModalComponent", () => {
  let component: ScenarioExecutionRepushModalComponent;
  let fixture: ComponentFixture<ScenarioExecutionRepushModalComponent>;

  let scenarioExecutionService: ScenarioExecutionService;
  let store: Store;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  const formBuilder = new UntypedFormBuilder();

  beforeEach(() => {
    store = {
      select: jest.fn(() => of(PROJECT_ID)),
    } as unknown as Store;
    scenarioExecutionService = {
      repushScenarioExecution: jest.fn(() => of(repushedScenario)),
    } as unknown as ScenarioExecutionService;
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MandatoryFieldModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TooltipModule,
        BrowserAnimationsModule,
        SelectModule,
        MessageModule,
        MockComponent(KeepServicesCheckboxComponent),
        MockComponent(FactoryProductInputComponent),
      ],
      declarations: [ScenarioExecutionRepushModalComponent],
      providers: [
        {
          provide: ScenarioExecutionService,
          useValue: scenarioExecutionService,
        },
        { provide: Store, useValue: store },
        { provide: FormBuilder, useValue: formBuilder },
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    });

    fixture = TestBed.createComponent(ScenarioExecutionRepushModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe("form validity and behavior", () => {
    it("should initialize the form values to correctly on init", () => {
      component.ngOnInit();
      expect(
        component.scenarioExecutionRepushForm.controls["commitId"].value
      ).toBeFalsy();
    });

    it.each([" ", null])(
      "should set the form as invalid if factoryProduct Id is not valid",
      (factoryProductId: string | null) => {
        component.scenarioExecutionRepushForm.controls[
          "factoryProductId"
        ].setValue(factoryProductId);
        expect(component.scenarioExecutionRepushForm.valid).toBeFalsy();
      }
    );

    it("should set the form as invalid if commitId is not valid", () => {
      component.scenarioExecutionRepushForm.controls["commitId"].setValue("  ");
      expect(component.scenarioExecutionRepushForm.valid).toBeFalsy();
    });

    it("should update form when factory product id got changed", () => {
      component.factoryProductIdChanged(FACTORY_PRODUCT_ID);
      expect(
        component.scenarioExecutionRepushForm.controls["factoryProductId"].value
      ).toEqual(FACTORY_PRODUCT_ID);
    });

    it("should disbale the repush button if form is invalid", () => {
      component.openModal(
        getComponentInput({
          mxVersion: undefined,
          mxBuildId: undefined,
          factoryProductId: undefined,
        })
      );
      fixture.detectChanges();
      expect(getButtonHarness("repushButton").isDisabled()).toBeTruthy();
    });

    it("should set the form as valid if the required fields are provided", () => {
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);
      expect(component.scenarioExecutionRepushForm.valid).toBeTruthy();
    });

    it("should enable the repush button if form is valid", () => {
      component.openModal(scenarioExecution);
      fixture.detectChanges();
      expect(getButtonHarness("repushButton").isDisabled()).toBeFalsy();
    });

    it("should set the repush button as loading when loading is true", () => {
      component.loading = true;
      component.showModal = true;
      expect(getButtonHarness("repushButton").isLoading()).toBeTruthy();
    });
  });

  describe("Opening the modal", () => {
    it("should set the project id from store", async () => {
      component.openModal(scenarioExecution);
      expect(component.projectId).toEqual(PROJECT_ID);
    });

    it("should set the modal visibility to true", () => {
      component.openModal(scenarioExecution);
      fixture.detectChanges();

      expect(component.showModal).toBeTruthy();
      const dialogElement = fixture.debugElement.query(By.css("p-dialog"));
      expect(dialogElement).toBeTruthy();
      expect(dialogElement.componentInstance.visible).toBe(true);
    });

    it("should set the scenario to be repushed to the passed scenario execution", () => {
      component.openModal(scenarioExecution);
      expect(component.input).toEqual(scenarioExecution);
    });

    it("should initialize the form values of mxversion, mxbuildId, and full maintenance", () => {
      component.openModal(scenarioExecution);
      expect(
        component.scenarioExecutionRepushForm.controls["factoryProductId"].value
      ).toEqual(FACTORY_PRODUCT_ID);
      expect(
        component.scenarioExecutionRepushForm.controls["commitId"].value
      ).toBeFalsy();
    });
    it("should initialize the form values to empty if no values present", () => {
      component.openModal(
        getComponentInput({
          mxVersion: undefined,
          mxBuildId: undefined,
          factoryProductId: undefined,
        })
      );
      expect(
        component.scenarioExecutionRepushForm.controls["factoryProductId"].value
      ).toBeFalsy();
      expect(
        component.scenarioExecutionRepushForm.controls["commitId"].value
      ).toBeFalsy();
    });
  });

  describe("close modal", () => {
    it("should set show modal to false", () => {
      component.showModal = true;
      component.closeModal();
      expect(component.showModal).toBeFalsy();
    });

    it("should stop loading", () => {
      component.loading = true;
      component.closeModal();
      expect(component.loading).toBeFalsy();
    });

    it("should close modal when cancel button is clicked", () => {
      jest.spyOn(component, "closeModal");
      component.showModal = true;
      fixture.detectChanges();
      getButtonHarness("cancelButton").click();

      expect(component.closeModal).toHaveBeenCalled();
      const dialogElement = fixture.debugElement.query(By.css("p-dialog"));
      expect(dialogElement.componentInstance.visible).toBeFalsy();
    });
  });

  describe("submit repush", () => {
    it("should repush scenario execution if form is valid", () => {
      component.openModal(scenarioExecution);
      component.scenarioExecutionRepushForm.controls["commitId"].setValue(
        COMMIT_ID_2
      );
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);

      component.submitRepush();

      expect(
        scenarioExecutionService.repushScenarioExecution
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        SCENARIO_EXECUTION_ID,
        getRepushScenarioExecutionRequest()
      );
    });

    it("should repush scenario execution with null commit id if value is not defined", () => {
      component.openModal(getComponentInput());
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);

      component.submitRepush();

      expect(
        scenarioExecutionService.repushScenarioExecution
      ).toHaveBeenCalledWith(PROJECT_ID, SCENARIO_EXECUTION_ID, {
        ...getRepushScenarioExecutionRequest(),
        commitId: null,
      });
    });

    it.each([
      [true, false],
      [false, true],
      [true, undefined],
    ])(
      "should repush scenario execution with stopServices as %s when keepServices is %s",
      (expectedStopServices: boolean, keepServices: boolean | undefined) => {
        component.keepServices = keepServices;
        component.openModal(scenarioExecution);
        component.scenarioExecutionRepushForm.controls["commitId"].setValue(
          COMMIT_ID_2
        );
        component.scenarioExecutionRepushForm.controls[
          "factoryProductId"
        ].setValue(FACTORY_PRODUCT_ID_2);

        component.submitRepush();
        expect(
          scenarioExecutionService.repushScenarioExecution
        ).toHaveBeenCalledWith(PROJECT_ID, SCENARIO_EXECUTION_ID, {
          ...getRepushScenarioExecutionRequest(),
          stopServices: expectedStopServices,
        });
      }
    );

    it("should display success message on successful repush", () => {
      component.openModal(scenarioExecution);
      component.scenarioExecutionRepushForm.controls["commitId"].setValue(
        COMMIT_ID_2
      );
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);

      component.submitRepush();

      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Scenario execution successfully repushed."
      );
    });

    it("should close modal on successful repush", () => {
      component.openModal(scenarioExecution);
      component.scenarioExecutionRepushForm.controls["commitId"].setValue(
        COMMIT_ID_2
      );
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);

      component.submitRepush();

      expect(component.showModal).toBeFalsy();
      const dialogElement = fixture.debugElement.query(By.css("p-dialog"));
      const dialogContent =
        dialogElement.nativeElement.querySelector(".p-dialog-content");
      expect(dialogContent).toBeFalsy();
    });

    it("should emit scenario repushed event", () => {
      const emitSpy = jest.spyOn(component.scenarioRepushed, "emit");
      component.openModal(scenarioExecution);
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);

      component.submitRepush();

      expect(emitSpy).toHaveBeenCalled();
    });

    it("should set loading to false on successful repush", () => {
      component.openModal(scenarioExecution);
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);

      component.submitRepush();

      expect(component.loading).toBeFalsy();
    });

    it("should display error message on failure to repush", () => {
      jest
        .spyOn(scenarioExecutionService, "repushScenarioExecution")
        .mockReturnValue(throwError(() => new Error("error")));
      component.openModal(scenarioExecution);
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);

      component.submitRepush();

      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "Failed to repush scenario execution."
      );
    });

    it("should set loading to false on failure to repush", () => {
      jest
        .spyOn(scenarioExecutionService, "repushScenarioExecution")
        .mockReturnValue(throwError(() => new Error("error")));
      component.openModal(scenarioExecution);
      component.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].setValue(FACTORY_PRODUCT_ID_2);

      component.submitRepush();

      expect(component.loading).toBeFalsy();
    });

    it("should call submitRepush on clicking repush button", () => {
      jest.spyOn(component, "submitRepush");
      component.openModal(scenarioExecution);
      fixture.detectChanges();
      getButtonHarness("repushButton").click();
      expect(component.submitRepush).toHaveBeenCalled();
    });
  });

  describe("warning messages", () => {
    it.each([true, false])(
      "should not display kept execution warning message when kept execution is marked as %s and keep execution is disabled",
      (keptScenarioExecution: boolean) => {
        component.disableKeepExecution = true;
        component.openModal(
          getComponentInput({ keptExecution: keptScenarioExecution })
        );
        fixture.detectChanges();
        const warningMessageText = DomTestUtils.getElementByType(
          fixture,
          Message
        );
        expect(warningMessageText.isRendered()).toBeFalsy();
      }
    );

    it("should not display kept execution warning message when scenario is marked as kept and keep execution is enabled", () => {
      component.disableKeepExecution = false;
      component.openModal(getComponentInput({ keptExecution: true }));
      fixture.detectChanges();

      const warningMessageText = DomTestUtils.getElementByType(
        fixture,
        Message
      );
      expect(warningMessageText.isRendered()).toBeFalsy();
    });

    it("should display kept execution warning message when scenario is not marked as kept and keep execution is enabled", () => {
      component.disableKeepExecution = false;
      component.openModal(getComponentInput({ keptExecution: false }));
      fixture.detectChanges();
      const warningMessageText = DomTestUtils.getElementByType(
        fixture,
        Message
      );
      expect(warningMessageText.isRendered()).toBeTruthy();
      expect(warningMessageText.getNativeElement().textContent).toContain(
        "After repushing a scenario that is not kept, the previous execution will be cleaned."
      );
    });

    it("should display warning message if passed", () => {
      component.openModal(getComponentInput());
      component.warningMessage = "This is a warning message";
      fixture.detectChanges();
      const warningMessageText = DomTestUtils.getElementByType(
        fixture,
        Message
      );
      expect(warningMessageText.isRendered()).toBeTruthy();
      expect(warningMessageText.getNativeElement().textContent).toContain(
        "This is a warning message"
      );
    });

    it("should not display warning message if not passed", () => {
      component.openModal(getComponentInput());
      fixture.detectChanges();
      const warningMessageText = DomTestUtils.getElementByType(
        fixture,
        Message
      );
      expect(warningMessageText.isRendered()).toBeFalsy();
    });
  });

  describe("when keep services check changes", () => {
    it.each([true, false])(
      "should set keepServices to %s when keepServices checkbox changes",
      (keepServices: boolean) => {
        component.onKeepServicesChanged(keepServices);
        expect(component.keepServices).toBe(keepServices);
      }
    );
  });

  describe("template tests", () => {
    it("should trigger onCheckKeepServicesChanged when keepServices checkbox changes", () => {
      component.openModal(scenarioExecution);
      component.enableKeepServices = true;
      fixture.detectChanges();
      const keepServicesCheckbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      const onCheckStopServicesChangedSpy = jest.spyOn(
        component,
        "onKeepServicesChanged"
      );
      keepServicesCheckbox.triggerEventHandler("keepServicesChange", true);
      fixture.detectChanges();
      expect(onCheckStopServicesChangedSpy).toHaveBeenCalledWith(true);
      expect(component.keepServices).toBeTruthy();
    });

    it("should not show the keep services checkbox when enableKeepServices is disabled", () => {
      component.openModal(scenarioExecution);
      component.enableKeepServices = false;
      fixture.detectChanges();
      const keepServicesCheckbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      expect(keepServicesCheckbox).toBeFalsy();
    });

    it("should show the keep services checkbox when enableKeepServices is enabled", () => {
      component.openModal(scenarioExecution);
      component.enableKeepServices = true;
      fixture.detectChanges();
      const keepServicesCheckbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      expect(keepServicesCheckbox).toBeTruthy();
    });
  });
  function getRepushScenarioExecutionRequest(): RepushScenarioExecutionRequest {
    return {
      factoryProductId: FACTORY_PRODUCT_ID_2,
      commitId: COMMIT_ID_2,
      executionGroupId: EXECUTION_GROUP_ID,
      stopServices: true,
    } as RepushScenarioExecutionRequest;
  }

  function getButtonHarness(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }
});
function getComponentInput(
  overrides?: Partial<ScenarioExecutionRepushModalInput>
) {
  return {
    scenarioExecutionId: SCENARIO_EXECUTION_ID,
    mxVersion: MX_VERSION,
    mxBuildId: MX_BUILD_ID,
    factoryProductId: FACTORY_PRODUCT_ID,
    executionGroupId: EXECUTION_GROUP_ID,
    keptExecution: true,
    stopServices: true,
    ...overrides,
  };
}
