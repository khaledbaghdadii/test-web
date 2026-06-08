import { Group } from "@mxflow/features/group";
import { BusinessProcessChain } from "./business-process-chain";

export interface Stream {
  id: string;
  name: string;
  owners: Group[];
  businessProcessChains: BusinessProcessChain[];
}
