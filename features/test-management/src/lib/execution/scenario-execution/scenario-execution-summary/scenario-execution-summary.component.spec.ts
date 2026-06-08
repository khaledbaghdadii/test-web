import { ComponentFixture, fakeAsync, TestBed } from "@angular/core/testing";
import { TestUnitScenarioExecutionModel } from "../../test-unit/test-unit.model";
import { ScenarioExecutionSummaryComponent } from "./scenario-execution-summary.component";
import { Badge } from "primeng/badge";
import { DomTestUtils, getTooltipTextByTestId } from "@mxevolve/testing";

describe("ScenarioExecutionSummaryComponent", () => {
  let fixture: ComponentFixture<ScenarioExecutionSummaryComponent>;
  let component: ScenarioExecutionSummaryComponent;
  const TEST_UNIT_SCENARIO_EXECUTION = {
    id: "execution-id",
  } as TestUnitScenarioExecutionModel;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioExecutionSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("scenarioExecutions", []);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("numberOfUnderwayExecutions", () => {
    it("should return 0 when no executions are underway", () => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: true,
        },
      ]);
      fixture.detectChanges();
      const badgeElement = getBadgeComponentById("underway-executions-badge");
      expect(badgeElement.value()).toBe(0);
    });

    it("should count underway executions correctly", () => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: false,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: true,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: false,
        },
      ]);
      fixture.detectChanges();
      const badgeElement = getBadgeComponentById("underway-executions-badge");
      expect(badgeElement.value()).toBe(2);
    });

    it("should return 0 when there are no scenario executions", () => {
      fixture.componentRef.setInput("scenarioExecutions", []);
      fixture.detectChanges();
      const badgeElement = getBadgeComponentById("underway-executions-badge");
      expect(badgeElement.value()).toBe(0);
    });

    it("should display correct tooltip when 1 execution is underway", fakeAsync(() => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: false,
        },
      ]);
      fixture.detectChanges();
      expect(getTooltipTextByTestId(fixture, "underway-executions-badge")).toBe(
        "1 Underway Execution"
      );
    }));

    it("should display correct tooltip when multiple executions are underway", fakeAsync(() => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: false,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: false,
        },
      ]);
      fixture.detectChanges();
      expect(getTooltipTextByTestId(fixture, "underway-executions-badge")).toBe(
        "2 Underway Executions"
      );
    }));
  });

  describe("numberOfPassedExecutions", () => {
    it("should return 0 when no executions are passed", () => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: false,
        },
      ]);
      fixture.detectChanges();
      const badgeElement = getBadgeComponentById("passed-executions-badge");
      expect(badgeElement.value()).toBe(0);
    });

    it("should count passed executions correctly", () => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: true,
          isFailed: false,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: true,
          isFailed: false,
        },
      ]);
      fixture.detectChanges();
      const badgeElement = getBadgeComponentById("passed-executions-badge");
      expect(badgeElement.value()).toBe(2);
    });

    it("should return 0 when there are no scenario executions", () => {
      fixture.componentRef.setInput("scenarioExecutions", []);
      fixture.detectChanges();
      const badgeElement = getBadgeComponentById("passed-executions-badge");
      expect(badgeElement.value()).toBe(0);
    });

    it("should display correct tooltip when 1 execution is passed", fakeAsync(() => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: true,
          isFailed: false,
        },
      ]);
      fixture.detectChanges();
      expect(getTooltipTextByTestId(fixture, "passed-executions-badge")).toBe(
        "1 Passed Execution"
      );
    }));

    it("should display correct tooltip when multiple executions are passed", fakeAsync(() => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: true,
          isFailed: false,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFinished: true,
          isFailed: false,
        },
      ]);
      fixture.detectChanges();
      expect(getTooltipTextByTestId(fixture, "passed-executions-badge")).toBe(
        "2 Passed Executions"
      );
    }));
  });

  describe("numberOfFailedExecutions", () => {
    it("should return 0 when no executions are failed", () => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFailed: false,
        },
      ]);
      fixture.detectChanges();
      const badgeElement = getBadgeComponentById("failed-executions-badge");
      expect(badgeElement.value()).toBe(0);
    });

    it("should count failed executions correctly", () => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFailed: true,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFailed: true,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFailed: false,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFailed: true,
        },
      ]);
      fixture.detectChanges();
      const badgeElement = getBadgeComponentById("failed-executions-badge");
      expect(badgeElement.value()).toBe(3);
    });

    it("should return 0 when there are no scenario executions", () => {
      fixture.componentRef.setInput("scenarioExecutions", []);
      expect(component.numberOfFailedExecutions()).toBe(0);
    });

    it("should display correct tooltip when 1 execution is failed", fakeAsync(() => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFailed: true,
        },
      ]);
      fixture.detectChanges();
      expect(getTooltipTextByTestId(fixture, "failed-executions-badge")).toBe(
        "1 Failed Execution"
      );
    }));

    it("should display correct tooltip when multiple executions are failed", fakeAsync(() => {
      fixture.componentRef.setInput("scenarioExecutions", [
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFailed: true,
        },
        {
          ...TEST_UNIT_SCENARIO_EXECUTION,
          isFailed: true,
        },
      ]);
      fixture.detectChanges();
      expect(getTooltipTextByTestId(fixture, "failed-executions-badge")).toBe(
        "2 Failed Executions"
      );
    }));
  });

  function getBadgeComponentById(id: string): Badge {
    return DomTestUtils.getElementByTestId(fixture, id).getInstance() as Badge;
  }
});
