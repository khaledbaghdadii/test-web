import { BusinessProcessDefinition } from "@mxevolve/domains/business-process/data-access";
import { deriveSubFamilies } from "./derive-sub-families";

function definition(
  overrides: Partial<BusinessProcessDefinition>
): BusinessProcessDefinition {
  return {
    id: "id",
    name: "name",
    providedInputs: [],
    ...overrides,
  };
}

describe("deriveSubFamilies", () => {
  it("returns an empty list when there are no definitions", () => {
    expect(deriveSubFamilies([])).toEqual([]);
  });

  it("keys options by sourceDefinitionId when present", () => {
    const options = deriveSubFamilies([
      definition({
        id: "def-1",
        name: "Configuration Build & Test",
        sourceDefinitionId: "configuration-build-and-test",
      }),
    ]);

    expect(options).toEqual([
      {
        label: "Configuration Build & Test",
        value: "configuration-build-and-test",
      },
    ]);
  });

  it("falls back to the definition id when sourceDefinitionId is missing", () => {
    const options = deriveSubFamilies([
      definition({
        id: "def-1",
        name: "RTP Build",
        sourceDefinitionId: undefined,
      }),
    ]);

    expect(options).toEqual([{ label: "RTP Build", value: "def-1" }]);
  });

  it("deduplicates definitions sharing the same key, keeping the first", () => {
    const options = deriveSubFamilies([
      definition({ id: "a", name: "First", sourceDefinitionId: "shared" }),
      definition({ id: "b", name: "Second", sourceDefinitionId: "shared" }),
    ]);

    expect(options).toEqual([{ label: "First", value: "shared" }]);
  });

  it("falls back to processName then id when name is missing", () => {
    const options = deriveSubFamilies([
      {
        id: "def-1",
        name: undefined as unknown as string,
        processName: "Process Name",
        providedInputs: [],
      },
      {
        id: "def-2",
        name: undefined as unknown as string,
        providedInputs: [],
      },
    ]);

    expect(options).toEqual([
      { label: "Process Name", value: "def-1" },
      { label: "def-2", value: "def-2" },
    ]);
  });

  it("derives the six Build & Test labels from the definitions", () => {
    const options = deriveSubFamilies([
      definition({
        id: "1",
        name: "Configuration Build & Test",
        sourceDefinitionId: "cfg",
      }),
      definition({
        id: "2",
        name: "RTP Enrichment",
        sourceDefinitionId: "rtp-enrich",
      }),
      definition({
        id: "3",
        name: "RTP Build",
        sourceDefinitionId: "rtp-build",
      }),
      definition({
        id: "4",
        name: "RTP Test Adaptation",
        sourceDefinitionId: "rtp-test",
      }),
      definition({
        id: "5",
        name: "Technical Reseed",
        sourceDefinitionId: "reseed",
      }),
      definition({
        id: "6",
        name: "On Demand Backport",
        sourceDefinitionId: "on-demand-backport",
      }),
    ]);

    expect(options.map((option) => option.label)).toEqual([
      "Configuration Build & Test",
      "RTP Enrichment",
      "RTP Build",
      "RTP Test Adaptation",
      "Technical Reseed",
      "On Demand Backport",
    ]);
  });
});
