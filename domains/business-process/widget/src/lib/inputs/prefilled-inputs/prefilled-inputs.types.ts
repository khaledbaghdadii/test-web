import { ProvidedInput } from "@mxevolve/domains/business-process/data-access";

/**
 * A single read-only prefilled input row: a human-readable label and the raw
 * value taken from the definition's `providedInputs`.
 */
export interface PrefilledInputRow {
  readonly inputId: string;
  readonly label: string;
  readonly value: unknown;
  readonly displayValue?: string;
}

/**
 * A titled group of prefilled rows, rendered under a blue/bold section heading
 * that mirrors the matching section heading of the (editable) executor form.
 */
export interface PrefilledSection {
  readonly title: string;
  readonly rows: PrefilledInputRow[];
}

/** An ordered `[inputId, label]` list for one section. */
type SectionSpec = {
  readonly title: string;
  readonly entries: readonly (readonly [string, string])[];
};

function prefilledValue(
  providedInputs: readonly ProvidedInput[],
  inputId: string
): unknown {
  const provided = providedInputs.find((input) => input.inputId === inputId);
  const value = provided?.value;
  if (value != null && value !== "") {
    return value;
  }
  return undefined;
}

function buildRows(
  providedInputs: readonly ProvidedInput[],
  entries: readonly (readonly [string, string])[]
): PrefilledInputRow[] {
  const rows: PrefilledInputRow[] = [];
  for (const [inputId, label] of entries) {
    const value = prefilledValue(providedInputs, inputId);
    if (value !== undefined) {
      rows.push({ inputId, label, value });
    }
  }
  return rows;
}

/**
 * Builds the display sections for the prefilled inputs panel, preserving each
 * section's ordering and dropping any row (missing/empty value) or section
 * (no rows) that has nothing to show.
 */
export function buildPrefilledSections(
  providedInputs: readonly ProvidedInput[],
  specs: readonly SectionSpec[]
): PrefilledSection[] {
  const sections: PrefilledSection[] = [];
  for (const spec of specs) {
    const rows = buildRows(providedInputs, spec.entries);
    if (rows.length > 0) {
      sections.push({ title: spec.title, rows });
    }
  }
  return sections;
}

/**
 * Build & Test prefilled sections. Section titles mirror the Build & Test
 * executor form's own section headings (Configuration Parameters, Build
 * Scenario, Infrastructure Parameters).
 */
export const BUILD_AND_TEST_PREFILLED_SECTIONS: readonly SectionSpec[] = [
  {
    title: "Configuration Parameters",
    entries: [
      ["repositoryId", "Repository"],
      ["configurationBranchName", "Configuration Branch"],
      ["configurationParentBranch", "Configuration Parent Branch"],
    ],
  },
  {
    title: "Build Scenario",
    entries: [["buildScenarioDefinitionId", "Build Scenario"]],
  },
  {
    title: "Infrastructure Parameters",
    entries: [
      ["buildEnvironmentInfraGroup", "Build Environment Infra Group"],
      ["buildAndTestInfraGroup", "Build and Test Infra Group"],
    ],
  },
];

/** Backport prefilled sections (mirror the Backport form section headings). */
export const BACKPORT_PREFILLED_SECTIONS: readonly SectionSpec[] = [
  {
    title: "Configuration Parameters",
    entries: [
      ["repositoryId", "Repository"],
      ["mergeConfigurationId", "Destination Merge Configuration"],
    ],
  },
  {
    title: "Infrastructure Parameters",
    entries: [["buildAndTestInfraGroup", "Build and Test Infra Group"]],
  },
];

/**
 * Validation prefilled sections (mirror the validation executor form's own
 * section headings: Configuration Parameters, Tests, Infrastructure Parameters).
 */
export const VALIDATION_PREFILLED_SECTIONS: readonly SectionSpec[] = [
  {
    title: "Configuration Parameters",
    entries: [
      ["repositoryId", "Repository"],
      ["businessProcessQualityLevel", "BP Quality Level"],
      ["createBranch", "Create Branch"],
      ["archivalBranchName", "Archival Branch"],
      ["parentBranch", "Parent Branch"],
      ["finalProductId", "Final Product"],
      ["rtpCommitId", "RTP Commit"],
      ["configCommitId", "Config Commit"],
    ],
  },
  {
    title: "Tests",
    entries: [
      ["testScenarioIds", "Quality Gate Test Scenarios"],
      ["nightlyRepusherEnabled", "Nightly Repush"],
    ],
  },
  {
    title: "Infrastructure Parameters",
    entries: [
      [
        "qualityGateExecutionInfraGroupId",
        "Quality Gate Execution Infra Group",
      ],
    ],
  },
];

