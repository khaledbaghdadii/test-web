# Raw Jira — VAL-26634 (traceability)

- **Key:** VAL-26634
- **Type:** Epic
- **Summary:** [UI/UX][CI] Build & Test Run Page Header & Run Stepper
- **Status:** Backlog
- **Assignee / Reporter:** MOUZAYA Myriam
- **Component:** ATLANTIS
- **Wiki:** https://mxwiki.murex.com/confluence/spaces/MVF/pages/950870852

## In Scope (from description)
- Process Run page header: Run Name, Process Status, Expiry tag, Run Details, Branch Details, Abort.
- Run Details → General (Template Name = BP definition name; Activity Type = process type e.g. Build & Test Process/Configuration Build & Test; Description = BP definition description, optional); Config Parameters; Build Scenario Definition; Infrastructure Parameters (Build Environment Infra Group, Test Environment Infra Group).
- Branch Details: same fields as the upgrade.
- Stepper migration: NEW skip-step option (build env deployment can be skipped → show skipped step); rest similar to upgrade process.

## Wiki Q&A (MVF/950870852)
- Stepper Start/End dates: **needed** (exists in current behaviour; Upgrade omitted by mistake).
- Expiry tag: always shown unless process finished (same as upgrade).
- Branch details commits: same logic as Upgrade Process.

## Wiki Technical Notes
- Abort → reuse `execution-abort-button` (done).
- Status → `execution-status-tag`. Expiry → `mxevolve-expiry-chip`.
- Branch Details same as upgrade; **No Reference Environment** (Roma adds it a future PI).
- Stepper → reuse common upgrade stepper.
- First creation → replace "business process execution is currently loading..." with the create-branch illustration.

> Full raw JSON: `refinement/ticket.json`. Images: `wiki-context/` (wiki_img1.png, jira_config_params.png, jira_skip_step.png).
