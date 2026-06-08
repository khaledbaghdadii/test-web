import { Pipe, PipeTransform } from "@angular/core";
import { TestExecution } from "../../../scenario-execution";

@Pipe({
  name: "testExecutionHasReportMenuItems",
  standalone: true,
})
export class TestExecutionHasReportMenuItemsPipe implements PipeTransform {
  transform(
    testExecution: TestExecution,
    isHardwareMonitoringFeatureEnabled: boolean
  ): boolean {
    const isPerformanceReportVisible =
      !!testExecution.report.performanceReportUrl;
    const isHardwareMonitoringReportVisible =
      isHardwareMonitoringFeatureEnabled &&
      !!testExecution.report.hardwareMonitoringReportUrl;
    return isPerformanceReportVisible || isHardwareMonitoringReportVisible;
  }
}
