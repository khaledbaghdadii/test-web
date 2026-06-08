export interface FactoryProducts {
  readonly content: FactoryProduct[];
  readonly totalPages: number;
  readonly totalElements: number;
  readonly size: number;
  readonly number: number;
  readonly last: boolean;
}

export interface FactoryProduct {
  readonly createdOn: string;
  readonly lastModifiedOn: string;
  readonly createdBy: string;
  readonly lastModifiedBy: string;
  readonly id: string;
  readonly projectId?: string;
  readonly parent?: SimpleFactoryProduct;
  readonly type: string;
  readonly softwareProduct: SoftwareProductResponse;
  readonly configurationComponents: ConfigurationComponentResponse[];
  readonly validationLevel?: string;
  readonly validationDate?: Date;
}

export interface SimpleFactoryProduct {
  readonly id: string;
  readonly type: string;
}

export interface SoftwareProductResponse {
  readonly id: string;
  readonly version: string;
  readonly revision: string;
  readonly patch?: string;
  readonly builds: SoftwareProductBuildResponse[];
}

export interface SoftwareProductBuildResponse {
  readonly id: string;
  readonly projectId?: string;
  readonly purged: boolean;
  readonly mxBuild: SoftwareProductMxBuildsResponse;
  readonly core: SoftwareProductMxBundlesResponse;
  readonly mxBundles: SoftwareProductMxBundlesResponse[];
  readonly customizedMxBundles?: SoftwareProductMxBundlesResponse[];
}

export interface SoftwareProductMxBundlesResponse {
  readonly id: string;
  readonly type: string;
}

export interface SoftwareProductMxBuildsResponse {
  readonly version: string;
  readonly buildId: string;
  readonly revision: string;
  readonly os: string;
}

export interface ConfigurationComponentResponse {
  readonly id: string;
  readonly type: string;
  readonly version: string;
  readonly purged: boolean;
  readonly builds: ConfigurationComponentBuildResponse[];
}

export interface ConfigurationComponentBuildResponse {
  readonly id: string;
  readonly purged: boolean;
  readonly mxBuild: ConfigurationComponentMxBuildResponse;
  readonly mxBundles: ConfigurationComponentMxBundlesResponse[];
}

export interface ConfigurationComponentMxBundlesResponse {
  readonly id: string;
  readonly type: string;
}

export interface ConfigurationComponentMxBuildResponse {
  readonly version: string;
  readonly buildId: string;
}
