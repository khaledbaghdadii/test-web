import { ProvideInputRequest } from "./provide-input-request";

export interface EditBusinessProcessDefinitionApiRequest {
  name: string;
  description: string;
  providedInputs: ProvideInputRequest[];
}
