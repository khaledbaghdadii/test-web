export interface CreateBinaryRegressionRequest {
  title: string;
  description: string;
  mxVersion: string;
  defect?: string;
  fix?: string;
  incidentId?: string;
}
