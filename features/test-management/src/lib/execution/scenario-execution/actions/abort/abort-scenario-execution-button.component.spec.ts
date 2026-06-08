import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbortScenarioExecutionButtonComponent } from "./abort-scenario-execution-button.component";
import {
  ScenarioExecutionService,
  ScenarioExecutionStatus,
} from "@mxflow/test-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfirmationService, MessageService } from "primeng/api";
import { of, throwError } from "rxjs";
import { MockPipe } from "ng-mocks";
import { DomTestUtils } from "@mxevolve/testing";
import { DisableAbortPipe } from "./disable-abort.pipe";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { Toast } from "primeng/toast";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

const PROJECT_ID = "test-project";
const SCENARIO_EXECUTION_ID = "test-execution";
const SCENARIO_EXECUTION_STATUS = ScenarioExecutionStatus.UNDERWAY;
describe("abort scenario execution button component", () => {
  let component: AbortScenarioExecutionButtonComponent;
  let fixture: ComponentFixture<AbortScenarioExecutionButtonComponent>;
  let scenarioExecutionService: jest.Mocked<ScenarioExecutionService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let confirmationService: jest.Mocked<ConfirmationService>;
  let analyticsTrackerService: { trackAbortExecution: jest.Mock };
  const disableAbortPipeTransformMock = jest.fn();

  beforeEach(async () => {
    scenarioExecutionService = {
      abortScenarioExecution: jest.fn(),
    } as unknown as jest.Mocked<ScenarioExecutionService>;

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    confirmationService = {
      confirm: jest.fn(),
    } as unknown as jest.Mocked<ConfirmationService>;

    analyticsTrackerService = { trackAbortExecution: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AbortScenarioExecutionButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ScenarioExecutionService,
          useValue: scenarioExecutionService,
        },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: ConfirmationService, useValue: confirmationService },
        {
          provide: TestManagementAnalyticsTrackerService,
          useValue: analyticsTrackerService,
        },
        { provide: MessageService, useValue: {} },
      ],
    })
      .overrideComponent(AbortScenarioExecutionButtonComponent, {
        remove: { imports: [Toast, ConfirmPopupModule, DisableAbortPipe] },
        add: {
          imports: [MockPipe(DisableAbortPipe, disableAbortPipeTransformMock)],
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
          providers: [
            { provide: ToastMessageService, useValue: toastMessageService },
            { provide: ConfirmationService, useValue: confirmationService },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AbortScenarioExecutionButtonComponent);
    component = fixture.componentInstance;

    component.projectId = PROJECT_ID;
    component.scenarioExecutionId = SCENARIO_EXECUTION_ID;
    component.scenarioExecutionStatus = SCENARIO_EXECUTION_STATUS;
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should open a confirmation popup when abort button is clicked", () => {
    getAbortButtonHarness().click();
    expect(confirmationService.confirm).toHaveBeenCalled();
  });

  it("should abort the scenario execution", () => {
    scenarioExecutionService.abortScenarioExecution.mockReturnValue(
      of("Success")
    );

    component["abortScenario"]();

    expect(
      scenarioExecutionService.abortScenarioExecution
    ).toHaveBeenCalledWith(PROJECT_ID, SCENARIO_EXECUTION_ID);
  });

  it("should display a success toast message when abort is successful", () => {
    const successMessage = "Abort successful";
    scenarioExecutionService.abortScenarioExecution.mockReturnValue(
      of(successMessage)
    );

    getAbortButtonHarness().click();
    acceptConfirmation(confirmationService);

    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      successMessage
    );
  });

  it("should track abort execution when scenario is aborted", () => {
    scenarioExecutionService.abortScenarioExecution.mockReturnValue(
      of("Success")
    );
    getAbortButtonHarness().click();
    acceptConfirmation(confirmationService);
    expect(analyticsTrackerService.trackAbortExecution).toHaveBeenCalled();
  });

  it("should display an error toast message when abort fails", () => {
    const errorMessage = "Abort failed";
    scenarioExecutionService.abortScenarioExecution.mockReturnValue(
      throwError(() => errorMessage)
    );
    getAbortButtonHarness().click();
    acceptConfirmation(confirmationService);

    expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
  });

  it("should stop loading when abort is successful", () => {
    scenarioExecutionService.abortScenarioExecution.mockReturnValue(
      of("Success")
    );

    getAbortButtonHarness().click();
    acceptConfirmation(confirmationService);

    expect(component.loading).toBe(false);
  });

  it("should stop loading when abort fails", () => {
    scenarioExecutionService.abortScenarioExecution.mockReturnValue(
      throwError(() => "Error")
    );
    getAbortButtonHarness().click();
    acceptConfirmation(confirmationService);

    expect(component.loading).toBe(false);
  });

  it("should evaluate whether enable the abort button based on the scenario execution status", () => {
    expect(disableAbortPipeTransformMock).toHaveBeenCalledWith(
      SCENARIO_EXECUTION_STATUS
    );
  });

  it("should enable abort button if abort is not allowed", () => {
    disableAbortPipeTransformMock.mockReturnValue(false);
    component.scenarioExecutionStatus = ScenarioExecutionStatus.UNDERWAY;
    expect(getAbortButtonHarness().isDisabled()).toBe(false);
  });

  it("should disable abort button if abort is allowed", () => {
    disableAbortPipeTransformMock.mockReturnValue(true);
    component.scenarioExecutionStatus = ScenarioExecutionStatus.FAILED;
    expect(getAbortButtonHarness().isDisabled()).toBe(true);
  });

  function acceptConfirmation(
    confirmationService: jest.Mocked<ConfirmationService>
  ) {
    const confirmCall = confirmationService.confirm.mock.calls[0]?.[0];
    confirmCall?.accept?.();
  }

  function getAbortButtonHarness() {
    return DomTestUtils.getButtonByTestId(fixture, "abort-button");
  }
});
