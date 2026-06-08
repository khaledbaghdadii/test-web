import { Injectable, inject, DestroyRef } from "@angular/core";
import { Router, ActivatedRoute, Params, NavigationEnd } from "@angular/router";
import { Observable } from "rxjs";
import { filter, map, distinctUntilChanged, shareReplay } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WorkItemPriority } from "../../../../model/work-item";
import {
  WorkItemBoardUrlFilters,
  DateRange,
} from "../../model/work-item-board-filters.model";

interface FilterConfig {
  urlKey: string;
  filterKey: keyof WorkItemBoardUrlFilters;
  parser?: (value: string) => unknown;
  serializer?: (value: unknown) => string;
  isArray?: boolean;
  isEnum?: boolean;
  enumType?: Record<string, string>;
}

@Injectable()
export class WorkItemBoardUrlSyncService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private syncLock: Promise<void> | null = null;

  private readonly filterConfigs: FilterConfig[] = [
    { urlKey: "search", filterKey: "searchKey" },
    { urlKey: "sortBy", filterKey: "sortBy" },
    { urlKey: "projects", filterKey: "selectedProjects", isArray: true },
    { urlKey: "objectIds", filterKey: "selectedObjectIds", isArray: true },
    { urlKey: "assignees", filterKey: "selectedAssignees", isArray: true },
    { urlKey: "categories", filterKey: "selectedCategories", isArray: true },
    {
      urlKey: "priority",
      filterKey: "selectedPriority",
      isEnum: true,
      enumType: WorkItemPriority,
      serializer: (val: unknown) => (val as WorkItemPriority)?.toLowerCase(),
      parser: (val: string) => val.toUpperCase(),
    },
  ];

  readonly queryParams$: Observable<Params> = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(() => this.route.snapshot.queryParams),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1),
    takeUntilDestroyed(this.destroyRef)
  );

  getFiltersFromUrl(): Partial<WorkItemBoardUrlFilters> {
    const params = this.route.snapshot.queryParams;
    return this.parseParams(params);
  }

  async syncFiltersToUrl(
    filters: WorkItemBoardUrlFilters,
    replaceUrl = true,
    excludeProjects = false
  ): Promise<void> {
    while (this.syncLock) {
      await this.syncLock;
    }
    let releaseLock: (() => void) | undefined;
    this.syncLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    try {
      const queryParams = this.serializeFilters(filters, excludeProjects);
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl,
      });
    } finally {
      if (releaseLock) {
        releaseLock();
      }
      this.syncLock = null;
    }
  }

  private parseParams(params: Params): Partial<WorkItemBoardUrlFilters> {
    const filters: Partial<WorkItemBoardUrlFilters> = {};
    for (const config of this.filterConfigs) {
      this.parseFilterConfig(params, filters, config);
    }
    const dateRange = this.parseDateParams(params);
    if (dateRange) {
      filters.selectedDateRange = dateRange;
    }
    return filters;
  }

  private parseFilterConfig(
    params: Params,
    filters: Partial<WorkItemBoardUrlFilters>,
    config: FilterConfig
  ): void {
    const value = params[config.urlKey];
    if (!value) return;
    if (config.isArray) {
      filters[config.filterKey] = (
        Array.isArray(value) ? value : [value]
      ) as never;
    } else if (config.isEnum && config.enumType) {
      this.parseEnumValue(filters, config, value);
    } else {
      filters[config.filterKey] = (
        config.parser ? config.parser(value) : value
      ) as never;
    }
  }

  private parseEnumValue(
    filters: Partial<WorkItemBoardUrlFilters>,
    config: FilterConfig,
    value: string
  ): void {
    if (!config.enumType) return;
    const parsed = config.parser ? config.parser(value) : value;
    if (this.isValidEnum(config.enumType, parsed as string)) {
      filters[config.filterKey] = parsed as never;
    }
  }

  private serializeFilters(
    filters: WorkItemBoardUrlFilters,
    excludeProjects: boolean
  ): Params {
    const params: Params = {};
    for (const config of this.filterConfigs) {
      if (config.filterKey === "selectedProjects" && excludeProjects) continue;
      const value = filters[config.filterKey];
      if (this.isEmpty(value)) continue;
      params[config.urlKey] = config.serializer
        ? config.serializer(value)
        : value;
    }
    if (filters.selectedDateRange?.startDate) {
      params["dueDateFrom"] = this.toISODate(
        filters.selectedDateRange.startDate
      );
    }
    if (filters.selectedDateRange?.endDate) {
      params["dueDateTo"] = this.toISODate(filters.selectedDateRange.endDate);
    }
    return params;
  }

  private parseDateParams(params: Params): DateRange | null {
    const startDate = this.parseDate(params["dueDateFrom"]);
    const endDate = this.parseDate(params["dueDateTo"]);
    return startDate ?? endDate ? { startDate, endDate } : null;
  }

  private isEmpty(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  }

  private isValidEnum<T extends Record<string, string>>(
    enumObj: T,
    value: string
  ): value is T[keyof T] {
    return Object.values(enumObj).includes(value as T[keyof T]);
  }

  private parseDate(param: string | undefined): Date | null {
    if (!param) return null;
    const date = new Date(param);
    return isNaN(date.getTime()) ? null : date;
  }

  private toISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
