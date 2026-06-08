import { MockBuilder, ngMocks } from "ng-mocks";
import { AbortScenarioRunAnalyticsTrackerService } from "./abort-scenario-run-analytics-tracker.service";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

describe("AbortScenarioRunAnalyticsTrackerService", () => {
  let service: AbortScenarioRunAnalyticsTrackerService;
  let analyticsTrackerService: { trackEvent: jest.Mock };

  beforeEach(() => {
    analyticsTrackerService = { trackEvent: jest.fn() };

    return MockBuilder()
      .provide(AbortScenarioRunAnalyticsTrackerService)
      .provide({
        provide: AnalyticsTrackerService,
        useValue: analyticsTrackerService,
      });
  });

  beforeEach(() => {
    service = ngMocks.findInstance(AbortScenarioRunAnalyticsTrackerService);
  });

  it("should track abort execution button click", () => {
    service.trackAbortExecution();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Abort Execution"
    );
  });
});
