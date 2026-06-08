import { Asset } from "../../asset/model/asset";

export interface LicensesPage {
  content: License[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}
export interface License {
  id: string;
  projectId: string;
  type: string;
  asset: Asset;
  version: string;
  revision: string;
  expirationDate: Date;
  archived: boolean;
  createdOn: Date;
  createdBy?: string;
}

export interface FetchLicensesFilter {
  pageSize: number;
  pageIndex: number;
  projectIds?: string[];
}
