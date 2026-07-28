## Spec review — VAL-27132 [UI/UX] Activities Landing Pages

Docs-only PR. **No source code** — this is the spec/plan review gate before implementation.

### What to review
👉 **Read `devo/feature/VAL-27132/spec.md`** (the SFO review surface). The step files are
implementation detail; spec.md captures the decisions.

### Scope
Three new **Activity Landing Pages** (Build & Test, Validation, Upgrade) on the new Nx domain
architecture — additive (legacy untouched), signals + Signal Forms, AG Grid, rxResource. 19 steps /
5 batches; Build & Test (batches 1–3) is an independently shippable slice.

### Captured designs
Real Figma frames + Jira screenshots are in `devo/feature/VAL-27132/designs/`.

### Open item for reviewer
- Figma shows **Actions on Active Runs but none on History** — documented as intentional; to be
  reconciled against legacy if legacy history exposes any row action.

### Artifacts
`spec.md` · `plan.md` · `context.md` · `confluence.md` · `steps/` · `designs/`
