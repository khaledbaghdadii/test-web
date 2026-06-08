import { ShutdownPolicyType } from "./shutdown-policy-type";

export interface ShutdownPolicyAPIResponse {
  id: string;
  policyType: ShutdownPolicyType;
}
