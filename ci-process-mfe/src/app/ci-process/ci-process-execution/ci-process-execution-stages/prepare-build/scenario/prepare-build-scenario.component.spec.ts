import { PrepareBuildScenarioComponent } from "./prepare-build-scenario.component";
import { ScenarioExecutionService } from "@mxflow/test-management";
import { concatMap, interval, merge, of, Subject, throwError } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { ToastMessageService } from "@mxflow/ui/alert";

describe("PrepareBuildScenarioComponent", () => {
  let component: PrepareBuildScenarioComponent;
  let scenarioExecutionService: ScenarioExecutionService;
  let toastMessageService: ToastMessageService;

  const projectId = uuidv4();
  const scenarioId = uuidv4();
  const environmentId = uuidv4();

  beforeEach(async () => {
    scenarioExecutionService = {
      getScenarioExecution: jest.fn(() => of({ environmentId: environmentId })),
    } as unknown as ScenarioExecutionService;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    component = new PrepareBuildScenarioComponent(
      scenarioExecutionService,
      toastMessageService
    );

    component.projectId = projectId;
    component.scenarioId = scenarioId;
  });

  it("should fetch scenario and set its environment id on init", () => {
    component.ngOnInit();

    expect(scenarioExecutionService.getScenarioExecution).toHaveBeenCalledWith(
      projectId,
      scenarioId
    );
    expect(component.environmentId).toBe(environmentId);
  });

  it("should disable view environment button if environment is not deployed yet", () => {
    scenarioExecutionService.getScenarioExecution = jest.fn(() =>
      of({})
    ) as unknown as ScenarioExecutionService["getScenarioExecution"];

    component.ngOnInit();

    expect(component.isViewEnvironmentDisabled).toBe(true);
  });

  it("should set isViewEnvironmentDisabled to true on error", () => {
    scenarioExecutionService.getScenarioExecution = jest.fn(() =>
      throwError(() => new Error("Error occurred"))
    ) as unknown as ScenarioExecutionService["getScenarioExecution"];

    component.ngOnInit();

    expect(component.isViewEnvironmentDisabled).toBe(true);
  });

  it("should set view environment disabled if the scenario id was undefined", () => {
    component.scenarioId = undefined;

    component.ngOnInit();

    expect(component.isViewEnvironmentDisabled).toBe(true);
  });

  it("should dispatch an error when it fails to get scenario", () => {
    scenarioExecutionService.getScenarioExecution = jest.fn(() =>
      throwError(() => new Error("Error occurred"))
    ) as unknown as ScenarioExecutionService["getScenarioExecution"];

    component.ngOnInit();

    expect(toastMessageService.showError).toHaveBeenCalledWith(
      "Error occurred"
    );
  });

  it("should unsubscribe to observables that outlive the component", () => {
    let observable = interval(100).pipe(concatMap((value) => value.toString()));
    let subject = new Subject();
    let projectIdObservable = merge(subject, observable);

    scenarioExecutionService = {
      getScenarioExecution: jest.fn().mockReturnValueOnce(projectIdObservable),
    } as unknown as ScenarioExecutionService;
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    component = new PrepareBuildScenarioComponent(
      scenarioExecutionService,
      toastMessageService
    );
    component.scenarioId = scenarioId;

    component.ngOnInit();

    expect(subject.observed).toBe(true);

    component.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });
});
