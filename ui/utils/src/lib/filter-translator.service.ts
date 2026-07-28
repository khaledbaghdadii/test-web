import { Injectable } from "@angular/core";
import { TableLazyLoadEvent } from "primeng/table";
import { FilterMetadata } from "primeng/api";

@Injectable({
  providedIn: "root",
})
export class FilterTranslatorService {
  constructor() {}

  handleTableFiltersChange<T extends PageCriteria>(
    event: TableLazyLoadEvent,
    options: FilterTranslatorOptions = { markEmptyStringAsUndefined: false }
  ): T {
    const dashboardQuery: T = {} as unknown as T;
    this.extractFilters(event).forEach((filter) => {
      this.addFilterToQuery(dashboardQuery, filter, options);
    });

    this.setPaginationCriteria(event, dashboardQuery);

    return dashboardQuery;
  }

  private setPaginationCriteria<T extends PageCriteria>(
    event: TableLazyLoadEvent,
    dashboardQuery: T
  ) {
    if (event.rows) {
      dashboardQuery.pageSize = event.rows;

      if (event.first !== undefined) {
        dashboardQuery.page = Math.floor(event.first / event.rows);
      }
    }
  }

  private addFilterToQuery<T>(
    dashboardQuery: T,
    filter: Filter,
    options: FilterTranslatorOptions
  ) {
    if (
      options.markEmptyStringAsUndefined &&
      typeof filter.getValue() === "string"
    ) {
      dashboardQuery[filter.key as keyof T] =
        this.markEmptyStringAsUndefined(filter);
    } else {
      dashboardQuery[filter.key as keyof T] = filter.getValue();
    }
  }

  private markEmptyStringAsUndefined(filter: Filter) {
    return filter.getValue()?.trim() ? filter.getValue() : undefined;
  }

  private extractFilters(event: TableLazyLoadEvent): Filter[] {
    return Object.entries(event.filters ?? {}).map(
      ([key, value]) => new Filter(key, value)
    );
  }
}

class Filter {
  key: string;
  value?: FilterMetadata | FilterMetadata[];

  constructor(
    key: string,
    value: FilterMetadata | FilterMetadata[] | undefined
  ) {
    this.key = key;
    this.value = value;
  }

  getValue() {
    let filterValue;
    if (Array.isArray(this.value)) {
      filterValue = this.value[0].value;
    } else {
      filterValue = this.value?.value;
    }

    if (!Array.isArray(filterValue) || filterValue?.length != 0) {
      return filterValue;
    }

    return undefined;
  }
}

interface PageCriteria {
  page?: number;
  pageSize?: number;
}

interface FilterTranslatorOptions {
  markEmptyStringAsUndefined: boolean;
}
