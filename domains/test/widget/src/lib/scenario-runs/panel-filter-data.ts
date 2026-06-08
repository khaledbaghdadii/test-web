export interface PanelFilterData {
  readonly hasWasteReasons: boolean;
  readonly hasRegressions: boolean;
  readonly hasImpacts: boolean;
  readonly hasIncidents: boolean;
  readonly incidentStatuses: string[];
  readonly businessProcessChainIds: string[];
}
