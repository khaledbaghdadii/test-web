import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionFilterResolverService,
  businessProcessExecutionStatusFilters,
  BusinessProcessType,
} from "@mxflow/features/business-process";
import { CiProcessExecutionSummary } from "../models/ci-process-execution-query-result";
import { CiProcessExecutionsQuery } from "../models/ci-process-execution-query";
import { CiProcessExecutionsTableQuery } from "./ci-process-executions-table-query";
import { Table, TableLazyLoadEvent } from "primeng/table";
import { Observable } from "rxjs";
import {
  IssueTrackingService,
  JiraDetailsResponse,
} from "@mxflow/features/project";

@Component({
  selector: "app-ci-process-executions-table",
  templateUrl: "./ci-process-executions-table.component.html",
  styleUrls: ["./ci-process-executions-table.component.scss"],
  standalone: false,
})
export class CiProcessExecutionsTableComponent implements OnInit {
  businessProcessType = BusinessProcessType.CI_PROCESS;
  @Input() executions: CiProcessExecutionSummary[] = [];
  @Input() projectId = "";
  @Input() isLoading: boolean;
  @Input() total: number;
  @Input() businessProcessDefinitions: BusinessProcessDefinition[];
  @ViewChild("table") table: Table;
  isMyExecutionsOnly: boolean = false;

  @Output() paginationParamsChangeEmitter =
    new EventEmitter<CiProcessExecutionsQuery>();

  selectedStatuses: string[] = [];

  selectedBpDefinition: string[];
  selectedProcessName: string[];
  startDateRange: Date[];
  endDateRange: Date[];
  expiryDateRange: Date[];
  jiraBaseUrl$: Observable<JiraDetailsResponse>;
  ciProcessExecutionsQuery: CiProcessExecutionsTableQuery = {
    pageSize: 10,
    page: 0,
  };

  globalFilterFields = [
    "namePhrase",
    "userStoryIds",
    "configurationBranchNamePhrase",
    "ownerPhrase",
    "startDateRange",
    "endDateRange",
    "expiryDateRange",
  ];

  private readonly definitionFilterResolverService: BusinessProcessDefinitionFilterResolverService =
    inject(BusinessProcessDefinitionFilterResolverService);
  private readonly issueTrackingService: IssueTrackingService =
    inject(IssueTrackingService);

  ngOnInit(): void {
    this.jiraBaseUrl$ = this.issueTrackingService.getJiraDetails(
      this.projectId
    );
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent) {
    this.executions = [];
    this.updateQueryParams(event);
    this.updatePaginationParams(
      Math.floor(event.first! / event.rows!),
      event.rows!
    );
    this.updateQuerySorter(event);
    this.emitQuery();
  }

  updateQueryParams(paginationParams: TableLazyLoadEvent) {
    Object.entries(paginationParams.filters ?? {}).forEach(
      ([key, filterValues]) => {
        if (Array.isArray(filterValues) && filterValues[0].value) {
          this.updateQueryProperty(key, filterValues[0].value);
        } else if (
          !Array.isArray(filterValues) &&
          typeof filterValues === "object"
        ) {
          this.updateQueryProperty(key, filterValues.value);
        } else {
          this.deleteQueryProperty(key);
        }
      }
    );
  }

  private emitQuery() {
    this.paginationParamsChangeEmitter.emit(
      this.mapToDomain(this.ciProcessExecutionsQuery)
    );
  }

