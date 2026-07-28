import { inject, Injectable } from "@angular/core";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";

@Injectable({ providedIn: "root" })
export class TestManagementAnalyticsTrackerService {
  private readonly analyticsTrackerService = inject(AnalyticsTrackerService);

  trackKeepExecutionToggle(keepExecution: boolean): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.TOGGLE,
      EventAction.CLICK_TOGGLE,
      `Keep Execution toggled ${keepExecution ? "on" : "off"}`
    );
  }

  trackStandardRepush(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Standard Repush"
    );
  }

  trackOfficialRepush(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Official Repush"
    );
  }

  trackUnofficialRepush(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Unofficial Repush"
    );
  }

  trackValidationScope() {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Validation Scope"
    );
  }

  trackDownloadConfiguration(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Download Configuration"
    );
  }

  trackAccessHardwareMonitoringReport(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Access Hardware Monitoring Report"
    );
  }

  trackAccessPerformanceReport(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Access NFT Report"
    );
  }

  trackKeepServicesCheckbox(checked: boolean): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.CHECKBOX,
      EventAction.CLICK_CHECKBOX,
      `Keep Services checkbox ${checked ? "checked" : "unchecked"}`
    );
  }

  trackAccessTestCaseSummary(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Access Test Case Summary"
    );
  }

  trackAbortExecution(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Abort Execution"
    );
  }

  trackCleanScenarioExecution(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Clean Scenario Run"
    );
  }

  trackUnlinkAnalysisObject(analysisObjectType: AnalysisObjectType): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      `Unlink ${analysisObjectType}`
    );
  }

  trackLinkAnalysisObject(analysisObjectType: AnalysisObjectType): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      `Link ${analysisObjectType}`
    );
  }

  trackPreviouslyLinkedAnalysisObjectToggle(
    analysisObjectType: AnalysisObjectType
  ): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.TOGGLE,
      EventAction.CLICK_TOGGLE,
      `Previously linked ${analysisObjectType}s toggled on`
    );
  }

  trackUpdateReference(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Update Reference"
    );
  }

  trackEditUpgradeImpact(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Edit Upgrade Impact"
    );
  }

  trackSubmitSelectedUpgradeImpact(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Submit Selected Upgrade Impact"
    );
  }
}
