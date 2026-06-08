import { concatMap, interval, merge, of, Subject } from "rxjs";
import { AggregatedScenarioExecutionsTableComponent } from "./aggregated-scenario-executions-table.component";
import { ViewContainerRef } from "@angular/core";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";
import { environment } from "../../../../../environments/environment";
import { Store } from "@ngrx/store";
import { updateErrorMessage } from "../../../state/ci-process.actions";
import { CiProcessExecutionStateUpdaterService } from "../../ci-process-execution-details/ci-process-state-updater.service";
import { v4 as uuidv4 } from "uuid";

describe("AggregatedScenarioExecutionsTableComponent", () => {
  let component: AggregatedScenarioExecutionsTableComponent;
  let viewContainerRef: ViewContainerRef;
  let injectorService: RemoteComponentInjectorService;
  let scenariosTableComponent: any;
  let store: Store;
  let processStateUpdater: CiProcessExecutionStateUpdaterService;

  beforeEach(() => {
    viewContainerRef = {} as unknown as ViewContainerRef;
    scenariosTableComponent = {
      initialize: jest.fn(),
      errorEventEmitter: new Subject<string>(),
      scenarioRepushed: new Subject(),
    };
    injectorService = {
      loadComponent: jest.fn(() => of(scenariosTableComponent)),
    } as unknown as RemoteComponentInjectorService;

    store = {
      dispatch: jest.fn(),
    } as unknown as Store;

    processStateUpdater = {
      reloadProcessDetails: jest.fn(),
    } as unknown as CiProcessExecutionStateUpdaterService;

    component = new AggregatedScenarioExecutionsTableComponent(
      store,
      viewContainerRef,
      injectorService,
      processStateUpdater
    );
  });

  it("should load the scenarios table component from the test mfe", () => {
    component.ngOnInit();

    expect(injectorService.loadComponent).toHaveBeenCalledWith({
      mfeUrl: environment.testMfeUrl,
      componentExposedPath: "./ScenarioExecutionsTable",
      moduleName: "ScenarioExecutionsTableComponentModule",
      componentName: "ScenarioExecutionsTableComponent",
      placeHolderComponent: viewContainerRef,
    });
  });

  it("should initialize the scenarios table with correct parameters", () => {
    component.processId = "testProcessId";
    component.subContextId = "testSubContextId";
    component.isUserInterventionDisabled = false;

    component.ngOnInit();

    expect(scenariosTableComponent.initialize).toHaveBeenCalledWith({
      contextId: "testProcessId",
      subContextId: "testSubContextId",
      showRepush: true,
      showBulkRepush: false,
    });
  });

  it("should should initialize the scenarios table with show bulk repush as disabled", () => {
    component.processId = uuidv4();
    component.subContextId = uuidv4();
    component.isUserInterventionDisabled = true;

    component.ngOnInit();

    expect(scenariosTableComponent.initialize).toHaveBeenCalledWith({
      contextId: component.processId,
      subContextId: component.subContextId,
      showRepush: !component.isUserInterventionDisabled,
      showBulkRepush: false,
    });
  });

  it("should dispatch any errors coming from the scenario component", () => {
    component.ngOnInit();
    scenariosTableComponent.errorEventEmitter.next("error message");

    expect(store.dispatch).toHaveBeenCalledWith(
      updateErrorMessage({ message: "error message" })
    );
  });

  it("should handle re-pushes when event is dispatched from scenario component", () => {
    const processId = uuidv4();
    component.processId = processId;
    const projectId = uuidv4();
    component.projectId = projectId;

    component.ngOnInit();
    scenariosTableComponent.scenarioRepushed.next();

    expect(processStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      processId,
      projectId
    );
  });

  it("should unsubscribe to observables that outlive the component", () => {
    let observable1 = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    let observable2 = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    let subject = new Subject();

    let firstObservable = merge(subject, observable2);
    let secondObservable = merge(subject, observable1);

    injectorService = {
      loadComponent: jest
        .fn()
        .mockReturnValueOnce(firstObservable)
        .mockReturnValueOnce(secondObservable),
    } as unknown as RemoteComponentInjectorService;

    component = new AggregatedScenarioExecutionsTableComponent(
      store,
      viewContainerRef,
      injectorService,
      processStateUpdater
    );

    component.ngOnInit();

    expect(subject.observed).toBe(true);

    component.ngOnDestroy();

    expect(subject.observed).toBe(false);
  });
});
