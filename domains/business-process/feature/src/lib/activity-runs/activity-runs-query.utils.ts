import { ExecutionStatus } from "@mxevolve/domains/business-process/util";

export interface ActivityRunDefinition {
  id: string;
  processName?: string;
}

export function resolveDefinitionIds(
  definitions: readonly ActivityRunDefinition[],
  definitionIds: string[] | undefined,
  processNames: string[] | undefined
): string[] | undefined {
  if (!definitions.length) {
    return undefined;
  }

  const hasDefinitionIds = !!definitionIds?.length;
  const hasProcessNames = !!processNames?.length;
  if (!hasDefinitionIds && !hasProcessNames) {
    return undefined;
  }

  const matchedByDefinitionId = definitionIds?.length
    ? definitions.filter((definition) => definitionIds.includes(definition.id))
    : [];
  const matchedByProcessName = processNames?.length
    ? definitions.filter(
        (definition) =>
          !!definition.processName &&
          processNames.includes(definition.processName)
      )
    : [];

  if (hasDefinitionIds && hasProcessNames) {
    const intersection = matchedByDefinitionId.filter((definition) =>
      matchedByProcessName.some((other) => other.id === definition.id)
    );
    return intersection.length
      ? intersection.map((definition) => definition.id)
      : ["noMatch"];
  }

  return (hasDefinitionIds ? matchedByDefinitionId : matchedByProcessName).map(
    (definition) => definition.id
  );
}

export function resolveStatuses(
  tableStatuses: ExecutionStatus[],
  pickedStatuses: ExecutionStatus[] | undefined
): ExecutionStatus[] {
  if (!pickedStatuses?.length) {
    return tableStatuses;
  }
  const intersection = pickedStatuses.filter((status) =>
    tableStatuses.includes(status)
  );
  return intersection.length ? intersection : tableStatuses;
}

export function nonEmpty(values: string[] | undefined): string[] | undefined {
  return values?.length ? values : undefined;
}

export function toDateRange(
  field: "startDateRange" | "endDateRange" | "expiryDateRange",
  range: Date[] | undefined
): Record<string, string> {
  if (!range?.[0] || !range?.[1]) {
    return {};
  }
  return {
    [`${field}Start`]: range[0].toISOString(),
    [`${field}End`]: range[1].toISOString(),
  };
}

export function withoutUndefined<T extends Record<string, unknown>>(
  query: T
): T {
  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) {
      delete query[key];
    }
  });
  return query;
}
