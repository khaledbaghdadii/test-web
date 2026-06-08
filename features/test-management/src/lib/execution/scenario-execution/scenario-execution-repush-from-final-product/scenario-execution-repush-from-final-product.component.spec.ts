import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import {
  ScenarioExecutionRepushFromFinalProductInput,
  ScenarioExecutionRepushFromFinalProductModalComponent,
} from "./scenario-execution-repush-from-final-product.component";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, UntypedFormBuilder } from "@angular/forms";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { of, throwError } from "rxjs";
import {
  FinalProduct,
  FinalProductDropdownInputComponent,
} from "@mxflow/features/artifact-manager";
import { By } from "@angular/platform-browser";
import { RepushScenarioExecutionFromFinalProductRequest } from "../request/repush-scenario-execution-from-final-product-request";
import { SelectModule } from "primeng/select";
import { MockComponent } from "ng-mocks";
import { SkeletonModule } from "primeng/skeleton";
import { KeepServicesCheckboxComponent } from "../actions/repush/keep-services-checkbox/keep-services-checkbox.component";
import { DomTestUtils } from "@mxevolve/testing";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { Message, MessageModule } from "primeng/message";

const PROJECT_ID = "projectId";
const SCENARIO_EXECUTION_ID = "scenarioExecutionId";
const MX_VERSION = "mxversion";
const MX_BUILD_ID = "mxBuildId";
const RTP_COMMIT_ID = "rtpCommitId";
const EXECUTION_GROUP_ID = "executionGroupId";
const REPUSHED_SCENARIO = {
  testExecutionId: "repushedScenarioId",
};
const KEPT_EXECUTION = true;
const FINAL_PRODUCT_ID = "finalproductId";
const FINAL_PRODUCT_RTP_COMMIT_ID = "finalproductRtpCommitId";
const BRANCH = "test-branch";
const INITIAL_FINAL_PRODUCT_ID = "initialFinalProductId";
const REPOSITORIES = [
  {
    id: "id1",
    name: "name1",
    url: "url1",
    credentialsId: "credentialsId1",
    label: "label1",
    defaultBranch: "defaultBranch1",
  } as Repository,
  {
    id: "id2",
    name: "name2",
    url: "url2",
    credentialsId: "credentialsId2",
    label: "label2",
    defaultBranch: "defaultBranch2",
  } as Repository,
] as Repository[];

