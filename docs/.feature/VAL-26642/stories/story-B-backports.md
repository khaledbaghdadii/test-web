# Story B — Backports tabs (v2 ag-grid + v1 legacy) (VAL-26642)

> Groups slices **S4 + S5**. Depends on **Story A** (CI execution view + stage shell must exist first).
> **Migrate to the new domains architecture only — never depend on legacy.**

## Goal
Migrate the **Backports** experience of the CI merge step. Two renderings driven by `ciVersion`:
- **v2** — a "Backports" summary tab with two ag-grid tables + an error banner moved above them (new Figma).
- **v1** — legacy per-backport tabs copied **as-is** into a `legacy/` subfolder, **de-remoted** (remote MFE loading removed).

## Scope
- v2 Backports summary tab (ag-grid) — S4.
- v1 legacy per-backport tabs, de-remoted — S5.
- Backport-related data-access services + models migrated to domains, with unit + contract tests.

## Out of scope
- Merge tab, Final Product Details, scaffold, decision/alerts → **Story A**.

## Figma & visual references
| Ref | What it shows |
|-----|---------------|
| [9769-57211](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9769-57211&m=dev) | v2 On-Demand Backport Executions table |
| `devo/.feature/VAL-26642/wiki-context/img3.png` | v2 backports design |
| `devo/.feature/VAL-26642/wiki-context/9769-57211.png` | exported backports table |
| `devo/.feature/VAL-26642/wiki-context/img2.png` | legacy cherry-pick `@switch` code (v1 reference) |

## Architecture conventions (MUST follow)
- Same domains/upgrade-process conventions as Story A (standalone, signals, barrels, `display: contents`, no NgRx).
- v2 tables use the **shared ag-grid wrapper** (not a hand-rolled table).
- **Nx boundary:** domains lib MUST NOT depend on `web/libs/features/*` (`type:legacy`).
- **De-remoting:** the legacy backport MR view was loaded from scm-mfe via `RemoteComponentInjectorService`. The remote
  MFE is being removed — copy the underlying view **as-is** into `legacy/` and render it **without** the remote injector.

## Verified component signature (v1 reference)
| Legacy component | Inputs | Notes |
|------------------|--------|-------|
| `backport-cherry-pick-and-merge-request.component` (ci-process-mfe) | `projectId`, `repositoryId`, `ciProcessExecutionId`, `backport` | `@switch` on `CherryPickStatus` (in-progress / manual / picked) |

## Data-access migration (REQUIRED — new architecture, no legacy reliance)
Every service + model this story needs must be **migrated into `domains/business-process/data-access`**, each with its
**unit tests AND contract (pact) tests**. Copy from the legacy CI MFE equivalents, then **enhance** to match the new
code. **Do NOT import or depend on legacy libs.**

- **CI backport executions service + models** — list backport executions with status (for the v2 executions table) and
  per-backport detail (for v1 tabs incl. `cherryPickStatus`, `backportFinalProductId`).
  - Source: legacy `CiProcessExecutionsService` in `web/apps/ci-process-mfe`.
- **Business-process definitions service + models** — failed-to-launch backport definitions by definition name (v2
  failed-to-launch table) + deleted/missing-definition info for the banner.
  - Source: legacy `BusinessProcessDefinitionService` in `web/apps/ci-process-mfe`.
- **Backport user-input actions** (repush-backport-merge-job, commits-cherry-picked) — reuse the migrated
  user-input services in `domains/business-process/data-access` from Story A; add CI-specific payloads only if they differ.

**Contract (pact) tests — convention:**
- Add pact specs to the shared **`web/libs/contract-tests/src/lib/`** lib (pattern: `scm-service.spec.pact.ts`),
  importing the **new** domains services via barrels. Provider: `business-process-execution-service`.
- Reuse matchers from `web/apps/ci-process-mfe/src/contracts/business-process-execution-service.spec.pact.ts`; enhance
  for new model fields. Verify with the **local-pact-verify** skill before merge.

## Tasks (ordered)
1. **Data-access first.** Migrate the CI backport executions service + models and the BP definitions service + models
   into `domains/business-process/data-access` (copy/enhance from legacy). Add unit tests + pact specs in
   `web/libs/contract-tests`.
2. **S4 — v2 Backports tab:** "Backports" tab with **two ag-grid tables** (backport executions w/ status; failed-to-launch
   definitions by definition name) using the shared ag-grid wrapper. Move the deleted/missing-definition **error banner
   ABOVE** the tables (with ids). Preserve the info alert (verbatim strings). Match Figma 9769-57211 / img3.
3. **S5 — v1 legacy tabs:** Copy per-backport tabs into a `legacy/` subfolder, **de-remoted**: cherry-pick `@switch`
   (in-progress / manual / picked), manual-cherry-pick, backport MR view (no remote injector), repush-backport action,
   per-backport branch details + final product. Behaviour identical to legacy.

## Acceptance criteria
- **v2:** both ag-grid tables render; executions table shows status; failed-to-launch table shows definition names;
  deleted-definition banner appears **above** the tables with ids; info alert wording matches current code verbatim;
  layout matches Figma 9769-57211 / img3.
- **v1:** each `cherryPickStatus` branch renders the correct sub-component; repush gating preserved; cherry-pick-done
  flow works; renders **without** the remote injector; copy-as-is under `legacy/`; behaviour identical to legacy MFE.
- **All consumed data-access is migrated to domains** with unit tests + passing contract (pact) tests; nothing imports legacy.

## Tests
- Unit: both ag-grid tables render correctly; banner-above ordering; each `cherryPickStatus` branch; repush gating;
  legacy view renders without remote injector; services map fields correctly.
- Contract: pact specs for `business-process-execution-service` (backport executions + BP definitions), verified via
  local-pact-verify.

## Definition of Done
- Lint + Nx boundaries pass (no domains→legacy edges; no remote injector usage).
- Unit + contract tests green.
- v2 matches Figma + same behaviour as current code; v1 behaviour identical to legacy.
