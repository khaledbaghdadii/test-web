export interface CreateBusinessProcessDefinitionRequest {
  name: string;
  description: string;
  sourceDefinition: SourceDefinition;
  inputs: any;
}

interface SourceDefinition {
  familyId: string;
  definitionId: string;
}
