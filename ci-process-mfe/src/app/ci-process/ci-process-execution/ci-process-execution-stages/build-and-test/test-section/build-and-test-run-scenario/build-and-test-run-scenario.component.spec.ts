import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { of } from "rxjs";
import { CiProcessExecutionStateUpdaterService } from "../../../../ci-process-execution-details/ci-process-state-updater.service";
import { BuildAndTestRunScenarioComponent } from "./build-and-test-run-scenario.component";
import { BUILD_AND_TEST_STAGE_ID } from "@mxflow/features/business-process";
import ScenarioExecutionGroupPermissionWarningMessage from "../../model/scenario-execution-group-permission-warning-message";
import { updateErrorMessage } from "../../../../../state/ci-process.actions";
import { ScmManagementService } from "@mxflow/features/scm";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { RunScenarioDropdownComponent } from "@mxflow/test-management";
import { MockComponent } from "ng-mocks";

const MACHINE_GROUP_ID = "MACHINE_GROUP_ID";

const processId =
  "user-story-build-and-test__d7889d6b-923a-4eee-80dc-5cd6670bfc88";
const projectId = "projectId";
const mockCiExecution = {
  id: processId,
  input: {
    buildAndTestInfraGroup: MACHINE_GROUP_ID,
  },
  createBranchStage: {
    developmentId: "developmentId",
  },
  buildAndTestStage: {
    name: "Build & Test",
    status: "PENDING_INPUT",
    startDate: "2024-02-23T11:02:01.623Z",
    endDate: "",
    errorMessage: null,
    requester: null,
    scenarioExecutionGroup: "df25b8b6-e8cc-4a14-89ee-77de39d3f308",
  },
};
const errorMessage = "ERROR_MESSAGE";
const branchName = "branchName";

describe("build-and-test-run-scenario", function () {
  let store: MockStore;
  let processStateUpdater: CiProcessExecutionStateUpdaterService;
  let buildAndTestRunScenarioComponent: BuildAndTestRunScenarioComponent;
  let scmManagementService: ScmManagementService;

  let fixture: ComponentFixture<BuildAndTestRunScenarioComponent>;

  beforeEach(async () => {
    processStateUpdater = {
      reloadProcessDetails: jest.fn(),
    } as unknown as CiProcessExecutionStateUpdaterService;
    scmManagementService = {
      getDevelopment: jest.fn(() => of({ name: branchName })),
    } as unknown as ScmManagementService;

    await TestBed.configureTestingModule({
      imports: [BuildAndTestRunScenarioComponent],
      providers: [
        provideMockStore({
          initialState: {
            ciProcessExecution: {
              data: {
                ciProcessExecution: mockCiExecution,
                errorMessage: null,
              },
            },
          },
        }),
        {
          provide: CiProcessExecutionStateUpdaterService,
          useValue: processStateUpdater,
        },
        { provide: ScmManagementService, useValue: scmManagementService },
      ],
    })
      .overrideComponent(BuildAndTestRunScenarioComponent, {
        remove: { imports: [RunScenarioDropdownComponent] },
        add: { imports: [MockComponent(RunScenarioDropdownComponent)] },
      })
      .compileComponents();

    store = TestBed.inject(MockStore);

    fixture = TestBed.createComponent(BuildAndTestRunScenarioComponent);
    buildAndTestRunScenarioComponent = fixture.componentInstance;
    buildAndTestRunScenarioComponent.projectId = projectId;
  });

  test("should have isLoading initially set to true", () => {
    expect(buildAndTestRunScenarioComponent.isLoading).toBe(true);
  });

  test("should set component properties on init", () => {
    fixture.detectChanges();
    expect(buildAndTestRunScenarioComponent.processId).toBe(processId);
    expect(buildAndTestRunScenarioComponent.executionGroupId).toBe(
      mockCiExecution.buildAndTestStage.scenarioExecutionGroup
    );
    expect(buildAndTestRunScenarioComponent.machineGroupId).toBe(
      MACHINE_GROUP_ID
    );
    expect(buildAndTestRunScenarioComponent.branchName).toBe(branchName);
    expect(buildAndTestRunScenarioComponent.isLoading).toBe(false);
  });

  test("should have correct warning message map", () => {
    expect(buildAndTestRunScenarioComponent.warningMessageMap).toBe(
      ScenarioExecutionGroupPermissionWarningMessage
    );
  });

  test("should have correct subContextId", () => {
    expect(buildAndTestRunScenarioComponent.subContextId).toBe(
      BUILD_AND_TEST_STAGE_ID
    );
  });

  test("should handle scenario pushed correctly", () => {
    buildAndTestRunScenarioComponent.processId = processId;
    buildAndTestRunScenarioComponent.onScenarioPushed();
    expect(processStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      processId,
      projectId
    );
  });

  test("should handle error correctly", () => {
    const dispatchSpy = jest.spyOn(store, "dispatch");
    buildAndTestRunScenarioComponent.onError(errorMessage);
    expect(dispatchSpy).toHaveBeenCalledWith(
      updateErrorMessage({ message: errorMessage })
    );
  });

  test("should get development from scm service with correct parameters", () => {
    fixture.detectChanges();
    expect(scmManagementService.getDevelopment).toHaveBeenCalledWith(
      projectId,
      mockCiExecution.createBranchStage.developmentId
    );
  });

  test("should unsubscribe on destroy", () => {
    const nextSpy = jest.spyOn(
      buildAndTestRunScenarioComponent["destroy$"],
      "next"
    );
    const completeSpy = jest.spyOn(
      buildAndTestRunScenarioComponent["destroy$"],
      "complete"
    );

    buildAndTestRunScenarioComponent.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
