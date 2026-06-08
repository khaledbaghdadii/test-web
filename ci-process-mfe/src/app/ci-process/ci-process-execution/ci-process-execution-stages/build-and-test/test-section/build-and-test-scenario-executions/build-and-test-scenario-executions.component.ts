import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef,
} from "@angular/core";
import { concatMap, Subject, takeUntil } from "rxjs";
import { environment } from "../../../../../../../environments/environment";
import { updateErrorMessage } from "../../../../../state/ci-process.actions";
import { CiProcessExecutionStateUpdaterService } from "../../../../ci-process-execution-details/ci-process-state-updater.service";
import { Store } from "@ngrx/store";
import { getCiProcessExecution } from "../../../../state/ci-process-execution.selector";
import ScenarioExecutionGroupPermissionWarningMessage from "../../model/scenario-execution-group-permission-warning-message";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";

@Component({
  selector: "mxflow-build-and-test-scenario-executions",
  templateUrl: "build-and-test-scenario-executions.component.html",
})
export class BuildAndTestScenarioExecutionsComponent
  implements OnInit, OnDestroy
{
  private readonly destroy$ = new Subject();

  @Input({ required: true }) projectId: string;

  processId: string;
  private componentInstance: any;
  executionGroupId: string | null;

  constructor(
    private store: Store,
    private viewContainerRef: ViewContainerRef,
    private injectorService: RemoteComponentInjectorService,
    private processStateUpdater: CiProcessExecutionStateUpdaterService
  ) {}

  ngOnInit(): void {
    this.loadScenarioExecutionsTableComponent()
      .pipe(
        concatMap((component) => {
          this.componentInstance = component;
          this.handleScenarioExecutionsError();
          this.handleScenarioExecutionRepush();
          return this.store.pipe(getCiProcessExecution);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((process) => {
        this.processId = process.id;
        this.executionGroupId =
          process.buildAndTestStage.scenarioExecutionGroup;

        if (this.componentInstance) {
          this.initializeScenariosTable();
        }
      });
  }

  private loadScenarioExecutionsTableComponent() {
    return this.injectorService.loadComponent({
      mfeUrl: environment.testMfeUrl,
      componentExposedPath: "./ScenarioExecutionsTable",
      moduleName: "ScenarioExecutionsTableComponentModule",
      componentName: "ScenarioExecutionsTableComponent",
      placeHolderComponent: this.viewContainerRef,
    });
  }

  private initializeScenariosTable() {
    if (this.processId) {
      this.componentInstance.initialize({
        contextId: this.processId,
        subContextId: "BUILD_AND_TEST",
        showBulkRepush: false,
        executionGroupId: this.executionGroupId,
        warningMessageMap: ScenarioExecutionGroupPermissionWarningMessage,
        enableKeepServices: true,
      });
    }
  }

  private handleScenarioExecutionsError() {
    this.componentInstance.errorEventEmitter
      .pipe(takeUntil(this.destroy$))
      .subscribe((errorMessage: string) => {
        this.store.dispatch(updateErrorMessage({ message: errorMessage }));
      });
  }

  private handleScenarioExecutionRepush() {
    this.componentInstance.scenarioRepushed
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.processStateUpdater.reloadProcessDetails(
          this.processId,
          this.projectId
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
