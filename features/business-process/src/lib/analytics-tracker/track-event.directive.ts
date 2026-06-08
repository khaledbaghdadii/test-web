import { Directive, HostListener, inject, Input } from "@angular/core";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

export interface TrackEventData {
  eventLabel: string;
  trackCategory: EventCategory;
  trackAction: EventAction;
  trackOn: "click" | "change";
}

@Directive({
  selector: "[mxevolveUsageTracker]",
  standalone: true,
})
export class TrackEventDirective {
  private readonly analyticsTrackerService = inject(AnalyticsTrackerService);

  @Input("mxevolveUsageTracker") data: TrackEventData;

  @HostListener("click")
  onClick() {
    if (this.data.trackOn === "click") {
      this.track();
    }
  }

  @HostListener("change")
  onChange() {
    if (this.data.trackOn === "change") {
      this.track();
    }
  }

  private track() {
    this.analyticsTrackerService.trackEvent(
      this.data.trackCategory,
      this.data.trackAction,
      this.data.eventLabel
    );
  }
}
