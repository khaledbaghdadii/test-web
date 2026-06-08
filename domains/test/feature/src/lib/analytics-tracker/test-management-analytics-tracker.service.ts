import { inject, Injectable } from "@angular/core";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

@Injectable({ providedIn: "root" })
export class TestManagementAnalyticsTrackerService {
  private readonly analyticsTrackerService = inject(AnalyticsTrackerService);

  trackKeepExecutionToggle(keptExecution: boolean): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.TOGGLE,
      EventAction.CLICK_TOGGLE,
      `Keep Execution toggled ${keptExecution ? "on" : "off"}`
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

  trackUpdateReference(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Update Reference"
    );
  }
}
