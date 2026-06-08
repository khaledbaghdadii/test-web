import { IntegrateChangesStageComponent } from "./integrate-changes-stage.component";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import { CiProcessActions } from "../../../state";
import {
  MergeConfigurationPage,
  MergeConfigurationService,
  MergeRequest,
  MergeRequestService,
} from "@mxflow/features/scm-management";
import {
  Backport,
  BuildAndTestProcessExecution,
} from "@mxflow/features/business-process";
import { Store } from "@ngrx/store";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { CiProcessExecutionService } from "../../service/ci-process-execution.service";
import { CiProcessExecutionStateUpdaterService } from "../../ci-process-execution-details/ci-process-state-updater.service";

describe("Integrate Changes Stage Test", () => {
  const PROCESS_ID = "processId";
  const PROJECT_ID = "projectId";
  const mergeJobId = "mergeJobId";
  const errorMessage = "error message";
  const destinationBranchName = "destinationBranchName";
  const backportStopRequester = "backportStopRequester";
  const DEVELOPMENT_ID = "developmentId";

  let store: any;
  let integrateChangesStageComponent: IntegrateChangesStageComponent;
  let processExecutionUpdater: any;
  let ciProcessService: any;
  let mergeRequestService: MergeRequestService;
  let projectIdResolver: ProjectIdRouteParamsResolverService;
  let mergeConfigurationService: MergeConfigurationService;

  beforeEach(() => {
    projectIdResolver = {
      resolve: jest.fn().mockReturnValue(PROJECT_ID),
    } as unknown as ProjectIdRouteParamsResolverService;
    processExecutionUpdater = {
      reloadProcessDetails: jest.fn(),
    };
    ciProcessService = {
      stopIntegrateChangesStage: jest.fn(() => of({})),
      fixIntegrationIssues: jest.fn(() => of({})),
    };

    store = {
      pipe: jest.fn().mockReturnValueOnce(of(getProcessExecution())),
      dispatch: jest.fn(),
    };

    mergeRequestService = {
      getMergeRequest: jest.fn(() => of(getMergeRequest())),
    } as unknown as MergeRequestService;

    mergeConfigurationService = {
      getFilteredMergeConfigurations: jest.fn(() => of([])),
    } as unknown as MergeConfigurationService;
  });

  function initComponent() {
    TestBed.configureTestingModule({
      declarations: [IntegrateChangesStageComponent],
      providers: [
        { provide: Store, useValue: store },
        { provide: CiProcessExecutionService, useValue: ciProcessService },
        {
          provide: CiProcessExecutionStateUpdaterService,
          useValue: processExecutionUpdater,
        },
        { provide: MergeRequestService, useValue: mergeRequestService },
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: projectIdResolver,
        },
        {
          provide: MergeConfigurationService,
          useValue: mergeConfigurationService,
        },
      ],
    }).compileComponents();
    integrateChangesStageComponent = TestBed.createComponent(
      IntegrateChangesStageComponent
    ).componentInstance;
  }

  it("should save the version of the build and test process", () => {
    initComponent();
    integrateChangesStageComponent.ngOnInit();

    expect(integrateChangesStageComponent.ciVersion).toEqual(
      getProcessExecution().ciVersion
    );
  });

  it("should set backport started to false if there are no backports initialized in the execution", () => {
    store = {
      pipe: jest.fn(() => of(getProcessExecutionsWithEmptyBackports())),
    };

    initComponent();

    integrateChangesStageComponent.ngOnInit();

    expect(integrateChangesStageComponent.backportStarted).toBeFalsy();
  });

  it("should set backport started to true is there are backports initialize in the execution", () => {
    initComponent();
    integrateChangesStageComponent.ngOnInit();

    expect(integrateChangesStageComponent.backportStarted).toBeTruthy();
  });

  it("should display the details of the configuration branch", () => {
    initComponent();
    integrateChangesStageComponent.ngOnInit();

    expect(integrateChangesStageComponent.developmentId).toStrictEqual(
      DEVELOPMENT_ID
    );
  });

  it("should set the backport decision maker", () => {
    store = {
      pipe: jest
        .fn()
        .mockReturnValueOnce(
          of(getProcessExecutionsWithBackportStopRequester())
        ),
      dispatch: jest.fn(),
    };

    initComponent();

    integrateChangesStageComponent.ngOnInit();

    expect(integrateChangesStageComponent.backportDecisionMaker).toEqual(
      backportStopRequester
    );
  });

  it("should call the store on init and set the values", () => {
    initComponent();
    integrateChangesStageComponent.ngOnInit();
    expect(store.pipe).toHaveBeenNthCalledWith(1, getCiProcessExecution);
    expect(integrateChangesStageComponent.ciProcessExecutionId).toEqual(
      getProcessExecution().id
    );
    expect(integrateChangesStageComponent.integrateChangesStage).toStrictEqual(
      getProcessExecution().integrateChangesStage
    );
    expect(integrateChangesStageComponent.projectId).toEqual(PROJECT_ID);
    expect(integrateChangesStageComponent.errorMessage).toEqual(
      getProcessExecution().integrateChangesStage.errorMessage
    );
  });

  it("should dispatch error if the store failed to fetch CI process", () => {
    initComponent();
    store.pipe = jest.fn().mockReturnValueOnce(throwError(() => errorMessage));

    integrateChangesStageComponent.ngOnInit();

    expect(store.pipe).toHaveBeenCalledWith(getCiProcessExecution);
    expect(store.dispatch).toHaveBeenCalledWith(
      CiProcessActions.updateErrorMessage({ message: errorMessage })
    );
  });

  it("should delegate to the merge request service to get the merge request and set destination branch name", () => {
    initComponent();
    integrateChangesStageComponent.ngOnInit();

    expect(mergeRequestService.getMergeRequest).toHaveBeenCalledWith(
      PROJECT_ID,
      mergeJobId
    );
    expect(
      integrateChangesStageComponent.integrateDestinationBranch
    ).toStrictEqual(destinationBranchName);
    expect(integrateChangesStageComponent.mergeRequest).toStrictEqual(
      getMergeRequest()
    );
  });

  it("should call the service correctly when fixing the integration issues", () => {
    initComponent();
    let ciProcessServiceSpy = jest.spyOn(
      ciProcessService,
      "fixIntegrationIssues"
    );

    integrateChangesStageComponent.projectId = PROJECT_ID;
    integrateChangesStageComponent.ciProcessExecutionId = PROCESS_ID;
    integrateChangesStageComponent.fixIssues();

    expect(ciProcessServiceSpy).toHaveBeenCalledWith(PROJECT_ID, PROCESS_ID);
  });

  it("should reload the process when fix integration issues is selected", () => {
    initComponent();
    let processExecutionUpdaterSpy = jest.spyOn(
      processExecutionUpdater,
      "reloadProcessDetails"
    );

    integrateChangesStageComponent.projectId = PROJECT_ID;
    integrateChangesStageComponent.ciProcessExecutionId = PROCESS_ID;
    integrateChangesStageComponent.fixIssues();

    expect(processExecutionUpdaterSpy).toHaveBeenCalledWith(
      PROCESS_ID,
      PROJECT_ID,
      1000
    );
  });

  it("should dispatch error if an error occurred when the user clicks on fix issues", () => {
    initComponent();
    const errorMessage = "An error occurred";
    jest
      .spyOn(ciProcessService, "fixIntegrationIssues")
      .mockReturnValueOnce(throwError(() => errorMessage));

    integrateChangesStageComponent.projectId = PROJECT_ID;
    integrateChangesStageComponent.ciProcessExecutionId = PROCESS_ID;
    integrateChangesStageComponent.fixIssues();

    expect(store.dispatch).toHaveBeenCalledWith(
      CiProcessActions.updateErrorMessage({ message: errorMessage })
    );
  });

  it("should unsubscribe to observables that outlive the component", () => {
    let observable2 = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    let subject = new Subject();

    let executionObservable = merge(subject, observable2);

    store = {
      pipe: jest.fn().mockReturnValueOnce(executionObservable),
    } as unknown as Store;

    initComponent();

    integrateChangesStageComponent.ngOnInit();

    expect(subject.observed).toBe(true);

    integrateChangesStageComponent.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });

  it("should return the correct backport destination branches for two merge configuration IDs", fakeAsync(() => {
    initComponent();
    jest
      .spyOn(mergeConfigurationService, "getFilteredMergeConfigurations")
      .mockReturnValueOnce(
        of({
          content: [{ id: "configId1", branchName: "branchName_configId1" }],
        } as unknown as MergeConfigurationPage)
      )
      .mockReturnValueOnce(
        of({
          content: [{ id: "configId2", branchName: "branchName_configId2" }],
        } as unknown as MergeConfigurationPage)
      );
    integrateChangesStageComponent.ngOnInit();
    tick();
    expect(integrateChangesStageComponent.backportDestinationBranches).toEqual([
      "branchName_configId1",
      "branchName_configId2",
    ]);
  }));

  function getProcessExecutionsWithEmptyBackports(): BuildAndTestProcessExecution {
    return {
      id: PROCESS_ID,
      integrateChangesStage: {
        latestMergeJobId: mergeJobId,
        errorMessage: errorMessage,
        backports: [] as Backport[],
      },
    } as BuildAndTestProcessExecution;
  }

  function getProcessExecutionsWithBackportStopRequester(): BuildAndTestProcessExecution {
    return {
      id: PROCESS_ID,
      integrateChangesStage: {
        backportStopRequester: backportStopRequester,
        latestMergeJobId: mergeJobId,
        errorMessage: errorMessage,
        backports: [
          {
            startDate: "startDate",
          },
        ],
      },
    } as BuildAndTestProcessExecution;
  }

  function getProcessExecution(): BuildAndTestProcessExecution {
    return {
      ciVersion: 2,
      id: PROCESS_ID,
      input: {
        repositoryId: "repositoryId",
      },
      createBranchStage: {
        developmentId: DEVELOPMENT_ID,
      },
      integrateChangesStage: {
        latestMergeJobId: mergeJobId,
        errorMessage: errorMessage,
        backportMergeConfigurationIds: ["configId1", "configId2"],
        backports: [
          {
            startDate: "startDate",
          },
        ],
      },
    } as BuildAndTestProcessExecution;
  }

  function getMergeRequest(): MergeRequest {
    return {
      mergeConfiguration: {
        branchName: destinationBranchName,
      },
    } as MergeRequest;
  }
});
