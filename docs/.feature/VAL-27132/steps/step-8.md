# Step 8: Build & Test templates dialog (Page 1)

**Jira ID:** VAL-27132
**Status:** [x]
**Depends on:** Step 1, Step 7
**AC:** AC-8, AC-9, AC-10

## Summary
Build Dialog **Page 1** for Build & Test: an Available **Process Templates** table inside the generic
multi-page dialog, loading definitions once, UI-filtering to `family.id === "user-story-build-and-test"`,
a **dynamically derived Sub-Family** dropdown (built from the returned definitions, decision 2026-06-30),
UI pagination (size 5), and a per-row **Run** that navigates to Page 2.

## Files
- `web/libs/domains/business-process/composite-widget/src/lib/build-and-test/templates-dialog/build-and-test-templates-dialog.component.{ts,html,scss}` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/shared/derive-sub-families.ts` (new — shared helper that derives Sub-Family options from the definitions response; **reused by Steps 14 & 18**)
- `web/libs/domains/business-process/composite-widget/src/lib/shared/derive-sub-families.spec.ts` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/build-and-test/templates-dialog/build-and-test-templates-dialog.component.spec.ts` (new)
- `web/libs/domains/business-process/composite-widget/src/index.ts` (mod — export)

## Implementation Details
- Hosts a `mxevolve-multi-page-dialog` (Step 1). **Page 1** content = templates table + Sub-Family
  dropdown + Run; **Page 2** = the executor (Steps 9/10) projected as the second dialog page.
- Load definitions via `BusinessProcessDefinitionService.getBusinessProcessDefinitions({ projectId,
  extendable: false, executable: true })` using **rxResource** (single call). Filter to
  `family.id === "user-story-build-and-test"`.
- **Sub-Family dropdown (dynamically derived, decision 2026-06-30):** build the options with the shared
  `deriveSubFamilies(defs)` helper (created here, reused by Steps 14 & 18) instead of a hardcoded list, and
  render them through the **shared common dropdown** `mxevolve-single-select-dropdown` from
  `@mxflow/ui/mxevolve-dropdown` (**not** raw PrimeNG `p-select` — change #7).
  The definitions response carries a **human-readable `name`** per definition and a `family.name` (verified
  in the backend `families.yaml` / `base-definitions.yaml` and serialized through `DefinitionApiModel.name`
  → web `BusinessProcessDefinition.name`). Derive distinct options keyed by `sourceDefinitionId ?? id`
  with `label = name` (the base definition's readable name). For Build & Test the derived labels resolve to
  exactly the six wiki labels — **Configuration Build & Test, RTP Enrichment, RTP Build, RTP Test Adaptation,
  Technical Reseed, On Demand Backport** — because they are the base-definition `name` values, so no
  hardcoding is needed. Selecting an option filters the table by `(d.sourceDefinitionId ?? d.id) === id`.
  > Fallback note: if a future definition lacked a `name`, fall back to `processName ?? sourceDefinitionId ?? id`;
  > the six wiki labels above remain the documented expected set for Build & Test.
- Table is **paginated on the UI** (size 5) — definitions are not backend-paginated. PrimeNG table or AG
  Grid client-side; keep it simple (small dataset).
- Per-row **Run** → set the selected definition (signal) + `dialog.goTo("executor")`; the executor page
  chooses BT vs Backport by `sourceDefinitionId === "on-demand-backport"` (Steps 9/10).
- Dialog title becomes the definition name on Page 2 (set `header` input from the selected definition).
- No search box (out of scope).

### Captured-design layout (2026-06-30 — `designs/jira-1901575.png`)
- Dialog title = **"Build & Test Available Templates"** with an **X close** in the top-right.
- Below the title a **"Select Sub-Activity"** labeled dropdown (the shared `mxevolve-single-select-dropdown`),
  default value **"All"** (options from the dynamic `deriveSubFamilies` helper).
- Table columns = **Name · Description** with a per-row primary **Run** button rendered in the **circle
  play-icon** style (right-aligned in the row). Name cell styled as a link.
- **Paginated size 5** on the UI (definitions are not backend-paginated). No search box (out of scope).

## Code Shape
```typescript
@Component({ selector: "mxevolve-build-and-test-templates-dialog", standalone: true,
  imports: [MultiPageDialogComponent, MultiPageDialogPageDirective, /* table, dropdown, executors */] })
export class BuildAndTestTemplatesDialogComponent {
  readonly projectId = input.required<string>();
  readonly subFamily = signal<string | undefined>(undefined);
  readonly selected = signal<DefinitionApiModel | undefined>(undefined);
  private readonly defsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) => this.defService.getBusinessProcessDefinitions(
      { projectId: params.projectId, extendable: false, executable: true }),
  });
  readonly templates = computed(() => (this.defsResource.value() ?? [])
    .filter(d => d.family?.id === BusinessProcessFamilies.USER_STORY_BUILD_AND_TEST)
    .filter(d => !this.subFamily() || (d.sourceDefinitionId ?? d.id) === this.subFamily()));
  readonly subFamilies = computed(() => deriveSubFamilies(
    (this.defsResource.value() ?? []).filter(d => d.family?.id === BusinessProcessFamilies.USER_STORY_BUILD_AND_TEST)));
  open() { this.dialog().open("templates"); }
  run(def: DefinitionApiModel) { this.selected.set(def); this.dialog().goTo("executor"); }
}
```

## Sub-steps
- [x] 8a. Generate dialog composite-widget hosting the multi-page dialog; rxResource load + family filter.
- [x] 8b. Create the shared `deriveSubFamilies(defs)` helper (label from `name`); dynamic Sub-Family dropdown via the shared `mxevolve-single-select-dropdown` + `(sourceDefinitionId ?? id)` filter; UI pagination size 5.
- [x] 8c. Per-row Run → select definition + goTo executor page; set dialog header to definition name.
- [x] 8d. Export; eslint.
- [x] 8e. Spec: single defs call; family + derived sub-family filtering; pagination; Run navigates to Page 2.

## Tests
- Component spec with stubbed definitions service.

## Test Obligations
- Production files: dialog component + shared `derive-sub-families` helper.
- Required tests: component spec + `deriveSubFamilies` spec.
- Targeted test command: Nx Jest for `domains-business-process-composite-widget`.

## Template
Step 1 dialog; legacy `business-process-definition-table` filtering; Step 7 service.

## Manual Verification
Build button opens dialog Page 1 titled "Build & Test Available Templates" (X close); a "Select Sub-Activity" dropdown defaults to "All"; only Build & Test templates show in Name/Description rows with a per-row circle Run button; the derived sub-family dropdown lists the six readable labels from the data; page size 5; Run advances to Page 2 with the template name as title.

## Risk
Medium — composes dialog + table + service; main care is correct family/sub-family filtering and single load.
