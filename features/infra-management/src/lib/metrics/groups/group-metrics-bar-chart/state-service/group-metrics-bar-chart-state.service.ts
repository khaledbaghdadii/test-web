import { computed, inject, Injectable, signal, Signal } from "@angular/core";

import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from "@angular/core/rxjs-interop";
import {
  GroupedBarChartData,
  GroupMetricsBarChartOptionsGenerator,
} from "../utils/option/group-metrics-bar-chart-option-generator-service";
import {
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { InfraGroupsService } from "../../../../infra-groups/infra-groups.service";
import { GroupMetricsPage } from "../../../../infra-groups/metrics/model/group-metrics-page";
import { GroupMetrics } from "../../../../infra-groups/metrics/model/group-metrics";
import { ProjectInfraConfigService } from "../../../../project-infra-config/project-infra-config.service";
import { ProjectInfraConfig } from "../../../../project-infra-config/model/project-infra-config";

@Injectable()
export class GroupMetricsBarChartStateService {
  groupsService = inject(InfraGroupsService);
  projectInfraConfigService = inject(ProjectInfraConfigService);
  groupMetricsBarChartOptionsGenerator = inject(
    GroupMetricsBarChartOptionsGenerator
  );
  private defaultPageIndex = 0;
  private defaultPageSize = 10;
  private emptyPage: GroupMetricsPage = {
    content: [],
    size: 0,
    number: 0,
    totalPages: 0,
    totalElements: 0,
    last: true,
  };

  private projectIdSubject = new Subject<string>();
  private projectId$ = this.projectIdSubject.asObservable();

  errorMessageSubject = new Subject<string>();

  private groupIdsSubject = new Subject<string[]>();
  private groupIds$ = this.groupIdsSubject.asObservable();
  readonly groupIds: Signal<string[]>;

  private groupNameSubject = new Subject<string[]>();
  private groupNames$ = this.groupNameSubject.asObservable();
  readonly groupNames: Signal<string[] | undefined>;

  readonly groupNamesWithNoMetrics$: Observable<string[]>;
  groupNamesWithNoMetrics: Signal<string[]>;

  private readonly groupMetricsPage$: Observable<GroupMetricsPage>;
  readonly groupMetricsPage: Signal<GroupMetricsPage>;

  groupMetrics: Signal<GroupMetrics[]> = computed(() => {
    return [...(this.groupMetricsPage().content ?? [])];
  });
  groupMetrics$ = toObservable(this.groupMetrics);
  readonly isLoadingData = signal(false);

  private readonly projectInfraConfig$: Observable<ProjectInfraConfig>;

  readonly stackedData$: Observable<GroupedBarChartData>;
  readonly stackedData: Signal<GroupedBarChartData>;

  readonly shouldShowChart = computed(() => {
    const metrics = this.groupMetrics();
    return (
      metrics.length > 0 && !this.isLoadingData() && this.groupIds().length > 0
    );
  });

  readonly shouldShowGroupNamesWithNoMetricsMessage = computed(
    () => !this.isLoadingData() && this.groupNamesWithNoMetrics().length > 0
  );

  constructor() {
    this.groupMetricsPage$ = combineLatest([
      this.projectId$,
      this.groupIds$,
    ]).pipe(
      tap(() => this.setLoadingData(true)),
      switchMap(([projectId, groupIds]) => {
        return this.groupsService
          .getGroupMetrics(
            projectId,
            this.defaultPageSize,
            this.defaultPageIndex,
            groupIds
          )
          .pipe(
            catchError(() => {
              this.setLoadingData(false);
              this.errorMessageSubject.next("Failed to fetch group metrics");
              return of(this.emptyPage);
            })
          );
      }),
      tap(() => this.setLoadingData(false)),
      shareReplay(1),
      takeUntilDestroyed()
    );

    this.groupNamesWithNoMetrics$ = combineLatest([
      this.groupMetrics$,
      this.groupNames$,
    ]).pipe(
      map(([metrics, groupNames]) => {
        const groupsWithMetrics = new Set(
          metrics
            .filter((metric) =>
              metric.groupInfraFamilyMetrics.some(
                (m) => m.remainingNumberOfAllocations !== undefined
              )
            )
            .map((metric) => metric.group.name)
        );
        return groupNames.filter((name) => !groupsWithMetrics.has(name));
      }),
      shareReplay(1),
      takeUntilDestroyed()
    );

    this.groupNamesWithNoMetrics = toSignal(this.groupNamesWithNoMetrics$, {
      initialValue: [],
    });

    this.groupMetricsPage = toSignal(this.groupMetricsPage$, {
      initialValue: this.emptyPage,
    });

    this.groupIds = toSignal(this.groupIds$, {
      initialValue: [],
    });

    this.groupNames = toSignal(this.groupNames$, {
      initialValue: [],
    });

    this.projectInfraConfig$ = this.projectId$.pipe(
      switchMap((projectId) =>
        this.projectInfraConfigService.getProjectInfraConfig(projectId).pipe(
          catchError(() =>
            of({
              groupAllocationNearCapacityThreshold: 0,
            } as ProjectInfraConfig)
          )
        )
      ),
      shareReplay(1),
      takeUntilDestroyed()
    );

    this.stackedData$ = combineLatest([
      this.groupMetrics$,
      this.projectInfraConfig$,
    ]).pipe(
      map(([metrics, config]) =>
        this.groupMetricsBarChartOptionsGenerator.toGroupedData(
          metrics,
          config.groupAllocationNearCapacityThreshold
        )
      )
    );
    this.stackedData = toSignal(this.stackedData$, {
      initialValue: { data: [], families: [] },
    });
  }

  private setLoadingData(isLoading: boolean): void {
    this.isLoadingData.set(isLoading);
  }

  setProjectId(projectId: string) {
    this.projectIdSubject.next(projectId);
  }

  setGroupIds(groupIds: string[]) {
    this.groupIdsSubject.next(groupIds);
  }

  setGroupNames(groupNames: string[]) {
    this.groupNameSubject.next(groupNames);
  }
}
