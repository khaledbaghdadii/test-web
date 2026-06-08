import { GroupApiModel } from "@mxflow/features/group";
import { BusinessProcessChainApiModel } from "./business-process-chain-api-model";

export interface StreamsApiModel {
  id: string;
  name: string;
  owners: GroupApiModel[];
  businessProcessChains: BusinessProcessChainApiModel[];
}
