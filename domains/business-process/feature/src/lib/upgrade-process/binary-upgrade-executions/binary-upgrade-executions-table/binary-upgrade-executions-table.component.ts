import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import {
  BinaryUpgradeExecutionsQueryRequest,
  BinaryUpgradeExecutionSummary,
  BinaryUpgradeExecutionsTableQuery,
} from "@mxevolve/domains/business-process/data-access";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionFilterResolverService,
  businessProcessExecutionStatusFilters,
  BusinessProcessType,
  officialityFilters,
  businessProcessQualityLevelFilters,
  MyExecutionsToggleComponent,
  BusinessProcessOfficialStatusComponent,
  BusinessProcessExecutionStatusComponent,
  BusinessProcessNameToFilterListPipe,
  BusinessProcessDefinitionToFilterListModule,
  BusinessProcessUriFactoryPipeModule,
} from "@mxflow/features/business-process";
import { DaysCountPipe, DurationPipeModule } from "@mxflow/pipe";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  TableCheckboxFilterComponent,
  TableDateFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { Table, TableLazyLoadEvent, TableModule } from "primeng/table";
import { ToggleSwitch } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: "mxevolve-binary-upgrade-executions-table",
  templateUrl: "./binary-upgrade-executions-table.component.html",
  styleUrls: ["./binary-upgrade-executions-table.component.scss"],
  imports: [
    TableModule,
    SkeletonModule,
    CommonModule,
    HeaderTitleModule,
    DurationPipeModule,
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
    ToggleSwitch,
    MyExecutionsToggleComponent,
    RouterModule,
  ],
  providers: [BusinessProcessDefinitionFilterResolverService],
})
export class BinaryUpgradeExecutionsTableComponent {
  businessProcessType = BusinessProcessType.BINARY_UPGRADE;
  @Input() executions: BinaryUpgradeExecutionSummary[] = [];
  @Input() projectId = "";
  @Input() isLoading: boolean;
  @Input() totalRecords: number;
  @Input() businessProcessDefinitions: BusinessProcessDefinition[];
  @ViewChild("table") table: Table;

  isMyExecutionsOnly: boolean = false;

  @Output() paginationParamsChangeEmitter =
    new EventEmitter<BinaryUpgradeExecutionsQueryRequest>();

  definitionFilterResolverService = inject(
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

  binaryUpgradeExecutionsTableQuery: BinaryUpgradeExecutionsTableQuery = {
    pageSize: this.numberOfRows,
    page: 0,
  };

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
    key: keyof BinaryUpgradeExecutionsTableQuery,
    newValue?: BinaryUpgradeExecutionsTableQuery[keyof BinaryUpgradeExecutionsTableQuery]
  ) {
    if (newValue) {
      this.binaryUpgradeExecutionsTableQuery[key] = newValue;
    }
  }

  private deleteQueryProperty(key: keyof BinaryUpgradeExecutionsTableQuery) {
    delete this.binaryUpgradeExecutionsTableQuery[key];
  }

  private mapToDomain(
    tableQuery: BinaryUpgradeExecutionsTableQuery
  ): BinaryUpgradeExecutionsQueryRequest {
    const resolvedDefinitionIds =
      this.definitionFilterResolverService.resolveDefinitionIdsFrom(
        this.businessProcessDefinitions,
        tableQuery.definitionIds,
        tableQuery.processNames
      );

    const query: BinaryUpgradeExecutionsQueryRequest = {
      page: tableQuery.page,
      pageSize: tableQuery.pageSize,
      statuses: tableQuery.statuses,
      namePhrase: tableQuery.namePhrase,
      ownerPhrase: tableQuery.ownerPhrase,
      definitionIds: resolvedDefinitionIds,
      officiality: tableQuery.officiality,
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
      parentMxArchivalBranchPhrase: tableQuery.parentMxArchivalBranchPhrase,
      mxVersionPhrase: tableQuery.mxVersionPhrase,
      mxBuildIdPhrase: tableQuery.mxBuildIdPhrase,
      configurationBranchNamePhrase: tableQuery.configurationBranchNamePhrase,
      businessProcessQualityLevel: tableQuery.businessProcessQualityLevel,
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

  private emitQuery() {
    this.paginationParamsChangeEmitter.emit(
      this.mapToDomain(this.binaryUpgradeExecutionsTableQuery)
    );
  }

  setSortOrder(event: TableLazyLoadEvent) {
    if (event.sortField === "sortByExpiryDate") {
      delete this.binaryUpgradeExecutionsTableQuery.sortByStartDate;
      delete this.binaryUpgradeExecutionsTableQuery.sortByDaysExtended;
      this.updateQueryProperty(
        "sortByExpiryDate",
        event.sortOrder === 1 ? "ascending" : "descending"
      );
    } else if (event.sortField === "sortByStartDate") {
      delete this.binaryUpgradeExecutionsTableQuery.sortByExpiryDate;
      delete this.binaryUpgradeExecutionsTableQuery.sortByDaysExtended;
      if (event.sortOrder) {
        this.updateQueryProperty(
          "sortByStartDate",
          event.sortOrder === 1 ? "ascending" : "descending"
        );
      }
    } else if (event.sortField === "sortByDaysExtended") {
      delete this.binaryUpgradeExecutionsTableQuery.sortByStartDate;
      delete this.binaryUpgradeExecutionsTableQuery.sortByExpiryDate;
      if (event.sortOrder) {
        this.updateQueryProperty(
          "sortByDaysExtended",
          event.sortOrder === 1 ? "ascending" : "descending"
        );
      }
    }
  }

  setPaginationParams(pageIndex: number, pageSize: number) {
    this.binaryUpgradeExecutionsTableQuery.pageSize = pageSize;
    if (pageIndex !== this.binaryUpgradeExecutionsTableQuery.page) {
      this.binaryUpgradeExecutionsTableQuery.page = pageIndex;
    } else {
      this.binaryUpgradeExecutionsTableQuery.page = 0;
    }
  }

  private resolveSortParameters() {
    if (this.binaryUpgradeExecutionsTableQuery.sortByStartDate == "ascending") {
      return "startDate,asc";
    }
    if (
      this.binaryUpgradeExecutionsTableQuery.sortByStartDate == "descending"
    ) {
      return "startDate,desc";
    }
    if (
      this.binaryUpgradeExecutionsTableQuery.sortByExpiryDate == "ascending"
    ) {
      return "expiryDate,asc";
    }
    if (
      this.binaryUpgradeExecutionsTableQuery.sortByExpiryDate == "descending"
    ) {
      return "expiryDate,desc";
    }
    if (
      this.binaryUpgradeExecutionsTableQuery.sortByDaysExtended == "ascending"
    ) {
      return "daysExtended,asc";
    }
    if (
      this.binaryUpgradeExecutionsTableQuery.sortByDaysExtended == "descending"
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
