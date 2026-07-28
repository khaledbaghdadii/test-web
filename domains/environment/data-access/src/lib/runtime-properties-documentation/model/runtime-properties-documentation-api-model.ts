import { PropertyKind } from "./runtime-properties-documentation-model";

export interface RuntimePropertyNodeApiModel {
  name: string;
  kind: PropertyKind;
  optional: boolean;
  description?: string;
  deprecated: boolean;
  deprecationReason?: string;
  allowedValues?: string[]; // enum only
  children?: RuntimePropertyNodeApiModel[]; // object only
  element?: RuntimePropertyNodeApiModel; // list only
}

export interface RuntimePropertiesDocumentationApiResponse {
  requestType: string;
  properties: RuntimePropertyNodeApiModel[];
}
