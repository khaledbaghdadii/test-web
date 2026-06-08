import { FinalProductLatestSyncState } from "./final-product-filters";
import { Asset } from "../../asset/model/asset";

export interface FinalProducts {
  content: FinalProduct[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface FinalProduct {
  id: string;
  projectId: string;
  branch: string;
  repositoryId: string;
  tag?: string;
  factoryProduct?: FactoryProduct;
  clientConfigurations: ClientConfiguration[];
  validationLevel?: string;
  environmentDefinitionId: string;
  version: string;
  configurationCommitId: string;
  state: string;
  latestSyncState?: FinalProductLatestSyncState;
  mxBundles: MxBundle[];
  rtpProduct?: RtpProduct;
  isTools: IsTools[];
  createdOn: string;
  expiryDate?: Date;
  syncRequests: SyncFinalProductRequest[];
  failureMessage?: string;
}

export interface SyncFinalProductRequest {
  id: string;
  state: SyncState;
  failureMessage?: string;
  startDate: string;
  endDate?: string;
  environmentDefinitionIds: string[];
  asset: Asset;
  lightPackage: boolean;
}

export enum SyncState {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  IN_PROGRESS = "IN_PROGRESS",
  UNSTABLE = "UNSTABLE",
}

export const SYNC_STATE_DISPLAY_LABELS: Record<string, string> = {
  SUCCESS: "Success",
  FAILED: "Failed",
  IN_PROGRESS: "In Progress",
  UNSTABLE: "Unstable",
};

export function getSyncStateDisplayLabel(state: string): string {
  return SYNC_STATE_DISPLAY_LABELS[state?.toUpperCase()] ?? state;
}

export interface IsTools {
  id: string;
  name: string;
  type: string;
}

export interface RtpProduct {
  id: string;
  rtpCommitId: string;
  tag: string;
}

export interface MxBundle {
  id: string;
  type: string;
}

interface FactoryProduct {
  id: string;
  type: string;
  softwareProduct: SoftwareProduct;
}

interface SoftwareProduct {
  id: string;
  version: string;
  revision: string;
}

export interface ClientConfiguration {
  id: string;
  type: string;
  branch: string;
  commitId: string;
}
