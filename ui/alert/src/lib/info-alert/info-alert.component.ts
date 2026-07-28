import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MessageModule } from "primeng/message";

@Component({
  imports: [MessageModule],
  selector: "mxflow-info-alert",
  template: `
    <p-message [closable]="closeable" severity="info" (close)="afterClose()">
      {{ infoMessage }}
    </p-message>
  `,
})
export class InfoAlertComponent {
  @Output() closeInfoAlert = new EventEmitter();
  @Input() infoMessage = "";
  @Input() closeable = true;

  afterClose(): void {
    this.closeInfoAlert.emit();
  }
}
