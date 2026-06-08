import {
  EnvironmentServiceItemApiModel,
  StartEnvironmentResponseApiModel,
  StopEnvironmentResponseApiModel,
} from "./service-actions-api-model";
import {
  EnvironmentServiceItem,
  StartEnvironmentResponse,
  StopEnvironmentResponse,
} from "./service-actions";

export function toStartEnvironmentResponse(
  apiModel: StartEnvironmentResponseApiModel
): StartEnvironmentResponse {
  return { startRequestId: apiModel.startRequestId };
}

export function toStopEnvironmentResponse(
  apiModel: StopEnvironmentResponseApiModel
): StopEnvironmentResponse {
  return { stopRequestId: apiModel.stopRequestId };
}

export function toEnvironmentServiceItems(
  apiModels: EnvironmentServiceItemApiModel[]
): EnvironmentServiceItem[] {
  return apiModels.map(toEnvironmentServiceItem);
}

function toEnvironmentServiceItem(
  apiModel: EnvironmentServiceItemApiModel
): EnvironmentServiceItem {
  return {
    name: apiModel.name,
    nickname: apiModel.nickname,
    installationCode: apiModel.installationCode,
    description: apiModel.description,
    status: apiModel.status,
  };
}
