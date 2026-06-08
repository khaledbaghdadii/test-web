import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { User } from "@mxflow/features/user";
import { ConfirmationService, MenuItem } from "primeng/api";
import { Menu } from "primeng/menu";
import { ScenarioExecutionStateManagementService } from "../scenario-execution-state-management.service";
import { ScenarioAnalysisStatus } from "./../../scenario-analysis-status/scenario-analysis-status";
import {
  AnalysisStatusEligibility,
  AnalysisStatusState,
  AnalysisStatusUpdateIneligibilityReason,
  AnalysisStatusUpdateIneligibilityReasonDisplayMessage,
} from "../../scenario-analysis-status/analysis-status-eligibility";
import { ScenarioExecutionService } from "../../scenario-execution.service";
import {
  AnalysisObjectType,
  IncidentLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { AnalysisObjectLink } from "@mxflow/test-management";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";
import { forkJoin } from "rxjs";

@Component({
  selector: "mxevolve-execution-details",
  templateUrl: "./execution-details.component.html",
  standalone: false,
})
export class ExecutionDetailsComponent implements OnInit {
  private scenarioExecutionService = inject(ScenarioExecutionService);
  private confirmationService = inject(ConfirmationService);
  private readonly analyticsTracker = inject(
    TestManagementAnalyticsTrackerService
  );

  stateService = inject(ScenarioExecutionStateManagementService);
  projectId = this.stateService.projectId;
  selectedScenarioExecution = this.stateService.scenarioExecution;
  testUnit = this.stateService.testUnit;
  validationScope = this.stateService.validationScope;
  validationScopeWarningMessage =
    this.stateService.validationScopeWarningMessage;
  @Input() assignee: User | null;
  @Input() isScenarioExecutionFinished: boolean;
  @Input() isLoading: boolean;
  @Input() validationScopeEnabled = false;
  @Input() incidentEnabled = false;
  @Output() updateAnalysisStatusEvent =
    new EventEmitter<ScenarioAnalysisStatus>();
  @Output() refreshAnalysisStatusEvent = new EventEmitter();
  @Output() errorEventEmitter = new EventEmitter<string>();
  @Output() setAssigneeEventEmitter = new EventEmitter<string>();
  @Output() updateCommentEventEmitter = new EventEmitter<string>();
  @Output() saveCommentEventEmitter = new EventEmitter<string>();
  @Output() cancelCommentEventEmitter = new EventEmitter<void>();
  @Output() abortScenarioRequested = new EventEmitter<string>();
  @Output() keptExecutionToggled = new EventEmitter<string>();

  scenarioAnalysisStatus = ScenarioAnalysisStatus;
  @Input() comment = "";
  showCommentButtons = false;
  isDefectsModalVisible = false;
  isUpradeImpactsModalVisible = false;
  isAnalysisObjectsLinkingModalVisible = false;
  analysisObjectType: AnalysisObjectType;
  linkToRegressionOptions: MenuItem[] | undefined;
  linkToImpactOptions: MenuItem[] | undefined;
  viewValidationScopeOptions: MenuItem[] = [];
  analysisStatusUpdateIneligibilityReason: AnalysisStatusUpdateIneligibilityReason;
  isAnalysisStatusUpdateEligible = false;
  analysisStatuMenuItems: MenuItem[] = [];

  @Input({ required: true })
  set analysisStatusEligibility(value: AnalysisStatusEligibility) {
    if (value) {
      this.refreshAnalysisStatusUpdateEligibility(value);
      this.initializeAnalysisStatusButton(value);
    }
  }
  incidentLinkingStateService: IncidentLinkingStateService;

  isWaitingForFailureReasonLinking = false;

  constructor() {
    this.incidentLinkingStateService = inject(IncidentLinkingStateService);
  }

  ngOnInit() {
    this.linkToRegressionOptions = [
      {
        label: "Configuration Regression",
        command: () => {
          this.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.CONFIGURATION_REGRESSION
          );
        },
      },
      {
        label: "Binary Regression",
        command: () => {
          this.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.BINARY_REGRESSION
          );
        },
      },
    ];

    this.linkToImpactOptions = [
      {
        label: "Configuration Impact",
        command: () => {
          this.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.CONFIGURATION_IMPACT
          );
        },
      },
      {
        label: "Binary Impact",
        command: () => {
          this.showAnalysisObjectsLinkingModal(
            AnalysisObjectType.BINARY_IMPACT
          );
        },
      },
    ];

    this.viewValidationScopeOptions = [
      {
        label: "Defects",
        command: () => {
          this.showDefects();
        },
      },
      {
        label: "Upgrade Impacts",
        command: () => {
          this.showUpgradeImpacts();
        },
      },
    ];
  }

  saveComment() {
    this.showCommentButtons = false;
    this.saveCommentEventEmitter.emit(this.comment);
  }

  cancelComment() {
    this.showCommentButtons = false;
    this.cancelCommentEventEmitter.emit();
  }

  updateComment(newComment: string) {
    this.comment = newComment;
    this.updateCommentEventEmitter.emit(newComment);
  }

  private showDefects() {
    this.isDefectsModalVisible = true;
  }

  private showUpgradeImpacts() {
    this.isUpradeImpactsModalVisible = true;
  }

  showAnalysisObjectsLinkingModal(analysisObjectType: AnalysisObjectType) {
    this.isAnalysisObjectsLinkingModalVisible = true;
    this.analysisObjectType = analysisObjectType;
    this.fetchScenarioExecutionAnalysisObjectLinks();
  }

  showIncidentsLinkingModal() {
    this.incidentLinkingStateService.setIsLinking(true);
    this.showAnalysisObjectsLinkingModal(AnalysisObjectType.INCIDENT);
  }

  onAnalysisObjectLinksChanged() {
    this.stateService.setLoading(true);
    forkJoin([
      this.stateService.refreshSelectedScenarioExecution$(),
      this.stateService.refreshAnalysisObjectLinks$(),
    ]).subscribe(() => {
      this.stateService.setLoading(false);
      const analysisObjectLinks = this.stateService.analysisObjectLinks();
      this.emitEventIfReasonOfFailureLinked(analysisObjectLinks);
    });
  }

  private emitEventIfReasonOfFailureLinked(
    analysisObjectLinks: AnalysisObjectLink[]
  ) {
    if (analysisObjectLinks && this.isWaitingForFailureReasonLinking) {
      const isAtLeastOneFailureReasonLinked = analysisObjectLinks.some(
        (link) => link.analysisObjectType === AnalysisObjectType.FAILURE_REASON
      );
      if (isAtLeastOneFailureReasonLinked) {
        this.updateAnalysisStatusEvent.emit(
          this.scenarioAnalysisStatus.CANCELLED
        );
        this.isWaitingForFailureReasonLinking = false;
      }
    }
  }

  handleMarkAnalysisStatusAsCancelled() {
    this.showAnalysisObjectsLinkingModal(AnalysisObjectType.FAILURE_REASON);
    this.isWaitingForFailureReasonLinking = true;
  }

  private fetchScenarioExecutionAnalysisObjectLinks() {
    this.stateService.getScenarioExecutionAnalysisObjectLinks$().subscribe();
  }

  getIneligibilityReasonMessage(
    reason: AnalysisStatusUpdateIneligibilityReason
  ) {
    return AnalysisStatusUpdateIneligibilityReasonDisplayMessage[reason];
  }

  confirmAbortScenarioExecution(event: Event, scenarioExecutionId?: string) {
    if (scenarioExecutionId) {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: "Are you sure you want to abort this scenario execution?",
        icon: "pi pi-info-circle",
        acceptButtonStyleClass: "p-button-danger p-button-sm",
        accept: () => this.abortScenarioExecution(scenarioExecutionId),
      });
    }
  }

  abortScenarioExecution(scenarioExecutionId: string) {
    this.scenarioExecutionService
      .abortScenarioExecution(this.projectId(), scenarioExecutionId)
      .subscribe({
        next: (message) => {
          this.abortScenarioRequested.emit(message);
        },
        error: (errorMessage) => {
          this.errorEventEmitter.emit(errorMessage);
        },
      });
  }

  private refreshAnalysisStatusUpdateEligibility(
    value: AnalysisStatusEligibility
  ) {
    this.isAnalysisStatusUpdateEligible = value.isUpdateEligible;
    this.analysisStatusUpdateIneligibilityReason =
      value.updateIneligibilityReason;
  }

  private initializeAnalysisStatusButton(value: AnalysisStatusEligibility) {
    this.analysisStatuMenuItems = value.nextAnalysisStatuses.map(
      (nextAnalysisStatus) => {
        return {
          label: nextAnalysisStatus.analysisStatus,
          command: () => {
            this.handleAnalysisStatusMenuItemClicked(nextAnalysisStatus);
          },
          disabled: this.isAnalysisStatusMenuItemDisabled(nextAnalysisStatus),
          tooltip:
            this.resolveAnalysisStatusMenuItemTooltip(nextAnalysisStatus),
        };
      }
    );
  }

  private handleAnalysisStatusMenuItemClicked(
    nextAnalysisStatus: AnalysisStatusState
  ) {
    if (!this.isAnalysisStatusCancelled(nextAnalysisStatus)) {
      this.updateAnalysisStatusEvent.emit(nextAnalysisStatus.analysisStatus);
    } else {
      this.handleMarkAnalysisStatusAsCancelled();
    }
  }

  private isAnalysisStatusMenuItemDisabled(
    nextAnalysisStatus: AnalysisStatusState
  ) {
    if (
      this.isAnalysisStatusCancelled(nextAnalysisStatus) &&
      this.isIneligibleDueToNoFailureReasonsLinked(nextAnalysisStatus)
    ) {
      return false;
    }
    return !nextAnalysisStatus.isEligible;
  }

  private resolveAnalysisStatusMenuItemTooltip(
    nextAnalysisStatus: AnalysisStatusState
  ) {
    if (
      this.isAnalysisStatusCancelled(nextAnalysisStatus) &&
      this.isIneligibleDueToNoFailureReasonsLinked(nextAnalysisStatus)
    ) {
      return undefined;
    }
    return this.getTooltipFromIneligibilityReason(nextAnalysisStatus);
  }

  private isIneligibleDueToNoFailureReasonsLinked(
    nextAnalysisStatus: AnalysisStatusState
  ) {
    return (
      !nextAnalysisStatus.isEligible &&
      nextAnalysisStatus.ineligibilityReason ===
        AnalysisStatusUpdateIneligibilityReason.NO_FAILURE_REASONS_LINKED
    );
  }

  private isAnalysisStatusCancelled(nextAnalysisStatus: AnalysisStatusState) {
    return (
      nextAnalysisStatus.analysisStatus === ScenarioAnalysisStatus.CANCELLED
    );
  }

  private getTooltipFromIneligibilityReason(
    nextAnalysisStatus: AnalysisStatusState
  ) {
    return nextAnalysisStatus.ineligibilityReason
      ? AnalysisStatusUpdateIneligibilityReasonDisplayMessage[
          nextAnalysisStatus.ineligibilityReason
        ]
      : undefined;
  }

  openAnalysisStatusMenu(setAnalysisStatusMenu: Menu, $event: MouseEvent) {
    if (this.isAnalysisStatusUpdateEligible) {
      if (!setAnalysisStatusMenu.visible) {
        this.refreshAnalysisStatusEvent.emit();
      }
      setAnalysisStatusMenu.toggle($event);
    }
  }

  handleError(errorMessage: string) {
    this.errorEventEmitter.emit(errorMessage);
  }

  toggleKeptExecutionFlag() {
    if (this.selectedScenarioExecution()) {
      this.keptExecutionToggled.emit(this.selectedScenarioExecution()?.id);
    }
  }

  displayCommentButtons() {
    this.showCommentButtons = true;
  }

  isModalVisibleChange(isModalVisible: boolean) {
    if (!isModalVisible) this.incidentLinkingStateService.setIsLinking(false);
  }

  onValidationScopeClick($event: Event, viewValidationScopeMenu: Menu) {
    viewValidationScopeMenu.toggle($event);
    this.analyticsTracker.trackValidationScope();
  }
}
