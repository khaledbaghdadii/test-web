import { Store } from "@ngrx/store";
import { ViewContainerRef } from "@angular/core";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";
import { CiProcessExecutionStateUpdaterService } from "../../../../ci-process-execution-details/ci-process-state-updater.service";
import { BuildAndTestScenarioExecutionsComponent } from "./build-and-test-scenario-executions.component";
import { of, Subject } from "rxjs";
import {
  BuildAndTestProcessBuildAndTestStage,
  BuildAndTestProcessExecution,
} from "@mxflow/features/business-process";
import { environment } from "../../../../../../../environments/environment";
import { updateErrorMessage } from "../../../../../state/ci-process.actions";
import ScenarioExecutionGroupPermissionWarningMessage from "../../model/scenario-execution-group-permission-warning-message";

const projectId = "projectId";
const id = "processId";
const scenarioExecutionGroup = "scenarioExecutionGroupId";

const process: BuildAndTestProcessExecution = {
  id: id,
  buildAndTestStage: {
    scenarioExecutionGroup: scenarioExecutionGroup,
  } as unknown as BuildAndTestProcessBuildAndTestStage,
} as unknown as BuildAndTestProcessExecution;

describe("build and test scenario executions table", () => {
  let store: Store;
  let viewContainerRef: ViewContainerRef;
  let scenariosTableComponent: any;
  let injectorService: RemoteComponentInjectorService;
  let processStateUpdater: CiProcessExecutionStateUpdaterService;
  let component: BuildAndTestScenarioExecutionsComponent;

  beforeEach(() => {
    store = {
      pipe: jest.fn(() => of(process)),
      dispatch: jest.fn(),
    } as unknown as Store;

    viewContainerRef = {} as unknown as ViewContainerRef;
    scenariosTableComponent = {
      errorEventEmitter: new Subject<string>(),
      scenarioRepushed: new Subject(),
      initialize: jest.fn(),
    };
    injectorService = {
      loadComponent: jest.fn(() => of(scenariosTableComponent)),
    } as unknown as RemoteComponentInjectorService;

    processStateUpdater = {
      reloadProcessDetails: jest.fn(),
    } as unknown as CiProcessExecutionStateUpdaterService;

    component = new BuildAndTestScenarioExecutionsComponent(
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

  it("should initialize the scenario table with correct request", () => {
    component.ngOnInit();

    expect(scenariosTableComponent.initialize).toHaveBeenCalledWith({
      contextId: id,
      subContextId: "BUILD_AND_TEST",
      showBulkRepush: false,
      executionGroupId: scenarioExecutionGroup,
      warningMessageMap: ScenarioExecutionGroupPermissionWarningMessage,
      enableKeepServices: true,
    });
  });

  it("should dispatch any errors coming from the table component to the store", () => {
    component.ngOnInit();

    scenariosTableComponent.errorEventEmitter.next("error message");
    expect(store.dispatch).toHaveBeenCalledWith(
      updateErrorMessage({ message: "error message" })
    );
  });

  it("should reload the state of the process in the store upon scenario repush", () => {
    component.projectId = projectId;
    component.ngOnInit();

    scenariosTableComponent.scenarioRepushed.next();
    expect(processStateUpdater.reloadProcessDetails).toHaveBeenCalledWith(
      id,
      projectId
    );
  });
});
