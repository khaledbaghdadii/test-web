import { Directive, inject, input, TemplateRef } from "@angular/core";

/**
 * Structural directive marking a single projected page of a
 * {@link MultiPageDialogComponent}. The host template is rendered as the dialog
 * body when its `id` matches the dialog's active page.
 *
 * Usage: `<ng-template mxevolveMultiPageDialogPage="templates" title="...">`.
 */
@Directive({
  selector: "[mxevolveMultiPageDialogPage]",
  standalone: true,
})
export class MultiPageDialogPageDirective {
  readonly id = input.required<string>({
    alias: "mxevolveMultiPageDialogPage",
  });
  readonly title = input<string>();

  readonly tpl = inject(TemplateRef<unknown>);
}
