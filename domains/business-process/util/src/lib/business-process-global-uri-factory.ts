import { ExecutionFamily } from "./execution-family";
import {
  BINARY_UPGRADE_MFE_PATH,
  CI_PROCESS_MFE_PATH,
  MASTER_VALIDATION_MFE_PATH,
} from "./mfe-urls";

/**
 * Builds the business-process execution details URL for a given execution id.
 *
 * The execution family is the id prefix before {@code __}; each family maps to its
 * own MFE path segment. Pure duplicate of the legacy
 * `BusinessProcessGlobalUriFactoryService.constructBusinessProcessExecutionUri`,
 * with the project base URI inlined so this util has no cross-domain dependency.
 *
 * @throws Error when the id prefix is not a known execution family.
 */
export function constructBusinessProcessExecutionUri(
  id: string,
  projectId: string
): string {
  const family = id.split("__")[0];
  const prefix = `/app/${projectId}/business-process`;
  switch (family) {
    case ExecutionFamily.UPGRADE_PROCESS:
      return `${prefix}/${BINARY_UPGRADE_MFE_PATH}/execution/${id}`;
    case ExecutionFamily.USER_STORY_BUILD_AND_TEST:
      return `${prefix}/${CI_PROCESS_MFE_PATH}/execution/${id}`;
    case ExecutionFamily.VALIDATION_PROCESS:
      return `${prefix}/${MASTER_VALIDATION_MFE_PATH}/execution/${id}`;
    default:
      throw new Error("Invalid process execution ID");
  }
}
