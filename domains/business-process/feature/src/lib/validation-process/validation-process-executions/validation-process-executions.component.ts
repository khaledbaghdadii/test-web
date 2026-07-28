import { Component, effect, inject, OnDestroy, OnInit } from "@angular/core";
import {
  ValidationProcessExecution,
  ValidationProcessExecutionMapperService,
  ValidationProcessExecutionsQueryRequest,
  ValidationProcessExecutionsQueryResponse,
  ValidationProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
} from "@mxflow/features/business-process";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { CardModule } from "primeng/card";
import { concatMap, Subject, takeUntil } from "rxjs";
import { ValidationProcessExecutionsTableComponent } from "./validation-process-executions-table/validation-process-executions-table.component";

@Component({
  selector: "mxevolve-validation-process-executions",
  templateUrl: "./validation-process-executions.component.html",
  imports: [CardModule, ValidationProcessExecutionsTableComponent],
  providers: [
    ValidationProcessListingService,
    BusinessProcessDefinitionService,
    ValidationProcessExecutionMapperService,
  ],
})
export class ValidationProcessExecutionsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();
  private readonly queryParamsChanged$ =
    new Subject<ValidationProcessExecutionsQueryRequest>();

  totalRecords = 0;
  isLoading = false;
  executions = [] as ValidationProcessExecution[];
  businessProcessDefinitions: BusinessProcessDefinition[] = [];

  private readonly toastMessageService = inject(ToastMessageService);
  private readonly validationListingService = inject(
    ValidationProcessListingService
  );
  private readonly businessProcessDefinitionService = inject(
    BusinessProcessDefinitionService
  );
  private readonly projectIdResolver = inject(
    ProjectIdRouteParamsResolverService
  );

  readonly projectId = this.projectIdResolver.projectId;

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      if (projectId) {
        this.loadBusinessProcessDefinitions(projectId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.queryParamsChanged$
      .pipe(
        concatMap((query) => this.getExecutions(this.projectId(), query)),
        takeUntil(this.destroy$)
      )
      .subscribe(this.handleReceivingExecutions());
  }

  private loadBusinessProcessDefinitions(projectId: string): void {
    this.businessProcessDefinitionService
      .getBusinessProcessDefinitions({ projectId })
      .pipe(takeUntil(this.destroy$))
      .subscribe((definitions) => {
        this.businessProcessDefinitions = definitions;
      });
  }

  private handleReceivingExecutions() {
    return {
      next: (paginatedExecutions: ValidationProcessExecutionsQueryResponse) => {
        this.totalRecords = paginatedExecutions.total;
        this.executions = paginatedExecutions.executions;
        this.isLoading = false;
      },
      error: (errorMessage: string) => {
        this.toastMessageService.showError(errorMessage);
        this.isLoading = false;
      },
    };
  }

  private getExecutions(
    projectId: string,
    query: ValidationProcessExecutionsQueryRequest
  ) {
    return this.validationListingService.getValidationProcessExecutions(
      projectId,
      query
    );
  }

  filtersChanged($event: ValidationProcessExecutionsQueryRequest) {
    this.isLoading = true;
    this.queryParamsChanged$.next($event);
  }
}
