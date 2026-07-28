import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MessageModule } from "primeng/message";

@Component({
  selector: "mxflow-success-alert",
  imports: [MessageModule],
  template: `
    <p-message severity="success" [closable]="true" (close)="afterClose()">
      {{ successMessage }}
    </p-message>
  `,
  standalone: true,
})
export class SuccessAlertComponent {
  @Output() closeSuccessAlert = new EventEmitter();
  @Input() successMessage = "";
  @Input() redirectLink: string | null;

  afterClose(): void {
    this.closeSuccessAlert.emit();
  }
}
