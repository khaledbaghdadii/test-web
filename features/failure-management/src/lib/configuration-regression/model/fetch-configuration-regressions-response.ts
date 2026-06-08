import { LiteConfigurationRegression } from "./lite-configuration-regression.model";

export interface FetchConfigurationRegressionsResponse {
  configurationRegressions: ConfigurationRegressionsPage;
}

export interface ConfigurationRegressionsPage {
  content: LiteConfigurationRegression[];
  totalElements: number;
}
