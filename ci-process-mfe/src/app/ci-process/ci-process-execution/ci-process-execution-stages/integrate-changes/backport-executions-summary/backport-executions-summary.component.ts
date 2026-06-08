import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
  BusinessProcessExecutionStatusComponent,
  BusinessProcessUriFactoryPipeModule,
} from "@mxflow/features/business-process";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ErrorAlertComponent, InfoAlertComponent } from "@mxflow/ui/alert";
import { TableModule } from "primeng/table";
import { CiProcessExecutionsService } from "../../../../ci-process-executions/ci-process-executions.service";
import {
  CiProcessExecutionsQueryResult,
  CiProcessExecutionSummary,
} from "../../../../ci-process-executions/models/ci-process-execution-query-result";

@Component({
  selector: "mxevolve-backport-executions-summary",
  templateUrl: "./backport-executions-summary.component.html",
  imports: [
    ErrorAlertComponent,
    TableModule,
    BusinessProcessExecutionStatusComponent,
    BusinessProcessUriFactoryPipeModule,
    InfoAlertComponent,
  ],
})
export class BackportExecutionsSummaryComponent implements OnInit, OnDestroy {
  @Input() backportExecutionIds: string[] = [];
  @Input() failedBackportDefinitionIds: string[] = [];
  @Input() projectId: string;
  @Input() integrateDestinationBranch: string;
  @Input() backportDestinationBranches: string[] = [];

  backportExecutions: CiProcessExecutionSummary[] = [];
  failedBackportDefinitions: BusinessProcessDefinition[] = [];
  missingDefinitions: string[] = [];
  errorMessage: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly buildAndTestFetcherService = inject(
    CiProcessExecutionsService
  );
  private readonly definitionService = inject(BusinessProcessDefinitionService);

  ngOnInit(): void {
    this.fetchBackportExecutions();
    this.fetchFailedBackportDefinitions();
  }

  private fetchBackportExecutions(): void {
    if (this.backportExecutionIds.length === 0) {
      return;
    }

    this.buildAndTestFetcherService
      .getCiProcessExecutions(this.projectId, {
        ids: this.backportExecutionIds,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.backportExecutions = response.content;
          this.addExecutionsThatCouldNotBeFetched(response);
        },
        error: () => {
          this.errorMessage = "Failed to fetch backport executions";
        },
      });
  }

  private fetchFailedBackportDefinitions(): void {
    if (this.failedBackportDefinitionIds.length === 0) {
      return;
    }

    this.definitionService
      .getBusinessProcessDefinitions({
        projectId: this.projectId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (definitions) => {
          this.failedBackportDefinitions = definitions.filter((def) =>
            this.failedBackportDefinitionIds.includes(def.id)
          );
          this.missingDefinitions = this.failedBackportDefinitionIds.filter(
            (id) => !definitions.some((def) => def.id === id)
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addExecutionsThatCouldNotBeFetched(
    response: CiProcessExecutionsQueryResult
  ) {
    this.backportExecutionIds
      .filter((id) => !response.content.some((exec) => exec.id === id))
      .forEach((id) => {
        this.backportExecutions.push({
          id,
        } as unknown as CiProcessExecutionSummary);
      });
  }
}
