import { ComponentFixture, TestBed } from "@angular/core/testing";
import { KeepServicesCheckboxComponent } from "./keep-services-checkbox.component";
import { By } from "@angular/platform-browser";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

describe("KeepServicesCheckboxComponent", () => {
  let component: KeepServicesCheckboxComponent;
  let fixture: ComponentFixture<KeepServicesCheckboxComponent>;
  let analyticsTrackerService: { trackKeepServicesCheckbox: jest.Mock };

  beforeEach(async () => {
    analyticsTrackerService = { trackKeepServicesCheckbox: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [KeepServicesCheckboxComponent],
    })
      .overrideProvider(TestManagementAnalyticsTrackerService, {
        useValue: analyticsTrackerService,
      })
      .compileComponents();

    fixture = TestBed.createComponent(KeepServicesCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should default keep services to false when input is undefined", () => {
    component.keepServices = undefined;
    fixture.detectChanges();
    expect(component.keepServices).toBeFalsy();
  });

  describe("when keep services check changes", () => {
    it("keep services check should be false by default", () => {
      expect(component.keepServices).toBeFalsy();
    });

    it("should emit the new value upon check change", () => {
      const keepServicesChangeSpy = jest.spyOn(
        component.keepServicesChange,
        "emit"
      );
      component.keepServices = false;
      component.onKeepServicesChange();

      expect(keepServicesChangeSpy).toHaveBeenCalledWith(false);
    });
  });

  describe("template test", () => {
    it("should trigger onKeepServicesChange when checked", () => {
      const checkbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      const keepServicesChangeSpy = jest.spyOn(
        component.keepServicesChange,
        "emit"
      );
      component.keepServices = true;
      checkbox.triggerEventHandler("onChange", { checked: true });
      fixture.detectChanges();
      expect(keepServicesChangeSpy).toHaveBeenCalledWith(true);
    });

    it("should track keep services when checkbox is checked", () => {
      const checkbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      component.keepServices = true;
      checkbox.triggerEventHandler("onChange", { checked: true });
      fixture.detectChanges();
      expect(
        analyticsTrackerService.trackKeepServicesCheckbox
      ).toHaveBeenCalledWith(true);
    });

    it("should not track keep services when checkbox is unchecked", () => {
      const checkbox = fixture.debugElement.query(
        By.css('[data-testid="keep-services-checkbox"]')
      );
      component.keepServices = false;
      checkbox.triggerEventHandler("onChange", { checked: false });
      fixture.detectChanges();
      expect(
        analyticsTrackerService.trackKeepServicesCheckbox
      ).not.toHaveBeenCalled();
    });
  });
});
