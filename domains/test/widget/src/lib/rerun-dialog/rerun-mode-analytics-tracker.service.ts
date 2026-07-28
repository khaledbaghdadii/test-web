import { inject, Injectable } from "@angular/core";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

@Injectable({ providedIn: "root" })
export class RerunModeAnalyticsTrackerService {
  private readonly analyticsTrackerService = inject(AnalyticsTrackerService);

  trackOfficialModeSelected(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Official"
    );
  }

  trackUnofficialModeSelected(): void {
    this.analyticsTrackerService.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Unofficial"
    );
  }
}
