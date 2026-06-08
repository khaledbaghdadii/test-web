import { Component, OnDestroy, OnInit } from "@angular/core";
import { concatMap, Observable, Subject, takeUntil } from "rxjs";
import {
  CiProcessExecutionsQueryResult,
  CiProcessExecutionSummary,
} from "./models/ci-process-execution-query-result";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
} from "@mxflow/features/business-process";
import { Store } from "@ngrx/store";
import { CiProcessExecutionsService } from "./ci-process-executions.service";
import { getErrorMessage } from "../state/ci-process.selectors";
import { CiProcessActions } from "../state";
import { CiProcessExecutionsQuery } from "./models/ci-process-execution-query";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

@Component({
  selector: "app-ci-process-executions",
  templateUrl: "./ci-process-executions.component.html",
  standalone: false,
})
export class CiProcessExecutionsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();
  private queryParamsChanged$ = new Subject<CiProcessExecutionsQuery>();

  total = 0;
  isLoading = false;
  projectId: string;
  executions: CiProcessExecutionSummary[] = [];

  errorMessage$: Observable<string>;
  businessProcessDefinitions: BusinessProcessDefinition[];

  constructor(
    private store: Store,
    private ciProcessExecutionsService: CiProcessExecutionsService,
    private businessProcessDefinitionService: BusinessProcessDefinitionService,
    private projectIdResolver: ProjectIdRouteParamsResolverService
  ) {}

  ngOnInit(): void {
    this.projectId = this.projectIdResolver.resolve();
    this.isLoading = true;
    this.errorMessage$ = this.store.select(getErrorMessage);
    this.queryParamsChanged$
      .pipe(
        concatMap((query) =>
          this.ciProcessExecutionsService.getCiProcessExecutions(
            this.projectId,
            query
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(this.handleReceivingExecutions());

    this.businessProcessDefinitionService
      .getBusinessProcessDefinitions({ projectId: this.projectId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (definitions) => {
          this.businessProcessDefinitions = definitions;
        },
      });
  }

  handlePaginationParamsChange(query: CiProcessExecutionsQuery) {
    this.isLoading = true;
    this.queryParamsChanged$.next(query);
  }

  private handleReceivingExecutions() {
    return {
      next: (paginatedExecutions: CiProcessExecutionsQueryResult) => {
        this.total = paginatedExecutions.totalElements;
        this.executions = paginatedExecutions.content;
        this.isLoading = false;
      },
      error: (errorMessage: string) => {
        this.store.dispatch(
          CiProcessActions.updateErrorMessage({ message: errorMessage })
        );
        this.isLoading = false;
      },
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
