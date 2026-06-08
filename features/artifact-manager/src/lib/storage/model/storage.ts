import { StorageType } from "./storage-type";
import { StorageUseCase } from "./storage-use-case";

export interface StoragePage {
  content: Storage[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface Storage {
  id: string;
  baseUri: string;
  name: string;
  description?: string;
  projectId?: string;
  repository?: string;
  storageType: StorageType;
  useCases: StorageUseCase[];
  createdOn: Date;
  createdBy?: string;
}

export interface FetchStoragesFilter {
  pageSize: number;
  pageIndex: number;
  storageType: string;
  searchKey: string;
  projectIds?: string[];
  fetchGlobal?: boolean;
  useCases?: StorageUseCase[];
}
