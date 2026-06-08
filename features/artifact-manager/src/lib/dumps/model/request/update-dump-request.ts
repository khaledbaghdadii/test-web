export interface UpdateDumpRequest {
  name?: string;
  description?: string;
  size?: number;
  mxDeployPackageId: string;
  serverVersion: string;
  version?: string;
  mxDbTypes: string[];
  compressed?: boolean;
  schema?: string;
}
