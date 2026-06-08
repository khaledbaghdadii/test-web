export interface DatabaseServerVersionsApiResponse {
  databaseServerVersions: DatabaseServerVersionApiResponse[];
}

interface DatabaseServerVersionApiResponse {
  version: string;

  engineSpecificDetails?: string[];
}
