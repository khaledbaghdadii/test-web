import { EditStreamOwnerApiRequest } from "./edit-stream-owner-api-request";

export interface EditStreamApiRequest {
  newName: string;
  owners: EditStreamOwnerApiRequest[];
  businessProcessChainIds: number[];
}
