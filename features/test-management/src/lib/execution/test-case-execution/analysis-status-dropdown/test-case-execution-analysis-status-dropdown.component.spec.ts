import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  TestCaseExecutionAnalysisStatusDropdownComponent,
  TestCaseExecutionService,
} from "@mxflow/test-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { delay, of, throwError } from "rxjs";
import { TestCaseExecutionStatus } from "../status/test-case-execution-status";
import { TestCaseExecution } from "../test-case-execution";
import {
  TestCaseExecutionAnalysisStatus,
  TestCaseExecutionAnalysisStatusDisplayValue,
} from "../analysis-status/test-case-execution-analysis-status";
import { SelectChangeEvent, SelectModule } from "primeng/select";
import { MockComponent } from "ng-mocks";
import { AnalysisObjectLinkingComponent } from "../../analysis-object-link/analysis-object-linking/analysis-object-linking.component";
import {
  TestCaseExecutionAnalysisStatusIneligibilityReason,
  TestCaseExecutionAnalysisStatusIneligibilityReasonDisplayMessage,
} from "../analysis-status-eligibility/test-case-execution-analysis-status-ineligibility-reason";
import { TestCaseExecutionAnalysisStatusTransitionEligibility } from "../analysis-status-eligibility/test-case-executions-analyisis-status-eligibility";
import { By } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TooltipModule } from "primeng/tooltip";
import { OverlayModule } from "primeng/overlay";

const projectId = "projectId";
const testCaseExecutionId1 = "testCaseExecutionId1";
const testExecutionId1 = "exec-456";
const testCaseExecutionId2 = "testCaseExecutionId2";
const testExecutionId2 = "exec-789";

const testCaseExecution1 = {
  id: testCaseExecutionId1,
  analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
  projectId: projectId,
  testExecutionId: testExecutionId1,
  externalId: "ext-789",
  testCaseKey: "TC-001",
  functionalTestCaseId: "FTC-101",
  scenarioExecutionId: "SE-202",
  title: "Login Test",
  description: "Test for user login functionality",
  status: TestCaseExecutionStatus.UNDERWAY,
  startDate: "2025-04-08T13:57:47.345Z",
  endDate: "2025-04-08T14:00:00.000Z",
} as TestCaseExecution;

const testCaseExecution2 = {
  id: testCaseExecutionId2,
  analysisStatus: TestCaseExecutionAnalysisStatus.FAILED,
  projectId: projectId,
  testExecutionId: testExecutionId2,
  externalId: "ext-789",
  testCaseKey: "TC-001",
  functionalTestCaseId: "FTC-101",
  scenarioExecutionId: "SE-202",
  title: "Login Test",
  description: "Test for user login functionality",
  status: TestCaseExecutionStatus.UNDERWAY,
  startDate: "2025-04-08T13:57:47.345Z",
  endDate: "2025-04-08T14:00:00.000Z",
} as TestCaseExecution;

const fetchAnalysisStatusEligibilityResponse = {
  nextAnalysisStatusTransitionEligibilities: [],
  eligibleToUpdateTestCaseAnalysisStatus: true,
};

