import { HeaderTitleModule } from "@mxflow/ui/header";
import { ScenarioDetections } from "../scenario-execution";
import { ValidationSummaryService } from "./validation-summary.service";
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { HorizontalStackedBarComponent, StackedBarItem } from "@mxflow/ui/bar";
import {
  Incident,
  IncidentService,
  IncidentsSummaryComponent,
  IncidentSummary,
} from "@mxflow/features/incident-management";
import { concatMap, Observable, Subject, takeUntil } from "rxjs";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";
import { MeterGroupModule } from "primeng/metergroup";

import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { ValidationDetectionsSummaryComponent } from "@mxflow/test-management/detection";
import { TestUnitService } from "../../test-unit/test-unit.service";
import {
  TestUnitModel,
  TestUnitScenarioExecutionModel,
} from "../../test-unit/test-unit.model";

@Component({
  imports: [
    HorizontalStackedBarComponent,
    HeaderTitleModule,
    ValidationDetectionsSummaryComponent,
    IncidentsSummaryComponent,
    ButtonModule,
    RouterLink,
    MeterGroupModule,
    ShowElementIfAuthorizedDirective,
  ],
  selector: "mxevolve-validation-summary",
  templateUrl: "./validation-summary.component.html",
  providers: [ValidationSummaryService, TestUnitService, IncidentService],
})
export class ValidationSummaryComponent implements OnInit, OnDestroy {
  private readonly validationSummaryService = inject(ValidationSummaryService);
  private readonly testUnitService = inject(TestUnitService);
  private readonly incidentService = inject(IncidentService);

  private readonly destroy$ = new Subject();

  @Input({ required: true }) contextId: string;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) subContextId: string;
  @Input({ required: true }) bpExecutionName: string;

  @Output() errorOccurred = new EventEmitter<string>();

  loading = true;

  incidentSummary: IncidentSummary;
  scenarioDetections: ScenarioDetections;
  scenarioStatusSummaryStackedBarItems: StackedBarItem[];
  analysisStatusSummaryStackedBarItems: StackedBarItem[];

  ngOnInit(): void {
    this.loading = true;
    const headScenarioExecutions: TestUnitScenarioExecutionModel[] = [];
    const allScenarioExecutions: TestUnitScenarioExecutionModel[] = [];
    this.testUnitService
      .fetch({
        projectId: this.projectId,
        contextId: this.contextId,
        subContextId: this.subContextId,
      })
      .pipe(
        takeUntil(this.destroy$),
        concatMap((testUnits: TestUnitModel[]): Observable<Incident[]> => {
          testUnits.forEach((testUnit: TestUnitModel) => {
            headScenarioExecutions.push(testUnit.headScenarioExecution);
            allScenarioExecutions.push(...testUnit.scenarioExecutions);
          });
          const scenarioExecutionsIncidentIds =
            this.gatherHeadScenarioExecutionsIncidentIds(allScenarioExecutions);
          return this.incidentService.fetchIncidentsByIds([
            ...scenarioExecutionsIncidentIds,
          ]);
        })
      )
      .subscribe({
        next: (incidents: Incident[]) => {
          this.scenarioDetections =
            this.validationSummaryService.mergeDistinctDetections(
              allScenarioExecutions
            );
          this.incidentSummary =
            this.validationSummaryService.groupLinkedIncidentsStatuses(
              incidents
            );
          this.scenarioStatusSummaryStackedBarItems =
            this.validationSummaryService.constructScenarioStatusStackedBarInput(
              headScenarioExecutions
            );
          this.analysisStatusSummaryStackedBarItems =
            this.validationSummaryService.constructAnalysisStatusStackedBarInput(
              headScenarioExecutions
            );
          this.loading = false;
        },
        error: (errorMessage) => {
          this.errorOccurred.emit(errorMessage);
          this.loading = false;
        },
      });
  }

  private gatherHeadScenarioExecutionsIncidentIds(
    headScenarioExecutions: TestUnitScenarioExecutionModel[]
  ): Set<string> {
    const headScenarioExecutionsIncidentIds: Set<string> = new Set<string>();

    headScenarioExecutions.forEach((scenarioExecution) => {
      scenarioExecution.analysisObjects.incidents.forEach((incidentId) => {
        headScenarioExecutionsIncidentIds.add(incidentId);
      });
    });
    return headScenarioExecutionsIncidentIds;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
