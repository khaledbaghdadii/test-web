# Step 11: Shared leaf input selectors (new-arch) + BT/backport prefilled display + non-prefilled logic

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** Step 1
**AC:** AC-11, AC-12

## Summary
Rebuild the four **shared leaf input selectors** (infra-group, scenario-definition, notifications-recipients,
user-story input) as **new components in the new architecture** (`business-process/ui`), built on the shared
common dropdowns — **no legacy `libs/ui/inputs` import** (greenfield, change #7 / PR #11556). Also create the
per-family **prefilled-fields display** component(s) (new design language) that replace the legacy generic
`input-view-resolver`, plus the reusable **field-visibility** helper that decides which definition inputs are
already prefilled (shown on expand) vs. not (shown in the form). All of this is shared by every executor
(Steps 9/10/15/19) — Build & Test/backport variants land here first.

## Files
- `web/libs/domains/business-process/ui/src/lib/inputs/infra-group-selector/business-process-infra-group-selector.component.{ts,html,spec.ts}` (new — new-arch, on `mxevolve-single-select-dropdown`)
- `web/libs/domains/business-process/ui/src/lib/inputs/scenario-definition-selector/business-process-scenario-definition-selector.component.{ts,html,spec.ts}` (new — new-arch, on `mxevolve-multiselect-dropdown`)
- `web/libs/domains/business-process/ui/src/lib/inputs/notifications-recipients-input/business-process-notifications-recipients-input.component.{ts,html,spec.ts}` (new — new-arch)
- `web/libs/domains/business-process/ui/src/lib/inputs/user-story-input/user-story-input.component.{ts,html,spec.ts}` (new — new-arch; "User Story ID" input + validity icon + blue "+" add)
- `web/libs/domains/business-process/ui/src/lib/prefilled-inputs/prefilled-inputs.types.ts` (new — display field model)
- `web/libs/domains/business-process/ui/src/lib/prefilled-inputs/build-and-test-prefilled-inputs.component.{ts,html}` (new)
- `web/libs/domains/business-process/ui/src/lib/prefilled-inputs/backport-prefilled-inputs.component.{ts,html}` (new)
- `web/libs/domains/business-process/util/src/lib/definition-inputs/input-visibility.ts` (new — `shouldShow`/`isEmpty` logic migrated from legacy `definition-input`)
- `*.spec.ts` for the components + the util (new)
- `web/libs/domains/business-process/ui/src/index.ts` + `…/util/src/index.ts` (mod — exports)

## Implementation Details
- **Shared leaf input selectors (new-arch, greenfield — change #7):** rebuild the four selectors as new
  standalone components in `@mxevolve/domains/business-process/ui`, **not** imported from legacy
  `libs/ui/inputs` / `libs/features/business-process`. Build them on the **shared common dropdowns**
  `mxevolve-single-select-dropdown` / `mxevolve-multiselect-dropdown` from `@mxflow/ui/mxevolve-dropdown`
  (never raw PrimeNG `p-select` / `p-multiselect`):
  - `mxevolve-business-process-infra-group-selector` — single-select on `mxevolve-single-select-dropdown`.
  - `mxevolve-business-process-scenario-definition-selector` — multi-select on `mxevolve-multiselect-dropdown`.
  - `mxevolve-business-process-notifications-recipients-input` — recipients input (multi).
  - `mxevolve-user-story-input` — "User Story ID" input with an inline validity-check icon + a blue "+" add
    (no magnifier); keep the `user-story-validation-and-transition` feature-flag validation behaviour.
  These expose `input()` signals + form-control bindings (Reactive Forms — change #3) so the executors
  (Steps 9/10/15/19) consume them as child controls. Read the legacy components only as a behaviour
  reference; do not import them.
- **Visibility util** (migrated from `definition-input.component.ts` `shouldShow`):
  - `isInputEmpty(value)` = `null | undefined | "" | (Array.isArray && length===0)`.
  - `shouldShowInForm(input, mode)` = `mode === ACCESS_ALL_INPUTS || (mode === ACCESS_INVALID_INPUTS_ONLY
    && invalid) || (mode === ACCESS_EMPTY_OPTIONAL_INPUTS && isInputEmpty)` (plus `forceShow`).
  - `isPrefilled(input)` = not empty (i.e. shown on the expand panel). Keep `InputAccessMode` semantics.
- **Prefilled display components** (replace `input-view-resolver`'s `@switch(resourceType)`): per-family
  **hardcoded field rows** rendering the prefilled values in the new design language (label + value;
  resource name lookups — repository name, scenario name, infra group name, etc. — via new-arch pipes/
  services, **not** imported from legacy `libs/ui/inputs`). Build & Test fields: repository, configuration
  branch, configuration parent, build scenario, build-environment infra group, build-and-test infra group,
  notifications. Backport fields: repository, merge configuration, build-and-test infra group, notifications.
- Pure presentational (`ui` lib): `input()` in, no business logic. Inputs: the definition's `providedInputs`
  (prefilled subset) + `projectId` for any async name lookups.

### Captured-design layout (2026-06-30 — `designs/jira-1901576.png`)
- These prefilled components render **inside the executor's collapsible "{template name} Details" panel**
  (the chevron/expand-arrow region of Page 2 — Steps 9/10/15/19). Default state matches the design: the panel
  header shows "{template name} Details" with a chevron and expands to reveal the rows.
- Each prefilled field is shown **read-only-style** (label + value, e.g. "Run Name" = "Build - 000001",
  "Configuration Branch Name" = "Branch-000001 / VAL-123-VAL-124") in the new design language — not an editable
  form control. This replaces the legacy `input-view-resolver` `@switch(resourceType)` rendering.

## Code Shape
```typescript
export type InputAccessMode = "ACCESS_ALL_INPUTS" | "ACCESS_INVALID_INPUTS_ONLY" | "ACCESS_EMPTY_OPTIONAL_INPUTS";
export function isInputEmpty(v: unknown): boolean { /* … */ }
export function shouldShowInForm(input: ProvidedInput, mode: InputAccessMode, forceShow = false): boolean { /* … */ }
export function isPrefilled(input: ProvidedInput): boolean { return !isInputEmpty(input.value); }

@Component({ selector: "mxevolve-build-and-test-prefilled-inputs", standalone: true })
export class BuildAndTestPrefilledInputsComponent {
  readonly projectId = input.required<string>();
  readonly inputs = input.required<ProvidedInput[]>(); // prefilled subset
}
```

## Sub-steps
- [ ] 11a. Rebuild the four leaf selectors (infra-group, scenario-definition, notifications-recipients, user-story input) as new `business-process/ui` components on the shared `mxevolve-single-select-dropdown` / `mxevolve-multiselect-dropdown` (no legacy import); Reactive-Forms control bindings + specs.
- [ ] 11b. Migrate visibility logic to `util/.../input-visibility.ts` + spec (cover all 4 modes + empty cases).
- [ ] 11c. Build the BT + backport prefilled display components (new design language, new-arch name-lookup pipes).
- [ ] 11d. Export from ui + util barrels; eslint.
- [ ] 11e. Specs: selectors emit/bind correctly; prefilled fields render correct labels/values; visibility util returns expected show/hide.

## Tests
- Util spec (visibility) + the four selector specs + the two prefilled-component specs.

## Test Obligations
- Production files: visibility util + 4 leaf selectors + 2 display components.
- Required tests: util spec + selector specs + component specs.
- Targeted test command: Nx Jest for `domains-business-process-util` and `domains-business-process-ui`.

## Template
Legacy `definition-input.component.ts` (`shouldShow`), `input-view-resolver.component.ts` (field rendering) and the legacy `libs/ui/inputs` selectors — **behaviour reference only** (rebuilt fresh in new-arch on the shared dropdowns).

## Manual Verification
On expand-arrow, prefilled definition fields render in new design language; the form below shows only non-prefilled fields.

## Risk
Medium — selector rebuild + display + logic migration shared across executors; must exactly reproduce the legacy show/hide rules and selector behaviour while sitting fully in new-arch (no legacy import).
