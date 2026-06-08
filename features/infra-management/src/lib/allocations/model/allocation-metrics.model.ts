export interface AllocationMetrics {
  states: AllocationMetricsStates;
}

export interface AllocationMetricsStates {
  deallocationFailed: number;
  failed: number;
  queued: number;
}

export interface AllocationMetricsApiResponse {
  states: AllocationMetricsStatesApiResponse;
}

export interface AllocationMetricsStatesApiResponse {
  deallocation_failed: number;
  failed: number;
  queued: number;
}
