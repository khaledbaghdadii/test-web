import { BuildAndTestStageComponent } from "./build-and-test-stage.component";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import { CiProcessActions } from "../../../state";
import { Store } from "@ngrx/store";
import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessPrepareBuildStage,
  BuildAndTestProcessStageStatus,
} from "@mxflow/features/business-process";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { v4 as uuid } from "uuid";
import { TestBed } from "@angular/core/testing";
import { CiProcessExecutionStateUpdaterService } from "../../ci-process-execution-details/ci-process-state-updater.service";
import {
  MergeRequest,
  MergeRequestService,
} from "@mxflow/features/scm-management";

describe("build and test stage component test", () => {
  const PROCESS_ID = "processId";
  const PROJECT_ID = "projectId";
  const ERROR_MESSAGE = "errorMessage";
  const REQUESTER = "requester";
  const LATEST_SCENARIO_EXECUTION_ID = "latestScenarioExecutionId";
  const BUILD_AND_TEST_STATUS = "RUNNING";
  const DEVELOPMENT_ID = "developmentId";
  const INFRA_GROUP = "buildAndTestInfraGroup";
  const TECHNICAL_RESEED_EXECUTION_GROUP_ID = "technicalReseedExecutionGroupId";
  const MERGE_JOB_ID = "mergeJobId";
  const MERGE_REQUEST: MergeRequest = {
    id: MERGE_JOB_ID,
    title: "Merge Request Title",
    isReOpenable: true,
  } as unknown as MergeRequest;

  let store: Store;
  let buildAndTestStageComponent: BuildAndTestStageComponent;
  let projectIdResolver: ProjectIdRouteParamsResolverService;
  let ciProcessStateUpdater: CiProcessExecutionStateUpdaterService;
  let mergeRequestService: jest.Mocked<Partial<MergeRequestService>>;

  beforeEach(() => {
    store = {
      pipe: jest.fn(() => of(getProcessExecution())),
      dispatch: jest.fn(),
    } as unknown as Store;

    projectIdResolver = {
      resolve: jest.fn(() => PROJECT_ID),
    } as unknown as ProjectIdRouteParamsResolverService;

    ciProcessStateUpdater = {
      reloadProcessDetails: jest.fn(() => of({})),
    } as unknown as CiProcessExecutionStateUpdaterService;

    mergeRequestService = {
      getMergeRequest: jest.fn(() => of(MERGE_REQUEST)),
    };
  });

  function setupTestBed(customStore?: Store): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: customStore || store },
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: projectIdResolver,
        },
        {
          provide: CiProcessExecutionStateUpdaterService,
          useValue: ciProcessStateUpdater,
        },
        {
          provide: MergeRequestService,
          useValue: mergeRequestService,
        },
      ],
    });
  }

  function createComponent(): BuildAndTestStageComponent {
    return TestBed.runInInjectionContext(
      () => new BuildAndTestStageComponent()
    );
  }

  it("should call the store on init and set the values", () => {
    setupTestBed();
    buildAndTestStageComponent = createComponent();
    buildAndTestStageComponent.ngOnInit();

    expect(store.pipe).toHaveBeenCalledWith(getCiProcessExecution);
    expect(buildAndTestStageComponent.ciProcessExecutionId).toEqual(
      getProcessExecution().id
    );
    expect(buildAndTestStageComponent.buildAndTestStage).toStrictEqual(
      getProcessExecution().buildAndTestStage
    );
    expect(buildAndTestStageComponent.errorMessage).toEqual(
      getProcessExecution().buildAndTestStage.errorMessage
    );
  });

  it("should dispatch error if the store failed to fetch CI process", () => {
    store = {
      pipe: jest.fn(() => throwError(() => ERROR_MESSAGE)),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();

    expect(store.pipe).toHaveBeenCalledWith(getCiProcessExecution);
    expect(store.dispatch).toHaveBeenCalledWith(
      CiProcessActions.updateErrorMessage({ message: ERROR_MESSAGE })
    );
  });

  it("should show the environment details section if the build environment deployment is not skipped", () => {
    store = {
      pipe: jest.fn(() => of(getProcessExecution())),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();
    expect(buildAndTestStageComponent.showEnvironmentDetails).toBe(true);
  });

  it("should hide the environment details section if the build environment deployment is skipped", () => {
    store = {
      pipe: jest.fn(() => of(getProcessExecutionWithBuildEnvironmentSkipped())),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();
    expect(buildAndTestStageComponent.showEnvironmentDetails).toBe(false);
  });

  it("should show the technical reseed details section if technical reseed execution group exists", () => {
    store = {
      pipe: jest.fn(() => of(getProcessExecutionWithTechnicalReseedEnabled())),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();
    expect(buildAndTestStageComponent.showTechnicalReseedDetails).toBe(true);
    expect(buildAndTestStageComponent.infraGroup).toBe(
      "buildAndTestInfraGroup"
    );
    expect(buildAndTestStageComponent.technicalReseedExecutionGroupId).toBe(
      "technicalReseedExecutionGroupId"
    );
  });

  it("should hide the technical reseed details section if technical reseed execution group does not exist", () => {
    store = {
      pipe: jest.fn(() => of(getProcessExecution())),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();
    expect(buildAndTestStageComponent.showTechnicalReseedDetails).toBe(false);
  });

  it("should initialize project id field on init", () => {
    const projectId = uuid();
    jest.spyOn(projectIdResolver, "resolve").mockReturnValue(projectId);

    setupTestBed();
    buildAndTestStageComponent = createComponent();
    buildAndTestStageComponent.ngOnInit();
    expect(buildAndTestStageComponent.projectId).toBe(projectId);
  });

  it("should initialize prepare build stage field on init", () => {
    store = {
      pipe: jest.fn(() => of(getProcessExecution())),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();
    expect(buildAndTestStageComponent.prepareBuildStage).toStrictEqual(
      getProcessExecution().prepareBuildStage
    );
  });

  it("should display the branch details of the configuration branch", () => {
    store = {
      pipe: jest.fn(() => of(getProcessExecution())),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();
    expect(buildAndTestStageComponent.developmentId).toStrictEqual(
      DEVELOPMENT_ID
    );
  });

  describe("user intervention", () => {
    it("should be disabled if status is passed", () => {
      const processExecution = getProcessExecution();
      processExecution.buildAndTestStage.status =
        BuildAndTestProcessStageStatus.PASSED;
      store = {
        pipe: jest.fn(() => of(processExecution)),
        dispatch: jest.fn(),
      } as unknown as Store;

      setupTestBed(store);
      buildAndTestStageComponent = createComponent();

      buildAndTestStageComponent.ngOnInit();
      expect(buildAndTestStageComponent.isUserInterventionDisabled).toBe(true);
    });

    it("should be disabled if status is failed", () => {
      const processExecution = getProcessExecution();
      processExecution.buildAndTestStage.status =
        BuildAndTestProcessStageStatus.FAILED;
      store = {
        pipe: jest.fn(() => of(processExecution)),
        dispatch: jest.fn(),
      } as unknown as Store;

      setupTestBed(store);
      buildAndTestStageComponent = createComponent();

      buildAndTestStageComponent.ngOnInit();
      expect(buildAndTestStageComponent.isUserInterventionDisabled).toBe(true);
    });

    it("should be disabled if status is stopped", () => {
      const processExecution = getProcessExecution();
      processExecution.buildAndTestStage.status =
        BuildAndTestProcessStageStatus.STOPPED;
      store = {
        pipe: jest.fn(() => of(processExecution)),
        dispatch: jest.fn(),
      } as unknown as Store;

      setupTestBed(store);
      buildAndTestStageComponent = createComponent();

      buildAndTestStageComponent.ngOnInit();
      expect(buildAndTestStageComponent.isUserInterventionDisabled).toBe(true);
    });

    it("should be disabled if status is not started", () => {
      const processExecution = getProcessExecution();
      processExecution.buildAndTestStage.status =
        BuildAndTestProcessStageStatus.NOT_STARTED;
      store = {
        pipe: jest.fn(() => of(processExecution)),
        dispatch: jest.fn(),
      } as unknown as Store;

      setupTestBed(store);
      buildAndTestStageComponent = createComponent();

      buildAndTestStageComponent.ngOnInit();
      expect(buildAndTestStageComponent.isUserInterventionDisabled).toBe(true);
    });

    it("should be disabled if status is NA", () => {
      const processExecution = getProcessExecution();
      processExecution.buildAndTestStage.status =
        BuildAndTestProcessStageStatus.NA;
      store = {
        pipe: jest.fn(() => of(processExecution)),
        dispatch: jest.fn(),
      } as unknown as Store;

      setupTestBed(store);
      buildAndTestStageComponent = createComponent();

      buildAndTestStageComponent.ngOnInit();
      expect(buildAndTestStageComponent.isUserInterventionDisabled).toBe(true);
    });

    it("should be disabled if status is skipped", () => {
      const processExecution = getProcessExecution();
      processExecution.buildAndTestStage.status =
        BuildAndTestProcessStageStatus.SKIPPED;
      store = {
        pipe: jest.fn(() => of(processExecution)),
        dispatch: jest.fn(),
      } as unknown as Store;

      setupTestBed(store);
      buildAndTestStageComponent = createComponent();

      buildAndTestStageComponent.ngOnInit();
      expect(buildAndTestStageComponent.isUserInterventionDisabled).toBe(true);
    });

    it("should be enabled if status is running", () => {
      const processExecution = getProcessExecution();
      processExecution.buildAndTestStage.status =
        BuildAndTestProcessStageStatus.RUNNING;
      store = {
        pipe: jest.fn(() => of(processExecution)),
        dispatch: jest.fn(),
      } as unknown as Store;

      setupTestBed(store);
      buildAndTestStageComponent = createComponent();

      buildAndTestStageComponent.ngOnInit();
      expect(buildAndTestStageComponent.isUserInterventionDisabled).toBe(false);
    });

    it("should be enabled if status is pending input", () => {
      const processExecution = getProcessExecution();
      processExecution.buildAndTestStage.status =
        BuildAndTestProcessStageStatus.PENDING_INPUT;
      store = {
        pipe: jest.fn(() => of(processExecution)),
        dispatch: jest.fn(),
      } as unknown as Store;

      setupTestBed(store);
      buildAndTestStageComponent = createComponent();

      buildAndTestStageComponent.ngOnInit();
      expect(buildAndTestStageComponent.isUserInterventionDisabled).toBe(false);
    });
  });

  it("should show info banner prompting user to refresh when stage is not ready yet", () => {
    const processExecution = {
      ...getProcessExecution(),
      buildAndTestStage: {
        readyForBuildAndTest: false,
      },
    };

    store = {
      pipe: jest.fn(() => of(processExecution)),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();

    expect(buildAndTestStageComponent.readyForBuildAndTest).toBe(false);
  });

  it("should not show info banner when stage is ready", () => {
    const processExecution = {
      ...getProcessExecution(),
      buildAndTestStage: {
        readyForBuildAndTest: true,
      },
    };

    store = {
      pipe: jest.fn(() => of(processExecution)),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();

    expect(buildAndTestStageComponent.readyForBuildAndTest).toBe(true);
  });

  it("should unsubscribe to observables that outlive the component", () => {
    const observable = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    const subject = new Subject();

    const executionObservable = merge(subject, observable);

    store = {
      pipe: jest.fn(() => executionObservable),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();

    expect(subject.observed).toBe(true);

    buildAndTestStageComponent.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });

  it("should refresh the page to show the most recent view when a technical reseed is launched", () => {
    setupTestBed();
    buildAndTestStageComponent = createComponent();
    buildAndTestStageComponent.ngOnInit();

    buildAndTestStageComponent.refreshPage();

    expect(ciProcessStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      PROCESS_ID,
      buildAndTestStageComponent.projectId
    );
  });

  it("given a the user previously created a merge request when opening the build and test stage then the merge request is fetched and saved", () => {
    setupTestBed();
    buildAndTestStageComponent = createComponent();

    buildAndTestStageComponent.ngOnInit();

    expect(mergeRequestService.getMergeRequest).toHaveBeenCalledWith(
      PROJECT_ID,
      MERGE_JOB_ID
    );
    expect(buildAndTestStageComponent.mergeRequestDetails).toEqual(
      MERGE_REQUEST
    );
  });

  it("given the user have not previously created a merge request when opening the build and test stage then no merge request is fetched", () => {
    store = {
      pipe: jest.fn(() => of(getProcessExecutionWithoutMergeJobId())),
      dispatch: jest.fn(),
    } as unknown as Store;

    setupTestBed(store);
    buildAndTestStageComponent = createComponent();
    buildAndTestStageComponent.ngOnInit();

    expect(mergeRequestService.getMergeRequest).not.toHaveBeenCalled();
    expect(buildAndTestStageComponent.mergeRequestDetails).toBeNull();
  });

  it("given the merge request fetch fails when the process loads then it should be handled", () => {
    mergeRequestService.getMergeRequest = jest.fn(() =>
      throwError(() => new Error("fetch error"))
    );

    setupTestBed();
    buildAndTestStageComponent = createComponent();
    buildAndTestStageComponent.ngOnInit();

    expect(buildAndTestStageComponent.mergeRequestDetails).toBeNull();
  });

  function getProcessExecution(): BuildAndTestProcessExecution {
    return {
      id: PROCESS_ID,
      input: {
        buildEnvironment: {
          skipEnvironmentDeployment: false,
        },
      },
      createBranchStage: {
        developmentId: DEVELOPMENT_ID,
      },
      prepareBuildStage: getPrepareBuildStage(),
      buildAndTestStage: {
        requester: REQUESTER,
        errorMessage: ERROR_MESSAGE,
        status: BUILD_AND_TEST_STATUS,
        readyForBuildAndTest: true,
      },
      integrateChangesStage: {
        latestMergeJobId: MERGE_JOB_ID,
      },
    } as BuildAndTestProcessExecution;
  }

  function getProcessExecutionWithoutMergeJobId(): BuildAndTestProcessExecution {
    return {
      ...getProcessExecution(),
      integrateChangesStage: {
        latestMergeJobId: undefined,
      },
    } as unknown as BuildAndTestProcessExecution;
  }

  function getProcessExecutionWithTechnicalReseedEnabled(): BuildAndTestProcessExecution {
    return {
      id: PROCESS_ID,
      input: {
        buildEnvironment: {
          skipEnvironmentDeployment: false,
        },
        buildAndTestInfraGroup: INFRA_GROUP,
      },
      createBranchStage: {
        developmentId: DEVELOPMENT_ID,
      },
      prepareBuildStage: getPrepareBuildStage(),
      buildAndTestStage: {
        requester: REQUESTER,
        errorMessage: ERROR_MESSAGE,
        status: BUILD_AND_TEST_STATUS,
        technicalReseedExecutionGroupId: TECHNICAL_RESEED_EXECUTION_GROUP_ID,
      },
      integrateChangesStage: {
        latestMergeJobId: MERGE_JOB_ID,
      },
    } as BuildAndTestProcessExecution;
  }

  function getProcessExecutionWithBuildEnvironmentSkipped(): BuildAndTestProcessExecution {
    return {
      projectId: PROJECT_ID,
      id: PROCESS_ID,
      input: {
        buildEnvironment: {
          skipEnvironmentDeployment: true,
        },
      },
      createBranchStage: {
        developmentId: DEVELOPMENT_ID,
      },
      prepareBuildStage: getPrepareBuildStage(),
      buildAndTestStage: {
        requester: REQUESTER,
        errorMessage: ERROR_MESSAGE,
        status: BUILD_AND_TEST_STATUS,
        readyForBuildAndTest: true,
      },
      integrateChangesStage: {
        latestMergeJobId: MERGE_JOB_ID,
      },
    } as BuildAndTestProcessExecution;
  }

  function getPrepareBuildStage(): BuildAndTestProcessPrepareBuildStage {
    return {
      requester: REQUESTER,
      latestScenarioExecutionId: LATEST_SCENARIO_EXECUTION_ID,
    } as BuildAndTestProcessPrepareBuildStage;
  }
});
