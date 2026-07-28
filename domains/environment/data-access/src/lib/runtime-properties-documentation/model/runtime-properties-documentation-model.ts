export enum RuntimePropertiesRequestType {
  DEPLOYMENT = "deployment",
  CLEANING = "cleaning",
  CONFIG_AUDIT = "config-audit",
  IMPORT_CONFIG = "import-config",
}

export type PropertyKind =
  | "STRING"
  | "INTEGER"
  | "LONG"
  | "BOOLEAN"
  | "ENUM"
  | "OBJECT"
  | "LIST";

export interface RuntimePropertyNode {
  name: string;
  kind: PropertyKind;
  optional: boolean;
  description?: string;
  deprecated: boolean;
  deprecationReason?: string;
  allowedValues?: string[]; // enum only
  children?: RuntimePropertyNode[]; // object only
  element?: RuntimePropertyNode; // list only
}

export interface RuntimePropertiesDocumentationModel {
  requestType: string;
  properties: RuntimePropertyNode[];
}

export type RuntimePropertyTreeNodeData = RuntimePropertyNode & {
  path: string;
  isListElement: boolean;
  deprecatedValue: string;
};
