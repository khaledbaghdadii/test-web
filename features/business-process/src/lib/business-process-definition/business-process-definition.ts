import { BusinessProcessFamily } from "./business-process-family";

export interface BusinessProcessDefinition {
  id: string;
  family: BusinessProcessFamily;
  processName: string;
  name: string;
  description: string;
  providedInputs: ProvidedInput[];
  executable?: boolean;
  sourceDefinitionId: string;
}

export interface ProvidedInput {
  inputId: string;
  value: any;
}
