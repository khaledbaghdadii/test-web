# Step 4: Actions cell (abort + repush) + My Builds widget + jira dedupe

**Jira ID:** VAL-27132
**Status:** [ ]
**Depends on:** Step 2, Step 3
**AC:** AC-5, AC-6, AC-7

## Summary
Build the shared Actions **cell renderer** (reusing the already-migrated **new-architecture** abort button +
the new-arch repush opener from Step 2), the **My Builds** toggle widget (sets `ownerPhrase = logged-in
user`), and a **jira-details dedupe** helper so each landing page makes a single `project-details` call
instead of N+1. The Actions column appears on **both** the Active and History tables; on **history rows the
abort is disabled** (terminal runs) — the migrated abort component already handles the disabled state.

## Files
- `web/libs/domains/business-process/widget/src/lib/activity-runs-table/cells/run-actions-cell.component.{ts,html,spec.ts}` (new — AG Grid cell renderer)
- `web/libs/domains/business-process/widget/src/lib/my-builds-toggle/my-builds-toggle.component.{ts,html,spec.ts}` (new)
- `web/libs/domains/business-process/widget/src/index.ts` (mod — export both)
- `web/libs/domains/business-process/data-access/src/lib/issue-tracking/jira-details.service.ts` (verify/confirm single shared call; no change if already single) — and a small consumer-side share helper if needed.

## Implementation Details
- **Run actions cell** (AG Grid `ICellRendererAngularComp` or a renderer component): given the row's
  process run, render the already-migrated **new-architecture** abort component
  `mxevolve-execution-abort-button` (from
  `web/libs/domains/business-process/composite-widget/src/lib/execution-abort-button/`, inputs
  `projectId`, `processId` — reuse as-is; this is new-arch, **not** legacy) and
  `mxevolve-business-process-execution-repush-modal-opener` (the new-arch opener built in Step 2, inputs
  `projectId, processId, familyId, familyName, sourceDefinitionId, [(disabled)]`). The cell takes a
  `terminal`/`isHistory` flag from the consumer; when set (history rows), the **abort is rendered disabled**
  (terminal runs) while repush stays available. Emits/refreshes the grid on `aborted`. Keep eligibility/
  authorization driven by the existing components.
- **My Builds toggle**: signal `enabled` (model); when on, the consumer sets the table's `ownerPhrase`
  input to `AuthService.getUsername()`; when off, clears it. Replaces legacy `my-executions-toggle`
  PrimeNG-table coupling — here it just emits the ownerPhrase value (table reloads via serverSide).
  Also hide the Owner column when enabled (consumer wires column visibility, mirroring legacy).
- **N+1 fix (AC-7)**: confirm `JiraDetailsService.getJiraDetails(projectId)` is called **once per page**
  and shared (e.g. resolved once at the landing-page container and passed down, or a `shareReplay`d
  rxResource). The legacy bug was duplicate calls per row/page-size; ensure the new pages call it once.

## Code Shape
```typescript
@Component({ selector: "mxevolve-run-actions-cell", standalone: true,
  imports: [ExecutionAbortButtonComponent, RepushModalOpenerComponent] })
export class RunActionsCellComponent implements ICellRendererAngularComp {
  readonly run = signal<ProcessRunRow | undefined>(undefined);
  readonly terminal = signal<boolean>(false); // history rows → abort disabled
  agInit(params: ICellRendererParams<ProcessRunRow> & { terminal?: boolean }) {
    this.run.set(params.data); this.terminal.set(!!params.terminal);
  }
  refresh() { return false; }
}

@Component({ selector: "mxevolve-my-builds-toggle", standalone: true, imports: [ToggleButton] })
export class MyBuildsToggleComponent {
  readonly enabled = model(false);
  readonly username = output<string | undefined>(); // emit username|undefined on toggle
  private readonly auth = inject(AuthService);
}
```

## Sub-steps
- [ ] 4a. Create `run-actions-cell` renderer composing the reused new-arch abort component + the new-arch repush opener; honor the `terminal` flag (abort disabled on history rows).
- [ ] 4b. Create `my-builds-toggle` widget emitting ownerPhrase + Owner-column-hide signal.
- [ ] 4c. Confirm/implement single shared jira-details call helper (dedupe).
- [ ] 4d. Export from barrel; eslint.
- [ ] 4e. Specs: cell renders both actions + refreshes on abort; abort disabled when terminal; toggle emits username/undefined; dedupe = one call.

## Tests
- Cell renderer spec, toggle spec, dedupe spec.

## Test Obligations
- Production files: cell renderer + toggle (+ dedupe helper if added).
- Required tests: the three specs above.
- Targeted test command: Nx Jest for `domains-business-process-widget`.

## Template
Reused new-arch `execution-abort-button` (`business-process/composite-widget/.../execution-abort-button`), the new-arch repush opener (Step 2), legacy `my-executions-toggle` (behaviour only), `JiraDetailsService`.

## Manual Verification
On a landing page: abort + repush from the Actions cell on Active rows; on History rows the Actions column is present with **abort disabled** + repush available; toggle My Builds (rows filter to me, Owner column hides); network shows one project-details call.

## Risk
Medium — composes existing/migrated components; main care is My Builds parity and confirming the dedupe.
