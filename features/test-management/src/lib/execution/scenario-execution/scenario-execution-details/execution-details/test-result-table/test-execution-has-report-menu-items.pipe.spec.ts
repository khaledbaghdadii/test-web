import { TestExecution } from "../../../scenario-execution";
import { TestExecutionHasReportMenuItemsPipe } from "./test-execution-has-report-menu-items.pipe";

describe("TestExecutionHasReportMenuItemsPipe", () => {
  let pipe: TestExecutionHasReportMenuItemsPipe;

  beforeEach(() => {
    pipe = new TestExecutionHasReportMenuItemsPipe();
  });

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should return true if execution has a performance report URL", () => {
    const execution = {
      report: {
        performanceReportUrl: "http://example.com/performance-report",
      },
    } as TestExecution;
    expect(pipe.transform(execution, true)).toBeTruthy();
  });

  it("should return false if execution has only the hardware monitoring report URL but the feature is toggled off", () => {
    const execution = {
      report: {
        hardwareMonitoringReportUrl:
          "http://example.com/hardware-monitoring-report",
      },
    } as TestExecution;
    expect(pipe.transform(execution, false)).toBeFalsy();
  });

  it("should return false if the execution does not have a hardware monitoring report URL while the feature is toggled on", () => {
    const execution = {
      report: {},
    } as TestExecution;
    expect(pipe.transform(execution, true)).toBeFalsy();
  });

  it("should return true if execution has a hardware monitoring report URL and the feature is toggled on", () => {
    const execution = {
      report: {
        hardwareMonitoringReportUrl:
          "http://example.com/hardware-monitoring-report",
      },
    } as TestExecution;
    expect(pipe.transform(execution, true)).toBeTruthy();
  });

  it("should return false if no report menu items are visible", () => {
    const execution = {
      report: {},
    } as TestExecution;
    expect(pipe.transform(execution, true)).toBeFalsy();
  });
});
