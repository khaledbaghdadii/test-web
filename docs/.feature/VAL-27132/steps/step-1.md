# Step 1: Generic multi-page dialog shell (`shared/ui/primitive`)

**Jira ID:** VAL-27132
**Status:** [x]
**Depends on:** none
**AC:** AC-8

## Summary
Create a reusable, presentational **multi-page dialog** in `@mxevolve/shared/ui/primitive`: a single
PrimeNG `p-dialog` instance whose body shows one of N projected pages, with internal forward/back
navigation and no modal-on-modal. The business-process consumers project their pages (templates table,
executor) into it.

## Files
- `web/libs/shared/ui/primitive/src/lib/multi-page-dialog/multi-page-dialog.component.ts` (new)
- `web/libs/shared/ui/primitive/src/lib/multi-page-dialog/multi-page-dialog.component.html` (new)
- `web/libs/shared/ui/primitive/src/lib/multi-page-dialog/multi-page-dialog.component.scss` (new)
- `web/libs/shared/ui/primitive/src/lib/multi-page-dialog/multi-page-dialog-page.directive.ts` (new — structural directive to mark each page's template)
- `web/libs/shared/ui/primitive/src/lib/multi-page-dialog/multi-page-dialog.component.spec.ts` (new)
- `web/libs/shared/ui/primitive/src/index.ts` (mod — export the component + directive)

## Implementation Details
- Pure presentational shell — **no business logic**, respects `scope:shared` (depends only on shared/PrimeNG).
  The shell is **activity-agnostic**: it knows nothing about Build & Test / Validation / Upgrade. Page 2's
  title (= the selected template name) and the collapsible **"{name} Details"** prefilled panel are supplied
  **by the consumer** via **input signals (`input()` / `input.required()`)** and **content projection** —
  **never legacy `@Input()`** (clarification 2026-06-30 / PR #11556 / change #8).
- Use a **content-projection** model: consumers declare pages via `*mxevolveMultiPageDialogPage` template
  directives (each carries an `id` and optional `title`). The component renders the **active** page only.
- State via signals: `visible`, `activePageId`, a `pageStack` (signal array) for back navigation.
- Public API (all reactive **`input()` / `model()` signals + content projection** — no legacy `@Input()`):
  - inputs: `visible` (model/two-way), `header` (title — consumer sets it to the definition name for Page 2).
  - methods exposed via template ref: `open(pageId)`, `goTo(pageId)` (pushes to stack), `back()` (pops),
    `close()`.
  - outputs: `visibleChange`, `pageChange`.
- Header shows a **back** button when `pageStack().length > 1`. Dialog `[modal]="true"`, single instance.
- No internal `ngOnInit`/imperative init — derive everything from signals/computed.

## Code Shape
```typescript
@Directive({ selector: "[mxevolveMultiPageDialogPage]", standalone: true })
export class MultiPageDialogPageDirective {
  readonly id = input.required<string>({ alias: "mxevolveMultiPageDialogPage" });
  readonly title = input<string>();
  constructor(public readonly tpl: TemplateRef<unknown>) {}
}

@Component({
  selector: "mxevolve-multi-page-dialog",
  standalone: true,
  imports: [Dialog, ButtonModule, NgTemplateOutlet],
  templateUrl: "./multi-page-dialog.component.html",
})
export class MultiPageDialogComponent {
  readonly visible = model<boolean>(false);
  readonly header = input<string>();
  readonly pages = contentChildren(MultiPageDialogPageDirective);
  private readonly stack = signal<string[]>([]);
  readonly activePageId = computed(() => this.stack().at(-1));
  readonly canGoBack = computed(() => this.stack().length > 1);
  readonly activePage = computed(() =>
    this.pages().find((p) => p.id() === this.activePageId()));
  open(pageId: string): void { this.stack.set([pageId]); this.visible.set(true); }
  goTo(pageId: string): void { this.stack.update((s) => [...s, pageId]); }
  back(): void { this.stack.update((s) => s.slice(0, -1)); }
  close(): void { this.visible.set(false); this.stack.set([]); }
}
```

## Sub-steps
- [x] 1a. Generate the `multi-page-dialog` component + page directive (standalone, signals).
- [x] 1b. Implement page-stack navigation (open/goTo/back/close) + back button + header.
- [x] 1c. Export both from `shared/ui/primitive` barrel; verify `scope:shared` eslint passes.
- [x] 1d. Write spec: open page 1, goTo page 2, back returns to page 1, close resets; back button visibility.

## Tests
- `multi-page-dialog.component.spec.ts`: navigation state transitions, back-button visibility, active-page
  projection, `visibleChange` emission.

## Test Obligations
- Production files: the component + directive.
- Required tests: `multi-page-dialog.component.spec.ts`.
- Targeted test command: infer from project (Nx Jest for `shared-ui-primitive`); see web-unit-test-runner skill.

## Template
PrimeNG `p-dialog` usage: `web/libs/domains/business-process/composite-widget/.../proceed-from-quality-gate-wizard`.

## Manual Verification
Embed in a scratch page, declare two pages, confirm forward/back navigation in one dialog instance.

## Risk
Medium — greenfield shared component; API must be generic enough for all three activities but contains no business logic.
