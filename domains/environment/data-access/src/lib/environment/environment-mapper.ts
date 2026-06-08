import {
  ApplicativeApiModel,
  EnvironmentApiModel,
  EnvironmentBundleApiModel,
  EnvironmentDatabaseApiModel,
} from "./environment-api-model";
import {
  Applicative,
  Environment,
  EnvironmentBundle,
  EnvironmentDatabase,
} from "./environment";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

const CORE_BUNDLE_ID = "CORE";
const MXTESTWEB_BUNDLE_ID = "mxtestweb";
const UNRESOLVED_VALUE = "-";

export function toEnvironments(
  apiModels: EnvironmentApiModel[]
): Environment[] {
  return apiModels.map(toEnvironment);
}

export function toEnvironment(apiModel: EnvironmentApiModel): Environment {
  const coreBundle = findCoreBundle(apiModel.bundles);

  return {
    id: apiModel.id,
    status: apiModel.status as EnvironmentStatus,
    projectId: apiModel.projectId,
    startDate: apiModel.createdOn,
    mxVersion: coreBundle?.branch ?? UNRESOLVED_VALUE,
    mxBuildId: coreBundle?.version ?? UNRESOLVED_VALUE,
    commitId: apiModel.configurationIdentifier?.revision ?? UNRESOLVED_VALUE,
    bundles: toBundles(apiModel.bundles),
    isTools: apiModel.isTools,
    outputsDirectoryUri: apiModel.outputsDirectoryUri,
    databases: toDatabases(apiModel.databases),
    primaryApplicative: toApplicative(apiModel.primaryApplicative),
    secondaryApplicatives: toApplicatives(apiModel.secondaryApplicatives),
    excludeFromShutdown: apiModel.excludeFromShutdown,
    environmentActions: apiModel.environmentActions,
    webClientUrl: apiModel.webClientUrl,
    secureClientArtifactUri: apiModel.secureClientArtifactUri,
  };
}

function findCoreBundle(
  bundles?: EnvironmentBundleApiModel[]
): EnvironmentBundleApiModel | undefined {
  return bundles?.find((bundle) => bundle.id === CORE_BUNDLE_ID);
}

function toBundles(
  apiModels?: EnvironmentBundleApiModel[]
): EnvironmentBundle[] | undefined {
  return apiModels?.map((apiModel) => {
    const bundleType = inferBundleType(apiModel.id);

    return {
      id: apiModel.id,
      branch: apiModel.branch,
      version: apiModel.version,
      ...(bundleType ? { type: bundleType } : {}),
    };
  });
}

function inferBundleType(bundleId: string): string | undefined {
  return bundleId.toLowerCase() === MXTESTWEB_BUNDLE_ID
    ? MXTESTWEB_BUNDLE_ID
    : undefined;
}

function toDatabases(
  apiModels?: EnvironmentDatabaseApiModel[]
): EnvironmentDatabase[] {
  return (apiModels ?? []).map((apiModel) => ({
    name: apiModel.name,
    mxDbTypes: apiModel.mxDbTypes ?? [],
  }));
}

function toApplicative(
  apiModel?: ApplicativeApiModel
): Applicative | undefined {
  if (!apiModel) return undefined;
  return {
    allocation: {
      machine: apiModel.allocation.machine
        ? {
            id: apiModel.allocation.machine.id,
            name: apiModel.allocation.machine.name,
          }
        : undefined,
      ports: apiModel.allocation.ports
        ? {
            start: apiModel.allocation.ports.start,
            end: apiModel.allocation.ports.end,
          }
        : undefined,
    },
    directory: apiModel.directory,
  };
}

function toApplicatives(
  apiModels?: ApplicativeApiModel[]
): Applicative[] | undefined {
  if (!apiModels) return undefined;
  return apiModels.map((apiModel) => toApplicative(apiModel)!);
}
