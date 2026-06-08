import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";

import { SkeletonModule } from "primeng/skeleton";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { BusinessProcessExecutionListComponent } from "@mxflow/features/business-process";
import { RouterModule } from "@angular/router";
import { TableModule } from "primeng/table";
import { Subject, takeUntil } from "rxjs";
import {
  AnalysisObjectLinkService,
  ScenarioDefinitionService,
  ScenarioExecutionService,
  TestCaseExecutionAnalyzabilityService,
  TestCaseExecutionDisplayComponent,
  TestCaseExecutionService,
} from "@mxflow/test-management";
import { ProjectService } from "@mxflow/features/project";
import { AnalysisObjectLinkedScenarioExecutionsService } from "../analysis-object-linked-scenario-executions.service";
import { AnalysisObjectLinkedScenarioExecutionDetails } from "../model/analysis/analysis-object-linked-scenario-execution";
import { GlobalAnalysisObjectType } from "@mxflow/features/analysis-objects";
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: "mxevolve-global-analysis-object-links-table",
  imports: [
    TableModule,
    TableEmptyMessageComponent,
    SkeletonModule,
    RouterModule,
    TooltipModule,
    BusinessProcessExecutionListComponent,
    TestCaseExecutionDisplayComponent,
  ],
  templateUrl: "./global-analysis-object-links-table.component.html",
  providers: [
    ScenarioDefinitionService,
    ProjectService,
    AnalysisObjectLinkService,
    AnalysisObjectLinkedScenarioExecutionsService,
    TestCaseExecutionService,
    TestCaseExecutionAnalyzabilityService,
    ScenarioExecutionService,
  ],
})
export class GlobalAnalysisObjectLinksTableComponent
  implements OnInit, OnDestroy
{
  protected readonly Array = Array;
  private linksService = inject(AnalysisObjectLinkedScenarioExecutionsService);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) analysisObjectId: string;
  @Input({ required: true }) analysisObjectType: GlobalAnalysisObjectType;
  @Output() errorMessageEmitter = new EventEmitter<string>();

  linkedScenarioExecutions: AnalysisObjectLinkedScenarioExecutionDetails[] = [];
  isLoading = false;
  private readonly destroy$ = new Subject();

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.getLinkedScenarioExecutions();
  }

  private getLinkedScenarioExecutions() {
    this.linksService
      .getGlobalAnalysisObjectLinks(
        this.analysisObjectId,
        this.analysisObjectType
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (
          linkedScenarioExecutions: AnalysisObjectLinkedScenarioExecutionDetails[]
        ) => {
          this.linkedScenarioExecutions = linkedScenarioExecutions;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessageEmitter.emit(error.message);
          this.isLoading = false;
        },
      });
  }
}
