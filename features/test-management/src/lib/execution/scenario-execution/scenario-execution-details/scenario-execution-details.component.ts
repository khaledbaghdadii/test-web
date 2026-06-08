import { Location } from "@angular/common";
import { Component, computed, inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { AuthorizationService } from "@mxflow/core/auth";
import { User, UserService } from "@mxflow/features/user";
import {
  ValidationScope,
  ValidationScopeService,
} from "@mxflow/features/validation-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  catchError,
  concatMap,
  defer,
  finalize,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
  throwError,
} from "rxjs";
import { ScenarioExecutionStateManagementService } from "./scenario-execution-state-management.service";
import {
  AnalysisStatusEligibility,
  AnalysisStatusUpdateIneligibilityReason,
} from "../scenario-analysis-status/analysis-status-eligibility";
import { ScenarioAnalysisStatus } from "../scenario-analysis-status/scenario-analysis-status";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { TestUnitScenarioExecutionModel } from "../../test-unit/test-unit.model";
import { Title } from "@angular/platform-browser";
import { ProjectService } from "@mxflow/features/project";

@Component({
  selector: "mxevolve-scenario-execution-details",
  templateUrl: "./scenario-execution-details.component.html",
  standalone: false,
})
export class ScenarioExecutionDetailsComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly scenarioExecutionService = inject(ScenarioExecutionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly validationScopeService = inject(ValidationScopeService);
  private readonly authorizationService = inject(AuthorizationService);
  readonly stateService = inject(ScenarioExecutionStateManagementService);
  private readonly title = inject(Title);
  private readonly projectService = inject(ProjectService);

  selectedScenarioExecution = this.stateService.scenarioExecution;
  selectedScenarioExecutionId = this.stateService.scenarioExecutionId;
  projectId = this.stateService.projectId;
  isLoading = this.stateService.isScenarioExecutionDetailsLoading;
  scenarioExecutionHistory = computed(
    () => this.stateService.testUnit()?.scenarioExecutions ?? []
  );
  validationScopeEnabled = computed(
    () => this.stateService.testUnit()?.validationScopeEnabled ?? false
  );
  incidentEnabled = computed(
    () => this.stateService.testUnit()?.incidentEnabled ?? false
  );

  readonly destroy$ = new Subject();
  isScenarioExecutionFinished: boolean;
  assignee: User | null = null;
  fetchedComment: string;
  comment = "";
  tabIndex = 0;
  isDetectionsSelected: boolean;
  analysisStatusEligibility: AnalysisStatusEligibility;
  projectName: string;

  private static readonly TAB_NAME_TO_INDEX: Record<string, number> = {
    details: 0,
    detections: 1,
    incidents: 2,
    history: 3,
  };
  private static readonly TAB_INDEX_TO_NAME: Record<number, string> = {
    0: "details",
    1: "detections",
    2: "incidents",
    3: "history",
  };

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: Params) => {
        this.initializeScenarioExecutionDetails(
          params["projectId"],
          params["scenario-execution-id"]
        );
      });

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParams) => {
        const tab = queryParams["tab"];
        if (
          tab &&
          ScenarioExecutionDetailsComponent.TAB_NAME_TO_INDEX[tab] !== undefined
        ) {
          this.tabIndex =
            ScenarioExecutionDetailsComponent.TAB_NAME_TO_INDEX[tab];
        }
      });
  }

  private initializeScenarioExecutionDetails(
    projectId: string,
    scenarioExecutionId: string
  ) {
    this.stateService.setLoading(true);
    this.applyTabFromQueryParams();
    return this.projectService
      .getProjectById(projectId)
      .pipe(
        tap((project) => {
          this.projectName = project.name;
        }),
        concatMap(() => {
          return this.stateService.initialize(scenarioExecutionId);
        }),
        concatMap(() => {
          this.isScenarioExecutionFinished =
            this.selectedScenarioExecution()?.isFinished;
          this.fetchedComment = this.selectedScenarioExecution()?.comment || "";

          const assignee = this.stateService.testUnit()?.assignee;
          if (assignee) {
            return this.userService.getUserById(assignee, this.projectId());
          }
          return of(null);
        }),
        concatMap((assigneeResponse) => {
          this.assignee = assigneeResponse;
          return this.getValidationScope();
        }),
        concatMap((validationScope) => {
          this.stateService.setValidationScope(validationScope);
          return this.authorizationService.isAuthorized(
            {
              action: "read_analysis_status",
              attributes: {},
              package: "test",
              resource: "scenario_execution",
            },
            this.projectId()
          );
        }),
        concatMap((authorizedToReadAnalysisStatus) => {
          if (authorizedToReadAnalysisStatus) {
            return this.scenarioExecutionService.checkAnalysisStatusesEligibility(
              this.projectId(),
              this.selectedScenarioExecutionId()
            );
          } else {
            return of(undefined);
          }
        }),
        tap((analysisStatusEligibility) => {
          if (analysisStatusEligibility) {
            this.analysisStatusEligibility = analysisStatusEligibility;
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          const scenarioName = this.selectedScenarioExecution()?.name;
          this.title.setTitle(
            `Test Execution - ${scenarioName} - ${this.projectName}`
          );
          this.stateService.setLoading(false);
        },
        error: (error) => {
          this.handleError(error);
          this.stateService.setLoading(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  updateAnalysisStatus(analysisStatus: ScenarioAnalysisStatus) {
    this.stateService.setLoading(true);
    this.scenarioExecutionService
      .updateAnalysisStatus(
        this.projectId(),
        this.selectedScenarioExecutionId(),
        analysisStatus
      )
      .pipe(
        concatMap(() => this.stateService.refreshSelectedScenarioExecution$()),
        finalize(() => this.stateService.setLoading(false))
      )
      .subscribe({
        error: (err) => {
          this.handleError(err);
        },
      });
  }

  setAssignee(assigneeId: string): void {
    if (assigneeId) {
      this.getAssigneeById(assigneeId);
    } else {
      this.assignee = null;
    }
    if (this.selectedScenarioExecution()) {
      this.stateService.setLoading(true);
      this.stateService
        .refreshSelectedScenarioExecution$()
        .pipe(finalize(() => this.stateService.setLoading(false)))
        .subscribe();
    }
  }

  handleError(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  updateComment(newComment: string) {
    this.stateService.setComment(newComment);
  }

  saveComment(newComment: string) {
    if (this.fetchedComment == newComment) return;
    if (this.selectedScenarioExecution()) {
      this.scenarioExecutionService
        .updateComment(
          this.projectId(),
          this.selectedScenarioExecution().id,
          newComment
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.fetchedComment = newComment;
          },
          error: (error) => {
            this.handleError(error);
          },
        });
    }
  }

  cancelComment() {
    this.stateService.setComment(this.fetchedComment);
  }

  back() {
    this.location.back();
  }

  detectionTabClick() {
    this.isDetectionsSelected = true;
  }

  detectionTabDeselected() {
    this.isDetectionsSelected = false;
  }

  handleRefreshAnalysisStatusEvent() {
    this.refreshAnalysisStatusEligibility().subscribe();
  }

  handleAbortScenarioRequested(abortRequestedMessage: string) {
    this.toastMessageService.showSuccess(abortRequestedMessage);
    this.initializeScenarioExecutionDetails(
      this.projectId(),
      this.selectedScenarioExecutionId()
    );
  }

  private refreshAnalysisStatusEligibility(): Observable<AnalysisStatusEligibility> {
    return defer(() => {
      this.analysisStatusEligibility = {
        nextAnalysisStatuses: [],
        isUpdateEligible: false,
        updateIneligibilityReason:
          AnalysisStatusUpdateIneligibilityReason.LOADING,
      };
      return this.scenarioExecutionService.checkAnalysisStatusesEligibility(
        this.projectId(),
        this.selectedScenarioExecutionId()
      );
    }).pipe(
      tap((analysisStatusEligibility) => {
        this.analysisStatusEligibility = analysisStatusEligibility;
      }),
      catchError((errorMessage) => {
        this.handleError(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private applyTabFromQueryParams() {
    const tab = this.route.snapshot.queryParams["tab"];
    if (
      tab &&
      ScenarioExecutionDetailsComponent.TAB_NAME_TO_INDEX[tab] !== undefined
    ) {
      this.tabIndex = ScenarioExecutionDetailsComponent.TAB_NAME_TO_INDEX[tab];
    } else {
      this.tabIndex = 0;
    }
  }

  updateTabIndex(index: number) {
    this.tabIndex = index;
    const tabName =
      ScenarioExecutionDetailsComponent.TAB_INDEX_TO_NAME[index] ?? "details";
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabName },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  private getAssigneeById(id: string) {
    this.userService
      .getUserById(id, this.projectId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (assignee) => {
          this.assignee = assignee;
        },
        error: (error) => {
          this.handleError(error);
        },
      });
  }

  private getValidationScope(): Observable<ValidationScope> {
    return this.validationScopeService
      .getValidationScope(
        this.projectId(),
        this.selectedScenarioExecution()?.validation?.scope
          ?.requestedFactoryProductId,
        this.selectedScenarioExecution()?.validation?.scope
          ?.referenceFactoryProductId
      )
      .pipe(
        catchError((error) => {
          this.stateService.setValidationScopeWarningMessage(error);
          return of({});
        })
      );
  }

  handleKeptExecutionToggled(id: string) {
    const scenarioExecutionCandidate = this.scenarioExecutionHistory().find(
      (value) => value.id === id
    );

    if (scenarioExecutionCandidate && this.selectedScenarioExecution()) {
      const currScenarioExecution = this.selectedScenarioExecution();
      this.toggleKeptExecutionForScenarioInScenarioExecutionsHistory(
        scenarioExecutionCandidate,
        !scenarioExecutionCandidate.keptExecution
      );
      this.toggleKeptExecutionForScenarioExecutionIfCurrentlyViewed(
        scenarioExecutionCandidate.id,
        currScenarioExecution.id,
        !currScenarioExecution.keptExecution
      );

      this.scenarioExecutionService
        .toggleKeptExecutionFlag(
          this.projectId(),
          scenarioExecutionCandidate.id,
          !scenarioExecutionCandidate.keptExecution
        )
        .subscribe({
          next: () => {
            this.toastMessageService.showSuccess(
              this.getKeptExecutionMessage(
                !scenarioExecutionCandidate.keptExecution
              )
            );
          },
          error: (error) => {
            this.toggleKeptExecutionForScenarioInScenarioExecutionsHistory(
              scenarioExecutionCandidate,
              scenarioExecutionCandidate.keptExecution
            );
            this.toggleKeptExecutionForScenarioExecutionIfCurrentlyViewed(
              scenarioExecutionCandidate.id,
              currScenarioExecution.id,
              currScenarioExecution.keptExecution
            );
            this.toastMessageService.showError(error);
          },
        });
    }
  }

  private toggleKeptExecutionForScenarioExecutionIfCurrentlyViewed(
    scenarioExecutionCandidateId: string,
    currScenarioExecutionId: string,
    keptExecution: boolean
  ) {
    if (scenarioExecutionCandidateId === currScenarioExecutionId) {
      this.stateService.setKeptExecution(keptExecution);
    }
  }

  private toggleKeptExecutionForScenarioInScenarioExecutionsHistory(
    scenarioExecutionCandidate: TestUnitScenarioExecutionModel,
    keptExecution: boolean
  ) {
    this.stateService.setKeptExecutionForTestUnitScenarioExecution(
      scenarioExecutionCandidate.id,
      keptExecution
    );
  }

  private getKeptExecutionMessage(keptExecution: boolean): string {
    return keptExecution
      ? "The execution has been marked as kept."
      : "The execution has been marked as not kept.";
  }
}
