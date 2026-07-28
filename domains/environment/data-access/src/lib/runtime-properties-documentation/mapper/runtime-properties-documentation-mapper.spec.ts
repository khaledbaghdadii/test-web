import { RuntimePropertiesDocumentationApiResponse } from "../model/runtime-properties-documentation-api-model";
import { toRuntimePropertiesDocumentation } from "./runtime-properties-documentation-mapper";

describe("toRuntimePropertiesDocumentation", () => {
  it("maps a flat list of properties", () => {
    const apiResponse: RuntimePropertiesDocumentationApiResponse = {
      requestType: "deployment",
      properties: [
        {
          name: "timeout",
          kind: "INTEGER",
          optional: true,
          description: "Timeout in seconds",
          deprecated: true,
          deprecationReason: "deprecation reason",
        },
      ],
    };

    const result = toRuntimePropertiesDocumentation(apiResponse);

    expect(result).toEqual({
      requestType: "deployment",
      properties: [
        {
          name: "timeout",
          kind: "INTEGER",
          optional: true,
          description: "Timeout in seconds",
          deprecated: true,
          deprecationReason: "deprecation reason",
          allowedValues: undefined,
          children: undefined,
          element: undefined,
        },
      ],
    });
  });

  it("maps nested object children recursively", () => {
    const apiResponse: RuntimePropertiesDocumentationApiResponse = {
      requestType: "cleaning",
      properties: [
        {
          name: "connection",
          kind: "OBJECT",
          optional: false,
          deprecated: false,
          children: [
            {
              name: "host",
              kind: "STRING",
              optional: false,
              deprecated: false,
            },
          ],
        },
      ],
    };

    const result = toRuntimePropertiesDocumentation(apiResponse);

    expect(result.properties[0].children).toEqual([
      {
        name: "host",
        kind: "STRING",
        optional: false,
        description: undefined,
        deprecated: false,
        deprecationReason: undefined,
        allowedValues: undefined,
        children: undefined,
        element: undefined,
      },
    ]);
  });

  it("maps a list element recursively", () => {
    const apiResponse: RuntimePropertiesDocumentationApiResponse = {
      requestType: "config-audit",
      properties: [
        {
          name: "tags",
          kind: "LIST",
          optional: true,
          deprecated: false,
          element: {
            name: "tag",
            kind: "STRING",
            optional: false,
            deprecated: false,
          },
        },
      ],
    };

    const result = toRuntimePropertiesDocumentation(apiResponse);

    expect(result.properties[0].element).toEqual({
      name: "tag",
      kind: "STRING",
      optional: false,
      description: undefined,
      deprecated: false,
      deprecationReason: undefined,
      allowedValues: undefined,
      children: undefined,
      element: undefined,
    });
  });

  it("maps an empty properties list", () => {
    const apiResponse: RuntimePropertiesDocumentationApiResponse = {
      requestType: "deployment",
      properties: [],
    };

    const result = toRuntimePropertiesDocumentation(apiResponse);

    expect(result).toEqual({
      requestType: "deployment",
      properties: [],
    });
  });
});
