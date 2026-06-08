import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";

import { TableModule } from "primeng/table";
import { RouterModule } from "@angular/router";
import { Subject } from "rxjs";
import { SkeletonModule } from "primeng/skeleton";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import {
  BusinessProcessDefinitionService,
  BusinessProcessExecutionListComponent,
  BusinessProcessExecutionService,
  BusinessProcessUriFactoryPipeModule,
} from "@mxflow/features/business-process";
import { AnalysisObjectLinkedScenarioExecutionsService } from "../analysis-object-linked-scenario-executions.service";
import { AnalysisObjectLinkedScenarioExecutionDetails } from "../model/analysis/analysis-object-linked-scenario-execution";
import {
  AnalysisObjectLinkService,
  ScenarioDefinitionService,
  ScenarioExecutionService,
  TestCaseExecutionDisplayComponent,
  TestCaseExecutionService,
} from "@mxflow/test-management";
import { ProjectService } from "@mxflow/features/project";
import { ProjectSpecificAnalysisObjectType } from "@mxflow/features/analysis-objects";
import { TooltipModule } from "primeng/tooltip";
import { TestCaseExecutionAnalyzabilityService } from "@mxflow/test-management/execution";

@Component({
  selector: "mxevolve-project-specific-analysis-object-links-table",
  imports: [
    TableModule,
    RouterModule,
    SkeletonModule,
    TableEmptyMessageComponent,
    TooltipModule,
    BusinessProcessUriFactoryPipeModule,
    BusinessProcessExecutionListComponent,
    TestCaseExecutionDisplayComponent,
  ],
  providers: [
    BusinessProcessExecutionService,
    BusinessProcessDefinitionService,
    ScenarioDefinitionService,
    ProjectService,
    AnalysisObjectLinkService,
    AnalysisObjectLinkedScenarioExecutionsService,
    TestCaseExecutionService,
    TestCaseExecutionAnalyzabilityService,
    ScenarioExecutionService,
  ],
  templateUrl: "./project-specific-analysis-object-links-table.component.html",
})
export class ProjectSpecificAnalysisObjectLinksTableComponent
  implements OnInit, OnDestroy
{
  private linksService = inject(AnalysisObjectLinkedScenarioExecutionsService);
  protected readonly Array = Array;

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) analysisObjectId: string;
  @Input({ required: true })
  analysisObjectType: ProjectSpecificAnalysisObjectType;
  @Output() errorMessageEmitter = new EventEmitter<string>();

  isLoading = false;
  linkedScenarioExecutions: AnalysisObjectLinkedScenarioExecutionDetails[] = [];
  private readonly destroy$ = new Subject();

  ngOnInit(): void {
    this.isLoading = true;
    this.fetchLinkedScenarioExecutions();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private fetchLinkedScenarioExecutions(): void {
    this.linksService
      .getProjectSpecificAnalysisObjectLinks(
        this.projectId,
        this.analysisObjectId,
        this.analysisObjectType
      )
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
