import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { Skeleton } from "primeng/skeleton";
import { catchError, forkJoin, map, of } from "rxjs";
import type {
  ScenarioRunApiResponse,
  TestUnitApiModel,
} from "@mxevolve/domains/test/data-access";
import {
  ScenarioRunService,
  TestUnitService,
} from "@mxevolve/domains/test/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { ScenarioRunsSummaryAggregationService } from "./scenario-runs-summary-aggregation.service";
import { SummaryDropdownComponent } from "./summary-dropdown/summary-dropdown.component";
import { SummaryItemComponent } from "./summary-item/summary-item.component";
import type { SummaryDropdownItem } from "./summary-dropdown/summary-dropdown-item";
import type { SummaryFilterEvent } from "./summary-filter-event";

@Component({
  selector: "mxevolve-scenario-runs-summary",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MxevolveIconComponent,
    RouterLink,
    ShowElementIfAuthorizedDirective,
    Skeleton,
    SummaryItemComponent,
    SummaryDropdownComponent,
  ],
  providers: [
    ScenarioRunsSummaryAggregationService,
    ScenarioRunService,
    TestUnitService,
  ],
  templateUrl: "./scenario-runs-summary.component.html",
})
export class ScenarioRunsSummaryComponent {
  readonly projectId = input.required<string>();
  readonly contextId = input.required<string>();
  readonly subContextId = input.required<string>();
  readonly bpExecutionName = input.required<string>();

  readonly externalFilter = input<SummaryFilterEvent[]>([]);
  readonly hideIncidents = input(false);

  readonly filterClicked = output<SummaryFilterEvent>();

