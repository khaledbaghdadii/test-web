/**
 * Infra Family model representing the domain object
 */
export interface InfraFamily {
  id: string;
  name: string;
  projectId: string;
  description: string;
  createdOn: string;
  lastModifiedOn: string;
  createdBy: string;
  lastModifiedBy: string;
}

/**
 * API response for Infra Family - matches backend response format
 */
export interface InfraFamilyApiResponse {
  id: string;
  name: string;
  projectId: string;
  description: string;
  createdOn: string;
  lastModifiedOn: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface CreateInfraFamilyRequest {
  name: string;
  description?: string;
}
