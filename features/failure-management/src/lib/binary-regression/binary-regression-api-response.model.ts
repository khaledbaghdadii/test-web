export interface BinaryRegressionApiResponse {
  id: string;
  title: string;
  description: string;
  defect: DefectApiResponse;
  fix: string;
  mxVersion: string;
  owner?: string;
  projectId?: string;
  incidentId?: string;
  creationDate: Date;
}

export class DefectApiResponse {
  id: string;
  link: string;
}
