import type { HeadScenarioRunViewModel } from "./head-scenario-run-view-model";
import type { DurationBreakdownData } from "./scenario-runs-panel-facade.service";

export interface DurationBreakdownDisplay {
  readonly totalDuration: string;
  readonly testTime: string;
  readonly deploymentTime: string;
  readonly other: string;
}

export function computeDurationBreakdown(
  head: HeadScenarioRunViewModel,
  breakdown: DurationBreakdownData | undefined
): DurationBreakdownDisplay | null {
  if (!head.endDate) {
    return null;
  }

  const totalMs =
    new Date(head.endDate).getTime() - new Date(head.startDate).getTime();
  const totalDuration = formatDurationMs(totalMs);

  const testMs = computeTimeMs(breakdown?.testExecutionTimings);
  const deploymentMs = computeDeploymentMs(
    breakdown?.deploymentStartedOn,
    breakdown?.deploymentEndedOn
  );

  const testTime = testMs !== null ? formatDurationMs(testMs) : "N/A";
  const deploymentTime =
    deploymentMs !== null ? formatDurationMs(deploymentMs) : "N/A";

  const knownMs = (testMs ?? 0) + (deploymentMs ?? 0);
  const otherMs = totalMs - knownMs;
  const o = otherMs > 0 ? formatDurationMs(otherMs) : "N/A";
  const other = testMs !== null || deploymentMs !== null ? o : "N/A";

  return { totalDuration, testTime, deploymentTime, other };
}

function computeTimeMs(
  timings: readonly { startDate?: string; endDate?: string }[] | undefined
): number | null {
  if (!timings || timings.length === 0) {
    return null;
  }
  let totalMs = 0;
  let hasValidTiming = false;
  for (const timing of timings) {
    if (timing.startDate && timing.endDate) {
      const ms =
        new Date(timing.endDate).getTime() -
        new Date(timing.startDate).getTime();
      if (ms >= 0) {
        totalMs += ms;
        hasValidTiming = true;
      }
    }
  }
  return hasValidTiming ? totalMs : null;
}

function computeDeploymentMs(
  startedOn: string | undefined,
  endedOn: string | undefined
): number | null {
  if (!startedOn || !endedOn) {
    return null;
  }
  const ms = new Date(endedOn).getTime() - new Date(startedOn).getTime();
  return ms >= 0 ? ms : null;
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}
