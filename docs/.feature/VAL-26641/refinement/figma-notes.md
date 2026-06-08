# Figma & Image Reference — VAL-26641 Build & Test Step

File key: `8Z7emdDFkZapK3nmVP2HsA` (MxEvolve). Exported PNGs are in `../figma/`.

## Overview frames
- **5642-134873** / **5651-143368**: Full Build & Test run page. Header (Run name, *Pending Input* status tag, *Expires on* chip, Activity Run Details link, Branch Details link w/ warning icon, red abort power button), stepper **Prepare Setup → Build & test → Merge**. Build panel expanded; Test panel collapsed.
- **9629-54091**: Same, with Branch Details warning tooltip "Rebase is needed. You are 3 commits behind master."
- **5657-145421**: Test panel expanded (empty state).

## Build panel (collapsible) — `5651-143368`, `9769-56255`
- Env actions bar label = **"Build Environment"** + status tag (Ready). Actions: **Services ▾, Open MX.3 ▾, Connect DB ▾, Connect Applicative ▾, Copy, Open Config Editor**, divider, **Details**, then two right-side icons: **refresh (repush latest TPK)** + **report/details (TPK details page)**.
  - `Open Config Editor` is **CI-only** and behind feature toggle `workspace-configuration-editor-ui`. (Hidden in automerge — env flag.)
- "You are working on the following story" + Jira story chips (VAL-125, VAL-127).
- "Commits on **Branch Name**" table: Commit ID (short, blue link via `commit-id-display`), Description, User, Commit Date (platform date format). Empty state illustration "There are no Commits on this branch" (create-branch illustration style).

## Test panel (collapsible) — `5657-145421`, env actions w/ Config Audit
- Env actions bar label = **"Environment"** + status tag. Same env actions **plus Config Audit ▾** (dropdown). **No** TPK repush / TPK report icons (TPK card already in this section).
- "Select a TPK that you wish to launch to validate your change *" → **Select TPK** dropdown + **Run TPK** button.
- **TPK Results** heading + "The card will be displaying the most recent run of each TPK in the current activity run".
  - Empty state illustration "There are no run Results".
  - Populated: TPK card (aggregate/test-unit) — TPK Name (e.g. Smoke Test, world.bank.TPK.001), TPK Status, Environment Status, Analysis Status, Test Unit Findings (3/3/3), Duration, Commit ID, Assignee dropdown, MX Version, MX Build ID, BIP Version, BIP Build ID, History dots (red/amber/green counts).
  - **Show Previous Runs ▾** expander → previous-runs table (one or multiple TPK definitions). Jira attachment `jira-previous-runs.png`.

## Config Audit button states — `9769-55602/55667/55848/56395`
- Dropdown options: **CSV Report**, **HTML Report**.
- Color/icon by **linting report** status (NOT environment status):
  - Running = **blue**, icon = clock (`9769-55602`).
  - Passed = **green**, icon = check circle (`9769-55848`).
  - Failed = **red**, icon = x circle (`9769-56395`).

## Technical Reseed section — `9694-108129` (opened), `9977-162920` (launch dialog)
- New section **between Build and Test** sections; shown only if the process has technical reseed.
- Collapsed by default (both the panel AND each row's details — wiki note 10 / Q).
- Header "Technical Reseed" + **Technical Reseed** button (top-right) to launch a new one.
- "List of Technical Reseed Executions". Empty state: illustration "There are no technical reseeds launched".
- Rows (expandable chevron): **TR Name** (sub-title = the existing reseed name; TR name field itself does not exist), **TR Status** (Passed=green check / Running=blue clock / Failed=red x), **Created On** (date | time).
- `dumpIds` is a list → show 1 by default with **see more/less**, comma-separated, stacked.
- Commit ID = short form.
- Clicking TR status → **info icon beside it → tooltip on click** (per wiki Q) OR a "Technical Reseed details" dialog (wiki note 10 says clicking status opens a dialog — design to be checked). Capture as open question.
- **Launch Technical Reseed dialog** (`9977-162920` → `figma/9977-162920.png`): title "Technical Reseed", subtitle "Launch a new Technical Reseed operations", fields **Final Product Tag** ("Select a final product"), **Environment Definition** ("Select environment definition"), **Maintenance Level** ("Select maintenance level") + blue **Launch** button.

## Merge — `9766-53383` (popup), `9766-54658` (backport dropdown)
- **Merge** button centered at the bottom. Opens **Create Merge Request** popup:
  - Suggested Merge Request Name (prefix `VAL` + text), Destination Branch dropdown (Master Branch), Suggested Reviewers Names (chips + search), **"Do you want to Backport your Changes? *"** Yes/No (default **No**).
  - When **Yes** → **"Select the Run definition for on-demand backport *"** multi-select dropdown (checkbox list, searchable). `9766-54658`.
  - **Send** button.

## On-Demand Backport banners (wiki)
- Show informative banner like "this is being backported from the parent BP" (similar already exists). The old-design "equivalent for this step" is **to be removed**.

## Jira attachment images (in wiki-context/)
- `jira-open-config-editor.png` — Open Config Editor button.
- `jira-config-audit.png` — Config Audit dropdown.
- `jira-previous-runs.png` — previous TPK runs table.
