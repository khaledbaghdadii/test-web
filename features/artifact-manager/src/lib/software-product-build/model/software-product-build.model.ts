export interface CustomizeSoftwareProductBuildApiRequest {
  customizedBundles: CustomizedBundle[];
}

export interface CustomizedBundle {
  bundleId: string;
  customizedMxDeployPackage: CustomizedMxDeployPackage;
  customizedArtifacts: CustomizedArtifact[];
}

export interface CustomizedMxDeployPackage {
  storageId: string;
  relativePath: string;
}

export interface CustomizedArtifact {
  artifactId: string;
  storageId: string;
  relativePath: string;
}