describe("ScenarioExecutionRepushFromFinalProductModalComponent", () => {
  let component: ScenarioExecutionRepushFromFinalProductModalComponent;
  let fixture: ComponentFixture<ScenarioExecutionRepushFromFinalProductModalComponent>;
  let store: MockStore;
  let scenarioExecutionService: jest.Mocked<ScenarioExecutionService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let repositoryService: jest.Mocked<RepositoryService>;
  let finalProductInputComponent: FinalProductDropdownInputComponent;
  beforeEach(() => {
    scenarioExecutionService = {
      repushScenarioExecutionFromFinalProduct: jest.fn(() =>
        of(REPUSHED_SCENARIO)
      ),
    } as unknown as jest.Mocked<ScenarioExecutionService>;

    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    repositoryService = {
      getAllRepositories: jest.fn(() => of(REPOSITORIES)),
    } as unknown as jest.Mocked<RepositoryService>;

    TestBed.configureTestingModule({
      imports: [
        ScenarioExecutionRepushFromFinalProductModalComponent,
        BrowserAnimationsModule,
      ],
      providers: [UntypedFormBuilder, provideMockStore({ initialState: {} })],
    })
      .overrideComponent(
        ScenarioExecutionRepushFromFinalProductModalComponent,
        {
          set: {
            imports: [
              CommonModule,
              ReactiveFormsModule,
              MandatoryFieldModule,
              DialogModule,
              ButtonModule,
              InputTextModule,
              TooltipModule,
              SelectModule,
              SkeletonModule,
              MockComponent(KeepServicesCheckboxComponent),
              MessageModule,
              MockComponent(FinalProductDropdownInputComponent),
            ],
            providers: [
              {
                provide: ScenarioExecutionService,
                useValue: scenarioExecutionService,
              },
              { provide: ToastMessageService, useValue: toastMessageService },
              { provide: RepositoryService, useValue: repositoryService },
            ],
          },
        }
      )
      .compileComponents();

    store = TestBed.inject(MockStore);
    jest.spyOn(store, "select").mockReturnValue(of(PROJECT_ID));

    fixture = TestBed.createComponent(
      ScenarioExecutionRepushFromFinalProductModalComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should initialize the form values to correctly on init", () => {
      component.ngOnInit();
      expect(
        component.scenarioExecutionRepushForm.controls["finalProductId"].value
      ).toBeFalsy();
      expect(
        component.scenarioExecutionRepushForm.controls["rtpCommitId"].value
      ).toBeFalsy();
    });

    it.each([" ", null])(
      "should set the form as invalid if finalProductId Id is not valid",
      (finalProductId: string | null) => {
        component.scenarioExecutionRepushForm.controls[
          "finalProductId"
        ].setValue(finalProductId);
        expect(component.scenarioExecutionRepushForm.valid).toBeFalsy();
      }
    );

    it.each([" ", " with white spaces ", null])(
      "should set the form as invalid if rtpCommitId is not valid",
      (rtpCommitId: string | null) => {
        component.scenarioExecutionRepushForm.controls["rtpCommitId"].setValue(
          rtpCommitId
        );
        expect(component.scenarioExecutionRepushForm.valid).toBeFalsy();
      }
    );
  });

  describe("openModal", () => {
    it("should set modal visbility to true", fakeAsync(() => {
      component.openModal(getComponentInput());
      tick();
      fixture.detectChanges();

      expect(component.showModal).toBeTruthy();
      const dialogElement = fixture.debugElement.query(By.css("p-dialog"));
      expect(dialogElement).toBeTruthy();

      const dialogContent = document.body.querySelector(".p-dialog-content");
      expect(dialogContent).toBeTruthy();
      expect(window.getComputedStyle(dialogContent as Element).visibility).toBe(
        "visible"
      );
    }));

    it("should set the scenario to be repushed", () => {
      component.openModal(getComponentInput());
      expect(component.input).toEqual(getComponentInput());
    });

    it("should get the project id from the store", () => {
      component.openModal(getComponentInput());
      expect(store.select).toHaveBeenCalled();
      expect(component.projectId).toEqual(PROJECT_ID);
    });

    it("should set form loading to true", () => {
      component.openModal(getComponentInput());
      expect(component.isFormLoading).toBeTruthy();
    });

    it("should set the branch correctly", () => {
      component.openModal(getComponentInput());
      expect(component.branch).toEqual(BRANCH);
    });

    it("should set the final product that the scenario execution was initially pushed from correctly", () => {
      component.openModal(getComponentInput());
      expect(component.initialFinalProductId).toEqual(INITIAL_FINAL_PRODUCT_ID);
    });

    it("should fetch all repositories and use the first value as the repository id", () => {
      component.openModal(getComponentInput());
      expect(repositoryService.getAllRepositories).toHaveBeenCalledWith(
        PROJECT_ID
      );
      expect(component.repositoryId).toEqual(REPOSITORIES[0].id);
    });
  });

  describe("closeModal", () => {
    it("should set modal showModal to false", () => {
      component.showModal = true;
      component.closeModal();
      expect(component.showModal).toBeFalsy();
    });

    it("should call closeModal on modal cancel", () => {
      jest.spyOn(component, "closeModal");
      component.openModal(getComponentInput());
      getButtonHarness("cancelButton").click();
      expect(component.closeModal).toHaveBeenCalled();
      const dialogElement = fixture.debugElement.query(By.css("p-dialog"));
      expect(dialogElement.componentInstance.visible).toBeFalsy();
    });
  });

  describe("submitRepush", () => {
    beforeEach(() => {
      component.input = getComponentInput();
      component.projectId = PROJECT_ID;
      component.scenarioExecutionRepushForm
        .get("mxVersion")
        ?.setValue(MX_VERSION);
      component.scenarioExecutionRepushForm
        .get("mxBuildId")
        ?.setValue(MX_BUILD_ID);
      component.scenarioExecutionRepushForm
        .get("finalProductId")
        ?.setValue(FINAL_PRODUCT_ID);
      component.scenarioExecutionRepushForm
        .get("rtpCommitId")
        ?.setValue(RTP_COMMIT_ID);
    });

    it("should call the scenario service to repush a scenario with finalProductId", () => {
      component.submitRepush();

      expect(
        scenarioExecutionService.repushScenarioExecutionFromFinalProduct
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        SCENARIO_EXECUTION_ID,
        getRepushScenarioExecutionRequest()
      );
    });

    it("should repush using a request with a trimmed rtp commit id field", () => {
      component.scenarioExecutionRepushForm
        .get("rtpCommitId")
        ?.setValue(`  ${RTP_COMMIT_ID}  `);

      component.submitRepush();

      expect(
        scenarioExecutionService.repushScenarioExecutionFromFinalProduct
      ).toHaveBeenCalledWith(
        PROJECT_ID,
        SCENARIO_EXECUTION_ID,
        getRepushScenarioExecutionRequest()
      );
    });

    it.each([
      [true, false],
      [false, true],
      [true, undefined],
    ])(
      "should repush scenario execution with stopServices as %s when KeepServices is %s",
      (expectedStopServices: boolean, keepServices: boolean | undefined) => {
        component.keepServices = keepServices;
        component.submitRepush();

        expect(
          scenarioExecutionService.repushScenarioExecutionFromFinalProduct
        ).toHaveBeenCalledWith(PROJECT_ID, SCENARIO_EXECUTION_ID, {
          ...getRepushScenarioExecutionRequest(),
          stopServices: expectedStopServices,
        });
      }
    );

    it("should repush successfully when execution group is not provided", () => {
      component.openModal(getComponentInput({ executionGroupId: undefined }));

      component.submitRepush();

      expect(
        scenarioExecutionService.repushScenarioExecutionFromFinalProduct
      ).toHaveBeenCalledWith(PROJECT_ID, SCENARIO_EXECUTION_ID, {
        ...getRepushScenarioExecutionRequest(),
        executionGroupId: undefined,
      });
    });

    it("should close modal on successful repush", () => {
      const closeModalSpy = jest.spyOn(component, "closeModal");
      component.submitRepush();
      expect(closeModalSpy).toHaveBeenCalled();
    });

    it("should display success message on successful repush", () => {
      component.submitRepush();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Scenario execution successfully repushed."
      );
    });

    it("should emit scenario execution repushed event on successful repush", () => {
      const emitSpy = jest.spyOn(component.scenarioRepushed, "emit");
      component.submitRepush();
      expect(emitSpy).toHaveBeenCalled();
    });

    it("should stop loading on successful repush", () => {
      component.submitRepush();
      expect(component.isButtonLoading).toBeFalsy();
    });

    it("should display error message on failure to repush", () => {
      jest
        .spyOn(
          scenarioExecutionService,
          "repushScenarioExecutionFromFinalProduct"
        )
        .mockReturnValue(throwError(() => new Error("error")));
      component.submitRepush();
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "Failed to repush scenario execution."
      );
    });

    it("should stop loading on failure to repush scenario", () => {
      jest
        .spyOn(
          scenarioExecutionService,
          "repushScenarioExecutionFromFinalProduct"
        )
        .mockReturnValue(throwError(() => new Error("error")));
      component.submitRepush();
      expect(component.isButtonLoading).toBeFalsy();
    });

    it("should call submitRepush on clicking repush button", () => {
      jest.spyOn(component, "submitRepush");
      component.openModal(getComponentInput());
      getButtonHarness("repushButton").click();
      expect(component.submitRepush).toHaveBeenCalled();
    });
  });

  describe("final product expiry message", () => {
    beforeEach(() => {
      component.showModal = true;
      finalProductInputComponent = DomTestUtils.getElementByType(
        fixture,
        FinalProductDropdownInputComponent
      ).getInstance();
    });

    it("should show the final product warning message if the final product component emitted a message", () => {
      const expiredMessage = "Fip Expired";
      finalProductInputComponent.selectedFinalProductExpiryDateNotification.emit(
        expiredMessage
      );
      fixture.detectChanges();
      const finalProductDisplayWarning = fixture.debugElement.query(
        By.css("[data-testid=final-product-warning-message]")
      ).nativeElement.innerHTML;
      expect(finalProductDisplayWarning).toContain(
        `<i class="pi pi-info-circle"></i> Note: ${expiredMessage}`
      );
    });

    it("should not show the final product warning message if a final product message is not emitted yet", () => {
      const finalProductDisplayWarning = fixture.debugElement.query(
        By.css("[data-testid=final-product-warning-message]")
      );
      expect(finalProductDisplayWarning).toBeFalsy();
    });

    it("should not show the final product warning message if the final product message was emitted with empty value", () => {
      const expiredMessage = "";
      finalProductInputComponent.selectedFinalProductExpiryDateNotification.emit(
        expiredMessage
      );
      fixture.detectChanges();
      const finalProductDisplayWarning = fixture.debugElement.query(
        By.css("[data-testid=final-product-warning-message]")
      );
      expect(finalProductDisplayWarning).toBeFalsy();
    });

    it("should empty the message if the final product input is emptied", () => {
      const expiredMessage = "Fip Expired";
      finalProductInputComponent.selectedFinalProductExpiryDateNotification.emit(
        expiredMessage
      );
      fixture.detectChanges();
      finalProductInputComponent.selectedFinalProductChange.emit(undefined);
      fixture.detectChanges();
      const finalProductDisplayWarning = fixture.debugElement.query(
        By.css("[data-testid=final-product-warning-message]")
      );
      expect(finalProductDisplayWarning).toBeFalsy();
    });
  });

  describe("handleSelectedFinalProductChange", () => {
    it("should set the final product id in the form", () => {
      component.handleSelectedFinalProductChange(getFinalProduct());
      expect(
        component.scenarioExecutionRepushForm.controls["finalProductId"].value
      ).toEqual(FINAL_PRODUCT_ID);
    });

    it("should set the rtp commit id to the final product configuration commit id the form", () => {
      component.handleSelectedFinalProductChange(getFinalProduct());
      expect(
        component.scenarioExecutionRepushForm.controls["rtpCommitId"].value
      ).toEqual(FINAL_PRODUCT_RTP_COMMIT_ID);
    });
  });

  describe("handleDataReadyChange", () => {
    it("should set isFormLoading to false when data is ready and form is loading", () => {
      component.isFormLoading = true;
      component.handleDataReadyChange(true);
      expect(component.isFormLoading).toBeFalsy();
    });

    it("should keep form loading when data is not ready", () => {
      component.isFormLoading = true;
      component.handleDataReadyChange(false);
      expect(component.isFormLoading).toBeTruthy();
    });

    it("should do nothing when form is not loading", () => {
      component.isFormLoading = false;
      component.handleDataReadyChange(true);
      expect(component.isFormLoading).toBeFalsy();
    });
  });

  describe("handleErrorMessageChange", () => {
    it("should display error message", () => {
      component.handleErrorMessageChange("error");
      expect(toastMessageService.showError).toHaveBeenCalledWith("error");
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
      component.openModal(getComponentInput());
      component.enableKeepServices = true;
      fixture.detectChanges();
      const keepServicesCheckbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      const onCheckKeepServicesChangedSpy = jest.spyOn(
        component,
        "onKeepServicesChanged"
      );
      keepServicesCheckbox.triggerEventHandler("keepServicesChange", true);
      fixture.detectChanges();
      expect(onCheckKeepServicesChangedSpy).toHaveBeenCalledWith(true);
      expect(component.keepServices).toBeTruthy();
    });

    it("should not show the keep services checkbox when enableKeepServices is disabled", () => {
      component.enableKeepServices = false;
      component.openModal(getComponentInput());
      fixture.detectChanges();
      const keepServicesCheckbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      expect(keepServicesCheckbox).toBeFalsy();
    });

    it("should show the keep services checkbox when enableKeepServices is enabled", () => {
      component.enableKeepServices = true;
      component.openModal(getComponentInput());
      fixture.detectChanges();
      const keepServicesCheckbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      expect(keepServicesCheckbox).toBeTruthy();
    });
  });

  function getButtonHarness(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }
});

function getRepushScenarioExecutionRequest(): RepushScenarioExecutionFromFinalProductRequest {
  return {
    rtpCommitId: RTP_COMMIT_ID,
    finalProductId: FINAL_PRODUCT_ID,
    executionGroupId: EXECUTION_GROUP_ID,
    stopServices: true,
  };
}

function getFinalProduct(): FinalProduct {
  return {
    id: FINAL_PRODUCT_ID,
    rtpProduct: { rtpCommitId: FINAL_PRODUCT_RTP_COMMIT_ID },
  } as unknown as FinalProduct;
}

function getComponentInput(
  overrides: Partial<ScenarioExecutionRepushFromFinalProductInput> = {}
): ScenarioExecutionRepushFromFinalProductInput {
  return {
    branch: BRANCH,
    initialFinalProductId: INITIAL_FINAL_PRODUCT_ID,
    scenarioExecutionId: SCENARIO_EXECUTION_ID,
    keptExecution: KEPT_EXECUTION,
    executionGroupId: EXECUTION_GROUP_ID,
    ...overrides,
  };
}