describe("TestCaseExecutionAnalysisStatusDropdownComponent", () => {
  let component: TestCaseExecutionAnalysisStatusDropdownComponent;
  let fixture: ComponentFixture<TestCaseExecutionAnalysisStatusDropdownComponent>;
  let toastMessageService: ToastMessageService;
  let testCaseExecutionService: TestCaseExecutionService;

  beforeEach(() => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;

    testCaseExecutionService = {
      updateAnalysisStatus: jest.fn(() => of(null)),
      fetchAnalysisStatusEligibility: jest.fn(() =>
        of(fetchAnalysisStatusEligibilityResponse)
      ),
    } as unknown as TestCaseExecutionService;

    TestBed.configureTestingModule({
      imports: [
        TestCaseExecutionAnalysisStatusDropdownComponent,
        SelectModule,
        TooltipModule,
        OverlayModule,
        BrowserAnimationsModule,
        MockComponent(AnalysisObjectLinkingComponent),
      ],
      providers: [
        {
          provide: ToastMessageService,
          useValue: toastMessageService,
        },
        {
          provide: TestCaseExecutionService,
          useValue: testCaseExecutionService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      TestCaseExecutionAnalysisStatusDropdownComponent
    );
    component = fixture.componentInstance;
    component.testCaseExecution = testCaseExecution1;

    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  describe("analysis status eligibilities", () => {
    it("should initialize statuses as empty in case no test case is selected yet", () => {
      component.testCaseExecution = undefined;
      expect(component.nextAnalysisStatusOptions).toEqual([]);
    });

    it("should fetch eligibilities for the correct test case execution", () => {
      component.testCaseExecution = testCaseExecution1;
      expect(
        testCaseExecutionService.fetchAnalysisStatusEligibility
      ).toHaveBeenCalledWith(
        testCaseExecution1.projectId,
        testCaseExecution1.id
      );
    });

    it("should disable analysis status dropdown if not eligible to update test case analysis status", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [],
            eligibleToUpdateTestCaseAnalysisStatus: false,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(component.disabled).toEqual(true);
    });

    it("should enable analysis status dropdown if eligible to update test case analysis status", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(component.disabled).toEqual(false);
    });

    it("should set the possible next status option labels correctly", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [
              {
                analysisStatus: TestCaseExecutionAnalysisStatus.FAILED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
              {
                analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(
        component.nextAnalysisStatusOptions.map((status) => status.label)
      ).toEqual([
        TestCaseExecutionAnalysisStatusDisplayValue[
          TestCaseExecutionAnalysisStatus.FAILED
        ],
        TestCaseExecutionAnalysisStatusDisplayValue[
          TestCaseExecutionAnalysisStatus.PASSED
        ],
      ]);
    });

    it("should set the possible next status option values correctly", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [
              {
                analysisStatus: TestCaseExecutionAnalysisStatus.FAILED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
              {
                analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(
        component.nextAnalysisStatusOptions.map((status) => status.value)
      ).toEqual([
        TestCaseExecutionAnalysisStatus.FAILED,
        TestCaseExecutionAnalysisStatus.PASSED,
      ]);
    });

    it("should disable/enable the possible next status option correctly", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [
              {
                eligible: true,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
              {
                eligible: false,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(
        component.nextAnalysisStatusOptions.map((status) => status.disabled)
      ).toEqual([false, true]);
    });

    it("should disable the cancelled analysis status if it is not eligible due to regressions linked", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [
              {
                eligible: false,
                analysisStatus: TestCaseExecutionAnalysisStatus.CANCELLED,
                ineligibilityReason:
                  TestCaseExecutionAnalysisStatusIneligibilityReason.REGRESSION_LINKED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(
        component.nextAnalysisStatusOptions.map((status) => status.disabled)
      ).toEqual([true]);
    });

    it("should not disable the cancelled analysis status only if it is not eligible due to no failure reasons linked", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [
              {
                eligible: false,
                analysisStatus: TestCaseExecutionAnalysisStatus.CANCELLED,
                ineligibilityReason:
                  TestCaseExecutionAnalysisStatusIneligibilityReason.NO_FAILURE_REASONS_LINKED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(
        component.nextAnalysisStatusOptions.map((status) => status.disabled)
      ).toEqual([false]);
    });

    it("should have a tooltip based on the ineligiblility reason of the analysis status", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [
              {
                ineligibilityReason:
                  TestCaseExecutionAnalysisStatusIneligibilityReason.NO_IMPACTS_LINKED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
              {
                ineligibilityReason:
                  TestCaseExecutionAnalysisStatusIneligibilityReason.NO_REGRESSIONS_LINKED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(
        component.nextAnalysisStatusOptions.map((status) => status.tooltip)
      ).toEqual([
        TestCaseExecutionAnalysisStatusIneligibilityReasonDisplayMessage[
          TestCaseExecutionAnalysisStatusIneligibilityReason.NO_IMPACTS_LINKED
        ],
        TestCaseExecutionAnalysisStatusIneligibilityReasonDisplayMessage[
          TestCaseExecutionAnalysisStatusIneligibilityReason
            .NO_REGRESSIONS_LINKED
        ],
      ]);
    });

    it("should not have tooltip on the cancelled analysis status if it is ineligibile due to no failure reasons linked", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [
              {
                eligible: false,
                ineligibilityReason:
                  TestCaseExecutionAnalysisStatusIneligibilityReason.NO_FAILURE_REASONS_LINKED,
                analysisStatus: TestCaseExecutionAnalysisStatus.CANCELLED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(
        component.nextAnalysisStatusOptions.map((status) => status.tooltip)
      ).toEqual([""]);
    });

    it("should have a tooltip on the cancelled analysis status if it is ineligible due to regressions linked", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(
          of({
            nextAnalysisStatusTransitionEligibilities: [
              {
                eligible: false,
                ineligibilityReason:
                  TestCaseExecutionAnalysisStatusIneligibilityReason.NO_REGRESSIONS_LINKED,
                analysisStatus: TestCaseExecutionAnalysisStatus.CANCELLED,
              } as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          })
        );
      component.testCaseExecution = testCaseExecution1;
      expect(
        component.nextAnalysisStatusOptions.map((status) => status.tooltip)
      ).toEqual([
        TestCaseExecutionAnalysisStatusIneligibilityReasonDisplayMessage[
          TestCaseExecutionAnalysisStatusIneligibilityReason
            .NO_REGRESSIONS_LINKED
        ],
      ]);
    });

    it("should set is loading to true before fetching eligibilities", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockImplementation(() => {
          return of({
            nextAnalysisStatusTransitionEligibilities: [],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          }).pipe(delay(3000));
        });
      component.testCaseExecution = testCaseExecution1;
      expect(component.isLoading).toBeTruthy();
    });

    it("should reset next statuses before fetching eligibilities", () => {
      component.testCaseExecution = testCaseExecution1;
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockImplementation(() => {
          return of({
            nextAnalysisStatusTransitionEligibilities: [
              {} as TestCaseExecutionAnalysisStatusTransitionEligibility,
            ],
            eligibleToUpdateTestCaseAnalysisStatus: true,
          }).pipe(delay(3000));
        });
      component.testCaseExecution = testCaseExecution1;
      expect(component.nextAnalysisStatusOptions).toEqual([]);
    });
    it("should set is loading to false after fetching eligibilities successfully", () => {
      component.testCaseExecution = testCaseExecution1;
      expect(component.isLoading).toBeFalsy();
    });
    it("should set is loading to false after failing to fetch eligibilities", () => {
      jest
        .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
        .mockReturnValue(throwError(() => new Error()));
      component.testCaseExecution = testCaseExecution1;
      expect(component.isLoading).toBeFalsy();
    });
    describe("template tests", () => {
      it("should show ineligibility tooltip if an analysis status is disabled", () => {
        jest
          .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
          .mockReturnValue(
            of({
              nextAnalysisStatusTransitionEligibilities: [
                {
                  ineligibilityReason:
                    TestCaseExecutionAnalysisStatusIneligibilityReason.NO_IMPACTS_LINKED,
                  analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
                  eligible: false,
                } as TestCaseExecutionAnalysisStatusTransitionEligibility,
              ],
              eligibleToUpdateTestCaseAnalysisStatus: true,
            })
          );
        component.testCaseExecution = testCaseExecution1;
        fixture.detectChanges();

        const nextAnalysisStatusOption = getNextAnalysisStatusOption();
        expect(nextAnalysisStatusOption).toBeTruthy();

        expect(nextAnalysisStatusOption.nativeElement.classList).toContain(
          "pointer-events-auto"
        );
      });

      it("disabled analysis status should not react to click", () => {
        jest
          .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
          .mockReturnValue(
            of({
              nextAnalysisStatusTransitionEligibilities: [
                {
                  ineligibilityReason:
                    TestCaseExecutionAnalysisStatusIneligibilityReason.NO_IMPACTS_LINKED,
                  analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
                  eligible: false,
                } as TestCaseExecutionAnalysisStatusTransitionEligibility,
              ],
              eligibleToUpdateTestCaseAnalysisStatus: true,
            })
          );
        component.testCaseExecution = testCaseExecution1;
        fixture.detectChanges();

        mockClickingNextAnalysisStatusOption();
        expect(
          testCaseExecutionService.updateAnalysisStatus
        ).not.toHaveBeenCalled();
      });

      it("enabled analysis status should react to click", () => {
        jest
          .spyOn(testCaseExecutionService, "fetchAnalysisStatusEligibility")
          .mockReturnValue(
            of({
              nextAnalysisStatusTransitionEligibilities: [
                {
                  analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
                  eligible: true,
                } as TestCaseExecutionAnalysisStatusTransitionEligibility,
              ],
              eligibleToUpdateTestCaseAnalysisStatus: true,
            })
          );
        component.testCaseExecution = testCaseExecution1;
        fixture.detectChanges();

        mockClickingNextAnalysisStatusOption();

        expect(
          testCaseExecutionService.updateAnalysisStatus
        ).toHaveBeenCalled();
      });
    });

    function getNextAnalysisStatusOption() {
      const analysisStatusSelectComponent = fixture.debugElement.query(
        By.css("p-select")
      );
      analysisStatusSelectComponent.nativeElement.click();
      fixture.detectChanges();

      const nextAnalysisStatusOption = fixture.debugElement.query(
        By.css("[data-testid=next-analysis-status]")
      );
      return nextAnalysisStatusOption;
    }

    function mockClickingNextAnalysisStatusOption() {
      const nextAnalysisStatusOption = getNextAnalysisStatusOption();
      expect(nextAnalysisStatusOption).toBeTruthy();

      nextAnalysisStatusOption.nativeElement?.click();
      fixture.detectChanges();
    }
  });
  it("should update test case execution and enabled when input is defined", () => {
    component.testCaseExecution = undefined;
    expect(component.selectedStatus).toBe(undefined);
    expect(component.disabled).toBe(true);
    component.testCaseExecution = testCaseExecution1;

    expect(component.testCaseExecution).toBe(testCaseExecution1);
    expect(component.selectedStatus).toBe(testCaseExecution1.analysisStatus);
    expect(component.disabled).toBe(false);
  });

  it("should update test case execution and enabled when test case execution input is modified", () => {
    component.testCaseExecution = testCaseExecution1;

    expect(component.testCaseExecution).toBe(testCaseExecution1);
    expect(component.selectedStatus).toBe(testCaseExecution1.analysisStatus);
    expect(component.disabled).toBe(false);

    component.testCaseExecution = testCaseExecution2;

    expect(component.testCaseExecution).toBe(testCaseExecution2);
    expect(component.selectedStatus).toBe(testCaseExecution2.analysisStatus);
    expect(component.disabled).toBe(false);
  });

  it("should call updateAnalysisStatus on status change", () => {
    component.testCaseExecution = testCaseExecution1;
    fixture.detectChanges();

    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
    } as unknown as SelectChangeEvent);
    fixture.detectChanges();
    expect(testCaseExecutionService.updateAnalysisStatus).toHaveBeenCalledWith({
      analysisStatus: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
      testCaseExecutionId: testCaseExecution1.id,
      projectId: testCaseExecution1.projectId,
    });
  });

  it("should show success message on status change", () => {
    component.testCaseExecution = testCaseExecution1;
    fixture.detectChanges();

    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
    } as unknown as SelectChangeEvent);
    fixture.detectChanges();
    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      "Status successfully updated to Incident Sent"
    );
  });

  it("should emit status update event on successful status change", () => {
    component.testCaseExecution = testCaseExecution1;
    jest.spyOn(component.statusUpdate, "emit");

    fixture.detectChanges();
    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
    } as unknown as SelectChangeEvent);
    fixture.detectChanges();
    expect(component.statusUpdate.emit).toHaveBeenCalled();
  });

  it("should not emit status update event when a failure occurs during status change", () => {
    component.testCaseExecution = testCaseExecution1;
    jest.spyOn(component.statusUpdate, "emit");
    jest
      .spyOn(testCaseExecutionService, "updateAnalysisStatus")
      .mockReturnValue(throwError(() => new Error("error")));

    fixture.detectChanges();
    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
    } as unknown as SelectChangeEvent);
    fixture.detectChanges();
    expect(component.statusUpdate.emit).not.toHaveBeenCalled();
  });

  it("should revert selectedStatus and show error message on update failure", () => {
    jest
      .spyOn(testCaseExecutionService, "updateAnalysisStatus")
      .mockReturnValue(throwError(() => new Error("error")));
    component.testCaseExecution = testCaseExecution1;

    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
    } as unknown as SelectChangeEvent);
    fixture.detectChanges();
    expect(testCaseExecutionService.updateAnalysisStatus).toHaveBeenCalled();
    expect(toastMessageService.showError).toHaveBeenCalledWith(
      "Failed to update status: error"
    );
    expect(component.selectedStatus).toBe(testCaseExecution1.analysisStatus);
  });

  it("should set modal visible when CANCELLED is selected", () => {
    component.testCaseExecution = testCaseExecution1;
    component.selectedStatus = TestCaseExecutionAnalysisStatus.CANCELLED;

    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.CANCELLED,
    } as SelectChangeEvent);
    fixture.detectChanges();

    expect(component.isFailureReasonModalVisible).toBe(true);
  });

  it("should revert selectedStatus on modal hide when no failure reason links changed", () => {
    component.testCaseExecution = testCaseExecution1;
    component.selectedStatus = TestCaseExecutionAnalysisStatus.CANCELLED;
    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.CANCELLED,
    } as SelectChangeEvent);
    fixture.detectChanges();

    component.onModalVisibilityChange(false);
    fixture.detectChanges();

    expect(component.selectedStatus).toBe(testCaseExecution1.analysisStatus);
  });

  it("should hide modal on modal hide when no failure reason links changed", () => {
    component.testCaseExecution = testCaseExecution1;
    component.selectedStatus = TestCaseExecutionAnalysisStatus.CANCELLED;
    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.CANCELLED,
    } as SelectChangeEvent);
    fixture.detectChanges();

    component.onModalVisibilityChange(false);
    fixture.detectChanges();

    expect(component.isFailureReasonModalVisible).toBe(false);
  });

  it("should keep selectedStatus as CANCELLED on modal hide when failure reason links changed", () => {
    component.testCaseExecution = testCaseExecution1;
    jest
      .spyOn(testCaseExecutionService, "updateAnalysisStatus")
      .mockReturnValue(of());
    component.selectedStatus = TestCaseExecutionAnalysisStatus.CANCELLED;
    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.CANCELLED,
    } as SelectChangeEvent);
    fixture.detectChanges();

    component.onFailureReasonLinksChanged();
    component.onModalVisibilityChange(false);
    fixture.detectChanges();

    expect(component.selectedStatus).toBe(
      TestCaseExecutionAnalysisStatus.CANCELLED
    );
  });

  it("should hide modal on modal hide when failure reason links changed", () => {
    component.testCaseExecution = testCaseExecution1;
    component.onStatusChange({
      value: TestCaseExecutionAnalysisStatus.CANCELLED,
    } as SelectChangeEvent);
    jest
      .spyOn(testCaseExecutionService, "updateAnalysisStatus")
      .mockReturnValue(of());
    fixture.detectChanges();

    component.onFailureReasonLinksChanged();
    component.onModalVisibilityChange(false);
    fixture.detectChanges();

    expect(component.isFailureReasonModalVisible).toBe(false);
  });
});
