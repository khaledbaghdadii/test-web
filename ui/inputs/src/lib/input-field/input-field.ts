export interface InputField {
  id: string;
  name: string;
  groupId: string;
  resourceType: string;
  multiValue: boolean;
  optional: boolean;
  value?: any;
  description?: string;
}
