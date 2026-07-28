import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import {
  ValidationProcessExecution,
  ValidationProcessExecutionsQueryRequest,
} from "@mxevolve/domains/business-process/data-access";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionFilterResolverService,
  BusinessProcessDefinitionToFilterListModule,
  BusinessProcessExecutionStatusComponent,
  businessProcessExecutionStatusFilters,
  BusinessProcessNameToFilterListPipe,
  BusinessProcessOfficialStatusComponent,
  businessProcessQualityLevelFilters,
  BusinessProcessType,
  BusinessProcessUriFactoryPipeModule,
  MyExecutionsToggleComponent,
  officialityFilters,
} from "@mxflow/features/business-process";
import { DaysCountPipe } from "@mxflow/pipe";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  TableCheckboxFilterComponent,
  TableDateFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { Table, TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { ValidationProcessExecutionsTableQuery } from "./validation-process-executions-table-query";

@Component({
  selector: "mxevolve-validation-process-executions-table",
  templateUrl: "./validation-process-executions-table.component.html",
  styleUrls: ["./validation-process-executions-table.component.scss"],
  imports: [
    TableModule,
    SkeletonModule,
    CommonModule,
    HeaderTitleModule,
    BusinessProcessUriFactoryPipeModule,
    BusinessProcessDefinitionToFilterListModule,
    BusinessProcessNameToFilterListPipe,
    TooltipModule,
    TableCheckboxFilterComponent,
    TableDateFilterComponent,
    TableEmptyMessageComponent,
    BusinessProcessExecutionStatusComponent,
    BusinessProcessOfficialStatusComponent,
    DaysCountPipe,
    FormsModule,
    MyExecutionsToggleComponent,
    RouterModule,
  ],
  providers: [BusinessProcessDefinitionFilterResolverService],
})
export class ValidationProcessExecutionsTableComponent implements OnChanges {
  businessProcessType = BusinessProcessType.MASTER_VALIDATION;
  @Input() executions: ValidationProcessExecution[] = [];
  @Input() projectId = "";
  @Input() isLoading: boolean;
  @Input() totalRecords: number;
  @Input() businessProcessDefinitions: BusinessProcessDefinition[];
  @ViewChild("table") table: Table;
  isMyExecutionsOnly: boolean = false;

  @Output() paginationParamsChangeEmitter =
    new EventEmitter<ValidationProcessExecutionsQueryRequest>();

  private readonly definitionFilterResolverService = inject(
    BusinessProcessDefinitionFilterResolverService
  );

  numberOfRows = 10;
  selectedStatuses: string[] = [];
  startDateRange: Date[];
  endDateRange: Date[];
  expiryDateRange: Date[];
  selectedBpDefinition: string[];
  selectedProcessName: string[];
  selectedOfficialStatus: string[] = [];
  selectedBpQualityLevel: string[] = [];

  validationProcessExecutionsTableQuery: ValidationProcessExecutionsTableQuery =
    {
      pageSize: this.numberOfRows,
      page: 0,
    };

  ngOnChanges(changes: SimpleChanges): void {
    const projectIdChange = changes["projectId"];
    if (
      projectIdChange &&
      !projectIdChange.firstChange &&
      projectIdChange.previousValue !== projectIdChange.currentValue
    ) {
      Promise.resolve().then(() => this.table?.reset());
    }
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent) {
    this.executions = [];
    this.setTableFilterParams(event);
    this.setPaginationParams(this.getPageIndex(event), event.rows!);
    this.setSortOrder(event);
    this.emitQuery();
  }

  private getPageIndex(event: TableLazyLoadEvent) {
    const firstRowDisplayedIndex = event.first!;
    const numberOfRowsPerPage = event.rows!;
    return Math.floor(firstRowDisplayedIndex / numberOfRowsPerPage);
  }

  setTableFilterParams(event: TableLazyLoadEvent) {
    Object.entries(event.filters ?? {}).forEach(
      ([tableFilterKey, tableFilterValue]) => {
        if (Array.isArray(tableFilterValue) && tableFilterValue[0].value) {
          this.updateQueryProperty(tableFilterKey, tableFilterValue[0].value);
        } else if (
          !Array.isArray(tableFilterValue) &&
          typeof tableFilterValue === "object"
        ) {
          this.updateQueryProperty(tableFilterKey, tableFilterValue.value);
        } else {
          this.deleteQueryProperty(tableFilterKey);
        }
      }
    );
  }

  private updateQueryProperty(
    key: keyof ValidationProcessExecutionsTableQuery,
    newValue?: ValidationProcessExecutionsTableQuery[keyof ValidationProcessExecutionsTableQuery]
  ) {
    if (newValue) {
      this.validationProcessExecutionsTableQuery[key] = newValue;
    }
  }

  private deleteQueryProperty(
    key: keyof ValidationProcessExecutionsTableQuery
  ) {
    delete this.validationProcessExecutionsTableQuery[key];
  }

  setPaginationParams(pageIndex: number, pageSize: number) {
    this.validationProcessExecutionsTableQuery.pageSize = pageSize;
    if (pageIndex !== this.validationProcessExecutionsTableQuery.page) {
      this.validationProcessExecutionsTableQuery.page = pageIndex;
    } else {
      this.validationProcessExecutionsTableQuery.page = 0;
    }
  }

  setSortOrder(event: TableLazyLoadEvent) {
    if (event.sortField === "sortByExpiryDate") {
      delete this.validationProcessExecutionsTableQuery.sortByStartDate;
      delete this.validationProcessExecutionsTableQuery.sortByDaysExtended;
      this.updateQueryProperty(
        "sortByExpiryDate",
        event.sortOrder === 1 ? "ascending" : "descending"
      );
    } else if (event.sortField === "sortByStartDate") {
      delete this.validationProcessExecutionsTableQuery.sortByExpiryDate;
      delete this.validationProcessExecutionsTableQuery.sortByDaysExtended;
      if (event.sortOrder) {
        this.updateQueryProperty(
          "sortByStartDate",
          event.sortOrder === 1 ? "ascending" : "descending"
        );
      }
    } else if (event.sortField === "sortByDaysExtended") {
      delete this.validationProcessExecutionsTableQuery.sortByStartDate;
      delete this.validationProcessExecutionsTableQuery.sortByExpiryDate;
      if (event.sortOrder) {
        this.updateQueryProperty(
          "sortByDaysExtended",
          event.sortOrder === 1 ? "ascending" : "descending"
        );
      }
    }
  }

  private mapToDomain(
    tableQuery: ValidationProcessExecutionsTableQuery
  ): ValidationProcessExecutionsQueryRequest {
    const resolvedDefinitionIds =
      this.definitionFilterResolverService.resolveDefinitionIdsFrom(
        this.businessProcessDefinitions,
        tableQuery.definitionIds,
        tableQuery.processNames
      );

    const query: ValidationProcessExecutionsQueryRequest = {
      page: tableQuery.page,
      pageSize: tableQuery.pageSize,
      statuses: tableQuery.statuses,
      officiality: tableQuery.officiality,
      businessProcessQualityLevel: tableQuery.businessProcessQualityLevel,
      namePhrase: tableQuery.namePhrase,
      ownerPhrase: tableQuery.ownerPhrase,
      definitionIds: resolvedDefinitionIds,
      hidden: false,
      startDateRangeStart: tableQuery.startDateRange
        ? tableQuery.startDateRange[0]
        : undefined,
      startDateRangeEnd: tableQuery.startDateRange
        ? tableQuery.startDateRange[1]
        : undefined,
      endDateRangeStart: tableQuery.endDateRange
        ? tableQuery.endDateRange[0]
        : undefined,
      endDateRangeEnd: tableQuery.endDateRange
        ? tableQuery.endDateRange[1]
        : undefined,
      expiryDateRangeStart: tableQuery.expiryDateRange
        ? tableQuery.expiryDateRange[0]
        : undefined,
      expiryDateRangeEnd: tableQuery.expiryDateRange
        ? tableQuery.expiryDateRange[1]
        : undefined,
      sort: this.resolveSortParameters(),
    };
    Object.keys(query).forEach((key) => {
      if (query[key] === undefined) {
        delete query[key];
      }
      if (Array.isArray(query[key]) && (query[key] as unknown[]).length === 0) {
        delete query[key];
      }
    });
    return query;
  }

  private emitQuery() {
    this.paginationParamsChangeEmitter.emit(
      this.mapToDomain(this.validationProcessExecutionsTableQuery)
    );
  }

  private resolveSortParameters() {
    if (
      this.validationProcessExecutionsTableQuery.sortByStartDate == "ascending"
    ) {
      return "startDate,asc";
    }
    if (
      this.validationProcessExecutionsTableQuery.sortByStartDate == "descending"
    ) {
      return "startDate,desc";
    }
    if (
      this.validationProcessExecutionsTableQuery.sortByExpiryDate == "ascending"
    ) {
      return "expiryDate,asc";
    }
    if (
      this.validationProcessExecutionsTableQuery.sortByExpiryDate ==
      "descending"
    ) {
      return "expiryDate,desc";
    }
    if (
      this.validationProcessExecutionsTableQuery.sortByDaysExtended ==
      "ascending"
    ) {
      return "daysExtended,asc";
    }
    if (
      this.validationProcessExecutionsTableQuery.sortByDaysExtended ==
      "descending"
    ) {
      return "daysExtended,desc";
    }
    return undefined;
  }

  protected readonly officialityFilters = officialityFilters;
  protected readonly businessProcessExecutionStatusFilters =
    businessProcessExecutionStatusFilters;
  protected readonly businessProcessQualityLevelFilters =
    businessProcessQualityLevelFilters;
}
