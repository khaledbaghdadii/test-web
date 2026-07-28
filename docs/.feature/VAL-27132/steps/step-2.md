# Step 2: Migrate repush opener + eligibility service (+ contract test)

**Jira ID:** VAL-27132
**Status:** [~] (eligibility service + contract test + opener done; 3 family input-form modals deferred to executor batches — see Deviation)
**Depends on:** none
**AC:** AC-6, AC-16

## Summary
Migrate the legacy **repush** flow to the new architecture: the eligibility data-access service (with a
Pact contract test) and the repush-modal-opener + its three per-family repush modals into
`composite-widget`. Reuse exactly the legacy eligibility gate and family dispatch — behaviour unchanged.

## Files
- `web/libs/domains/business-process/data-access/src/lib/execution/business-process-execution-eligibility.service.ts` (new)
- `web/libs/domains/business-process/data-access/src/lib/execution/business-process-execution-eligibility.service.spec.ts` (new — unit)
- `web/libs/domains/business-process/data-access/src/lib/execution/business-process-execution-eligibility.service.pact.spec.ts` (new — contract)
- `web/libs/domains/business-process/data-access/src/index.ts` (mod — export service + `EligibilityResponse` model)
- `web/libs/domains/business-process/composite-widget/src/lib/repush-modal-opener/repush-modal-opener.component.{ts,html,spec.ts}` (new)
- `web/libs/domains/business-process/composite-widget/src/lib/repush-modal-opener/{build-and-test,validation-process,upgrade-process}-repusher-modal.component.{ts,html,spec.ts}` (new — 3 family modals)
- `web/libs/domains/business-process/composite-widget/src/index.ts` (mod — export opener)

## Implementation Details
- **Greenfield in new-arch \u2014 no legacy component import** (change #7 / PR #11556): the opener and the three
  family repush modals are **rebuilt fresh** as new-architecture components in `composite-widget`; the legacy
  components are read **only as a behaviour reference** (logic ported, then cleaned to signals), never
  imported. The eligibility **data-access** service is likewise a **new file** against the same backend REST
  endpoint \u2014 re-implementing a data-access service against an existing endpoint is **not** "legacy reuse"
  (no legacy component is imported).
- Behaviour reference (legacy, port logic then clean to signals \u2014 do not import):
  - `web/apps/shell/src/app/business-process/business-process-execution/business-process-execution-repush-modal-opener/…`
  - the per-family repush modal components it dispatches to (BuildAndTest / Validation / Upgrade repushers).
- **Eligibility service** → `data-access`: `getBusinessProcessExecutionEligibility(projectId, familyId,
  baseDefinitionId)` → `GET projects/{projectId}/business-process/executions/eligibility?familyId=&baseDefinitionId=`.
  `@Injectable({ providedIn: "root" })`, inject `GATEWAY_CONFIG` + `HttpClient`, return `Observable<EligibilityResponse>`.
- **Opener** → `composite-widget`, selector kept `mxevolve-business-process-execution-repush-modal-opener`.
  Inputs (signal): `projectId`, `processId`, `familyId`, `familyName`, `sourceDefinitionId`, `disabled` (model).
  On click: call eligibility (via `rxResource` or imperative one-shot with `catchError → showError`); if
  eligible, open the matching family modal; keep `disabled` two-way during in-flight.
- Use **signals + rxResource**, `inject()`, standalone; no NgModule. Keep any special-case error handling
  (eligibility-denied messaging) verbatim — do not collapse into a generic `showError` if legacy differs.
- Legacy opener stays in the shell (additive migration).

## Code Shape
```typescript
@Injectable({ providedIn: "root" })
export class BusinessProcessExecutionEligibilityService {
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly http = inject(HttpClient);
  getBusinessProcessExecutionEligibility(
    projectId: string, familyId: string, baseDefinitionId: string,
  ): Observable<EligibilityResponse> {
    const params = new HttpParams().set("familyId", familyId).set("baseDefinitionId", baseDefinitionId);
    return this.http.get<EligibilityResponse>(
      `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/eligibility`, { params });
  }
}

@Component({ selector: "mxevolve-business-process-execution-repush-modal-opener", standalone: true, /* … */ })
export class RepushModalOpenerComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly familyId = input.required<string>();
  readonly familyName = input.required<string>();
  readonly sourceDefinitionId = input<string | null>(null);
  readonly disabled = model(false);
  // eligibility check → open BuildAndTest|Validation|Upgrade repusher modal
}
```

## Sub-steps
- [x] 2a. Create eligibility service in data-access + unit spec; export model.
- [x] 2b. Add Pact **consumer** contract test for the eligibility endpoint (see local-pact-verify skill).
- [~] 2c. Migrate opener + 3 family repush modals to composite-widget (signals, standalone, rxResource). **Opener + new-arch limit-exceed (ineligibility) modal done; the 3 family input-form modals are deferred — see Deviation.**
- [x] 2d. Export from barrels; eslint on data-access + composite-widget folders.
- [~] 2e. Specs for opener (eligible → emits repush event; ineligible → opens limit modal/keeps messaging; error → toast) + limit-exceed modal. **Family-modal specs deferred with the modals.**

## Deviation (Batch 1)
The three per-family repush modals (`build-and-test` / `validation-process` / `upgrade-process` repushers)
are **full executor input forms**: legacy `Repush*ProcessInputComponent` depend on the definition-input
infrastructure and per-family leaf selectors (`@mxflow/ui/inputs`: infra-group / scenario / user-story /
skip-build, config-params, notifications-recipients) plus the per-family **executor** services. In the
new architecture those leaf selectors are rebuilt in **Step 11** and the per-family executor forms in
**Steps 9 / 10 / 15 / 19** (batches 3–5) — none exist yet. Step 2 is scheduled in **batch 1** with
`Depends on: none`, so building the family modals now would either (a) pull all of batches 3–5 forward and
duplicate that work, or (b) produce non-compiling stubs importing not-yet-existing components.

**Resolution (additive / dead-until-wired):** the new-arch `RepushModalOpenerComponent` performs the
eligibility gate, shows the migrated `BusinessProcessLimitExceedModalComponent` on ineligibility, toasts on
error, and exposes the eligible decision via an `eligibleToRepush` output seam. The family input-form modals
+ their wiring (replace the output with a direct family-modal open) are completed alongside the per-family
executor migrations in batches 3–5. Selector, inputs, and `[(disabled)]` match what Step 4's Actions cell
expects, so Step 4 composes the opener unchanged.

## Tests
- Service unit + **contract** test; opener + family-modal component specs.

## Test Obligations
- Production files: eligibility service + opener + 3 modals.
- Required tests: service unit + pact spec; opener + modal specs.
- Targeted test command: Nx Jest for `domains-business-process-data-access` and `…-composite-widget`;
  contract via local-pact-verify skill.
- No-test justification: n/a.

## Template
Legacy opener + repushers; new-arch data-access pattern (`branch-details` rxResource).

## Manual Verification
Trigger repush from a landing-page Actions cell; eligible run opens the correct family modal; ineligible shows legacy messaging.

## Risk
High — crosses the execution-service boundary (contract), 4 migrated components, must preserve eligibility + family-dispatch behaviour exactly.
