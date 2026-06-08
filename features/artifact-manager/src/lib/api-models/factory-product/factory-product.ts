export interface FactoryProducts {
  content: FactoryProduct[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

export interface FactoryProduct {
  createdOn: string;
  lastModifiedOn: string;
  createdBy: string;
  lastModifiedBy: string;
  id: string;
  projectId?: string;
  parent?: SimpleFactoryProduct;
  type: string;
  softwareProduct: SoftwareProductResponse;
  configurationComponents: ConfigurationComponentResponse[];
  validationLevel?: string;
  validationDate?: Date;
}

export interface SimpleFactoryProduct {
  id: string;
  type: string;
}

export interface SoftwareProductResponse {
  id: string;
  version: string;
  revision: string;
  patch?: string;
  builds: SoftwareProductBuildResponse[];
}

export interface SoftwareProductBuildResponse {
  id: string;
  projectId?: string;
  purged: boolean;
  mxBuild: SoftwareProductMxBuildsResponse;
  core: SoftwareProductMxBundlesResponse;
  mxBundles: SoftwareProductMxBundlesResponse[];
  customizedMxBundles?: SoftwareProductMxBundlesResponse[];
}

export interface SoftwareProductMxBundlesResponse {
  id: string;
  type: string;
}

export interface SoftwareProductMxBuildsResponse {
  version: string;
  buildId: string;
  revision: string;
  os: string;
}

export interface ConfigurationComponentResponse {
  id: string;
  type: string;
  version: string;
  purged: boolean;
  builds: ConfigurationComponentBuildResponse[];
}

export interface ConfigurationComponentBuildResponse {
  id: string;
  purged: boolean;
  mxBuild: ConfigurationComponentMxBuildResponse;
  mxBundles: ConfigurationComponentMxBundlesResponse[];
}

export interface ConfigurationComponentMxBundlesResponse {
  id: string;
  type: string;
}

export interface ConfigurationComponentMxBuildResponse {
  version: string;
  buildId: string;
}
