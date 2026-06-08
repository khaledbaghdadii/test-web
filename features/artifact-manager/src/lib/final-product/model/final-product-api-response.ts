import { FinalProductLatestSyncState } from "./final-product-filters";
import { Asset } from "../../asset/model/asset";
import { SyncState } from "./final-product";

export interface FinalProductsApiResponse {
  content: FinalProductApiResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface FinalProductApiResponse {
  id: string;
  projectId: string;
  branch: string;
  repositoryId: string;
  tag?: string;
  factoryProduct?: FactoryProductApiResponse;
  clientConfigurations: ClientConfigurationApiResponse[];
  validationLevel?: string;
  environmentDefinitionId: string;
  version: string;
  configurationCommitId: string;
  state: string;
  latestSyncState?: FinalProductLatestSyncState;
  mxBundles: MxBundleApiResponse[];
  rtpProduct: RtpProductApiResponse;
  isTools: IsToolsApiResponse[];
  createdOn: string;
  expiryDate?: Date;
  syncRequests: SyncFinalProductRequestApiResponse[];
  failureMessage?: string;
}

export interface SyncFinalProductRequestApiResponse {
  id: string;
  state: SyncState;
  startDate: string;
  endDate?: string;
  environmentDefinitionIds: string[];
  asset: Asset;
  lightPackage: boolean;
}

export interface FactoryProductApiResponse {
  id: string;
  type: string;
  softwareProduct: SoftwareProductApiResponse;
}

export interface SoftwareProductApiResponse {
  id: string;
  version: string;
  revision: string;
}

export interface ClientConfigurationApiResponse {
  id: string;
  type: string;
  branch: string;
  commitId: string;
}

export interface IsToolsApiResponse {
  id: string;
  name: string;
  type: string;
}

export interface RtpProductApiResponse {
  id: string;
  rtpCommitId: string;
  tag: string;
}

export interface MxBundleApiResponse {
  id: string;
  type: string;
}
