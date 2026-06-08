import {
  concatMap,
  interval,
  merge,
  Observable,
  of,
  Subject,
  throwError,
} from "rxjs";
import { CiProcessExecutionDetailsComponent } from "./ci-process-execution-details.component";
import { CiProcessActions } from "../../state";
import { CiProcessExecutionAction } from "../state";
import { getCiProcessExecution } from "../state/ci-process-execution.selector";
import { Store } from "@ngrx/store";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
  ProjectIdRouteParamsResolverService,
  ProjectService,
} from "@mxflow/features/project";
import {
  fakeAsync,
  TestBed,
  tick,
  ComponentFixture,
} from "@angular/core/testing";
import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessExecutionMapperService,
  BuildAndTestProcessStageStatus,
} from "@mxflow/features/business-process";
import { BuildAndTestExecutionFetcherService } from "@mxevolve/domains/business-process/data-access";
import { CiProcessStageSelectorService } from "../service/ci-process-stage-selector.service";
import { DatePipe } from "@angular/common";

const CI_PROCESS_EXECUTION_ID = "ciProcessId";
const PROJECT_ID = "projectId";

describe("Build and test process execution details", () => {
  let fixture: ComponentFixture<CiProcessExecutionDetailsComponent>;
  let component: CiProcessExecutionDetailsComponent;
  let activatedRoute: ActivatedRoute;
  let router: Router;
  let ciProcessMapper: BuildAndTestProcessExecutionMapperService;
  let store: Store;
  let stageSelectorService: CiProcessStageSelectorService;
  let projectIdResolver: ProjectIdRouteParamsResolverService;
  let projectService: ProjectService;
  let domainExecutionFetcher: BuildAndTestExecutionFetcherService;

  beforeEach(() => {
    projectIdResolver = {
      resolve: jest.fn(() => PROJECT_ID),
    } as unknown as ProjectIdRouteParamsResolverService;

    activatedRoute = {
      params: of({ executionId: CI_PROCESS_EXECUTION_ID }),
    } as unknown as ActivatedRoute;

    stageSelectorService = {
      getWantedStage: jest.fn(),
    } as unknown as CiProcessStageSelectorService;

    ciProcessMapper = {
      toExecutionStages: jest.fn(),
      toStage: jest.fn(),
    } as unknown as BuildAndTestProcessExecutionMapperService;

    store = {
      dispatch: jest.fn(),
      pipe: jest.fn(),
      select: jest.fn().mockReturnValue(of({ name: "Mock Project" })),
    } as unknown as Store;

    router = {
      navigate: jest.fn(),
    } as unknown as Router;

    projectService = {
      getProjectById: jest.fn().mockReturnValue(of({ name: "Mock Project" })),
    } as unknown as ProjectService;

    domainExecutionFetcher = {
      fetchExecution: jest.fn().mockReturnValue(of({})),
    } as unknown as BuildAndTestExecutionFetcherService;

    TestBed.configureTestingModule({
      declarations: [CiProcessExecutionDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: Router, useValue: router },
        { provide: Store, useValue: store },
        {
          provide: BuildAndTestProcessExecutionMapperService,
          useValue: ciProcessMapper,
        },
        {
          provide: CiProcessStageSelectorService,
          useValue: stageSelectorService,
        },
        {
          provide: ProjectIdRouteParamsResolverService,
          useValue: projectIdResolver,
        },
        {
          provide: BuildAndTestExecutionFetcherService,
          useValue: domainExecutionFetcher,
        },
      ],
    }).overrideComponent(CiProcessExecutionDetailsComponent, {
      set: {
        providers: [
          { provide: ProjectService, useValue: projectService },
          DatePipe,
        ],
      },
    });

    fixture = TestBed.createComponent(CiProcessExecutionDetailsComponent);
    component = fixture.componentInstance;
  });

  it("should fetch the ci process execution on init", () => {
    component.ngOnInit();

    expect(store.pipe).toHaveBeenCalledWith(getCiProcessExecution);
  });

  it("should throw error if failed to fetch execution", () => {
    let error = "error";
    jest.spyOn(store, "pipe").mockReturnValueOnce(throwError(() => error));

    component.ngOnInit();

    expect(store.dispatch).toHaveBeenCalledWith(
      CiProcessActions.updateErrorMessage({ message: error })
    );
  });

  it("should reload CI process execution correctly", () => {
    component.ngOnInit();
    component.refetchExecution();

    expect(store.dispatch).toHaveBeenCalledWith(
      CiProcessExecutionAction.getCiProcessExecution({
        id: CI_PROCESS_EXECUTION_ID,
        projectId: PROJECT_ID,
      })
    );
  });

  it("given a process with no stage that was started, when displaying the process details, then the user should be alerted", fakeAsync(() => {
    store.pipe = jest.fn().mockReturnValue(
      of({
        id: CI_PROCESS_EXECUTION_ID,
        input: { buildEnvironment: { skipEnvironmentDeployment: false } },
        createBranchStage: { startDate: null },
        prepareBuildStage: { startDate: null },
        buildAndTestStage: { startDate: null },
        integrateChangesStage: { startDate: null },
      } as unknown as BuildAndTestProcessExecution)
    );

    component.ngOnInit();

    tick();

    expect(component.notStarted).toBeTruthy();
  }));

  it("given a process with at least one stage that was started, when displaying the process details, then the user should not be alerted", fakeAsync(() => {
    store.pipe = jest.fn().mockReturnValue(
      of({
        id: CI_PROCESS_EXECUTION_ID,
        input: { buildEnvironment: { skipEnvironmentDeployment: false } },
        createBranchStage: { startDate: "2025-10-06T12:41:44.410455491Z" },
        prepareBuildStage: { startDate: null },
        buildAndTestStage: { startDate: null },
        integrateChangesStage: { startDate: null },
      } as unknown as BuildAndTestProcessExecution)
    );

    component.ngOnInit();

    tick();

    expect(component.notStarted).toBeFalsy();
  }));

  it("should unsubscribe to observables that outlive the component", () => {
    let observable1 = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    let observable2 = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    let subject = new Subject();

    let executionObservable = merge(subject, observable1);
    let executionIdObservable = merge(subject, observable2);

    jest.spyOn(store, "pipe").mockReturnValue(executionObservable);
    component.activatedRoute.params =
      executionIdObservable as unknown as Observable<Params>;

    component.ngOnInit();

    expect(subject.observed).toBe(true);

    component.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });

  describe("run stepper", () => {
    function executionWithStages(
      skipEnvironmentDeployment = false
    ): BuildAndTestProcessExecution {
      return {
        id: CI_PROCESS_EXECUTION_ID,
        name: "CI Run",
        input: { buildEnvironment: { skipEnvironmentDeployment } },
        createBranchStage: {
          name: "Create Branch Stage",
          route: "create-branch",
          status: BuildAndTestProcessStageStatus.PASSED,
        },
        prepareBuildStage: {
          name: "Prepare Build Stage",
          route: "prepare-build",
          status: BuildAndTestProcessStageStatus.PASSED,
        },
        buildAndTestStage: {
          name: "Build And Test Stage",
          route: "build-and-test",
          status: BuildAndTestProcessStageStatus.RUNNING,
        },
        integrateChangesStage: {
          name: "Integrate Changes Stage",
          route: "integrate-changes",
          status: BuildAndTestProcessStageStatus.NOT_STARTED,
        },
      } as unknown as BuildAndTestProcessExecution;
    }

    it("builds one step per stage keyed by route with mapped statuses", fakeAsync(() => {
      store.pipe = jest
        .fn()
        .mockReturnValue(of(executionWithStages()));

      component.ngOnInit();
      tick();

      expect(component.steps).toEqual([
        expect.objectContaining({
          id: "create-branch",
          title: "Create Branch",
          status: "completed",
        }),
        expect.objectContaining({
          id: "prepare-build",
          title: "Prepare Setup",
          status: "completed",
        }),
        expect.objectContaining({
          id: "build-and-test",
          title: "Build & Test",
          status: "active",
        }),
        expect.objectContaining({
          id: "integrate-changes",
          title: "Merge",
          status: "inactive",
        }),
      ]);
    }));

    it("marks the prepare-build step skipped when environment deployment is skipped", fakeAsync(() => {
      store.pipe = jest
        .fn()
        .mockReturnValue(of(executionWithStages(true)));

      component.ngOnInit();
      tick();

      expect(component.steps[1]).toEqual(
        expect.objectContaining({ id: "prepare-build", status: "skipped" })
      );
    }));

    it("navigates to the selected step route and tracks the selected step", fakeAsync(() => {
      store.pipe = jest
        .fn()
        .mockReturnValue(of(executionWithStages()));

      component.ngOnInit();
      tick();

      component.onStepSelected("build-and-test");

      expect(router.navigate).toHaveBeenCalledWith(
        ["build-and-test"],
        expect.objectContaining({ replaceUrl: true })
      );
      expect(component.selectedStepId).toBe("build-and-test");
    }));

    it("does not navigate when the selected step has not started", fakeAsync(() => {
      store.pipe = jest
        .fn()
        .mockReturnValue(of(executionWithStages()));

      component.ngOnInit();
      tick();
      (router.navigate as jest.Mock).mockClear();

      component.onStepSelected("integrate-changes");

      expect(router.navigate).not.toHaveBeenCalled();
    }));

    it("does not navigate when the selected step id is undefined", fakeAsync(() => {
      store.pipe = jest
        .fn()
        .mockReturnValue(of(executionWithStages()));

      component.ngOnInit();
      tick();
      (router.navigate as jest.Mock).mockClear();

      component.onStepSelected(undefined);

      expect(router.navigate).not.toHaveBeenCalled();
    }));
  });
});
