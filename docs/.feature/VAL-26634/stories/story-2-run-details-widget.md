# Story 2 — CI Run Details widget (VAL-26634)

> Slice **S3**. Self-contained, AI-implementable. Mirrors the upgrade-process
> `ActivityRunDetailsComponent`. **Migrate to domains only — never depend on legacy.**
> **Depends on:** Story 1 Part A (CI data-access models).

## Goal
Build the CI **Run Details** widget that renders General + Config Parameters + Build Scenario
Definition + Infrastructure Parameters from a `BuildAndTestProcessExecution`, applying the agreed
field renames.

## Figma & visual references
| Ref | What it shows |
|-----|---------------|
| [9615-68110](https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA/MxEvolve?node-id=9615-68110&m=dev) | Run header incl. Run Details layout |
| `docs/.feature/VAL-26634/wiki-context/jira_config_params.png` | Config Parameters row (Repository / Configuration Branch / Configuration Parent Branch) |

## Where
- `web/libs/domains/business-process/widget/src/lib/build-and-test/activity-run-details/`
  - `activity-run-details.component.ts` / `.html` / `.spec.ts`
- Export via `widget/src/index.ts`.
- Selector: `mxevolve-build-and-test-activity-run-details`.
- Template reference: upgrade-process
  `web/libs/domains/business-process/widget/src/lib/upgrade-process/activity-run-details/activity-run-details.component.html`.

## Component shape (mirror upgrade-process)
```ts
@Component({
  selector: "mxevolve-build-and-test-activity-run-details",
  imports: [Divider, RepositoryNameComponent, InfraGroupNameComponent, ShowMoreLessTextComponent],
  templateUrl: "./activity-run-details.component.html",
})
export class BuildAndTestActivityRunDetailsComponent {
  readonly execution = input.required<BuildAndTestProcessExecution>();
  readonly description = computed(() => /* optional BP definition description */);
}
```
Reused atoms (verified import paths):
- `RepositoryNameComponent` → `@mxevolve/domains/scm/widget`
- `InfraGroupNameComponent` → `@mxevolve/domains/infra/widget`
- `ShowMoreLessTextComponent` → `@mxflow/ui/utils`

## Fields to render (with renames)
| Section | Label (new) | Source field | Notes |
|---------|-------------|--------------|-------|
| General | Template Name | `execution().definitionName` | fallback `-` |
| General | Activity Type | `execution().familyName + " / " + execution().processName` | e.g. "Build & Test Process / Configuration Build & Test" |
| General | Description | BP definition description | optional → `mxevolve-show-more-less-text`, else `-` |
| Config Parameters | Repository | `execution().input.repositoryId` | `mxevolve-repository-name`, else `-` |
| Config Parameters | Configuration Branch | `execution().input.configurationBranchName` | fallback `-` |
| Config Parameters | Configuration Parent Branch | `execution().input.configurationParentBranch` | fallback `-` |
| Build Scenario | Build Scenario Definition | `execution().input.buildEnvironment.scenarioDefinitionId` | show name if a resolver exists, else id; fallback `-` |
| Infrastructure Parameters | **Build Environment Infra Group** | `execution().input.buildEnvironmentInfraGroup` | `mxevolve-infra-group-name`, else `-` |
| Infrastructure Parameters | **Test Environment Infra Group** | `execution().input.buildAndTestInfraGroup` | **RENAME** from legacy "Build & Test Infra Group"; `mxevolve-infra-group-name`, else `-` |

> Layout: same `flex` + `p-divider layout="vertical"` rows as the upgrade-process template, grouped by
> section headers (`General` is implicit / first row; `Configuration Parameters`, `Build Scenario`,
> `Infrastructure Parameters` as bold `text-primary` sub-headers like the upgrade template).

## Tests
- Renders Template Name, Activity Type (`family / process`), Description (`show-more-less` when present,
  `-` when empty).
- Config Parameters: repository name component receives `projectId` + `repositoryId`; branch + parent
  branch render; `-` fallbacks when fields empty.
- Infra Parameters assert the **renamed** labels: "Build Environment Infra Group" bound to
  `buildEnvironmentInfraGroup`; **"Test Environment Infra Group"** bound to `buildAndTestInfraGroup`.
- Build Scenario Definition renders the scenario value (or `-`).

## Acceptance criteria
- Widget renders all sections from a `BuildAndTestProcessExecution` with the renamed infra labels.
- Reuses `RepositoryNameComponent` / `InfraGroupNameComponent` / `ShowMoreLessTextComponent` (no
  re-implementation, no legacy imports).
- Description hidden/`-` when empty.

## Definition of Done
- Lint + Nx boundaries pass; unit tests green (via `web-unit-test-runner`).
