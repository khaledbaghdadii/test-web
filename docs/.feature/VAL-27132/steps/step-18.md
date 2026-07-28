# Step 18: Upgrade templates dialog (Page 1)

**Jira ID:** VAL-27132
**Status:** [x]
**Depends on:** Step 1, Step 7, Step 8
**AC:** AC-8, AC-9, AC-10

## Summary
Build Dialog Page 1 for Upgrade: templates table inside the generic dialog, filtered to
`family.id === "binary-upgrade"`, with a **dynamically derived** Sub-Family dropdown (reusing the shared
`deriveSubFamilies` helper from Step 8, using each definition's readable `name`), UI pagination (size 5),
and per-row Run → Page 2.

## Files
- `web/libs/domains/business-process/composite-widget/src/lib/upgrade-process/templates-dialog/upgrade-templates-dialog.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/upgrade-process/templates-dialog/upgrade-templates-dialog.component.spec.ts` (new)
- `web/libs/domains/business-process/composite-widget/src/index.ts` (mod — export)

## Implementation Details
- Same structure as Steps 8/14 but family `binary-upgrade`; Sub-Family dropdown derived via the shared
  `deriveSubFamilies(defs)` helper (Step 8) → readable labels from each definition's `name`
  (Continuous RTP Greening, Patch Upgrade, Subsequent RTP Greening — the base-definition `name` values),
  rendered through the shared **`mxevolve-single-select-dropdown`** from `@mxflow/ui/mxevolve-dropdown`
  (not raw PrimeNG — change #7).
- Single definitions call via `BusinessProcessDefinitionService` (rxResource); UI filter by family +
  sub-family; UI pagination size 5; Run → goTo executor page (Step 19); dialog header = definition name.

### Captured-design layout (2026-06-30 — `designs/jira-1901575.png`, Upgrade analogue)
- Same dialog chrome as Steps 8/14: title = **"Upgrade Available Templates"** (analogue) with an **X close**;
  a **"Select Sub-Activity"** dropdown (shared `mxevolve-single-select-dropdown`) defaulting to **"All"**;
  table columns **Name · Description** with a per-row primary **Run** button (circle play-icon style);
  **paginated size 5** on the UI.

## Sub-steps
- [ ] 18a. Generate dialog; rxResource load + filter family `binary-upgrade`.
- [ ] 18b. Derive Sub-Family options (reuse Step 8 shared helper) + filter; UI pagination size 5.
- [ ] 18c. Run → select definition + goTo executor; set dialog header.
- [ ] 18d. Export; eslint.
- [ ] 18e. Spec: single call; family filter; derived sub-families; pagination; Run navigates.

## Tests
- Component spec.

## Test Obligations
- Production files: dialog component.
- Required tests: component spec.
- Targeted test command: Nx Jest for `domains-business-process-composite-widget`.

## Template
Steps 8/14; Step 7 service; shared `deriveSubFamilies` helper (Step 8).

## Manual Verification
Upgrade Build dialog shows only upgrade templates; sub-family values derived from data; Run advances to Page 2.

## Risk
Medium — mirrors Steps 8/14.
