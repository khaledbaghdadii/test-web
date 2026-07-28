# Step 14: Validation templates dialog (Page 1)

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** Step 1, Step 7, Step 8
**AC:** AC-8, AC-9, AC-10

## Summary
Build Dialog Page 1 for Validation: templates table inside the generic dialog, filtered to
`family.id === "master-validation"`, with a **dynamically derived** Sub-Family dropdown (built by the
shared `deriveSubFamilies` helper from Step 8, using each definition's readable `name`), UI pagination
(size 5), and per-row Run → Page 2.

## Files
- `web/libs/domains/business-process/composite-widget/src/lib/validation-process/templates-dialog/validation-templates-dialog.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/validation-process/templates-dialog/validation-templates-dialog.component.spec.ts` (new)
- `web/libs/domains/business-process/composite-widget/src/index.ts` (mod — export)

> Reuses the shared `deriveSubFamilies` helper created in **Step 8** (`composite-widget/src/lib/shared/derive-sub-families.ts`).

## Implementation Details
- Same structure as Step 8 but family `master-validation` and the **Sub-Family dropdown derived
  dynamically** (decision 2026-06-30): build distinct options via the shared `deriveSubFamilies(defs)`
  helper, keyed by `sourceDefinitionId ?? id` with readable `label = name` (e.g. Master Validation,
  Initial RTP Greening, Incremental RTP Greening — the base-definition `name` values), rendered through the
  shared **`mxevolve-single-select-dropdown`** from `@mxflow/ui/mxevolve-dropdown` (not raw PrimeNG — change #7).
- Single definitions call via `BusinessProcessDefinitionService` (rxResource); UI filter by family +
  sub-family; UI pagination size 5; Run → goTo executor page (Step 15); dialog header = definition name.

### Captured-design layout (2026-06-30 — `designs/jira-1901575.png`, Validation analogue)
- Same dialog chrome as Step 8: title = **"Validation Available Templates"** (analogue) with an **X close**;
  a **"Select Sub-Activity"** dropdown (shared `mxevolve-single-select-dropdown`) defaulting to **"All"**;
  table columns **Name · Description** with a per-row primary **Run** button (circle play-icon style);
  **paginated size 5** on the UI.

## Code Shape
```typescript
// shared/derive-sub-families.ts (created in Step 8, reused here)
export function deriveSubFamilies(defs: BusinessProcessDefinition[]): { id: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const d of defs) {
    const id = d.sourceDefinitionId ?? d.id;
    // prefer the base definition's readable name; fall back gracefully
    const label = d.name ?? d.processName ?? id;
    if (!seen.has(id) || d.id === id) seen.set(id, label);
  }
  return [...seen].map(([id, label]) => ({ id, label }));
}
```

## Sub-steps
- [ ] 14a. Generate dialog; rxResource load + filter family `master-validation`.
- [ ] 14b. Derive Sub-Family options dynamically via the shared `deriveSubFamilies` helper (Step 8) + filter; UI pagination size 5.
- [ ] 14c. Run → select definition + goTo executor; set dialog header.
- [ ] 14d. Export; eslint.
- [ ] 14e. Spec: single call; family filter; derived sub-families; pagination; Run navigates.

## Tests
- Component spec (the `deriveSubFamilies` helper is unit-tested in Step 8).

## Test Obligations
- Production files: dialog component.
- Required tests: component spec.
- Targeted test command: Nx Jest for `domains-business-process-composite-widget`.

## Template
Step 8; Step 7 service.

## Manual Verification
Validation Build dialog shows only validation templates; sub-family dropdown values derived from data; Run advances to Page 2.

## Risk
Medium — mirrors Step 8 with dynamic sub-family derivation.
