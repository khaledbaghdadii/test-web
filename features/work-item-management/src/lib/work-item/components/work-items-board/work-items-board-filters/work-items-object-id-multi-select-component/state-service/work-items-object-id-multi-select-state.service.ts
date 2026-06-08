import { Injectable, inject, signal, computed, effect } from "@angular/core";
import { finalize } from "rxjs";
import { WorkItemFilterApiRequest } from "../../../../../services/work-item-api/request/work-item-filter-api-request.model";
import { WorkItemService } from "../../../../../services/work-item-api/work-item.service";
import { WorkItemStatus } from "../../../../../model/work-item";

export interface WorkItemObjectIdOption {
  id: string;
}

@Injectable()
export class WorkItemsObjectIdMultiSelectStateService {
  private readonly workItemService = inject(WorkItemService);

  private readonly pageIndexSubject = signal(0);
  private readonly searchKeySubject = signal("");
  private readonly projectIdsSubject = signal<string[] | undefined>(undefined);
  private readonly workItemStatusesSubject = signal<
    WorkItemStatus[] | undefined
  >(undefined);

  readonly pageIndexSignal = computed(() => this.pageIndexSubject());
  readonly searchKeySignal = computed(() => this.searchKeySubject());
  readonly projectIdsSignal = computed(() => this.projectIdsSubject());
  readonly workItemStatusesSignal = computed(() =>
    this.workItemStatusesSubject()
  );

  readonly isLoadingDataSignal = signal(false);
  readonly isLastPageSignal = signal(false);
  readonly errorMessageSignal = signal("");
  readonly workItemObjectIdOptionsSignal = signal<WorkItemObjectIdOption[]>([]);

  private readonly pageSize = 20;

  constructor() {
    effect(() => {
      this.fetchPage(
        this.pageIndexSignal(),
        this.searchKeySignal(),
        this.projectIdsSignal(),
        this.workItemStatusesSignal()
      );
    });
  }

  setPageIndexSubject(next: number): void {
    this.pageIndexSubject.set(next);
  }

  setSearchKeySubject(next: string): void {
    this.searchKeySubject.set(next);
  }

  setProjectIdsSubject(next: string[] | undefined): void {
    this.projectIdsSubject.set(next);
    this.pageIndexSubject.set(0);
    this.workItemObjectIdOptionsSignal.set([]);
    this.isLastPageSignal.set(false);
  }

  setWorkItemStatusesSubject(next: WorkItemStatus[] | undefined): void {
    this.workItemStatusesSubject.set(next);
    this.pageIndexSubject.set(0);
    this.workItemObjectIdOptionsSignal.set([]);
    this.isLastPageSignal.set(false);
  }

  private fetchPage(
    page: number,
    searchKey: string,
    projectIds?: string[],
    workItemStatuses?: WorkItemStatus[]
  ): void {
    if (this.isLastPageSignal() && page > 0) return;
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const filter: WorkItemFilterApiRequest = {
      search: searchKey || undefined,
      projectIds: projectIds?.length ? projectIds : undefined,
      workItemStatuses: workItemStatuses?.length ? workItemStatuses : undefined,
      resolvedDateSince: fiveDaysAgo.toISOString(),
    };

    this.isLoadingDataSignal.set(true);
    this.errorMessageSignal.set("");

    this.workItemService
      .getFilteredWorkItems(filter, page, this.pageSize, "objectId,asc")
      .pipe(finalize(() => this.isLoadingDataSignal.set(false)))
      .subscribe({
        next: (resp) => {
          const newIds = resp.content
            .map((w) => w.objectId)
            .filter((id) => !!id) as string[];
          const isFirstPage = page === 0;
          const existing = isFirstPage
            ? []
            : this.workItemObjectIdOptionsSignal();

          const uniqueAppended = newIds
            .filter((id) => !existing.some((e) => e.id === id))
            .map((id) => ({ id }));

          this.workItemObjectIdOptionsSignal.set([
            ...existing,
            ...uniqueAppended,
          ]);
          this.isLastPageSignal.set(resp.last);
        },
        error: (err) => {
          this.errorMessageSignal.set(
            err?.message || "Failed to load work item IDs"
          );
        },
      });
  }
}
