import { Component, computed, input } from "@angular/core";
import { Message } from "primeng/message";

@Component({
  selector: "mxevolve-execution-alert-display",
  imports: [Message],
  templateUrl: "./execution-alert-display.component.html",
  host: {
    style: "display: contents;",
  },
})
export class ExecutionAlertDisplayComponent {
  readonly expiryDate = input.required<string | undefined>();
  readonly endDate = input.required<string | undefined>();
  readonly errorMessage = input.required<string | undefined>();
  readonly aborted = input.required<boolean>();

  readonly showExpiryBanner = computed(() => this.isExpiryReached());

  private isExpiryReached(): boolean {
    const expiryDateValue = this.expiryDate();
    if (!expiryDateValue) return false;

    const currentDate = new Date();
    const expiry = new Date(expiryDateValue);
    const endDateValue = this.endDate();
    const end = endDateValue ? new Date(endDateValue) : null;

    const stillRunningPastExpiry =
      currentDate.getTime() > expiry.getTime() && end === null;
    const endedAfterExpiry = end !== null && end.getTime() >= expiry.getTime();
    return stillRunningPastExpiry || endedAfterExpiry;
  }
}
