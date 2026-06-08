export interface SummaryFilterEvent {
  readonly type: "analysisStatus" | "detection" | "incident";
  readonly value: string;
  readonly label: string;
}
