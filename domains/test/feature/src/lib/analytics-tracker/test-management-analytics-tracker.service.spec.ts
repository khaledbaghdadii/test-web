import { MockBuilder, ngMocks } from "ng-mocks";
import { TestManagementAnalyticsTrackerService } from "./test-management-analytics-tracker.service";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

describe("TestManagementAnalyticsTrackerService", () => {
  let service: TestManagementAnalyticsTrackerService;
  let analyticsTrackerService: { trackEvent: jest.Mock };

  beforeEach(() => {
    analyticsTrackerService = { trackEvent: jest.fn() };

    return MockBuilder()
      .provide(TestManagementAnalyticsTrackerService)
      .provide({
        provide: AnalyticsTrackerService,
        useValue: analyticsTrackerService,
      });
  });

  beforeEach(() => {
    service = ngMocks.findInstance(TestManagementAnalyticsTrackerService);
  });

  describe("trackKeepExecutionToggle", () => {
    it("should track event with 'on' when keep execution is toggled on", () => {
      service.trackKeepExecutionToggle(true);

      expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
        EventCategory.TOGGLE,
        EventAction.CLICK_TOGGLE,
        "Keep Execution toggled on"
      );
    });

    it("should track event with 'off' when keep execution is toggled off", () => {
      service.trackKeepExecutionToggle(false);

      expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
        EventCategory.TOGGLE,
        EventAction.CLICK_TOGGLE,
        "Keep Execution toggled off"
      );
    });
  });

  it("should track standard repush button click", () => {
    service.trackStandardRepush();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Standard Repush"
    );
  });

  it("should track official repush button click", () => {
    service.trackOfficialRepush();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Official Repush"
    );
  });

  it("should track unofficial repush button click", () => {
    service.trackUnofficialRepush();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Unofficial Repush"
    );
  });

  it("should track validation scope button click", () => {
    service.trackValidationScope();
    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Validation Scope"
    );
  });

  it("should track download configuration button click", () => {
    service.trackDownloadConfiguration();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Download Configuration"
    );
  });

  it("should track access hardware monitoring report button click", () => {
    service.trackAccessHardwareMonitoringReport();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Access Hardware Monitoring Report"
    );
  });

  it("should track access NFT report button click", () => {
    service.trackAccessPerformanceReport();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Access NFT Report"
    );
  });

  it("should track access test case summary button click", () => {
    service.trackAccessTestCaseSummary();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Access Test Case Summary"
    );
  });

  it("should track abort execution button click", () => {
    service.trackAbortExecution();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Abort Execution"
    );
  });

  it("should track update reference button click", () => {
    service.trackUpdateReference();

    expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Update Reference"
    );
  });

  describe("trackKeepServicesCheckbox", () => {
    it("should track event with 'checked' when keep services is checked", () => {
      service.trackKeepServicesCheckbox(true);

      expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
        EventCategory.CHECKBOX,
        EventAction.CLICK_CHECKBOX,
        "Keep Services checkbox checked"
      );
    });

    it("should track event with 'unchecked' when keep services is unchecked", () => {
      service.trackKeepServicesCheckbox(false);

      expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
        EventCategory.CHECKBOX,
        EventAction.CLICK_CHECKBOX,
        "Keep Services checkbox unchecked"
      );
    });
  });
});
