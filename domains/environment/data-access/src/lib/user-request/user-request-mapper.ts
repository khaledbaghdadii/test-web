import { UserRequestApiModel } from "./user-request-api-model";
import { UserRequest } from "./user-request";

export function toDeploymentRequest(
  apiModel: UserRequestApiModel
): UserRequest {
  return {
    id: apiModel.id,
    environmentId: apiModel.environmentId,
    completedAt: apiModel.completedAt,
  };
}

export function toDeploymentRequests(
  apiModels: UserRequestApiModel[]
): UserRequest[] {
  return apiModels.map(toDeploymentRequest);
}