interface FactoryProductPrefilledValue {
  id?: string;
  mxVersion?: string;
  mxBuildId?: string;
  bipVersion?: string;
  bipBuildId?: string;
}

/** Sub-attribute label maps for the two factory-product object inputs. */
const FACTORY_PRODUCT_ATTRIBUTE_LABELS: readonly [
  keyof FactoryProductPrefilledValue,
  string
][] = [
  ["mxVersion", "MX Version"],
  ["mxBuildId", "MX Build ID"],
  ["bipVersion", "BIP Version"],
  ["bipBuildId", "BIP Build ID"],
];

function factoryProductRows(
  providedInputs: readonly ProvidedInput[],
  inputId: string,
  prefix: string
): PrefilledInputRow[] {
  const provided = providedInputs.find((input) => input.inputId === inputId);
  const value = provided?.value as FactoryProductPrefilledValue | undefined;
  if (value == null) {
    return [];
  }
  const rows: PrefilledInputRow[] = [];
  for (const [attribute, label] of FACTORY_PRODUCT_ATTRIBUTE_LABELS) {
    const attributeValue = value[attribute];
    if (attributeValue != null && attributeValue !== "") {
      rows.push({
        inputId: `${inputId}.${attribute}`,
        label: `${prefix} ${label}`,
        value: attributeValue,
      });
    }
  }
  return rows;
}

/**
 * Builds the ordered prefilled sections for the upgrade executor's details
 * panel: section titles mirror the upgrade form's headings (MX Parameters,
 * Configuration Parameters, Infrastructure Parameters, Tests, Reference
 * Environment Parameters), with the two factory-product objects expanded into
 * their MX/BIP sub-attribute rows and placed in their legacy group positions.
 */
export function buildUpgradePrefilledSections(
  providedInputs: readonly ProvidedInput[]
): PrefilledSection[] {
  const sections: PrefilledSection[] = [
    {
      title: "MX Parameters",
      rows: [
        ...factoryProductRows(
          providedInputs,
          "factoryProduct",
          "Conversion Factory Product"
        ),
        ...buildRows(providedInputs, [
          ["parentMxArchivalBranch", "Parent MX Archival Branch"],
          ["upgradeJump", "Upgrade Jump"],
        ]),
      ],
    },
    {
      title: "Configuration Parameters",
      rows: buildRows(providedInputs, [
        ["repositoryId", "Repository"],
        ["businessProcessQualityLevel", "BP Quality Level"],
        ["createBranch", "Create Branch"],
        ["configurationBranchName", "Configuration Branch"],
        ["configurationParentBranch", "Configuration Parent Branch"],
      ]),
    },
    {
      title: "Infrastructure Parameters",
      rows: buildRows(providedInputs, [
        [
          "qualityGateExecutionInfraGroupId",
          "Quality Gate Execution Infra Group",
        ],
        ["binaryConversionInfraGroupId", "Binary Conversion Infra Group"],
      ]),
    },
    {
      title: "Tests",
      rows: buildRows(providedInputs, [
        ["testScenarioIds", "Quality Gate Execution Test Scenarios"],
        ["technicalUpgradeTestScenarioId", "Binary Conversion Test Scenario"],
      ]),
    },
    {
      title: "Reference Environment Parameters",
      rows: [
        ...buildRows(providedInputs, [
          ["referenceCommitId", "Reference Commit ID"],
          [
            "referenceEnvironmentDefinitionId",
            "Reference Environment Definition",
          ],
        ]),
        ...factoryProductRows(
          providedInputs,
          "referenceFactoryProduct",
          "Reference Factory Product"
        ),
        ...buildRows(providedInputs, [
          [
            "referenceEnvironmentInfraGroupId",
            "Reference Environment Infra Group",
          ],
        ]),
      ],
    },
  ];
  return sections.filter((section) => section.rows.length > 0);
}
