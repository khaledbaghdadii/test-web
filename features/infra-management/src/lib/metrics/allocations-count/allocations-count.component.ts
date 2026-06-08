import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AgCharts } from "ag-charts-angular";
import {
  AgBarSeriesTooltipRendererParams,
  AgCartesianChartOptions,
} from "ag-charts-enterprise";
import { InfraAllocationsService } from "../../allocations/infra-allocations.service";
import { AllocationMetrics } from "../../allocations/model/allocation-metrics.model";

export interface AllocationChartData {
  type: string;
  count: number;
  tooltip: string;
}

@Component({
  selector: "mxevolve-allocations-count",
  providers: [InfraAllocationsService],
  imports: [AgCharts],
  templateUrl: "allocations-count.component.html",
})
export class AllocationsCountComponent implements OnInit {
  infraAllocationService = inject(InfraAllocationsService);
  destroyRef = inject(DestroyRef);

  projectId = input.required<string>();

  infraAllocationMetrics: WritableSignal<AllocationMetrics | undefined> =
    signal(undefined);

  dataExists = computed(() => {
    const metrics = this.infraAllocationMetrics();
    if (!metrics?.states) return false;
    const { queued, failed, deallocationFailed } = metrics.states;
    return queued > 0 || failed > 0 || deallocationFailed > 0;
  });

  chartOptions = computed<AgCartesianChartOptions>(() =>
    this.buildChartOptions(this.infraAllocationMetrics())
  );

  ngOnInit(): void {
    this.infraAllocationService
      .getAllocationMetrics(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((metrics) => {
        this.infraAllocationMetrics.set(metrics);
      });
  }

  buildChartOptions(
    metrics: AllocationMetrics | undefined
  ): AgCartesianChartOptions {
    return {
      data: this.mapToChartData(metrics),
      series: [
        {
          type: "bar",
          xKey: "type",
          yKey: "count",
          direction: "horizontal",
          label: {
            enabled: true,
          },
          tooltip: {
            renderer: (
              params: AgBarSeriesTooltipRendererParams<AllocationChartData>
            ) => params.datum.tooltip,
          },
        },
      ],
      axes: [
        {
          type: "category",
          position: "left",
        },
        {
          type: "number",
          position: "bottom",
          title: {
            text: "Count",
          },
        },
      ],
      legend: {
        enabled: false,
      },
    };
  }

  mapToChartData(
    metrics: AllocationMetrics | undefined
  ): AllocationChartData[] {
    if (!metrics?.states) return [];
    const { queued, failed, deallocationFailed } = metrics.states;
    return [
      {
        type: "Queued",
        count: queued ?? 0,
        tooltip: `Total number of allocations with state queued: ${
          queued ?? 0
        }`,
      },
      {
        type: "Failed",
        count: failed ?? 0,
        tooltip: `Total number of allocations with state failed: ${
          failed ?? 0
        }`,
      },
      {
        type: "Deallocation Failed",
        count: deallocationFailed ?? 0,
        tooltip: `Total number of allocations with state deallocation failed: ${
          deallocationFailed ?? 0
        }`,
      },
    ];
  }
}
