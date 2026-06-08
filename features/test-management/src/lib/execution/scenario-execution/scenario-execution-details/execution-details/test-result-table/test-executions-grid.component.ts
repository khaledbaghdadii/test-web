import { Component, inject } from "@angular/core";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution-state-management.service";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { Divider } from "primeng/divider";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { TestExecutionStatusComponent } from "../../../test-result-status/test-execution-status.component";
import {
  CommonModule,
  DatePipe,
  NgClass,
  NgTemplateOutlet,
} from "@angular/common";
import { Tooltip } from "primeng/tooltip";
import { DurationPipeModule } from "@mxflow/pipe";
import { SkeletonModule } from "primeng/skeleton";
import { TestExecutionMode } from "../../../model/test-execution-mode";
import { ButtonModule } from "primeng/button";
import { Router } from "@angular/router";
import { TestExecution } from "../../../scenario-execution";
import { SplitButtonModule } from "primeng/splitbutton";
import { MenuItem } from "primeng/api";
import { TestExecutionHasReportMenuItemsPipe } from "./test-execution-has-report-menu-items.pipe";
import { ProjectService } from "@mxflow/features/project";
import { ScenarioExecutionDurationComponent } from "../../../properties-display/duration/scenario-execution-duration.component";
import { toObservable } from "@angular/core/rxjs-interop";
import { concatMap, of } from "rxjs";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

@Component({
  selector: "mxevolve-test-execution-grid",
  templateUrl: "./test-executions-grid.component.html",
  styleUrl: "./test-executions-grid.component.scss",
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    Divider,
    TableEmptyMessageComponent,
    TestExecutionStatusComponent,
    NgClass,
    Tooltip,
    DatePipe,
    DurationPipeModule,
    NgTemplateOutlet,
    CommonModule,
    SkeletonModule,
    SplitButtonModule,
    ButtonModule,
    TestExecutionHasReportMenuItemsPipe,
    ScenarioExecutionDurationComponent,
  ],
  providers: [ProjectService],
})
export class TestExecutionsGridComponent {
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private readonly analyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );

  private readonly HARDWARE_MONITORING_FEATURE_FLAG = "hardware-monitoring";

  stateService = inject(ScenarioExecutionStateManagementService);
  projectId = this.stateService.projectId;
  scenarioExecution = this.stateService.scenarioExecution;
  isLoading = this.stateService.isScenarioExecutionDetailsLoading;

  isHardwareMonitoringFeatureEnabled = false;
  reportMenuItems: MenuItem[] = [];

  protected readonly TestExecutionMode = TestExecutionMode;
  protected readonly Array = Array;

  constructor() {
    toObservable(this.stateService.projectId)
      .pipe(
        concatMap((projectId) => {
          if (projectId) {
            return this.projectService.getFeatureToggle(
              projectId,
              this.HARDWARE_MONITORING_FEATURE_FLAG
            );
          }
          return of({ toggledOn: false });
        })
      )
      .subscribe((toggleResponse) => {
        this.isHardwareMonitoringFeatureEnabled = toggleResponse.toggledOn;
      });
  }

  showReportOptions(testExecution: TestExecution) {
    this.reportMenuItems = [
      {
        label: "Performance Report",
        command: () => {
          this.navigateToUrl(testExecution.report.performanceReportUrl);
          this.analyticsTrackerService.trackAccessPerformanceReport();
        },
        visible:
          testExecution.executionMode === TestExecutionMode.WEB_TEST_ENGINE &&
          !!testExecution.report.performanceReportUrl,
      },
      {
        label: "Hardware Monitoring Report",
        command: () => {
          this.navigateToUrl(testExecution.report.hardwareMonitoringReportUrl);
          this.analyticsTrackerService.trackAccessHardwareMonitoringReport();
        },
        visible:
          this.isHardwareMonitoringFeatureEnabled &&
          !!testExecution.report.hardwareMonitoringReportUrl,
      },
    ];
  }

  navigateToReport(testExecution: TestExecution) {
    if (testExecution.executionMode === TestExecutionMode.WEB_TEST_ENGINE) {
      this.router.navigate(
        [
          `/app/${this.projectId()}/test/execution/details/${
            this.scenarioExecution().id
          }/${testExecution.id}/report`,
        ],
        { replaceUrl: true }
      );
    } else {
      window.open(testExecution.report.url, "_blank");
    }
  }

  navigateToSummaryReport(testExecution: TestExecution) {
    this.analyticsTrackerService.trackAccessTestCaseSummary();
    this.router.navigate(
      [
        `/app/${this.projectId()}/test/execution/details/${
          this.scenarioExecution().id
        }/${testExecution.id}/test-case-executions-summary-report`,
      ],
      { replaceUrl: true }
    );
  }

  private navigateToUrl(url: string | undefined): void {
    if (url) {
      window.open(url, "_blank");
    }
  }

  trackDownloadRun() {
    this.analyticsTrackerService.trackDownloadConfiguration();
  }
}
