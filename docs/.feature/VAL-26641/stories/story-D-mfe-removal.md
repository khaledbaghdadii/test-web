# Story D — MFE Removal Tail (VAL-26641)

> Groups slice **S6**. **DO THIS LAST** — only after VAL-26634, VAL-26640, VAL-26641 (A+B+C), and
> VAL-26642 are ALL merged and the shell can be switched to the new domains views.
> **Cross-cutting cleanup — no production logic changes.**

## Goal
Delete the `ci-process-mfe` Angular app and remove all references to it from the shell, config,
routing, pacts, and local-dev setup. Switch the shell route to the new domains-based CI execution
view delivered by VAL-26634. Leave no dangling references or broken imports.

## Prerequisite checklist (verify before starting)
- [ ] VAL-26634 is merged (CI run view + stepper in domains)
- [ ] VAL-26640 is merged (Prepare Setup step body in domains)
- [ ] VAL-26641 Stories A + B + C are merged (Build & Test step body in domains)
- [ ] VAL-26642 is merged (Merge step body in domains)
- [ ] All CI routes load correctly from domains in staging/dev before you delete the MFE

## Scope (what this story delivers)
- Delete the entire `web/apps/ci-process-mfe/` application.
- Switch the shell CI route from the remote MFE to the new `loadComponent` domains view (VAL-26634).
- Remove all ~8 references to the MFE across the shell, config, pact, and local-dev files.
- Update/remove the affected pact file entries for the CI process MFE.
- Verify the full build + all affected tests pass after the deletion.

## Out of scope
- Any feature changes or UI modifications — this is deletion + rewiring only.
- Changes to VAL-26640, 26641, 26642 feature libs — those are already merged.

## Reference pattern — already-deleted MFEs
Two MFEs have already been removed following this exact pattern. Use them as your template:
- **`upgrade-process-mfe`** — deleted; search git history for the PR that removed it.
- **`validation-process-mfe`** — deleted; same pattern.

Run: `git log --all --oneline -- web/apps/upgrade-process-mfe/` to find the reference commit.
Read that commit's diff as your step-by-step guide before touching anything.

## Known references to remove (~8 locations)

| # | File | What to change |
|---|------|----------------|
| 1 | `web/apps/shell/src/app/business-process-routing.module.ts` | Switch CI route from remote MFE `loadRemoteModule(...)` to `loadComponent(...)` pointing to the new domains CI execution view (VAL-26634). |
| 2 | `web/apps/shell/src/decl.d.ts` | Remove the `ci-process-mfe/Module` ambient declaration. |
| 3 | `web/apps/shell/tailwind.config.js` | Remove `ci-process-mfe` content path entry. |
| 4 | `web/apps/shell/src/app/app-layout.component.ts` (or nearby) | Remove `CI_PROCESS_ROUTE` import/usage if MFE-specific. |
| 5 | `web/apps/shell/src/environments/environment.ts` (+ prod variant) | Remove `ciProcessMfeUrl` property. |
| 6 | `web/tools/local-dev/project.json` | Remove the `ci-process-mfe` serve target from local-dev setup. |
| 7 | `web/libs/config/src/lib/mfe-urls.ts` | Remove `CI_PROCESS_MFE_PATH` constant. |
| 8 | CI pact spec (e.g. `business-process-execution-service.spec.pact.ts`) | Remove or update CI MFE consumer pact interactions that referenced the remote MFE module. |

> **Do a full-repo search** for `ci-process-mfe` and `ciProcessMfe` before closing the PR — there may
> be additional references not listed above. Every match must be resolved.

## Deletion procedure
1. Confirm all 4 prerequisite features are merged (checklist above).
2. Read the `upgrade-process-mfe` removal commit diff as a guide.
3. **Search** the whole repo for `ci-process-mfe`, `ciProcessMfe`, `CI_PROCESS_MFE`, `ciProcess` (in shell/config context) and list every hit.
4. Update the shell route (item 1 above) to point to the VAL-26634 domains view. Test the route locally.
5. Remove the remaining references (items 2–8) one by one.
6. Delete `web/apps/ci-process-mfe/`.
7. Run `nx affected --target=build --base=main` — must succeed with no errors.
8. Run full `nx affected --target=lint` — must be clean.
9. Run `web-unit-test-runner` skill for all affected projects — all green.
10. Run `local-pact-verify` skill for any affected pact files — all green.
11. Run the e2e smoke test for the CI shell route (playwright, if available) — must pass.

## Tests (MANDATORY)
- **Shell route integration:** `business-process-routing.module.ts` spec (or equivalent) — CI route
  resolves to the domains component, not the remote MFE.
- **All affected unit tests green** (no broken imports from the deleted app).
- **All pacts green** (no consumer pact for a now-deleted MFE module).
- **e2e CI smoke:** the CI process route loads correctly in the shell after deletion.

## Definition of Done
- `web/apps/ci-process-mfe/` directory is gone.
- Zero occurrences of `ci-process-mfe` or `ciProcessMfe` remain in the repo (outside of git history).
- Shell CI route loads the new domains view.
- `nx build`, `nx lint`, all unit tests, all pacts, and e2e smoke all pass.
- PR description lists every file changed and confirms the reference CI MFEs (upgrade, validation) as the pattern used.

---

## NON-NEGOTIABLE ENGINEERING RULES
```
1. DO NOT start this story until all 4 prerequisite features are confirmed merged.
2. Use the upgrade-process-mfe / validation-process-mfe removal commits as your exact template.
3. Search the WHOLE repo for every MFE reference before declaring done. Use grep_search.
4. Run nx affected build + lint + all unit tests + local-pact-verify + e2e smoke before the PR.
5. This story has NO feature logic — if you find yourself writing feature code, stop and put it in
   the right feature story instead.
6. If anything breaks that cannot be fixed by routing/config changes alone, do NOT delete the MFE —
   raise the blocker and coordinate with the relevant feature story owner first.
```
