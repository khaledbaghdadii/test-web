import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import {
  BinaryUpgradeExecutionsQueryRequest,
  BinaryUpgradeExecutionsQueryResult,
  BinaryUpgradeExecutionSummary,
  UpgradeProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
} from "@mxflow/features/business-process";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { CardModule } from "primeng/card";
import { concatMap, Subject, takeUntil } from "rxjs";
import { BinaryUpgradeExecutionsTableComponent } from "./binary-upgrade-executions-table/binary-upgrade-executions-table.component";

@Component({
  selector: "mxevolve-binary-upgrade-executions",
  templateUrl: "./binary-upgrade-executions.component.html",
  imports: [CardModule, BinaryUpgradeExecutionsTableComponent],
  providers: [UpgradeProcessListingService, BusinessProcessDefinitionService],
})
export class BinaryUpgradeExecutionsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();
  private queryParamsChanged$ =
    new Subject<BinaryUpgradeExecutionsQueryRequest>();

  projectId = "";
  totalRecords = 0;
  isLoading = false;
  executions = [] as BinaryUpgradeExecutionSummary[];
  businessProcessDefinitions: BusinessProcessDefinition[] = [];

  private readonly toastMessageService = inject(ToastMessageService);
  private readonly upgradeListingService = inject(UpgradeProcessListingService);
  private readonly businessProcessDefinitionService = inject(
    BusinessProcessDefinitionService
  );
  private readonly projectIdResolver = inject(
    ProjectIdRouteParamsResolverService
  );

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.queryParamsChanged$
      .pipe(
        concatMap((query) => this.getExecutions(this.projectId, query)),
        takeUntil(this.destroy$)
      )
      .subscribe(this.handleReceivingExecutions());

    this.projectId = this.projectIdResolver.resolve();
    this.businessProcessDefinitionService
      .getBusinessProcessDefinitions({ projectId: this.projectId })
      .pipe(takeUntil(this.destroy$))
      .subscribe((definitions) => {
        this.businessProcessDefinitions = definitions;
      });
  }

  private handleReceivingExecutions() {
    return {
      next: (paginatedExecutions: BinaryUpgradeExecutionsQueryResult) => {
        this.totalRecords = paginatedExecutions.totalElements;
        this.executions = paginatedExecutions.content;
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
    query: BinaryUpgradeExecutionsQueryRequest
  ) {
    return this.upgradeListingService.getBinaryUpgradeExecutions(
      projectId,
      query
    );
  }

  filtersChanged($event: BinaryUpgradeExecutionsQueryRequest) {
    this.isLoading = true;
    this.queryParamsChanged$.next($event);
  }
}
