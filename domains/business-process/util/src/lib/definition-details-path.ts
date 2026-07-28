export function buildDefinitionDetailsPath(
  projectId: string,
  definitionId: string
): string {
  return `/app/${projectId}/business-process/definition/details/${definitionId}`;
}
