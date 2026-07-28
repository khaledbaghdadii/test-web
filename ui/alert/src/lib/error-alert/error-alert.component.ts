import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MessageModule } from "primeng/message";
import { ButtonModule } from "primeng/button";

@Component({
  imports: [MessageModule, ButtonModule],
  selector: "mxflow-error-alert",
  templateUrl: "./error-alert.component.html",
  standalone: true,
})
export class ErrorAlertComponent {
  @Output() closeErrorAlert = new EventEmitter();
  @Input() errorMessage = "";
  @Input() errorDetails?: string;
  @Input() closeable = true;

  isExpanded = false;

  afterClose(): void {
    this.closeErrorAlert.emit();
  }

  toggleDetails(): void {
    this.isExpanded = !this.isExpanded;
  }
}
