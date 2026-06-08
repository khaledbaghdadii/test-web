import { Component, Input, OnInit } from "@angular/core";
import {
  ErrorAlertComponent,
  InfoAlertComponent,
  WarningAlertModule,
} from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-business-process-alert-display",
  templateUrl: "business-process-alert-display-component.html",
  imports: [ErrorAlertComponent, InfoAlertComponent, WarningAlertModule],
})
export class BusinessProcessAlertDisplayComponent implements OnInit {
  @Input({ required: true }) expiryDate: string;
  @Input({ required: true }) endDate: string;
  @Input({ required: true }) errorMessage: string | undefined;
  @Input({ required: true }) aborted: boolean;
  @Input({ required: true }) notStarted: boolean;

  showExpiryBanner = false;

  ngOnInit(): void {
    this.showExpiryBanner = this.getExpiryResult();
  }

  getExpiryResult() {
    if (!this.expiryDate) {
      return false;
    }

    const currentDate = new Date();
    const expiry = new Date(this.expiryDate);
    const end = this.endDate ? new Date(this.endDate) : null;

    const condition1 = currentDate.getTime() > expiry.getTime() && end === null;
    const condition2 = end !== null && end.getTime() >= expiry.getTime();
    return condition1 || condition2;
  }
}
