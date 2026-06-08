export interface ScenarioRunApiResponse {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly analysisStatus: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly commitId: string;
  readonly assignee: string;
  readonly mxVersion: string;
  readonly mxBuildId: string;
  readonly envInfo: {
    readonly environmentId: string;
    readonly status: string;
  };
  readonly detections: {
    readonly binaryImpactIds: string[];
    readonly configurationImpactIds: string[];
    readonly binaryRegressionIds: string[];
    readonly configurationRegressionIds: string[];
    readonly failureReasonIds: string[];
  };
  readonly linkedIncidents: {
    readonly id: string;
    readonly title: string;
    readonly status: string;
    readonly assignee: string;
    readonly reporter: string;
    readonly creationDate: string;
    readonly externalIssue: {
      readonly id: string;
      readonly origin: string;
      readonly link: string;
    };
  }[];
  readonly testExecutions?: readonly {
    readonly startDate?: string;
    readonly endDate?: string;
  }[];
}
