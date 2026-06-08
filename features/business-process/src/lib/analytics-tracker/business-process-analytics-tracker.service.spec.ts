import { TestBed } from "@angular/core/testing";
import { BusinessProcessAnalyticsTrackerService } from "./business-process-analytics-tracker.service";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

describe("BusinessProcessAnalyticsTrackerService", () => {
  let analyticsTrackerService: Partial<AnalyticsTrackerService>;
  let service: BusinessProcessAnalyticsTrackerService;

  beforeEach(() => {
    analyticsTrackerService = {
      trackEvent: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        BusinessProcessAnalyticsTrackerService,
        { provide: AnalyticsTrackerService, useValue: analyticsTrackerService },
      ],
    });

    service = TestBed.inject(BusinessProcessAnalyticsTrackerService);
  });

  it("should track open business process repush modal", () => {
    service.trackOpenBusinessProcessRepushModal();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Open Business Process Repush Modal"
    );
  });

  it("should track repush business process", () => {
    service.trackRepushBusinessProcess();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Repush Business Process"
    );
  });

  it("should track CI process fix issues", () => {
    service.trackCiProcessFixIssues();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "CI Process - Fix Issues"
    );
  });

  it("should track Upgrade process fix issues", () => {
    service.trackUpgradeProcessFixIssues();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Upgrade Process - Fix Issues"
    );
  });

  it("should track Upgrade process failed and stop process", () => {
    service.trackUpgradeProcessFailedAndStopProcess();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.RADIO_BUTTON,
      EventAction.SELECT_BUTTON,
      "Upgrade Process - Failed and Stop Process"
    );
  });

  it("should track Validation process failed and stop process", () => {
    service.trackValidationProcessFailedAndStopProcess();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.RADIO_BUTTON,
      EventAction.SELECT_BUTTON,
      "Validation Process - Failed and Stop Process"
    );
  });
});
