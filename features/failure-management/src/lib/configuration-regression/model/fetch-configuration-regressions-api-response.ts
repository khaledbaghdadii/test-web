export interface LiteConfigurationRegressionApiResponse {
  id: string;
  projectId: string;
  title: string;
  guiltyChange: string;
  fix: string;
  owner: string;
}

export interface FetchConfigurationRegressionsApiResponse {
  configurationRegressions: ConfigurationRegressionsApiPage;
}

export interface ConfigurationRegressionsApiPage {
  content: LiteConfigurationRegressionApiResponse[];
  totalElements: number;
}
