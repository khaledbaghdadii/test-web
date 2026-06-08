import { ProvideInputRequest } from "./provide-input-request";

export interface CreateBusinessProcessDefinitionApiRequest {
  sourceDefinitionId: string;
  name: string;
  description: string;
  providedInputs: ProvideInputRequest[];
}
