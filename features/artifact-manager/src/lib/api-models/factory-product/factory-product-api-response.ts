export interface FactoryProductsApiResponse {
  content: FactoryProductApiResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface FactoryProductApiResponse {
  createdOn: string;
  lastModifiedOn: string;
  createdBy: string;
  lastModifiedBy: string;
  id: string;
  projectId?: string;
  parent?: SimpleFactoryProductApiResponse;
  type: string;
  softwareProduct: SoftwareProductApiResponse;
  configurationComponents: ConfigurationComponentApiResponse[];
  validationLevel?: string;
  validationDate?: Date;
}

export interface SimpleFactoryProductApiResponse {
  id: string;
  type: string;
}

export interface SoftwareProductApiResponse {
  id: string;
  version: string;
  revision: string;
  patch?: string;
  builds: SoftwareProductBuildApiResponse[];
}

export interface SoftwareProductBuildApiResponse {
  id: string;
  purged: boolean;
  mxBuild: SoftwareProductMxBuildsApiResponse;
  core: SoftwareProductMxBundlesApiResponse;
  mxBundles: SoftwareProductMxBundlesApiResponse[];
  customizedMxBundles?: SoftwareProductMxBundlesApiResponse[];
}

export interface SoftwareProductMxBuildsApiResponse {
  version: string;
  buildId: string;
  revision: string;
  os: string;
}

export interface SoftwareProductMxBundlesApiResponse {
  id: string;
  type: string;
}

export interface ConfigurationComponentApiResponse {
  id: string;
  type: string;
  version: string;
  builds: ConfigurationComponentBuildApiResponse[];
  purged: boolean;
}

export interface ConfigurationComponentBuildApiResponse {
  id: string;
  purged: boolean;
  mxBuild: ConfigurationComponentMxBuildApiResponse;
  mxBundles: ConfigurationComponentMxBundlesApiResponse[];
}

export interface ConfigurationComponentMxBundlesApiResponse {
  id: string;
  type: string;
}

export interface ConfigurationComponentMxBuildApiResponse {
  version: string;
  buildId: string;
}
