import {
  RuntimePropertiesDocumentationApiResponse,
  RuntimePropertyNodeApiModel,
} from "../model/runtime-properties-documentation-api-model";
import {
  RuntimePropertiesDocumentationModel,
  RuntimePropertyNode,
} from "@mxevolve/domains/environment/data-access";

export function toRuntimePropertiesDocumentation(
  apiResponse: RuntimePropertiesDocumentationApiResponse
): RuntimePropertiesDocumentationModel {
  return {
    requestType: apiResponse.requestType,
    properties: apiResponse.properties.map(toRuntimePropertyNode),
  };
}

function toRuntimePropertyNode(
  apiModel: RuntimePropertyNodeApiModel
): RuntimePropertyNode {
  return {
    name: apiModel.name,
    kind: apiModel.kind,
    optional: apiModel.optional,
    description: apiModel.description,
    deprecated: apiModel.deprecated,
    deprecationReason: apiModel.deprecationReason,
    allowedValues: apiModel.allowedValues,
    children: apiModel.children?.map(toRuntimePropertyNode),
    element: apiModel.element
      ? toRuntimePropertyNode(apiModel.element)
      : undefined,
  };
}
