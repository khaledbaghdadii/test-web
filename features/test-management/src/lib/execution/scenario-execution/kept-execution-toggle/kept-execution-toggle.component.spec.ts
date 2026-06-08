import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { KeptExecutionToggleComponent } from "./kept-execution-toggle.component";
import { KeptExecutionDisabledPipe } from "../scenario-execution-details/kept-execution-disabled/kept-execution-disabled.pipe";
import { By } from "@angular/platform-browser";
import { ToggleSwitch } from "primeng/toggleswitch";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";
import { Tooltip } from "primeng/tooltip";
import { getTooltipTextByTestId } from "@mxevolve/testing";

describe("KeptExecutionToggleComponent", () => {
  let fixture: MockedComponentFixture<
    KeptExecutionToggleComponent,
    Partial<KeptExecutionToggleComponent>
  >;
  let component: KeptExecutionToggleComponent;
  const keptExecutionDisabledPipeTransform = jest.fn().mockReturnValue(false);
  let analyticsTrackerService: { trackKeepExecutionToggle: jest.Mock };

  beforeEach(async () => {
    analyticsTrackerService = {
      trackKeepExecutionToggle: jest.fn(),
    };

    await MockBuilder(KeptExecutionToggleComponent)
      .keep(ToggleSwitch)
      .keep(Tooltip)
      .mock(KeptExecutionDisabledPipe, keptExecutionDisabledPipeTransform)
      .provide({
        provide: TestManagementAnalyticsTrackerService,
        useValue: analyticsTrackerService,
      });
  });

  function renderComponent(inputs: Partial<KeptExecutionToggleComponent> = {}) {
    const defaultInputs = {
      keptExecution: false,
      cleaningStatus: "NOT_LAUNCHED",
      isFailed: true,
      disableKeepExecution: false,
      ...inputs,
    };
    fixture = MockRender(KeptExecutionToggleComponent, defaultInputs);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  }

  it("should create", () => {
    renderComponent();
    expect(component).toBeTruthy();
  });

  it("should emit updates when toggle is changed", () => {
    renderComponent();
    const emitSpy = jest.spyOn(component.keptExecutionToggled, "emit");
    component.onToggle();
    expect(emitSpy).toHaveBeenCalled();
  });

  it("should track analytics event when toggle turned on", () => {
    renderComponent({ keptExecution: false });
    component.onToggle();
    expect(
      analyticsTrackerService.trackKeepExecutionToggle
    ).toHaveBeenCalledWith(true);
  });

  it("should track analytics event when toggle is turned off", () => {
    renderComponent({ keptExecution: true });
    component.onToggle();
    expect(
      analyticsTrackerService.trackKeepExecutionToggle
    ).toHaveBeenCalledWith(false);
  });

  it.each([[true], [false]])(
    "should disable the toggle based on the provided input",
    (disabled) => {
      keptExecutionDisabledPipeTransform.mockReturnValue(disabled);
      renderComponent({
        cleaningStatus: "NOT_LAUNCHED",
        isFailed: true,
        disableKeepExecution: true,
      });

      expect(keptExecutionDisabledPipeTransform).toHaveBeenCalledWith({
        scenarioExecutionCleaningStatus: "NOT_LAUNCHED",
        isScenarioExecutionFailed: true,
        disableKeepExecution: true,
      });

      const toggleSwitch = fixture.debugElement.query(
        By.directive(ToggleSwitch)
      );
      expect(toggleSwitch.componentInstance.disabled()).toEqual(disabled);
    }
  );

  describe("tooltip", () => {
    it("should render tooltip with the defined options", () => {
      renderComponent();
      expect(component.tooltipOptions).toEqual({
        showDelay: 210,
        positionTop: -9,
        tooltipPosition: "right",
        tooltipLabel: "Toggle on to keep execution",
        tooltipStyleClass: "min-w-max",
      });
    });

    it("should show tooltip when requested", () => {
      renderComponent({ showTooltip: true });

      expect(getTooltipTextByTestId(fixture, "kept-execution-toggle")).toEqual(
        "Toggle on to keep execution"
      );
    });

    it.each([[undefined], [false]])(
      "should not show tooltip when not requested",
      (showTooltip) => {
        renderComponent({ showTooltip: showTooltip });

        expect(
          getTooltipTextByTestId(fixture, "kept-execution-toggle")
        ).toBeUndefined();
      }
    );
  });
});
