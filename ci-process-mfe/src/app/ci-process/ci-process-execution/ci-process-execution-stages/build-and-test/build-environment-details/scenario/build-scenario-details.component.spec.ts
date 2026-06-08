import { ScenarioExecutionService } from "@mxflow/test-management";
import { v4 as uuidv4 } from "uuid";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { BuildScenarioDetailsComponent } from "./build-scenario-details.component";
import { Store } from "@ngrx/store";
import { updateErrorMessage } from "../../../../../state/ci-process.actions";

describe("BuildScenarioDetailsComponent", () => {
  let component: BuildScenarioDetailsComponent;
  let store: Store;
  let scenarioExecutionService: ScenarioExecutionService;
  const environmentId = uuidv4();

  beforeEach(async () => {
    store = {
      dispatch: jest.fn(),
    } as unknown as Store;
    scenarioExecutionService = {
      getScenarioExecution: jest.fn(() => of({ environmentId: environmentId })),
    } as unknown as ScenarioExecutionService;
    component = new BuildScenarioDetailsComponent(
      store,
      scenarioExecutionService
    );
  });

  it("should set environment id on Init", () => {
    component.ngOnInit();
    expect(component.environmentId).toBe(environmentId);
  });

  it("should get scenario execution with correct parameters on Init", () => {
    const projectId = "testProjectId";
    const scenarioId = "testScenarioId";
    component.projectId = projectId;
    component.scenarioId = scenarioId;

    component.ngOnInit();

    expect(scenarioExecutionService.getScenarioExecution).toHaveBeenCalledWith(
      projectId,
      scenarioId
    );
  });

  it("should handle failure when fetching scenario execution", () => {
    const errorMessage = "Error occurred";
    scenarioExecutionService.getScenarioExecution = jest.fn(() =>
      throwError(() => errorMessage)
    ) as unknown as ScenarioExecutionService["getScenarioExecution"];
    component.ngOnInit();
    expect(store.dispatch).toHaveBeenCalledWith(
      updateErrorMessage({ message: errorMessage })
    );
  });

  it("should unsubscribe to observables that outlive the component", () => {
    let observable = interval(100).pipe(concatMap((value) => value.toString()));
    let subject = new Subject();
    let projectIdObservable = merge(subject, observable);

    scenarioExecutionService = {
      getScenarioExecution: jest.fn().mockReturnValueOnce(projectIdObservable),
    } as unknown as ScenarioExecutionService;

    component = new BuildScenarioDetailsComponent(
      store,
      scenarioExecutionService
    );

    component.ngOnInit();

    expect(subject.observed).toBe(true);

    component.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });
});
