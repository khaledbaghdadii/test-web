import { Component, computed, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { AgGridAngular } from "ag-grid-angular";
import { ModuleRegistry } from "ag-grid-community";
import type { ColDef, ValueFormatterParams } from "ag-grid-enterprise";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import type { AgSparklineOptions } from "ag-charts-community";
import { AgChartsCommunityModule } from "ag-charts-community";
import {
  ManagementRequestMetricApiResponse,
  ManagementRequestMetricsService,
} from "@mxevolve/domains/environment/data-access";
import { DurationUtils } from "@mxevolve/domains/environment/util";

ModuleRegistry.registerModules([
  AllEnterpriseModule.with(AgChartsCommunityModule),
]);

interface MetricRow {
  task: string;
  startedOn: Date;
  endedOn: Date;
  durationSeconds: number;
  durationSecondsBarValue: number[];
}

@Component({
  selector: "mxevolve-management-request-metrics-table",
  standalone: true,
  imports: [AgGridAngular],
  providers: [ManagementRequestMetricsService],
  templateUrl: "./management-request-metrics-table.component.html",
})
export class ManagementRequestMetricsTableComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly managementRequestId = input.required<string>();

  readonly defaultColumnDefinition: ColDef = { flex: 1 };

  private readonly metricsService = inject(ManagementRequestMetricsService);

  protected readonly metricsResource = rxResource<
    ManagementRequestMetricApiResponse[],
    { projectId: string; environmentId: string; managementRequestId: string }
  >({
    params: () => ({
      projectId: this.projectId(),
      environmentId: this.environmentId(),
      managementRequestId: this.managementRequestId(),
    }),
    stream: ({ params }) => {
      if (
        !params.projectId ||
        !params.environmentId ||
        !params.managementRequestId
      ) {
        return of<ManagementRequestMetricApiResponse[]>([]);
      }
      return this.metricsService.getManagementRequestMetrics(
        params.projectId,
        params.environmentId,
        params.managementRequestId
      );
    },
  });

  readonly rowData = computed<MetricRow[]>(() => {
    const metrics = this.metricsResource.hasValue()
      ? this.metricsResource.value()
      : [];
    return metrics.map((metric) => {
      const durationSeconds = DurationUtils.parseDurationToSeconds(
        metric.duration
      );
      return {
        task: metric.taskName,
        startedOn: new Date(metric.startTime),
        endedOn: new Date(metric.endTime),
        durationSeconds,
        durationSecondsBarValue: [durationSeconds],
      };
    });
  });

  readonly maxDurationInSeconds = computed(() => {
    const durations = this.rowData().map((row) => row.durationSeconds);
    return durations.length ? Math.max(...durations) : 7200;
  });

  readonly columnDefinitions = computed<ColDef<MetricRow>[]>(() => [
    {
      field: "task",
      headerName: "Task",
      filter: "agTextColumnFilter",
    },
    {
      field: "durationSecondsBarValue",
      headerName: "Duration (seconds)",
      cellRenderer: "agSparklineCellRenderer",
      comparator: (valueA: number[], valueB: number[]) => valueA[0] - valueB[0],
      cellRendererParams: {
        sparklineOptions: {
          type: "bar",
          direction: "horizontal",
          min: 0,
          max: this.maxDurationInSeconds(),
          highlight: {
            highlightedItem: {
              fill: "#ffc107",
            },
          },
        } as AgSparklineOptions,
      },
    },
    {
      field: "durationSeconds",
      headerName: "Duration",
      valueFormatter: (params: ValueFormatterParams<MetricRow, number>) =>
        DurationUtils.convertSecondsToDurationString(params.value!),
    },
    {
      field: "startedOn",
      headerName: "Started On",
      cellDataType: "dateTime",
      valueFormatter: (params: ValueFormatterParams<MetricRow, Date>) =>
        DurationUtils.formatDate(params.value!),
    },
    {
      field: "endedOn",
      headerName: "Ended On",
      cellDataType: "dateTime",
      valueFormatter: (params: ValueFormatterParams<MetricRow, Date>) =>
        DurationUtils.formatDate(params.value!),
    },
  ]);
}
