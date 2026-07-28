export interface UpdateFactoryProductRequest {
  projectId: string;
  processId: string;
  factoryProductId: string;
  commitMessage: string;
  filesToUpdate: string[];
  skipUpdate: boolean;
}

export interface FactoryProductFileResult {
  configurationFilePath: string;
  commitId: string;
  status: string;
  failureMessage?: string;
}

export interface UpdateFactoryProductResponse {
  success: boolean;
  skipped: boolean;
  files: FactoryProductFileResult[];
}

export type FactoryProductUserActionType = "SUBMIT_FAP" | "SKIP_FAP_UPDATE";
export type FactoryProductUserActionStatus = "SUCCESS" | "FAILURE" | "NA";

export interface FactoryProductUserAction {
  id: string;
  projectId: string;
  processId: string;
  actionType: FactoryProductUserActionType;
  status: FactoryProductUserActionStatus;
  occurredAt: string;
  details: Record<string, unknown>;
}

export interface FactoryProductUpdateUserActionsResponse {
  actions: FactoryProductUserAction[];
}
