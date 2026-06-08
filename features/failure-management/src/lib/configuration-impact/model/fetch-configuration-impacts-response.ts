import { LiteConfigurationImpact } from "@mxflow/features/failure-management";

export interface FetchConfigurationImpactsResponse {
  configurationImpacts: ConfigurationImpactsPage;
}

export interface ConfigurationImpactsPage {
  content: LiteConfigurationImpact[];
  totalElements: number;
}
