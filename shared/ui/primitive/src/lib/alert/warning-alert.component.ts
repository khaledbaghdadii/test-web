import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { Message } from "primeng/message";

/**
 * Inline warning banner.
 *
 * New-architecture rebuild of the legacy `mxflow-warning-alert`
 * (`web/libs/ui/alert/src/lib/warning-alert/warning-alert.component.ts`), used to
 * surface non-blocking problems next to the field they relate to rather than as a
 * transient toast.
 */
@Component({
  selector: "mxevolve-warning-alert",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Message],
  template: `
    <p-message
      severity="warn"
      [closable]="closable()"
      (onClose)="closed.emit()"
    >
      {{ message() }}
    </p-message>
  `,
})
export class WarningAlertComponent {
  readonly message = input.required<string>();
  readonly closable = input(false);
  readonly closed = output<void>();
}
