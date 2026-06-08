import { Injectable } from "@angular/core";
import { GroupMetricsBarChartModel } from "../../model/group-metrics-bar-chart-model";
import {
  GroupMetrics,
  GroupInfraFamilyMetric,
} from "../../../../../infra-groups/metrics/model/group-metrics";

@Injectable()
export class GroupMetricsBarChartMapper {
  map(
    groupMetrics: GroupMetrics[],
    defaultThreshold = 0
  ): GroupMetricsBarChartModel[] {
    const barChartData: GroupMetricsBarChartModel[] = [];

    groupMetrics
      .slice()
      .sort((a, b) => {
        const minA = Math.min(
          ...a.groupInfraFamilyMetrics
            .filter((m) => m.remainingNumberOfAllocations !== undefined)
            .map((m) => m.remainingNumberOfAllocations!)
        );
        const minB = Math.min(
          ...b.groupInfraFamilyMetrics
            .filter((m) => m.remainingNumberOfAllocations !== undefined)
            .map((m) => m.remainingNumberOfAllocations!)
        );
        return minA - minB;
      })
      .forEach((groupMetric) => {
        const threshold =
          groupMetric.group.allocationNotificationThreshold?.threshold ??
          defaultThreshold;
        groupMetric.groupInfraFamilyMetrics.forEach((metric) => {
          if (metric?.remainingNumberOfAllocations !== undefined) {
            barChartData.push({
              groupName: groupMetric.group.name,
              infraFamilyName:
                metric.allocationRequest?.infraFamily?.name ??
                "No Infra Family",
              remainingNumberOfAllocations: metric.remainingNumberOfAllocations,
              threshold: threshold,
              tooltipHtml: this.tooltipHtml(groupMetric, metric, threshold),
            });
          }
        });
      });
    return barChartData;
  }

  private tooltipHtml(
    groupMetric: GroupMetrics,
    metric: GroupInfraFamilyMetric,
    threshold: number
  ): string {
    if (!groupMetric || !metric) return "";
    const groupName = groupMetric.group.name;
    const infraFamilyName = metric.allocationRequest?.infraFamily?.name;
    const remaining = metric.remainingNumberOfAllocations;
    const details = metric.allocationFailureDetails;
    const containerClass =
      "bg-white text-gray-900 border border-blue-700 rounded-lg p-4 text-xs sm:text-sm min-w-[220px] max-w-[90vw] w-full sm:w-[400px] h-auto max-h-[60vh] overflow-y-auto shadow-lg";
    const labelClass = "text-blue-700 font-bold";
    const valueClass = "text-gray-900 font-normal";
    const groupNameHtml = `<div><span class='${labelClass}'>Group Name:</span> <span class='${valueClass}'>${groupName}</span></div>`;
    const infraFamilyHtml = infraFamilyName
      ? `<div><span class='${labelClass}'>Infra Family:</span> <span class='${valueClass}'>${infraFamilyName}</span></div>`
      : "";
    const totalAllocationsHtml = `<div><span class='${labelClass}'>Remaining number of allocations:</span> <span class='${
      remaining !== undefined && remaining < threshold
        ? "text-red-600"
        : valueClass
    }'>${remaining}</span></div>`;
    if (details?.failedDatabaseInstanceAllocationRequest) {
      const dbSnapshotId =
        details.failedDatabaseInstanceAllocationRequest.databaseSnapshotId ??
        "-";
      return `<div class='${containerClass}'>
                ${groupNameHtml}
                ${infraFamilyHtml}
                ${totalAllocationsHtml}
                <div><span class='${labelClass}'>Allocation Limit Reason:</span> <span class='${valueClass}'>low resources in FDP - <b>DB Snapshot Id: ${dbSnapshotId}</b>.<br><i>Other machine types might hold more allocations</i></span></div>
            </div>`;
    }
    if (details?.failedMachineResourceAllocationRequest) {
      const servers =
        details.failedMachineResourceAllocationRequest.servers ?? [];
      const serverTypes = servers.map((s) => s.type).filter(Boolean);
      const typesStr =
        serverTypes.length > 0 ? `<b>${serverTypes.join(", ")}</b>` : "-";
      return `<div class='${containerClass}'>
                ${groupNameHtml}
                ${infraFamilyHtml}
                ${totalAllocationsHtml}
                <div><span class='${labelClass}'>Allocation Limit Reason:</span> <span class='${valueClass}'>low resources on machines of type: ${typesStr}.<br><i>Other machine types may still have available allocations.</i></span></div>
            </div>`;
    }
    return `<div class='${containerClass}'>
              ${groupNameHtml}
              ${infraFamilyHtml}
              ${totalAllocationsHtml}
            </div>`;
  }
}
