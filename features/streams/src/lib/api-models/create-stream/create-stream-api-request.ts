import { CreateStreamOwnerApiRequest } from "./create-stream-owner-api-request";

export interface CreateStreamApiRequest {
  name: string;
  owners: CreateStreamOwnerApiRequest[];
  businessProcessChainIds: number[];
}
