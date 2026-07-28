import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";

export interface AllExecutionSummary {
  readonly id: string;
  readonly definitionId?: string;
  readonly name: string;
  readonly owner?: string;
  readonly status?: ExecutionStatus;
  readonly officiality?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly expiryDate?: string;
  readonly daysExtended?: number;
  readonly businessProcessDefinitionName?: string;
  readonly processName?: string;
  readonly familyId: ExecutionFamily;
  readonly sourceDefinitionId?: string;
}
