import { SyncFinalProductRequest } from "../../model/final-product";

export interface FinalProductSyncDetails {
  finalProductId: string;
  projectId: string;
  syncRequestDetails: SyncFinalProductRequest;
}
