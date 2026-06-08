export interface IncidentSummary {
  statuses: IncidentSummaryStatus[];
}
export interface IncidentSummaryStatus {
  name: string;
  count: number;
}
