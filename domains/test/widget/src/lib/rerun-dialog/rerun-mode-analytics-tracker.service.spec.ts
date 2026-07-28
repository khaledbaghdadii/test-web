import { MockBuilder, ngMocks } from "ng-mocks";
import { RerunModeAnalyticsTrackerService } from "./rerun-mode-analytics-tracker.service";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

describe("RerunModeAnalyticsTrackerService", () => {
  let service: RerunModeAnalyticsTrackerService;
  let analyticsTrackerService: { trackEvent: jest.Mock };

  beforeEach(() => {
    analyticsTrackerService = { trackEvent: jest.fn() };

    return MockBuilder().provide(RerunModeAnalyticsTrackerService).provide({
      provide: AnalyticsTrackerService,
      useValue: analyticsTrackerService,
    });
  });

  beforeEach(() => {
    service = ngMocks.findInstance(RerunModeAnalyticsTrackerService);
  });

  it("should track official mode selection", () => {
    service.trackOfficialModeSelected();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Official"
    );
  });

  it("should track unofficial mode selection", () => {
    service.trackUnofficialModeSelected();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Unofficial"
    );
  });
});
