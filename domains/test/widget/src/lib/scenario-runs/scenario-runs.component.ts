import {
  Component,
  computed,
  contentChild,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  type Signal,
  TemplateRef,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Button } from "primeng/button";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Select } from "primeng/select";
import { FormsModule } from "@angular/forms";
import { TooltipModule } from "primeng/tooltip";
import { Popover, PopoverModule } from "primeng/popover";
import { InputTextModule } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import {
  AnalysisStatusDisplayComponent,
  AssigneeDisplayComponent,
  ScenarioRunNameDisplayComponent,
  ScenarioRunStatusDisplayComponent,
  ScenarioRunTableComponent,
} from "@mxevolve/domains/test/ui";
import { EnvironmentStatusDisplayComponent } from "@mxevolve/domains/environment/ui";
import { EnvironmentStatusPanelComponent } from "@mxevolve/domains/environment/widget";
import {
  EnvironmentService,
  ManagementRequestService,
} from "@mxevolve/domains/environment/data-access";
import {
  CommitIdDisplayComponent,
  DurationDisplayComponent,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { RouterLink } from "@angular/router";
import {
  AuthenticationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { StreamsService } from "@mxflow/features/streams";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import {
  ScenarioDefinitionService,
  ScenarioRunService,
  TestDefinitionService,
  TestUnitService,
} from "@mxevolve/domains/test/data-access";
import { GroupService, UserService } from "@mxevolve/domains/user/data-access";
import { catchError, map, of, switchMap } from "rxjs";
import type { HeadScenarioRunViewModel } from "./head-scenario-run-view-model";
import {
  ScenarioRunsPanelFacadeService,
  type ScenarioRunsPanelViewModel,
} from "./scenario-runs-panel-facade.service";
import {
  computeDurationBreakdown,
  type DurationBreakdownDisplay,
} from "./duration-breakdown.util";
import { AbortScenarioRunButtonComponent } from "../abort-scenario-run-button/abort-scenario-run-button.component";
import { EnvironmentLinkButtonComponent } from "../environment-link-button/environment-link-button.component";
import { RerunScenarioButtonComponent } from "../rerun-scenario-button/rerun-scenario-button.component";
import type { RerunMode } from "../rerun-dialog/rerun-dialog.component";
import { ScenarioRunAssigneeDropdownComponent } from "../assignee-dropdown/scenario-run-assignee-dropdown.component";
import type { SummaryFilterEvent } from "../scenario-runs-summary/summary-filter-event";
import { BulkRerunScenariosComponent } from "../bulk-rerun-scenarios/bulk-rerun-scenarios.component";
import {
  type AssigneeFilterValue,
  panelPassesAssigneeFilter,
} from "./assignee-filter.util";

const CLOSED_INCIDENT_STATUSES = new Set(["CLOSED", "DUPLICATE", "CANCEL"]);

@Component({
  selector: "mxevolve-scenario-runs",
  imports: [
    NgTemplateOutlet,
    Button,
    ToggleSwitch,
    Select,
    FormsModule,
    RouterLink,
    MxevolveIconComponent,
    ScenarioRunStatusDisplayComponent,
    ScenarioRunNameDisplayComponent,
    AnalysisStatusDisplayComponent,
    AssigneeDisplayComponent,
    ScenarioRunTableComponent,
    EnvironmentStatusDisplayComponent,
    EnvironmentStatusPanelComponent,
    CommitIdDisplayComponent,
    DurationDisplayComponent,
    AbortScenarioRunButtonComponent,
    EnvironmentLinkButtonComponent,
    RerunScenarioButtonComponent,
    ScenarioRunAssigneeDropdownComponent,
    ShowElementIfAuthorizedDirective,
    TooltipModule,
    PopoverModule,
    InputTextModule,
    IconField,
    InputIcon,
    BulkRerunScenariosComponent,
  ],
  providers: [
    ScenarioRunsPanelFacadeService,
    ScenarioRunService,
    ScenarioDefinitionService,
    TestDefinitionService,
    EnvironmentService,
    ManagementRequestService,
    UserService,
    TestUnitService,
    GroupService,
    StreamsService,
  ],
  templateUrl: "./scenario-runs.component.html",
})
export class ScenarioRunsComponent implements OnInit {
  readonly projectId = input.required<string>();
  readonly contextId = input<string>();
  readonly subContextId = input<string>();
  readonly scenarioRunIds = input<string[]>();
  /**
   * Business process execution name used to filter the global operations
   * detections/incidents dashboards when redirecting from the test unit
   * findings. Defaults to "" so consumers without a process execution name
   * do not add the filter.
   */
  readonly bpExecutionName = input<string>("");
  readonly showEnvironmentDetails = input<boolean>(true);
  /**
   * When true, the environment status panel for a run is only rendered once
   * that run's row has been expanded via the collapse/expand chevron.
   * Defaults to false so existing consumers keep showing it unconditionally.
   */
  readonly showEnvironmentDetailsOnlyWhenExpanded = input<boolean>(false);
  readonly showEnvironmentLink = input<boolean>(true);
  readonly showHistory = input<boolean>(false);
  readonly showHistorySummary = input<boolean>(true);
  readonly showBulkRerun = input<boolean>(false);
  showTopBarActions = input(false);
  readonly topBarTemplate = contentChild<TemplateRef<unknown>>("topBar");
  readonly detailsExpandedByDefault = input<boolean>(false);
  readonly showActionButtons = input<boolean>(true);
  readonly warningMessageMap = input<Record<string, string>>();
  readonly filter = input<SummaryFilterEvent[]>([]);
  readonly allowOfficialRerun = input(false);
  readonly initialFinalProductId = input<string>();
  readonly branch = input<string>();
  readonly enableKeepServices = input(false);
  readonly defaultRerunMode = input<RerunMode>("unofficial");
  readonly showOpenConfigEditorAction = input(false);
  /**
   * When true, the environment status panel for a given run is removed once
   * that environment reports it has been cleaned. Defaults to false so most
   * consumers keep showing the panel regardless of status.
   */
  readonly hideEnvironmentPanelWhenCleaned = input(false);
  readonly hideIncidents = input(false);
  /**
   * When true, panels are sorted by head.startDate descending (latest run
   * first). Defaults to false to preserve the natural API/testUnits order
   * for existing consumers.
   */
  readonly sortPanelsByStartDateDesc = input<boolean>(false);

  private readonly scenarioRunsPanelFacade = inject(
    ScenarioRunsPanelFacadeService
  );
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly groupsService = inject(GroupService);
  private readonly streamsService = inject(StreamsService);
  private readonly authService = inject(AuthenticationService);

  readonly currentUserId: Signal<string | null> = computed(
    () => this.authService.currentUserInfo()?.userId ?? null
  );

  private readonly userStreamBpcIdsResource = rxResource({
    params: () => this.projectId(),
    stream: ({ params: projectId }) =>
      this.groupsService.getAllTransitiveGroups().pipe(
        switchMap((groups) => {
          const groupIds = new Set(groups.map((g) => g.id));
          return this.streamsService.getStreams(projectId).pipe(
            map((streams) => {
              const bpcIds = new Set<string>();
              for (const stream of streams) {
                if (stream.owners.some((o) => groupIds.has(o.id))) {
                  for (const bpc of stream.businessProcessChains) {
                    bpcIds.add(String(bpc.id));
                  }
                }
              }
              return bpcIds;
            }),
            catchError(() => of(new Set<string>()))
          );
        }),
        catchError(() => of(new Set<string>()))
      ),
  });

  private readonly userStreamBpcIds = computed(
    () => this.userStreamBpcIdsResource.value() ?? new Set<string>()
  );

  readonly panels = signal<ScenarioRunsPanelViewModel[]>([]);
  readonly loading = signal(false);
  private readonly expandedPanelIds = signal(new Set<string>());
  private readonly historyVisiblePanelIds = signal(new Set<string>());
  readonly searchTerm = signal("");
  private readonly cleanedEnvironmentIds = signal(new Set<string>());

  onEnvironmentCleaned(environmentId: string): void {
    if (!environmentId || this.cleanedEnvironmentIds().has(environmentId)) {
      return;
    }
    const updated = new Set(this.cleanedEnvironmentIds());
    updated.add(environmentId);
    this.cleanedEnvironmentIds.set(updated);
  }

  isEnvironmentPanelHidden(environmentId: string): boolean {
    return (
      this.hideEnvironmentPanelWhenCleaned() &&
      this.cleanedEnvironmentIds().has(environmentId)
    );
  }

  readonly assigneeFilterOptions: {
    label: string;
    value: AssigneeFilterValue;
  }[] = [
    { label: "Not Assigned", value: "not-assigned" },
    { label: "Assigned to me", value: "assigned-to-me" },
    { label: "Assigned to my stream", value: "assigned-to-my-stream" },
  ];
  readonly assigneeFilter = signal<AssigneeFilterValue>(null);

  readonly isAllExpanded = computed(
    () =>
      this.filteredPanels().length > 0 &&
      this.filteredPanels().every((p) => this.expandedPanelIds().has(p.head.id))
  );

  readonly filteredPanels = computed(() => {
    let result = this.panels();
    const activeFilters = this.filter();
    if (activeFilters.length > 0) {
      result = result.filter((panel) =>
        activeFilters.some((activeFilter) => {
          switch (activeFilter.type) {
            case "analysisStatus":
              return panel.head.analysisStatus === activeFilter.value;
            case "detection":
              switch (activeFilter.value) {
                case "wasteReasons":
                  return panel.filterData.hasWasteReasons;
                case "regressions":
                  return panel.filterData.hasRegressions;
                case "impacts":
                  return panel.filterData.hasImpacts;
                default:
                  return false;
              }
            case "incident":
              if (activeFilter.value === "total") {
                return panel.filterData.hasIncidents;
              }
              if (activeFilter.value === "closed") {
                return panel.filterData.incidentStatuses.some((s) =>
                  CLOSED_INCIDENT_STATUSES.has(s.toUpperCase())
                );
              }
              return panel.filterData.incidentStatuses.some(
                (s) => s === activeFilter.value
              );
            default:
              return true;
          }
        })
      );
    }
    const term = this.searchTerm().toLowerCase();
    if (term) {
      result = result.filter((panel) => {
        const head = panel.head;
        return [
          head.name,
          head.status,
          head.analysisStatus,
          head.assigneeDisplayName,
          head.commitId,
          head.mxVersion,
          head.mxBuildId,
          head.startDate,
          head.endDate,
        ]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(term));
      });
    }
    const assigneeFilterValue = this.assigneeFilter();
    if (assigneeFilterValue) {
      const userId = this.currentUserId() ?? "";
      const streamBpcIds = this.userStreamBpcIds();
      result = result.filter((panel) =>
        panelPassesAssigneeFilter(
          panel,
          assigneeFilterValue,
          userId,
          streamBpcIds
        )
      );
    }
    if (this.sortPanelsByStartDateDesc()) {
      result = [...result].sort(
        (a, b) =>
          new Date(b.head.startDate).getTime() -
          new Date(a.head.startDate).getTime()
      );
    }
    return result;
  });

  private static readonly PASSED_STATUSES = new Set([ScenarioRunStatus.PASSED]);
  private static readonly FAILED_STATUSES = new Set([
    ScenarioRunStatus.FAILED,
    ScenarioRunStatus.ABORTED,
    ScenarioRunStatus.FAILED_TO_ABORT,
  ]);

  isDetailsExpanded(panelId: string): boolean {
    return this.expandedPanelIds().has(panelId);
  }

  isHistoryVisible(panelId: string): boolean {
    return this.historyVisiblePanelIds().has(panelId);
  }

  toggleDetails(panelId: string): void {
    this.expandedPanelIds.update((set) => {
      const next = new Set(set);
      if (next.has(panelId)) next.delete(panelId);
      else next.add(panelId);
      return next;
    });
  }

  toggleHistory(panelId: string): void {
    this.historyVisiblePanelIds.update((set) => {
      const next = new Set(set);
      if (next.has(panelId)) next.delete(panelId);
      else next.add(panelId);
      return next;
    });
  }

  toggleExpandAll(): void {
    if (this.isAllExpanded()) {
      this.collapseAll();
    } else {
      this.expandAll();
    }
  }

  private expandAll(): void {
    this.expandedPanelIds.set(
      new Set(this.filteredPanels().map((p) => p.head.id))
    );
  }

  private collapseAll(): void {
    this.expandedPanelIds.set(new Set());
  }

  getDetectionsLink(run: HeadScenarioRunViewModel): string {
    return `/app/${this.projectId()}/test/execution/details/${run.id}`;
  }

  getDetectionsDashboardLink(): string {
    return "/global-operations/detections";
  }

  getDetectionsDashboardQueryParams(
    run: HeadScenarioRunViewModel,
    category: "Impact" | "Regression"
  ): Record<string, unknown> {
    return {
      projectIds: [this.projectId()],
      ...(run.name ? { scenarioDefinitionNamePhrases: [run.name] } : {}),
      ...(this.bpExecutionName()
        ? { businessProcessExecutionNamePhrase: this.bpExecutionName() }
        : {}),
      category,
    };
  }

  getIncidentsDashboardLink(): string {
    return "/global-operations/incidents";
  }

  getIncidentsDashboardQueryParams(
    run: HeadScenarioRunViewModel
  ): Record<string, unknown> {
    return {
      projectIds: [this.projectId()],
      ...(run.name ? { scenarioDefinitionNamePhrases: [run.name] } : {}),
      ...(this.bpExecutionName()
        ? { businessProcessExecutionNamePhrase: this.bpExecutionName() }
        : {}),
    };
  }

  getHistoryLink(run: HeadScenarioRunViewModel): string {
    return `/app/${this.projectId()}/test/execution/details/${run.id}`;
  }

  getDurationBreakdown(
    panel: ScenarioRunsPanelViewModel
  ): DurationBreakdownDisplay | null {
    return computeDurationBreakdown(panel.head, panel.durationBreakdown);
  }

  showDurationPopover(
    event: Event,
    popover: Popover,
    panel: ScenarioRunsPanelViewModel
  ): void {
    if (this.getDurationBreakdown(panel)) {
      popover.show(event);
    }
  }

  hideDurationPopover(popover: Popover): void {
    popover.hide();
  }

  private historyRunStatuses(
    panel: ScenarioRunsPanelViewModel
  ): readonly ScenarioRunStatus[] {
    return [panel.head.status, ...panel.previousRuns.map((run) => run.status)];
  }

  passedRunCount(panel: ScenarioRunsPanelViewModel): number {
    return this.historyRunStatuses(panel).filter((status) =>
      ScenarioRunsComponent.PASSED_STATUSES.has(status)
    ).length;
  }

  failedRunCount(panel: ScenarioRunsPanelViewModel): number {
    return this.historyRunStatuses(panel).filter((status) =>
      ScenarioRunsComponent.FAILED_STATUSES.has(status)
    ).length;
  }

  underwayRunCount(panel: ScenarioRunsPanelViewModel): number {
    return this.historyRunStatuses(panel).filter(
      (status) =>
        !ScenarioRunsComponent.PASSED_STATUSES.has(status) &&
        !ScenarioRunsComponent.FAILED_STATUSES.has(status)
    ).length;
  }

  readonly scenarioChanged = output<void>();
  readonly scenarioRunsFetched = output<string[]>();

  ngOnInit(): void {
    this.loadPanels();
  }

  onScenarioChanged(): void {
    this.scenarioChanged.emit();
    this.loadPanels();
  }

  onAssigneeChanged(panelId: string, newAssigneeId: string | null): void {
    this.panels.update((panels) =>
      panels.map((panel) =>
        panel.head.id === panelId
          ? {
              ...panel,
              head: { ...panel.head, assigneeId: newAssigneeId ?? "" },
            }
          : panel
      )
    );
  }

  onBulkRerunCompleted(): void {
    this.scenarioChanged.emit();
    this.loadPanels();
  }

  private loadPanels(): void {
    this.loading.set(true);

    this.scenarioRunsPanelFacade
      .fetch({
        projectId: this.projectId(),
        contextId: this.contextId(),
        subContextId: this.subContextId(),
        scenarioRunIds: this.scenarioRunIds(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (panels) => {
          this.scenarioRunsFetched.emit(panels.map((panel) => panel.head.id));
          this.panels.set(panels);
          this.initPanelStates(panels);
          this.loading.set(false);
        },
        error: () => {
          this.toastMessageService.showError("Failed to load scenario runs.");
          this.loading.set(false);
        },
      });
  }

  private initPanelStates(results: ScenarioRunsPanelViewModel[]): void {
    if (this.detailsExpandedByDefault()) {
      this.expandedPanelIds.set(new Set(results.map((r) => r.head.id)));
    } else {
      this.expandedPanelIds.set(new Set());
    }
  }
}
