import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { KeepExecutionToggleComponent } from "./keep-execution-toggle.component";
import { KeepExecutionDisabledPipe } from "../scenario-execution-details/keep-execution-disabled/keep-execution-disabled.pipe";
import { By } from "@angular/platform-browser";
import { ToggleSwitch } from "primeng/toggleswitch";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/data-access";
import { Tooltip } from "primeng/tooltip";
import { getTooltipTextByTestId } from "@mxevolve/testing";
import { ScenarioExecutionHousekeepingStatus } from "@mxevolve/domains/test/model";

describe("KeepExecutionToggleComponent", () => {
  let fixture: MockedComponentFixture<
    KeepExecutionToggleComponent,
    Partial<KeepExecutionToggleComponent>
  >;
  let component: KeepExecutionToggleComponent;
  const keepExecutionDisabledPipeTransform = jest.fn().mockReturnValue(false);
  let analyticsTrackerService: { trackKeepExecutionToggle: jest.Mock };

  beforeEach(async () => {
    analyticsTrackerService = {
      trackKeepExecutionToggle: jest.fn(),
    };

    await MockBuilder(KeepExecutionToggleComponent)
      .keep(ToggleSwitch)
      .keep(Tooltip)
      .mock(KeepExecutionDisabledPipe, keepExecutionDisabledPipeTransform)
      .provide({
        provide: TestManagementAnalyticsTrackerService,
        useValue: analyticsTrackerService,
      });
  });

  function renderComponent(inputs: Partial<KeepExecutionToggleComponent> = {}) {
    const defaultInputs = {
      keepExecution: false,
      cleaningStatus: ScenarioExecutionHousekeepingStatus.NOT_LAUNCHED,
      isFailed: true,
      disableKeepExecution: false,
      isTestUnitHead: true,
      ...inputs,
    };
    fixture = MockRender(KeepExecutionToggleComponent, defaultInputs);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  }

  it("should create", () => {
    renderComponent();
    expect(component).toBeTruthy();
  });

  it("should emit updates when toggle is changed", () => {
    renderComponent();
    const emitSpy = jest.spyOn(component.keepExecutionToggled, "emit");
    component.onToggle();
    expect(emitSpy).toHaveBeenCalled();
  });

  it("should track analytics event when toggle turned on", () => {
    renderComponent({ keepExecution: false });
    component.onToggle();
    expect(
      analyticsTrackerService.trackKeepExecutionToggle
    ).toHaveBeenCalledWith(true);
  });

  it("should track analytics event when toggle is turned off", () => {
    renderComponent({ keepExecution: true });
    component.onToggle();
    expect(
      analyticsTrackerService.trackKeepExecutionToggle
    ).toHaveBeenCalledWith(false);
  });

  it.each([[true], [false]])(
    "should disable the toggle based on the provided input",
    (disabled) => {
      keepExecutionDisabledPipeTransform.mockReturnValue(disabled);
      renderComponent({
        cleaningStatus: ScenarioExecutionHousekeepingStatus.NOT_LAUNCHED,
        isFailed: true,
        disableKeepExecution: true,
        isTestUnitHead: true,
      });

      expect(keepExecutionDisabledPipeTransform).toHaveBeenCalledWith({
        scenarioExecutionCleaningStatus: "NOT_LAUNCHED",
        isScenarioExecutionFailed: true,
        disableKeepExecution: true,
        isTestUnitHead: true,
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

      expect(getTooltipTextByTestId(fixture, "keep-execution-toggle")).toEqual(
        "Toggle on to keep execution"
      );
    });

    it.each([[undefined], [false]])(
      "should not show tooltip when not requested",
      (showTooltip) => {
        renderComponent({ showTooltip: showTooltip });

        expect(
          getTooltipTextByTestId(fixture, "keep-execution-toggle")
        ).toBeUndefined();
      }
    );
  });
});
