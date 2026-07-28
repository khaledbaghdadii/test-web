import { BusinessProcessDefinition } from "@mxevolve/domains/business-process/data-access";

/**
 * A Sub-Family option derived from the business process definitions response.
 * The `value` is the stable key used to filter the templates table, and the
 * `label` is the human-readable definition name shown in the dropdown.
 */
export interface SubFamilyOption {
  readonly label: string;
  readonly value: string;
}

/**
 * Parameters carrying the in-memory Sub-Family options into the single-select
 * dropdown's frontend state provider. The options are derived from the already
 * loaded definitions, so no extra backend call is made.
 */
export interface SubFamilyOptionsParams {
  readonly options: readonly SubFamilyOption[];
}

/**
 * Derive the distinct Sub-Family dropdown options from a list of business
 * process definitions (decision 2026-06-30: dynamically derived, not hardcoded).
 *
 * Definitions are keyed by `sourceDefinitionId ?? id`; the first occurrence of a
 * key wins. The label is the readable definition `name`, falling back to
 * `processName ?? sourceDefinitionId ?? id` when a name is missing.
 */
export function deriveSubFamilies(
  definitions: readonly BusinessProcessDefinition[]
): SubFamilyOption[] {
  const seen = new Set<string>();
  const options: SubFamilyOption[] = [];

  for (const definition of definitions) {
    const value = definition.sourceDefinitionId ?? definition.id;
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    options.push({
      label:
        definition.name ??
        definition.processName ??
        definition.sourceDefinitionId ??
        definition.id,
      value,
    });
  }

  return options;
}
