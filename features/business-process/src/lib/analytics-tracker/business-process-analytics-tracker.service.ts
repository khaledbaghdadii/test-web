import { inject, Injectable } from "@angular/core";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

@Injectable({ providedIn: "root" })
export class BusinessProcessAnalyticsTrackerService {
  private readonly analyticsTrackerService = inject(AnalyticsTrackerService);

  trackOpenBusinessProcessRepushModal(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Open Business Process Repush Modal"
    );
  }

  trackRepushBusinessProcess(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Repush Business Process"
    );
  }

  trackCiProcessFixIssues() {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "CI Process - Fix Issues"
    );
  }

  trackUpgradeProcessFixIssues() {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Upgrade Process - Fix Issues"
    );
  }

  trackUpgradeProcessFailedAndStopProcess() {
    this.analyticsTrackerService.trackEvent(
      EventCategory.RADIO_BUTTON,
      EventAction.SELECT_BUTTON,
      "Upgrade Process - Failed and Stop Process"
    );
  }

  trackValidationProcessFailedAndStopProcess() {
    this.analyticsTrackerService.trackEvent(
      EventCategory.RADIO_BUTTON,
      EventAction.SELECT_BUTTON,
      "Validation Process - Failed and Stop Process"
    );
  }
}
