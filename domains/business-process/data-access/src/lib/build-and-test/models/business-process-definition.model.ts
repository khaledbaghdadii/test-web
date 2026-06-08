export interface BusinessProcessDefinition {
  readonly id: string;
  readonly family?: BusinessProcessFamily;
  readonly processName?: string;
  readonly name: string;
  readonly description?: string;
  readonly providedInputs: ProvidedInput[];
  readonly executable?: boolean;
  readonly sourceDefinitionId?: string;
}

export interface ProvidedInput {
  readonly inputId: string;
  readonly value: unknown;
}

export interface BusinessProcessFamily {
  readonly id?: string;
  readonly name?: string;
}

export interface GetBusinessProcessDefinitionsRequest {
  readonly projectId: string;
  readonly extendable?: boolean;
  readonly executable?: boolean;
}
