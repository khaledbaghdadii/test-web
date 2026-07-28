import { buildDefinitionDetailsPath } from "@mxevolve/domains/business-process/util";

describe("buildDefinitionDetailsPath", () => {
  it("should build the definition details path", () => {
    expect(buildDefinitionDetailsPath("project-123", "definition-456")).toBe(
      "/app/project-123/business-process/definition/details/definition-456"
    );
  });
});
