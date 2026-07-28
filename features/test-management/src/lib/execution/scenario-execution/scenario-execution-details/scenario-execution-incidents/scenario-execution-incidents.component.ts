import { Component, inject, Input } from "@angular/core";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ScenarioExecutionStateManagementService } from "../scenario-execution-state-management.service";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-scenario-execution-incidents",
  templateUrl: "./scenario-execution-incidents.component.html",
  standalone: false,
})
export class ScenarioExecutionIncidentsComponent {
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly analyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );
  private readonly stateService = inject(
    ScenarioExecutionStateManagementService
  );

  linkedIncidents = this.stateService.linkedIncidents;
  protected readonly AnalysisObjectType = AnalysisObjectType;
  isUnlinkModalVisible = false;
  incidentId: string;
  _isIncidentTableLoading = false;
  set isIncidentTableLoading(isLoading: boolean) {
    this._isIncidentTableLoading = isLoading;
  }
  get isIncidentTableLoading(): boolean {
    return this._isIncidentTableLoading;
  }
  _isSelected = false;
  @Input()
  set isSelected(isTabSelected: boolean) {
    this._isSelected = isTabSelected;
    if (isTabSelected) {
      this.isIncidentTableLoading = true;
      this.stateService.getScenarioExecutionAnalysisObjectLinks$().subscribe({
        next: () => (this.isIncidentTableLoading = false),
        error: () => {
          this.displayErrorMessage();
          this.isIncidentTableLoading = false;
        },
      });
    }
  }
  get isSelected(): boolean {
    return this._isSelected;
  }

  openUnlinkModal(incidentId: string) {
    this.incidentId = incidentId;
    this.isUnlinkModalVisible = true;
    this.analyticsTrackerService.trackUnlinkAnalysisObject(
      AnalysisObjectType.INCIDENT
    );
  }

  isVisibleChange(isUnlinkModalVisible: boolean) {
    this.isUnlinkModalVisible = isUnlinkModalVisible;
  }

  private displayErrorMessage() {
    this.toastMessageService.showError("Could not load incidents.");
  }
}