  private readonly elementRef = inject(ElementRef);
  private readonly scenarioRunService = inject(ScenarioRunService);
  private readonly testUnitService = inject(TestUnitService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly aggregationService = inject(
    ScenarioRunsSummaryAggregationService
  );

  readonly scenarioRunsResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      contextId: this.contextId(),
      subContextId: this.subContextId(),
    }),
    stream: ({ params }) =>
      forkJoin({
        runs: this.scenarioRunService.fetch(
          params.projectId,
          params.contextId,
          params.subContextId
        ),
        testUnits: this.testUnitService.fetch({
          projectId: params.projectId,
          contextId: params.contextId,
          subContextId: params.subContextId,
        }),
      }).pipe(
        map(({ runs, testUnits }) => ({
          runs,
          headRunIds: new Set(
            testUnits.map((tu: TestUnitApiModel) => tu.headScenarioExecutionId)
          ),
        })),
        catchError(() => {
          this.toastMessageService.showError(
            "Failed to load scenario runs summary"
          );
          return of({
            runs: [] as ScenarioRunApiResponse[],
            headRunIds: new Set<string>(),
          });
        })
      ),
  });

  readonly scenarioRuns = computed(
    () => this.scenarioRunsResource.value()?.runs ?? []
  );
  readonly headRunIds = computed(
    () => this.scenarioRunsResource.value()?.headRunIds ?? new Set<string>()
  );
  readonly isLoading = computed(() => this.scenarioRunsResource.isLoading());

  readonly analysisStatus = computed(() =>
    this.aggregationService.aggregateAnalysisStatuses(
      this.scenarioRuns(),
      this.headRunIds()
    )
  );
  readonly detections = computed(() =>
    this.aggregationService.aggregateDetections(this.scenarioRuns())
  );
  readonly incidents = computed(() =>
    this.aggregationService.aggregateIncidents(this.scenarioRuns())
  );

  readonly notStartedDropdownItems = computed<SummaryDropdownItem[]>(() => [
    {
      value: "NA",
      label: "N/A",
      count: this.analysisStatus().na,
      active: this.isActive("analysisStatus", "NA"),
    },
    {
      value: "Assigned",
      label: "Assigned",
      count: this.analysisStatus().assigned,
      active: this.isActive("analysisStatus", "Assigned"),
    },
  ]);

  readonly doneDropdownItems = computed<SummaryDropdownItem[]>(() => [
    {
      value: "Passed",
      label: "Passed",
      count: this.analysisStatus().passed,
      active: this.isActive("analysisStatus", "Passed"),
    },
    {
      value: "Failed",
      label: "Failed",
      count: this.analysisStatus().failed,
      active: this.isActive("analysisStatus", "Failed"),
    },
    {
      value: "Cancelled",
      label: "Cancelled",
      count: this.analysisStatus().cancelled,
      active: this.isActive("analysisStatus", "Cancelled"),
    },
  ]);

  readonly openIncidentsDropdownItems = computed<SummaryDropdownItem[]>(() =>
    this.incidents().openBreakdown.map((s) => ({
      value: s.name,
      label: s.name,
      count: s.count,
      active: this.isActive("incident", s.name),
    }))
  );

  /** Mirrors parent-controlled filter array for internal use */
  readonly activeFilters = linkedSignal<SummaryFilterEvent[]>(() =>
    this.externalFilter()
  );

  /** Which dropdown is open: 'notStarted' | 'done' | 'openIncidents' | null */
  readonly openDropdown = signal<
    "notStarted" | "done" | "openIncidents" | null
  >(null);

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openDropdown.set(null);
    }
  }

  isActive(type: SummaryFilterEvent["type"], value: string): boolean {
    return this.activeFilters().some(
      (f) => f.type === type && f.value === value
    );
  }

  isDropdownParentActive(
    dropdown: "notStarted" | "done" | "openIncidents"
  ): boolean {
    const filters = this.activeFilters();
    if (dropdown === "notStarted") {
      return filters.some(
        (f) =>
          f.type === "analysisStatus" &&
          (f.value === "NA" || f.value === "Assigned")
      );
    }
    if (dropdown === "done") {
      return filters.some(
        (f) =>
          f.type === "analysisStatus" &&
          (f.value === "Passed" ||
            f.value === "Failed" ||
            f.value === "Cancelled")
      );
    }
    return filters.some(
      (f) =>
        f.type === "incident" &&
        f.value !== "open" &&
        f.value !== "closed" &&
        f.value !== "total"
    );
  }

  toggleDropdown(dropdown: "notStarted" | "done" | "openIncidents"): void {
    this.openDropdown.update((current) =>
      current === dropdown ? null : dropdown
    );
  }

  onFilterClick(type: SummaryFilterEvent["type"], value: string): void {
    this.openDropdown.set(null);
    const label = this.computeLabel(type, value);
    this.filterClicked.emit({ type, value, label });
  }

  onDropdownItemClick(type: SummaryFilterEvent["type"], value: string): void {
    this.openDropdown.set(null);
    const label = this.computeLabel(type, value);
    this.filterClicked.emit({ type, value, label });
  }

  private computeLabel(
    type: SummaryFilterEvent["type"],
    value: string
  ): string {
    const dummy: SummaryFilterEvent = { type, value, label: "" };
    const count = this.getFilterCount(dummy);
    const label = this.getFilterLabel(dummy);
    return `${count} ${label}`;
  }

  private getFilterCount(filter: SummaryFilterEvent): number {
    const status = this.analysisStatus();
    const det = this.detections();
    const inc = this.incidents();

    switch (filter.type) {
      case "analysisStatus":
        switch (filter.value) {
          case "Under Analysis":
            return status.underAnalysis;
          case "Incident Sent":
            return status.incidentSent;
          case "NA":
            return status.na;
          case "Assigned":
            return status.assigned;
          case "Passed":
            return status.passed;
          case "Failed":
            return status.failed;
          case "Cancelled":
            return status.cancelled;
          default:
            return 0;
        }
      case "detection":
        switch (filter.value) {
          case "wasteReasons":
            return det.wasteReasonCount;
          case "regressions":
            return det.regressionCount;
          case "impacts":
            return det.impactCount;
          default:
            return 0;
        }
      case "incident":
        if (filter.value === "closed") return inc.closedCount;
        if (filter.value === "total") return inc.totalCount;
        return (
          inc.openBreakdown.find((s) => s.name === filter.value)?.count ?? 0
        );
    }
  }

  private getFilterLabel(filter: SummaryFilterEvent): string {
    switch (filter.type) {
      case "analysisStatus":
        return filter.value === "NA" ? "N/A" : filter.value;
      case "detection":
        switch (filter.value) {
          case "wasteReasons":
            return "Waste Reasons";
          case "regressions":
            return "Regressions";
          case "impacts":
            return "Impacts";
          default:
            return filter.value;
        }
      case "incident":
        if (filter.value === "closed") return "Closed Incidents";
        if (filter.value === "total") return "Total Incidents";
        return filter.value;
    }
  }
}
