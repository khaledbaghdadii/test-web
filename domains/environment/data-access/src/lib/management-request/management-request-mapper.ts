import { ManagementRequestApiModel } from "./management-request-api-model";
import { ManagementRequest } from "./management-request";

export function toManagementRequests(
  apiModels: ManagementRequestApiModel[]
): ManagementRequest[] {
  return apiModels.map(toManagementRequest);
}

function toManagementRequest(
  apiModel: ManagementRequestApiModel
): ManagementRequest {
  return {
    id: apiModel.id,
    type: apiModel.type,
    status: apiModel.status,
    createdOn: apiModel.createdOn,
    startedOn: apiModel.startedOn,
    endedOn: apiModel.endedOn,
    correlationId: apiModel.correlationId,
    statusMessage: apiModel.statusMessage,
    resultStatus: apiModel.result?.status,
    resultMessage: apiModel.result?.message,
    abortedBy: apiModel.abortedBy,
    hasMetrics: apiModel.hasMetrics,
    artifacts: apiModel.artifacts,
  };
}
