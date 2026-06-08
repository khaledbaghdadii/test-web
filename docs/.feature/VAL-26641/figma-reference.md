# Figma Reference Index — VAL-26641 CI "Build & Test" step

> **How an implementer agent uses this file:**
> 1. **Best / always-available:** open the committed PNG with `view_image` on the local path
>    `.github/devo/.feature/VAL-26641/figma/<frame>.png` — no Figma auth needed, the export is in the repo.
> 2. **Live source:** open the URL, or fetch via the **`query-figma`** skill using
>    **file key `8Z7emdDFkZapK3nmVP2HsA`** + the node id (API form uses `:`, e.g. `5651:143368`).
> 3. The **textual visual spec** below + in each story slice is the contract — match it even if you cannot
>    render the image.

**Figma file:** MxEvolve — key `8Z7emdDFkZapK3nmVP2HsA`
**URL pattern:** `https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=<FRAME>` (FRAME uses a dash, e.g. `5651-143368`)

| Frame (node-id) | Used by | Local PNG | URL | What it shows |
|-----------------|---------|-----------|-----|---------------|
| `5642-134873` | S0 | `figma/5642-134873.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=5642-134873 | Full Build & Test run page (overview variant). |
| `5651-143368` | S0/S1 | `figma/5651-143368.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=5651-143368 | Full page: run header + stepper (Prepare Setup → Build & test → Merge), **Build panel expanded**, Test collapsed. |
| `9629-54097` | S0 | `figma/9629-54097.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9629-54097 | Run header: "Run - 000001" + amber **Pending Input** status tag + red power/abort button. |
| `9629-54091` | S1 | `figma/9629-54091.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9629-54091 | Branch Details link with warning tooltip "Rebase is needed. You are 3 commits behind master." |
| `9769-56255` | S1 | `figma/9769-56255.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-56255 | **Build panel** full: "Build" title + chevron; row `Environment [Ready] Services▾ Open MX.3▾ Connect DB▾ Connect Applicative▾ Copy Open Config Editor │ Details   ⟳  ▤`; "You are working on the following story  VAL-125  VAL-127"; "Commits on **Branch Name**" table (Commit ID blue link / Description / User / Commit Date e.g. "Dec 23, 2024, 3:58:56 PM"). |
| `5657-145421` | S2 | `figma/5657-145421.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=5657-145421 | **Test panel expanded** (empty state): "Environment" actions bar + **Config Audit▾**; "Select a TPK…" dropdown + Run TPK; "TPK Results" empty illustration. |
| `9769-55667` | S2 | `figma/9769-55667.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-55667 | Config Audit **dropdown menu** options: **CSV Report**, **HTML Report**. |
| `9769-55602` | S2 | `figma/9769-55602.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-55602 | Config Audit button **Running** = blue, clock icon. |
| `9769-55848` | S2 | `figma/9769-55848.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-55848 | Config Audit button **Passed** = green, check-circle icon. |
| `9769-56395` | S2 | `figma/9769-56395.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9769-56395 | Config Audit button **Failed** = red, x-circle icon. |
| `9694-108129` | S3 | `figma/9694-108129.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9694-108129 | **Technical Reseed panel** opened: "Technical Reseed" title + launch button top-right; "List of Technical Reseed Executions"; expandable rows (status / Created On / commit / dumpIds). |
| `9977-162920` | S3 | `figma/9977-162920.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9977-162920 | **Launch Technical Reseed dialog**: title "Technical Reseed", "Launch a new Technical Reseed operations", fields **Final Product Tag** ("Select a final product"), **Environment Definition** ("Select environment definition"), **Maintenance Level** ("Select maintenance level"), blue **Launch** button. |
| `9766-53383` | S4 | `figma/9766-53383.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9766-53383 | **Create Merge Request popup**: Suggested MR Name (VAL prefix), Destination Branch dropdown, Suggested Reviewers (chips + search), "Do you want to Backport your Changes? *" Yes/No (default No), Send button. |
| `9766-54658` | S4 | `figma/9766-54658.png` | https://www.figma.com/design/8Z7emdDFkZapK3nmVP2HsA?node-id=9766-54658 | Same popup with **Backport = Yes** → "Select the Run definition for on-demand backport *" searchable checkbox multi-select. |

**Blank exports (do NOT rely on):** `7017-141571.png`, `7017-142509.png`, `9751-51217.png`, `9977-162313.png`
exported white (Figma dev-mode component frames render empty at frame level). Use the textual spec / sibling
full-page frames instead.

**Supplementary images (in `wiki-context/`):** `jira-open-config-editor.png`, `jira-config-audit.png`,
`jira-previous-runs.png`, `wiki-img01..17.png` — referenced from `refinement/figma-notes.md`.
