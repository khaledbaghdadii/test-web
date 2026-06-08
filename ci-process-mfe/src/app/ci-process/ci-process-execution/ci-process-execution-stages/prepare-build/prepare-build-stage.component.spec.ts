import { PrepareBuildStageComponent } from "./prepare-build-stage.component";
import { Store } from "@ngrx/store";
import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessPrepareBuildStage,
  BuildAndTestProcessStageStatus,
} from "@mxflow/features/business-process";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { CiProcessActions } from "../../../state";
import fn = jest.fn;
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

const PROJECT_ID = "projectId";
const PROCESS_ID = "processId";
const REQUESTER = "requester";

describe("Prepare Build Environment Stage", () => {
  let store: Store;

  let component: PrepareBuildStageComponent;
  let projectIdResolver: ProjectIdRouteParamsResolverService;

  beforeEach(() => {
    store = {
      pipe: fn(() => of({})),
      dispatch: fn(),
    } as unknown as Store;

    projectIdResolver = {
      resolve: jest.fn(),
    } as unknown as ProjectIdRouteParamsResolverService;

    component = new PrepareBuildStageComponent(store, projectIdResolver);
  });

  describe("onInit", () => {
    describe("should initialize prepare build stage", () => {
      it("with correct requester field", () => {
        store.pipe = jest.fn(() =>
          of({
            prepareBuildStage: {
              requester: REQUESTER,
            } as unknown as BuildAndTestProcessPrepareBuildStage,
          } as unknown as BuildAndTestProcessExecution)
        );
        component.ngOnInit();
        expect(component.prepareBuildStage.requester).toStrictEqual(REQUESTER);
      });

      it("with correct latest scenario execution id", () => {
        const latestScenarioExecutionId = "scenarioExecutionId";
        store.pipe = jest.fn(() =>
          of({
            prepareBuildStage: {
              latestScenarioExecutionId: latestScenarioExecutionId,
            } as unknown as BuildAndTestProcessPrepareBuildStage,
          } as unknown as BuildAndTestProcessExecution)
        );
        component.ngOnInit();
        expect(
          component.prepareBuildStage.latestScenarioExecutionId
        ).toStrictEqual(latestScenarioExecutionId);
      });
    });

    it("should initialize ci process execution id", () => {
      store.pipe = jest.fn(() =>
        of({
          id: PROCESS_ID,
          prepareBuildStage:
            {} as unknown as BuildAndTestProcessPrepareBuildStage,
        } as unknown as BuildAndTestProcessExecution)
      );
      component.ngOnInit();
      expect(component.ciProcessExecutionId).toStrictEqual(PROCESS_ID);
    });

    it("should set stage to skipped if prepare build stage status is skipped", () => {
      store.pipe = jest.fn(() =>
        of({
          prepareBuildStage: {
            status: BuildAndTestProcessStageStatus.SKIPPED,
          } as unknown as BuildAndTestProcessPrepareBuildStage,
        } as unknown as BuildAndTestProcessExecution)
      );
      component.ngOnInit();
      expect(component.isStageSkipped).toStrictEqual(true);
    });

    it("should not disable user intervention if prepare build stage status is pending input", () => {
      store.pipe = jest.fn(() =>
        of({
          prepareBuildStage: {
            status: BuildAndTestProcessStageStatus.PENDING_INPUT,
          } as unknown as BuildAndTestProcessPrepareBuildStage,
        } as unknown as BuildAndTestProcessExecution)
      );
      component.ngOnInit();
      expect(component.isUserInterventionDisabled).toStrictEqual(false);
    });

    it("should disable user intervention if prepare build stage status is not pending input", () => {
      store.pipe = jest.fn(() =>
        of({
          prepareBuildStage: {
            status: BuildAndTestProcessStageStatus.PASSED,
          } as unknown as BuildAndTestProcessPrepareBuildStage,
        } as unknown as BuildAndTestProcessExecution)
      );
      component.ngOnInit();
      expect(component.isUserInterventionDisabled).toStrictEqual(true);
    });

    it("should show decision only if prepare build stage status is stopped", () => {
      store.pipe = jest.fn(() =>
        of({
          prepareBuildStage: {
            status: BuildAndTestProcessStageStatus.STOPPED,
          } as unknown as BuildAndTestProcessPrepareBuildStage,
        } as unknown as BuildAndTestProcessExecution)
      );
      component.ngOnInit();
      expect(component.showDecision).toStrictEqual(true);
    });

    it("should initialize action requester field", () => {
      store.pipe = jest.fn(() =>
        of({
          prepareBuildStage: {
            requester: REQUESTER,
          } as unknown as BuildAndTestProcessPrepareBuildStage,
        } as unknown as BuildAndTestProcessExecution)
      );
      component.ngOnInit();
      expect(component.actionRequester).toStrictEqual(REQUESTER);
    });

    it("should initialize project id", () => {
      jest.spyOn(projectIdResolver, "resolve").mockReturnValue(PROJECT_ID);
      component.ngOnInit();
      expect(component.projectId).toStrictEqual(PROJECT_ID);
    });

    it("should handle error correctly", () => {
      const errorMessage = "error";
      store.pipe = jest.fn(() => throwError(() => errorMessage));
      component.ngOnInit();
      expect(store.dispatch).toHaveBeenCalledWith(
        CiProcessActions.updateErrorMessage({ message: errorMessage })
      );
    });
  });

  it("should unsubscribe to observables that outlive the component", () => {
    const observable2 = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    const subject = new Subject();

    const executionObservable = merge(subject, observable2);

    store = {
      pipe: jest.fn().mockReturnValueOnce(executionObservable),
    } as unknown as Store;

    component = new PrepareBuildStageComponent(store, projectIdResolver);

    component.ngOnInit();

    expect(subject.observed).toBe(true);

    component.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });
});
