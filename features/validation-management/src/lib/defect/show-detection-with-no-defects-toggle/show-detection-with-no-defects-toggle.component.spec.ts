import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ShowDetectionWithNoDefectsToggleComponent } from "./show-detection-with-no-defects-toggle.component";
import { DomTestUtils, getTooltipTextByTestId } from "@mxevolve/testing";
import { FormsModule } from "@angular/forms";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Tooltip } from "primeng/tooltip";
import {
  DetectionCategory,
  DetectionType,
} from "@mxflow/features/failure-management";

describe("ShowDetectionWithNoDefectsToggleComponent", () => {
  let component: ShowDetectionWithNoDefectsToggleComponent;
  let fixture: ComponentFixture<ShowDetectionWithNoDefectsToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ShowDetectionWithNoDefectsToggleComponent,
        FormsModule,
        ToggleSwitch,
        Tooltip,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ShowDetectionWithNoDefectsToggleComponent
    );
    fixture.componentRef.setInput("detectionType", DetectionType.Configuration);
    fixture.componentRef.setInput(
      "detectionCategory",
      DetectionCategory.Regression
    );
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("toggle label", () => {
    it("should have the correct toggle label for Binary Impacts", () => {
      fixture.componentRef.setInput("detectionType", DetectionType.Binary);
      fixture.componentRef.setInput(
        "detectionCategory",
        DetectionCategory.Impact
      );
      fixture.detectChanges();

      expect(component.toggleLabel()).toBe("Show Impacts With No Defects");
    });

    it("should have the correct toggle label for Configuration Regressions", () => {
      fixture.componentRef.setInput(
        "detectionType",
        DetectionType.Configuration
      );
      fixture.componentRef.setInput(
        "detectionCategory",
        DetectionCategory.Regression
      );
      fixture.detectChanges();

      expect(component.toggleLabel()).toBe("Show Regressions With No Defects");
    });
  });

  describe("tooltip message", () => {
    it("should have the correct tooltip message for Binary Impacts", () => {
      fixture.componentRef.setInput("detectionType", DetectionType.Binary);
      fixture.componentRef.setInput(
        "detectionCategory",
        DetectionCategory.Impact
      );
      fixture.detectChanges();

      expect(component.tooltipMessage()).toBe(
        "Cannot toggle since all Binary Impacts are displayed"
      );
    });

    it("should have the correct tooltip message for Configuration Regressions", () => {
      fixture.componentRef.setInput(
        "detectionType",
        DetectionType.Configuration
      );
      fixture.componentRef.setInput(
        "detectionCategory",
        DetectionCategory.Regression
      );
      fixture.detectChanges();

      expect(component.tooltipMessage()).toBe(
        "Cannot toggle since all Configuration Regressions are displayed"
      );
    });

    it("should display tooltip when warning message exists", () => {
      fixture.componentRef.setInput("warningMessage", "warning-message");
      component.validationScope.set({
        referenceVersion: "ref",
        currentVersion: "current",
      });
      fixture.componentRef.setInput(
        "detectionType",
        DetectionType.Configuration
      );
      fixture.componentRef.setInput(
        "detectionCategory",
        DetectionCategory.Regression
      );
      fixture.detectChanges();

      const tooltipText = getTooltipByTestId(
        "show-detections-with-no-defects-toggle-tooltip"
      );
      expect(tooltipText).toBe(
        "Cannot toggle since all Configuration Regressions are displayed"
      );
    });

    it("should display tooltip when validation scope is incomplete", () => {
      fixture.componentRef.setInput("warningMessage", undefined);
      component.validationScope.set({
        referenceVersion: undefined,
        currentVersion: "current",
      });
      fixture.detectChanges();

      const tooltipText = getTooltipByTestId(
        "show-detections-with-no-defects-toggle-tooltip"
      );
      expect(tooltipText).toBe(component.tooltipMessage());
    });

    it("should not display tooltip when toggle is enabled", () => {
      fixture.componentRef.setInput("warningMessage", undefined);
      component.validationScope.set({
        referenceVersion: "ref",
        currentVersion: "current",
      });
      fixture.detectChanges();

      const tooltipText = getTooltipByTestId(
        "show-detections-with-no-defects-toggle-tooltip"
      );
      expect(tooltipText).toBe("");
    });
  });

  describe("toggle disabled state", () => {
    it("should enable the toggle when no warning message exists and validation scope is complete", () => {
      fixture.componentRef.setInput("warningMessage", undefined);
      component.validationScope.set({
        referenceVersion: "ref",
        currentVersion: "current",
      });
      fixture.detectChanges();

      const toggleSwitch = getToggleSwitchByTestId(
        "show-detections-without-defects-toggle"
      );
      expect(toggleSwitch.isDisabled()).toBeFalsy();
    });

    it("should disable the toggle when a warning message is present", () => {
      fixture.componentRef.setInput("warningMessage", "warning-message");
      component.validationScope.set({
        referenceVersion: "ref",
        currentVersion: "current",
      });
      fixture.detectChanges();

      const toggleSwitch = getToggleSwitchByTestId(
        "show-detections-without-defects-toggle"
      );
      expect(toggleSwitch.isDisabled()).toBeTruthy();
    });

    it("should disable the toggle when reference version does not exist", () => {
      fixture.componentRef.setInput("warningMessage", undefined);
      component.validationScope.set({
        referenceVersion: undefined,
        currentVersion: "current",
      });
      fixture.detectChanges();

      const toggleSwitch = getToggleSwitchByTestId(
        "show-detections-without-defects-toggle"
      );
      expect(toggleSwitch.isDisabled()).toBeTruthy();
    });

    it("should disable the toggle when current version does not exist", () => {
      fixture.componentRef.setInput("warningMessage", undefined);
      component.validationScope.set({
        referenceVersion: "ref",
        currentVersion: undefined,
      });
      fixture.detectChanges();

      const toggleSwitch = getToggleSwitchByTestId(
        "show-detections-without-defects-toggle"
      );
      expect(toggleSwitch.isDisabled()).toBeTruthy();
    });

    it("should disable the toggle when both reference and current versions do not exist", () => {
      fixture.componentRef.setInput("warningMessage", undefined);
      component.validationScope.set(undefined);
      fixture.detectChanges();

      const toggleSwitch = getToggleSwitchByTestId(
        "show-detections-without-defects-toggle"
      );
      expect(toggleSwitch.isDisabled()).toBeTruthy();
    });
  });

  describe("show detections without defects toggle", () => {
    it("should set to true the show detections without defects when toggle is clicked", () => {
      component.showDetectionsWithoutDefects.set(false);
      fixture.componentRef.setInput("warningMessage", undefined);
      component.validationScope.set({
        referenceVersion: "ref",
        currentVersion: "current",
      });
      fixture.detectChanges();

      const toggleSwitch = getToggleSwitchByTestId(
        "show-detections-without-defects-toggle"
      );
      toggleSwitch.toggle();
      expect(component.showDetectionsWithoutDefects()).toBeTruthy();
    });

    it("should set the show detections without defects toggle to false when toggle is clicked again", () => {
      component.showDetectionsWithoutDefects.set(true);
      fixture.componentRef.setInput("warningMessage", undefined);
      component.validationScope.set({
        referenceVersion: "ref",
        currentVersion: "current",
      });
      fixture.detectChanges();

      const toggleSwitch = getToggleSwitchByTestId(
        "show-detections-without-defects-toggle"
      );
      component.showDetectionsWithoutDefects.set(false);
      fixture.detectChanges();

      expect(component.showDetectionsWithoutDefects()).toBeFalsy();
      expect(toggleSwitch.isToggled()).toBeFalsy();
    });
  });

  function getToggleSwitchByTestId(testId: string) {
    return DomTestUtils.getToggleSwitchByTestId(fixture, testId);
  }

  function getTooltipByTestId(testId: string) {
    return getTooltipTextByTestId(fixture, testId);
  }
});
