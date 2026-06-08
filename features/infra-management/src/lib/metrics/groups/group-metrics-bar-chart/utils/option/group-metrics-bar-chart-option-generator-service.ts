import { inject, Injectable } from "@angular/core";
import { GroupMetrics } from "../../../../../infra-groups/metrics/model/group-metrics";
import { GroupMetricsBarChartMapper } from "../mapper/group-metrics-bar-chart-mapper.service";
import {
  AgBarSeriesTooltipRendererParams,
  AgCartesianChartOptions,
} from "ag-charts-enterprise";
import { GroupMetricsBarChartModel } from "../../model/group-metrics-bar-chart-model";
import colors from "tailwindcss/colors";

export type GroupMetricsGroupedBarData = {
  groupName: string;
  threshold: number;
  tooltips: Record<string, string>;
  realValues: Record<string, number>;
  [familyName: string]:
    | string
    | number
    | Record<string, string | number>
    | undefined;
};

export interface GroupedBarChartData {
  data: GroupMetricsGroupedBarData[];
  families: string[];
}

const GOLDEN_ANGLE = 137.508;
const HUE_OFFSET = 200;
const MIN_SEGMENT_RATIO = 0.08;
const MIN_SEGMENT_FLOOR = 3;

function familyFill(index: number): string {
  const hue = (HUE_OFFSET + index * GOLDEN_ANGLE) % 360;
  return `hsl(${Math.round(hue)}, 65%, 55%)`;
}

@Injectable()
export class GroupMetricsBarChartOptionsGenerator {
  mapper = inject(GroupMetricsBarChartMapper);

  toGroupedData(
    groupMetrics: GroupMetrics[],
    defaultThreshold = 0
  ): GroupedBarChartData {
    const chartModels = this.mapper.map(groupMetrics, defaultThreshold);
    return this.mapToGroupedData(chartModels);
  }

  mapToGroupedData(
    chartModels: GroupMetricsBarChartModel[]
  ): GroupedBarChartData {
    const groupMap = new Map<string, GroupMetricsGroupedBarData>();
    const familySet = new Set<string>();
    const familyTotals = new Map<string, { sum: number; count: number }>();

    for (const model of chartModels) {
      if (!groupMap.has(model.groupName)) {
        groupMap.set(model.groupName, {
          groupName: model.groupName,
          threshold: model.threshold,
          tooltips: {},
          realValues: {},
        });
      }
      const row = groupMap.get(model.groupName)!;
      row.realValues[model.infraFamilyName] =
        model.remainingNumberOfAllocations;
      row[model.infraFamilyName] = model.remainingNumberOfAllocations;
      row.tooltips[model.infraFamilyName] = model.tooltipHtml;
      familySet.add(model.infraFamilyName);

      const entry = familyTotals.get(model.infraFamilyName) || {
        sum: 0,
        count: 0,
      };
      entry.sum += model.remainingNumberOfAllocations;
      entry.count += 1;
      familyTotals.set(model.infraFamilyName, entry);
    }

    const groupTotals = new Map<string, number>();
    for (const model of chartModels) {
      groupTotals.set(
        model.groupName,
        (groupTotals.get(model.groupName) ?? 0) +
          model.remainingNumberOfAllocations
      );
    }
    const maxGroupTotal = Math.max(...groupTotals.values(), 0);
    const minSegment = Math.max(
      MIN_SEGMENT_FLOOR,
      Math.ceil(maxGroupTotal * MIN_SEGMENT_RATIO)
    );

    for (const row of groupMap.values()) {
      for (const family of familySet) {
        const real = row.realValues[family];
        if (real !== undefined) {
          row[family] = minSegment + real;
        }
      }
    }

    const sortedFamilies = Array.from(familySet).sort((a, b) => {
      const avgA =
        (familyTotals.get(a)?.sum ?? 0) / (familyTotals.get(a)?.count ?? 1);
      const avgB =
        (familyTotals.get(b)?.sum ?? 0) / (familyTotals.get(b)?.count ?? 1);
      return avgA - avgB;
    });

    return {
      data: Array.from(groupMap.values()),
      families: sortedFamilies,
    };
  }

  buildChartOptions(groupedData: GroupedBarChartData): AgCartesianChartOptions {
    const { data, families } = groupedData;
    const series = families.map((family, idx) => ({
      type: "bar" as const,
      xKey: "groupName",
      yKey: family,
      yName: family,
      stacked: true,
      fill: familyFill(idx),
      stroke: "#ffffff",
      strokeWidth: 1,
      label: {
        enabled: true,
        formatter: ({
          datum,
          yKey,
        }: {
          datum: GroupMetricsGroupedBarData;
          yKey: string;
        }) => {
          const real = datum.realValues[yKey];
          return real == null ? "" : real.toString();
        },
      },
      itemStyler: ({
        datum,
        yKey,
      }: {
        datum: GroupMetricsGroupedBarData;
        yKey: string;
      }) => {
        const real = datum.realValues[yKey];
        if (real !== undefined && real < datum.threshold) {
          return { fill: colors.red[600] };
        }
        return {};
      },
      tooltip: {
        range: "nearest" as const,
        renderer: (
          params: AgBarSeriesTooltipRendererParams<GroupMetricsGroupedBarData>
        ) => params.datum.tooltips[family] ?? "",
      },
    }));

    return {
      legend: {
        enabled: true,
        position: "top" as const,
      },
      contextMenu: {
        enabled: false,
      },
      data,
      series,
      axes: [
        {
          type: "category" as const,
          paddingOuter: 0.4,
          position: "bottom" as const,
          title: {
            text: "Groups",
          },
        },
        {
          type: "number" as const,
          position: "left" as const,
          label: {
            enabled: false,
          },
          crosshair: {
            enabled: false,
          },
        },
      ],
    };
  }
}