  private mapToDomain(
    ciProcessExecutionsQuery: CiProcessExecutionsTableQuery
  ): CiProcessExecutionsQuery {
    const resolvedDefinitionIds =
      this.definitionFilterResolverService.resolveDefinitionIdsFrom(
        this.businessProcessDefinitions,
        ciProcessExecutionsQuery.definitionIds,
        ciProcessExecutionsQuery.processNames
      );

    const query: CiProcessExecutionsQuery = {
      page: ciProcessExecutionsQuery.page,
      pageSize: ciProcessExecutionsQuery.pageSize,
      statuses: ciProcessExecutionsQuery.statuses,
      namePhrase: ciProcessExecutionsQuery.namePhrase,
      ownerPhrase: ciProcessExecutionsQuery.ownerPhrase,
      userStoryIds: ciProcessExecutionsQuery.userStoryIds,
      definitionIds: resolvedDefinitionIds,
      hidden: false,
      configurationBranchNamePhrase:
        ciProcessExecutionsQuery.configurationBranchNamePhrase,
      startDateRangeStart: ciProcessExecutionsQuery.startDateRange
        ? ciProcessExecutionsQuery.startDateRange[0]
        : undefined,
      startDateRangeEnd: ciProcessExecutionsQuery.startDateRange
        ? ciProcessExecutionsQuery.startDateRange[1]
        : undefined,
      endDateRangeStart: ciProcessExecutionsQuery.endDateRange
        ? ciProcessExecutionsQuery.endDateRange[0]
        : undefined,
      endDateRangeEnd: ciProcessExecutionsQuery.endDateRange
        ? ciProcessExecutionsQuery.endDateRange[1]
        : undefined,
      expiryDateRangeStart: ciProcessExecutionsQuery.expiryDateRange
        ? ciProcessExecutionsQuery.expiryDateRange[0]
        : undefined,
      expiryDateRangeEnd: ciProcessExecutionsQuery.expiryDateRange
        ? ciProcessExecutionsQuery.expiryDateRange[1]
        : undefined,
      sort: this.resolveSortParameters(),
    };
    Object.keys(query).forEach((key) => {
      if (query[key] === undefined) {
        delete query[key];
      }
      if (Array.isArray(query[key]) && query[key].length === 0) {
        delete query[key];
      }
    });
    return query;
  }

  private updateQuerySorter(paginationParams: TableLazyLoadEvent) {
    if (paginationParams.sortField === "sortByExpiryDate") {
      delete this.ciProcessExecutionsQuery.sortByStartDate;
      delete this.ciProcessExecutionsQuery.sortByDaysExtended;
      this.updateQueryProperty(
        "sortByExpiryDate",
        paginationParams.sortOrder === 1 ? "ascending" : "descending"
      );
    } else if (paginationParams.sortField === "sortByStartDate") {
      delete this.ciProcessExecutionsQuery.sortByExpiryDate;
      delete this.ciProcessExecutionsQuery.sortByDaysExtended;
      if (paginationParams.sortOrder) {
        this.updateQueryProperty(
          "sortByStartDate",
          paginationParams.sortOrder === 1 ? "ascending" : "descending"
        );
      }
    } else if (paginationParams.sortField === "sortByDaysExtended") {
      delete this.ciProcessExecutionsQuery.sortByStartDate;
      delete this.ciProcessExecutionsQuery.sortByExpiryDate;
      if (paginationParams.sortOrder) {
        this.updateQueryProperty(
          "sortByDaysExtended",
          paginationParams.sortOrder === 1 ? "ascending" : "descending"
        );
      }
    }
  }

  private updatePaginationParams(pageIndex: number, pageSize: number) {
    this.ciProcessExecutionsQuery.pageSize = pageSize;
    if (pageIndex !== this.ciProcessExecutionsQuery.page) {
      this.ciProcessExecutionsQuery.page = pageIndex;
    } else {
      this.ciProcessExecutionsQuery.page = 0;
    }
  }

  private updateQueryProperty(
    key: keyof CiProcessExecutionsTableQuery,
    newValue?: CiProcessExecutionsTableQuery[keyof CiProcessExecutionsTableQuery]
  ) {
    if (newValue) {
      this.ciProcessExecutionsQuery[key] = newValue;
    }
  }

  private deleteQueryProperty(key: keyof CiProcessExecutionsTableQuery) {
    delete this.ciProcessExecutionsQuery[key];
  }

  private resolveSortParameters() {
    if (this.ciProcessExecutionsQuery.sortByStartDate == "ascending") {
      return "startDate,asc";
    }
    if (this.ciProcessExecutionsQuery.sortByStartDate == "descending") {
      return "startDate,desc";
    }
    if (this.ciProcessExecutionsQuery.sortByExpiryDate == "ascending") {
      return "expiryDate,asc";
    }
    if (this.ciProcessExecutionsQuery.sortByExpiryDate == "descending") {
      return "expiryDate,desc";
    }
    if (this.ciProcessExecutionsQuery.sortByDaysExtended == "ascending") {
      return "daysExtended,asc";
    }
    if (this.ciProcessExecutionsQuery.sortByDaysExtended == "descending") {
      return "daysExtended,desc";
    }
    return undefined;
  }

  protected readonly businessProcessExecutionStatusFilters =
    businessProcessExecutionStatusFilters;
}
