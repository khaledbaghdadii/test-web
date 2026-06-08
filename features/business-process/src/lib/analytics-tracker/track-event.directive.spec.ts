import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";
import { TrackEventDirective } from "./track-event.directive";

@Component({
  template: `<button
    [mxevolveUsageTracker]="{
      eventLabel: eventLabel,
      trackCategory: trackCategory,
      trackAction: trackAction,
      trackOn: trackOn
    }"
  >
    Test
  </button>`,
  standalone: true,
  imports: [TrackEventDirective],
})
class TestHostComponent {
  eventLabel = "My Label";
  trackCategory: EventCategory = EventCategory.BUTTON;
  trackAction: EventAction = EventAction.CLICK_BUTTON;
  trackOn: "click" | "change" = "click";
}

describe("TrackEventDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let analyticsTrackerService: Partial<AnalyticsTrackerService>;
  let button: ReturnType<typeof fixture.debugElement.query>;

  beforeEach(async () => {
    analyticsTrackerService = {
      trackEvent: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: AnalyticsTrackerService, useValue: analyticsTrackerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    button = fixture.debugElement.query(By.css("button"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("given the directive is applied to an element", () => {
    it("when the component renders then the directive is attached", () => {
      expect(
        fixture.debugElement.query(By.directive(TrackEventDirective))
      ).toBeTruthy();
    });
  });

  describe("given trackOn is set to 'click' (default)", () => {
    it("when the element is clicked then the event is tracked with the provided label, category and action", () => {
      button.triggerEventHandler("click", null);

      expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
        EventCategory.BUTTON,
        EventAction.CLICK_BUTTON,
        "My Label"
      );
    });

    it("when the element changes then no analytics event is tracked", () => {
      button.triggerEventHandler("change", null);

      expect(analyticsTrackerService.trackEvent).not.toHaveBeenCalled();
    });

    it("when the element is clicked multiple times then the event is tracked each time", () => {
      button.triggerEventHandler("click", null);
      button.triggerEventHandler("click", null);
      button.triggerEventHandler("click", null);

      expect(analyticsTrackerService.trackEvent).toHaveBeenCalledTimes(3);
    });
  });

  describe("given trackOn is set to 'change'", () => {
    beforeEach(() => {
      host.trackOn = "change";
      fixture.detectChanges();
    });

    it("when the element changes then the event is tracked with the provided label, category and action", () => {
      button.triggerEventHandler("change", null);

      expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
        EventCategory.BUTTON,
        EventAction.CLICK_BUTTON,
        "My Label"
      );
    });

    it("when the element is clicked then no analytics event is tracked", () => {
      button.triggerEventHandler("click", null);

      expect(analyticsTrackerService.trackEvent).not.toHaveBeenCalled();
    });
  });

  describe("given a custom category and action and label", () => {
    beforeEach(() => {
      host.trackCategory = EventCategory.TOGGLE;
      host.trackAction = EventAction.CLICK_TOGGLE;
      host.eventLabel = "My Label 2";
      fixture.detectChanges();
    });

    it("when the element is clicked then the event is tracked with the custom category and action", () => {
      button.triggerEventHandler("click", null);

      expect(analyticsTrackerService.trackEvent).toHaveBeenCalledWith(
        EventCategory.TOGGLE,
        EventAction.CLICK_TOGGLE,
        "My Label 2"
      );
    });
  });
});
