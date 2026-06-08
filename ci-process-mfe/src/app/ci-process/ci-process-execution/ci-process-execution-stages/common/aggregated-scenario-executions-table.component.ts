import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewContainerRef,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { RemoteComponentInjectorService } from "@mxflow/federation/remote-component-injector";
import { environment } from "../../../../../environments/environment";
import { updateErrorMessage } from "../../../state/ci-process.actions";
import { Store } from "@ngrx/store";
import { CiProcessExecutionStateUpdaterService } from "../../ci-process-execution-details/ci-process-state-updater.service";
import { ScenarioExecutionsTableComponentInstance } from "./scenario-executions-table-component-instance";

@Component({
  selector: "mxflow-aggregated-scenario-executions-table",
  templateUrl: "aggregated-scenario-executions-table.component.html",
  standalone: true,
})
export class AggregatedScenarioExecutionsTableComponent
  implements OnInit, OnDestroy
{
  private readonly destroy$ = new Subject();

  constructor(
    private readonly store: Store,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly injectorService: RemoteComponentInjectorService,
    private readonly processStateUpdater: CiProcessExecutionStateUpdaterService
  ) {}

  private componentInstance: ScenarioExecutionsTableComponentInstance;
  @Input() processId: string;
  @Input() projectId: string;
  @Input() subContextId: string;
  @Input() isUserInterventionDisabled: boolean;

  ngOnInit(): void {
    this.loadScenariosTable()
      .pipe(takeUntil(this.destroy$))
      .subscribe((component) => {
        this.componentInstance = component;
        this.initializeScenariosTable();
        this.handleScenarioExecutionsError();
        this.handleScenarioExecutionRepush();
      });
  }

  private loadScenariosTable() {
    return this.injectorService.loadComponent({
      mfeUrl: environment.testMfeUrl,
      componentName: "ScenarioExecutionsTableComponent",
      moduleName: "ScenarioExecutionsTableComponentModule",
      componentExposedPath: "./ScenarioExecutionsTable",
      placeHolderComponent: this.viewContainerRef,
    });
  }

  private initializeScenariosTable() {
    this.componentInstance.initialize({
      contextId: this.processId,
      subContextId: this.subContextId,
      showRepush: !this.isUserInterventionDisabled,
      showBulkRepush: false,
    });
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
