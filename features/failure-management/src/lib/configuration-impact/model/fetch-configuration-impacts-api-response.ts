export interface ConfigurationImpactApiResponse {
  id: string;
  projectId: string;
  title: string;
  description: string;
  guiltyChange: string;
  owner: string;
  creationDate: Date;
}

export interface LiteConfigurationImpactApiResponse {
  id: string;
  projectId: string;
  title: string;
  guiltyChange: string;
  owner: string;
  creationDate: Date;
}

export interface FetchConfigurationImpactsApiResponse {
  configurationImpacts: ConfigurationImpactsApiPage;
}

export interface ConfigurationImpactsApiPage {
  content: LiteConfigurationImpactApiResponse[];
  totalElements: number;
}
