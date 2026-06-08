import {
  BinaryImpactsSelectionTableComponent,
  ConfigurationImpactsSelectionTableComponent,
  LiteBinaryImpact,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import { AuthenticationService } from "@mxflow/core/auth";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { triggerUpdateReferenceResponse } from "../update-reference-utils";
import { of, throwError } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { FileInfo, ScmService } from "@mxflow/features/scm";
import { UpdateReferenceModalComponent } from "./update-reference-modal.component";
import { UpdateReferenceService } from "../update-reference.service";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { TabsModule } from "primeng/tabs";
import {
  TriggerUpdateReferenceRequest,
  UpdateReferenceFileRequest,
} from "../trigger-update-reference-request";
import { getFullySelectedAnalysisObject } from "../../../analysis-object-link/analysis-object-link-test-utils";
import {
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
} from "@mxflow/features/analysis-objects";
import { StepperModule } from "primeng/stepper";
import { DialogModule } from "primeng/dialog";
import { DomTestUtils } from "@mxevolve/testing";
import { NgClass } from "@angular/common";
import { MessageModule } from "primeng/message";
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import { FormsModule } from "@angular/forms";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

interface UpdateReferenceModalTestInputs {
  projectId: string;
  repositoryId: string;
  commitId: string;
  referenceFilePathOnRepo: string;
  scenarioExecutionId: string;
  testExecutionId: string;
  testCaseExecutionId: string;
  updatedReferenceFilePath: string;
}

const PROJECT_ID = "PROJECT_ID";
const REPOSITORY_ID = "REPO_ID";
const VERSION = "VERSION";
const REFERENCE_FILE_PATH_ON_REPO = "referenceFilePathOnRepo";
const SCENARIO_EXECUTION_ID = "scenarioExecutionId";
const TEST_EXECUTION_ID = "testExecutionId";
const TEST_CASE_EXECUTION_ID = "testCaseExecutionId";
const COMMIT_MESSAGE = "commitMessage";
const UPDATED_REFERENCE_FILE_PATH = "updatedReferenceFilePath";
class MockedResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
function getFirstBinaryImpact(): LiteBinaryImpact {
  return {
    id: "1",
    projectId: PROJECT_ID,
    title: "title1",
    owner: "owner1",
    mxVersion: "mxVersion",
    upgradeImpact: {
      id: "upgradeImpactId1",
      externalIssue: {
        id: "upgradeImpactExternalIssueId1",
        link: "upgradeImpactExternalIssueLink1",
      },
    },
  };
}

function getSecondBinaryImpact(): LiteBinaryImpact {
  return {
    id: "2",
    projectId: PROJECT_ID,
    title: "title2",
    owner: "owner2",
    mxVersion: "mxVersion",
    upgradeImpact: {
      id: "upgradeImpactId2",
      externalIssue: {
        id: "upgradeImpactExternalIssueId2",
        link: "upgradeImpactExternalIssueLink2",
      },
    },
  };
}

function getFirstConfigurationImpact(): LiteConfigurationImpact {
  return {
    id: "1",
    projectId: PROJECT_ID,
    title: "title1",
    owner: "owner1",
    guiltyChange: "guiltyChange1",
  };
}

function getSecondConfigurationImpact(): LiteConfigurationImpact {
  return {
    id: "2",
    projectId: PROJECT_ID,
    title: "title2",
    owner: "owner2",
    guiltyChange: "guiltyChange2",
  };
}

const USER_MAIL = "user-mail";
const USER_NAME = "user-name";
describe("update reference modal", () => {
  let component: UpdateReferenceModalComponent;
  let scmService: ScmService;
  let toastMessageService: ToastMessageService;
  let authService: AuthenticationService;
  let updateReferenceService: UpdateReferenceService;
  let analyticsTrackerService: { trackUpdateReference: jest.Mock };
  let fixture: MockedComponentFixture<
    UpdateReferenceModalComponent,
    UpdateReferenceModalTestInputs
  >;

  beforeEach(async () => {
    global.ResizeObserver = MockedResizeObserver;
    scmService = {
      getFileInfo: jest.fn(() => of({ fileExists: true } as FileInfo)),
    } as unknown as ScmService;
    authService = {
      getUserMail: jest.fn(() => USER_MAIL),
      getUsername: jest.fn(() => USER_NAME),
    } as unknown as AuthenticationService;
    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as ToastMessageService;
    updateReferenceService = {
      trigger: jest.fn(() => of(triggerUpdateReferenceResponse)),
    } as unknown as UpdateReferenceService;
    analyticsTrackerService = { trackUpdateReference: jest.fn() };
    await MockBuilder(UpdateReferenceModalComponent)
      .mock(BinaryImpactsSelectionTableComponent)
      .mock(ConfigurationImpactsSelectionTableComponent)
      .mock(ValidationScopeSetterComponent)
      .keep(TabsModule)
      .keep(DialogModule)
      .keep(MessageModule)
      .keep(StepperModule)
      .keep(ShowDetectionWithNoDefectsToggleComponent)
      .keep(FormsModule)
      .keep(BrowserAnimationsModule)
      .keep(NgClass, { exportAll: true })
      .mock(AuthenticationService, authService)
      .mock(ToastMessageService, toastMessageService)
      .mock(UpdateReferenceService, updateReferenceService)
      .mock(ScmService, scmService)
      .mock(TestManagementAnalyticsTrackerService, analyticsTrackerService);

    fixture = MockRender(UpdateReferenceModalComponent, {
      projectId: PROJECT_ID,
      repositoryId: REPOSITORY_ID,
      commitId: VERSION,
      referenceFilePathOnRepo: REFERENCE_FILE_PATH_ON_REPO,
      scenarioExecutionId: SCENARIO_EXECUTION_ID,
      testExecutionId: TEST_EXECUTION_ID,
      testCaseExecutionId: TEST_CASE_EXECUTION_ID,
      updatedReferenceFilePath: UPDATED_REFERENCE_FILE_PATH,
    });
    component = fixture.point.componentInstance;

    component.selectedBinaryImpactsSignal.set([]);
    component.selectedConfigurationImpactsSignal.set([]);
    component.commitMessageSignal.set("");

    component.commitMessageSignal.set(COMMIT_MESSAGE);
    component.selectedBinaryImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstBinaryImpact()),
    ]);
    component.selectedConfigurationImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstConfigurationImpact()),
    ]);
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("refresh should be behavioural subject with false initial value", async () => {
    component.refresh$.subscribe((refresh) => {
      expect(refresh).toBeFalsy();
    });
  });

  it("should emit next when visible is true", () => {
    const refreshEmit = jest.spyOn(component.refresh$, "next");

    component.isVisible = true;

    expect(refreshEmit).toHaveBeenCalledWith(true);
  });

  it("should allow proceed to commit message when at least one configuration impact is selected", () => {
    component.selectedBinaryImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstBinaryImpact()),
    ]);

    expect(component.canProceedToCommitStepSignal()).toBeTruthy();
  });

  it("should allow proceed to commit message when at least one binary impact is selected", () => {
    component.selectedConfigurationImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstConfigurationImpact()),
    ]);

    expect(component.canProceedToCommitStepSignal()).toBeTruthy();
  });

  it("should not allow proceed to commit message when neither a binary nor a config impact is selected", () => {
    component.selectedBinaryImpactsSignal.set([]);
    component.selectedConfigurationImpactsSignal.set([]);

    expect(component.canProceedToCommitStepSignal()).toBeFalsy();
  });

  it("should not select any binary impacts initially", () => {
    expect(component.initiallyLinkedBinaryImpactsState()).toEqual([]);
  });

  it("should not select any configuration impacts initially", () => {
    expect(component.initiallyLinkedConfigurationImpactsState()).toEqual([]);
  });

  it("should check for file existence on submit", () => {
    component.submit();

    expect(scmService.getFileInfo).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      repositoryId: REPOSITORY_ID,
      version: VERSION,
      path: REFERENCE_FILE_PATH_ON_REPO,
    });
  });

  it("should trigger update reference on submit", () => {
    const computedCommitMessage = `${component.commitMessageSignal()} -Configuration Impacts: ${
      component.selectedConfigurationImpactsSignal()[0].analysisObject.title
    } -Binary Impacts: ${
      component.selectedBinaryImpactsSignal()[0].analysisObject.upgradeImpact
        ?.externalIssue.id
    }`;

    component.submit();

    expect(updateReferenceService.trigger).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      scenarioExecutionId: SCENARIO_EXECUTION_ID,
      testExecutionId: TEST_EXECUTION_ID,
      testCaseExecutionId: TEST_CASE_EXECUTION_ID,
      commitMessage: computedCommitMessage,
      binaryImpactIds: [getFirstBinaryImpact().id],
      configurationImpactIds: [getFirstConfigurationImpact().id],
      referenceToUpdate: {
        referenceFilePathOnRepo: REFERENCE_FILE_PATH_ON_REPO,
        updatedReferenceFilePath: UPDATED_REFERENCE_FILE_PATH,
      } as UpdateReferenceFileRequest,
    } as TriggerUpdateReferenceRequest);
  });

  it("should not trigger update reference on submit when file does not exist on repo", () => {
    jest
      .spyOn(scmService, "getFileInfo")
      .mockImplementation(jest.fn(() => of({ fileExists: false } as FileInfo)));

    component.submit();

    expect(updateReferenceService.trigger).not.toHaveBeenCalled();
  });

  it("should not trigger update reference on submit when checking file existence throws error", () => {
    const error = new Error("file info error");
    jest
      .spyOn(scmService, "getFileInfo")
      .mockReturnValue(throwError(() => error));

    component.submit();

    expect(updateReferenceService.trigger).not.toHaveBeenCalled();
  });

  it("should show error toast if file does not exist", () => {
    jest
      .spyOn(scmService, "getFileInfo")
      .mockImplementation(jest.fn(() => of({ fileExists: false } as FileInfo)));

    component.submit();

    expect(toastMessageService.showError).toHaveBeenCalledWith(
      "File does not exist on the repository!"
    );
  });

  it("should show error if failed to check for file existence", () => {
    const error = new Error("file info error");
    jest
      .spyOn(scmService, "getFileInfo")
      .mockReturnValue(throwError(() => error));

    component.submit();

    expect(toastMessageService.showError).toHaveBeenCalledWith(
      expect.stringContaining("Could not fetch file information")
    );
  });

  it("should show error toast if trigger update reference throws error", () => {
    const error = new Error("failed to trigger update reference");
    jest
      .spyOn(updateReferenceService, "trigger")
      .mockReturnValue(throwError(() => error));

    component.submit();

    expect(toastMessageService.showError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update reference")
    );
  });

  it("should show success toast if trigger update reference succeeds", () => {
    component.commitMessageSignal.set(COMMIT_MESSAGE);
    component.selectedBinaryImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstBinaryImpact()),
    ]);
    component.selectedConfigurationImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstConfigurationImpact()),
    ]);

    component.submit();

    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      "The update reference has been triggered successfully!"
    );
  });

  it("should track update reference on submit", () => {
    component.submit();

    expect(analyticsTrackerService.trackUpdateReference).toHaveBeenCalled();
  });

  it("should set isVisible to false after submit", () => {
    component.isVisible = true;
    component.submit();

    expect(component.isVisible).toBe(false);
  });

  it("should set isVisible to false after submit when file does not exist on repo", () => {
    scmService.getFileInfo = jest.fn(() =>
      of({ fileExists: false } as FileInfo)
    );

    component.submit();

    expect(component.isVisible).toBe(false);
  });

  it("should set isVisible to false after submit when failed to check file info", () => {
    const error = new Error("file info error");
    jest
      .spyOn(scmService, "getFileInfo")
      .mockReturnValue(throwError(() => error));
    component.isVisible = true;
    component.submit();

    expect(component.isVisible).toBe(false);
  });

  it("should set isVisible to false after submit when failed to trigger update reference", () => {
    const error = new Error("trigger error");
    jest
      .spyOn(updateReferenceService, "trigger")
      .mockReturnValue(throwError(() => error));
    component.isVisible = true;
    component.submit();

    expect(component.isVisible).toBe(false);
  });

  it("should set user name correctly", () => {
    component.initModal();

    expect(component.userName).toBe(USER_NAME);
  });

  it("should set user mail correctly", () => {
    component.initModal();

    expect(component.userEmail).toBe(USER_MAIL);
  });

  it("should not allow submit when commit message blank", () => {
    component.commitMessageSignal.set("");

    expect(component.canSubmitSignal()).toBeFalsy();
  });

  it("should not allow submit when commit message white space", () => {
    component.commitMessageSignal.set(" ");

    expect(component.canSubmitSignal()).toBeFalsy();
  });

  describe("onNextClicked", () => {
    it("should navigate to second modal step correctly", () => {
      component.onNextClicked();

      expect(component.stepperValue()).toEqual(2);
    });

    it("should update the initially selected binary impacts to the current selection", () => {
      component.selectedBinaryImpactsSignal.set([
        getFullySelectedAnalysisObject(getFirstBinaryImpact()),
      ]);
      component.onNextClicked();
      const expectedState: AnalysisObjectSelectionState<LiteBinaryImpact>[] = [
        {
          analysisObject: getFirstBinaryImpact(),
          selectionType: AnalysisObjectSelectionType.FULL,
        },
      ];
      expect(component.initiallyLinkedBinaryImpactsState()).toEqual(
        expectedState
      );
    });

    it("should update the initially selected configuration impacts to the current selection", () => {
      component.selectedConfigurationImpactsSignal.set([
        getFullySelectedAnalysisObject(getFirstConfigurationImpact()),
      ]);
      component.onNextClicked();
      const expectedState: AnalysisObjectSelectionState<LiteConfigurationImpact>[] =
        [
          {
            analysisObject: getFirstConfigurationImpact(),
            selectionType: AnalysisObjectSelectionType.FULL,
          },
        ];
      expect(component.initiallyLinkedConfigurationImpactsState()).toEqual(
        expectedState
      );
    });
  });

  it("should navigate to first modal step correctly", () => {
    const refreshSpy = jest.spyOn(component.refresh$, "next");
    component.selectedBinaryImpactsSignal.set([]);
    component.selectedConfigurationImpactsSignal.set([]);

    component.onBackClicked();

    expect(component.stepperValue()).toEqual(1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledWith(true);
  });

  it("should close modal correctly", () => {
    component.onNextClicked();
    component.onModalClose();

    expect(component.stepperValue()).toEqual(1);
  });

  it("should init modal correctly", () => {
    const refreshSpy = jest.spyOn(component.refresh$, "next");

    component.initModal();

    expect(component.stepperValue()).toEqual(1);
    expect(component.selectedConfigurationImpactsSignal()).toEqual([]);
    expect(component.selectedBinaryImpactsSignal()).toEqual([]);
    expect(component.commitMessageSignal()).toEqual("");
    expect(component.computedCommitMessageSignal()).toEqual("");
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledWith(true);
  });

  it("should compute preview message correctly when a binary impact is linked", () => {
    component.initModal();
    component.selectedBinaryImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstBinaryImpact()),
    ]);
    component.commitMessageSignal.set("commit message");

    expect(component.computedCommitMessageSignal()).toEqual(
      `commit message -Binary Impacts: ${
        getFirstBinaryImpact().upgradeImpact?.externalIssue.id
      }`
    );
  });

  it("should compute preview message correctly when multiple binary impacts are linked", () => {
    component.initModal();
    component.selectedBinaryImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstBinaryImpact()),
      getFullySelectedAnalysisObject(getSecondBinaryImpact()),
    ]);

    component.commitMessageSignal.set("commit message");

    expect(component.computedCommitMessageSignal()).toEqual(
      `commit message -Binary Impacts: ${
        getFirstBinaryImpact().upgradeImpact?.externalIssue.id
      }, ${getSecondBinaryImpact().upgradeImpact?.externalIssue.id}`
    );
  });

  it("should trim commit message correctly", () => {
    component.initModal();
    component.selectedBinaryImpactsSignal.set([]);
    component.selectedConfigurationImpactsSignal.set([]);
    component.commitMessageSignal.set(" commit message ");

    expect(component.computedCommitMessageSignal()).toEqual("commit message");
  });

  it("should compute preview message correctly when a binary impact with null external issue is linked", () => {
    component.initModal();

    component.selectedBinaryImpactsSignal.set([
      getFullySelectedAnalysisObject({
        id: "1",
        projectId: PROJECT_ID,
        title: "title1",
        owner: "owner1",
        mxVersion: "mxVersion",
        upgradeImpact: {
          id: "upgradeImpactId1",
          externalIssue: null,
        },
      } as unknown as LiteBinaryImpact),
    ]);
    component.commitMessageSignal.set("commit message");

    expect(component.computedCommitMessageSignal()).toContain(
      getFirstBinaryImpact().title
    );
  });

  it("should compute preview message correctly when a configuration impact is linked", () => {
    component.initModal();
    component.selectedConfigurationImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstConfigurationImpact()),
    ]);
    component.commitMessageSignal.set("commit message");

    expect(component.computedCommitMessageSignal()).toEqual(
      `commit message -Configuration Impacts: ${
        getFirstConfigurationImpact().title
      }`
    );
  });

  it("should compute preview message correctly when multiple configuration impacts are linked", () => {
    component.initModal();
    component.selectedConfigurationImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstConfigurationImpact()),
      getFullySelectedAnalysisObject(getSecondConfigurationImpact()),
    ]);
    component.commitMessageSignal.set("commit message");

    expect(component.computedCommitMessageSignal()).toEqual(
      `commit message -Configuration Impacts: ${
        getFirstConfigurationImpact().title
      }, ${getSecondConfigurationImpact().title}`
    );
  });

  it("should compute preview message correctly when configuration and binary impacts are linked", () => {
    component.initModal();
    component.selectedConfigurationImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstConfigurationImpact()),
      getFullySelectedAnalysisObject(getSecondConfigurationImpact()),
    ]);
    component.selectedBinaryImpactsSignal.set([
      getFullySelectedAnalysisObject(getFirstBinaryImpact()),
      getFullySelectedAnalysisObject(getSecondBinaryImpact()),
    ]);
    component.commitMessageSignal.set("commit message");

    expect(component.computedCommitMessageSignal()).toEqual(
      `commit message -Configuration Impacts: ${
        getFirstConfigurationImpact().title
      }, ${getSecondConfigurationImpact().title} -Binary Impacts: ${
        getFirstBinaryImpact().upgradeImpact?.externalIssue.id
      }, ${getSecondBinaryImpact().upgradeImpact?.externalIssue.id}`
    );
  });

  it("should load binary impacts selection table by default upon opening the modal", () => {
    fixture.detectChanges();
    component.isVisible = true;
    fixture.detectChanges();
    expect(
      DomTestUtils.getElementByType(
        fixture,
        BinaryImpactsSelectionTableComponent
      ).getInstance()
    ).toBeTruthy();
  });

  describe("handle warning message", () => {
    it("should set the warning value correctly when it exists", () => {
      const warningMessage = "warning-message";
      component.handleWarningMessage(warningMessage);
      fixture.detectChanges();
      expect(component.warningMessage).toBe(warningMessage);
    });
  });

  describe("display warning message template test", () => {
    it("should not display the warning message template when warning message is undefined", () => {
      component.warningMessage = undefined;
      component.isVisible = true;
      fixture.detectChanges();
      const warningMessageElement = getElementByTestId("warning-message");
      expect(warningMessageElement.isRendered()).toBeFalsy();
    });

    it("should display the warning message template when warning message has a value", () => {
      const warningMessage = "warning-message";
      component.isVisible = true;
      fixture.detectChanges();
      component.warningMessage = warningMessage;
      fixture.detectChanges();
      const warningMessageElement = getElementByTestId("warning-message");
      expect(warningMessageElement.isRendered()).toBeTruthy();
      expect(warningMessageElement.getNativeElement().textContent).toContain(
        warningMessage
      );
    });

    it("should call handleWarningMessage when warningMessage changes from the selection table", () => {
      const handleWarningMessageSpy = jest.spyOn(
        component,
        "handleWarningMessage"
      );

      component.isVisible = true;
      fixture.detectChanges();

      const selectionTableComponent = DomTestUtils.getElementByType(
        fixture,
        BinaryImpactsSelectionTableComponent
      ).getInstance();
      const warningMessage = "warning-message";
      selectionTableComponent.warningMessageChange.emit(warningMessage);
      fixture.detectChanges();
      expect(handleWarningMessageSpy).toHaveBeenCalledWith(warningMessage);
    });
  });

  describe("show impactsWithoutDefects toggle tests", () => {
    it("should default show impacts with no defects signal to false", () => {
      expect(component.showImpactsWithoutDefects()).toBeFalsy();
    });
  });

  function getElementByTestId(testId: string) {
    return DomTestUtils.getElementByTestId(fixture, testId);
  }
});
