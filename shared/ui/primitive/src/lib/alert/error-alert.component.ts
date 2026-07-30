import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { Message } from "primeng/message";

/**
 * Inline error banner.
 *
 * New-architecture rebuild of the legacy `mxflow-error-alert`
 * (`web/libs/ui/alert/src/lib/error-alert/error-alert.component.ts`), reduced to
 * the shape its callers actually use: a message and whether it can be dismissed.
 * The legacy expandable `errorDetails` block has no consumer here and was left
 * out; add it back when something needs it.
 *
 * The executors anchor a submit failure in this banner rather than a toast: a
 * toast disappears while the user is still looking at the form that produced it,
 * and the dialog is modal, so there is nowhere else for the message to live.
 */
@Component({
  selector: "mxevolve-error-alert",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Message],
  template: `
    <p-message severity="error" [closable]="closable()" (onClose)="closed.emit()">
      {{ message() }}
    </p-message>
  `,
})
export class ErrorAlertComponent {
  readonly message = input.required<string>();
  readonly closable = input(false);
  readonly closed = output<void>();
}
