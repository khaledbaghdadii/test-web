import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionFilterResolverService,
} from "@mxflow/features/business-process";

describe("Business Process Definition Filter Resolver", () => {
  const defs = [
    { id: "def1", processName: "process1" } as BusinessProcessDefinition,
    { id: "def2", processName: "process2" } as BusinessProcessDefinition,
    { id: "def3", processName: "process1" } as BusinessProcessDefinition,
  ];

  let resolver: BusinessProcessDefinitionFilterResolverService;
  beforeEach(() => {
    resolver = new BusinessProcessDefinitionFilterResolverService();
  });

  it("should return undefined if the definition list is empty", () => {
    let result = resolver.resolveDefinitionIdsFrom([], [], []);
    expect(result).toBeUndefined();
  });

  it("should return undefined if the definition list is undefined", () => {
    let result = resolver.resolveDefinitionIdsFrom(undefined, [], []);
    expect(result).toBeUndefined();
  });

  it("should return the list of definitions matching the process name if the definition id filter is undefined", () => {
    let result = resolver.resolveDefinitionIdsFrom(defs, undefined, [
      "process1",
    ]);
    expect(result).toEqual(["def1", "def3"]);
  });

  it("should return the list of definitions matching the definition ids if the process name filter is undefined", () => {
    let result = resolver.resolveDefinitionIdsFrom(
      defs,
      ["def1", "def2"],
      undefined
    );
    expect(result).toEqual(["def1", "def2"]);
  });

  it("should return undefined when no filters are applied", () => {
    let result = resolver.resolveDefinitionIdsFrom(defs, [], []);
    expect(result).toBeUndefined();
  });

  it("should return definition matching definition filter when only definition filter is selected", () => {
    let result = resolver.resolveDefinitionIdsFrom(defs, ["def1"], []);
    expect(result).toEqual(["def1"]);
  });

  it("should return all definitions matching definition filter when only definition filter is selected", () => {
    let result = resolver.resolveDefinitionIdsFrom(defs, ["def1", "def2"], []);
    expect(result).toEqual(["def1", "def2"]);
  });

  it("should return empty list when definition filter is selected but none match", () => {
    let result = resolver.resolveDefinitionIdsFrom(defs, ["def4"], []);
    expect(result).toEqual([]);
  });

  it("should return only matching definitions when definition filter is selected and some filters match", function () {
    let result = resolver.resolveDefinitionIdsFrom(defs, ["def1", "def4"], []);
    expect(result).toEqual(["def1"]);
  });

  it("should return definition matching when process name is selected", () => {
    let result = resolver.resolveDefinitionIdsFrom(defs, [], ["process2"]);
    expect(result).toEqual(["def2"]);
  });

  it("should return all definitions matching when process name is selected", () => {
    let result = resolver.resolveDefinitionIdsFrom(defs, [], ["process1"]);
    expect(result).toEqual(["def1", "def3"]);
  });

  it("should return empty list when process name is selected and no definition matches", () => {
    let result = resolver.resolveDefinitionIdsFrom(defs, [], ["process4"]);
    expect(result).toEqual([]);
  });

  it("should return definition matching when process name is selected and some filters only match", () => {
    let result = resolver.resolveDefinitionIdsFrom(
      defs,
      [],
      ["process2", "process4"]
    );
    expect(result).toEqual(["def2"]);
  });

  it("should return definition matching when both process name is selected and definition are selected", () => {
    let result = resolver.resolveDefinitionIdsFrom(
      defs,
      ["def2"],
      ["process2"]
    );
    expect(result).toEqual(["def2"]);
  });

  it("should return noMatch when both process name is selected and definition are selected and none match both criteria", () => {
    let result = resolver.resolveDefinitionIdsFrom(
      defs,
      ["def1"],
      ["process2"]
    );
    expect(result).toEqual(["noMatch"]);
  });

  it("should find the intersection of both filters when different definitions match each criteria", () => {
    let result = resolver.resolveDefinitionIdsFrom(
      defs,
      ["def1"],
      ["process1"]
    );
    expect(result).toEqual(["def1"]);
  });
});
