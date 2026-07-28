import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "mxflow-warning-alert",
  template: `
    <p-message [closable]="closeable" (close)="afterClose()" severity="warn">{{
      warningMessage
    }}</p-message>
  `,
  standalone: false,
})
export class WarningAlertComponent {
  @Output() closeErrorAlert = new EventEmitter();
  @Input() warningMessage = "";
  @Input() closeable = true;

  afterClose(): void {
    this.closeErrorAlert.emit();
  }
}
