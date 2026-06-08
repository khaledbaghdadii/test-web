import { Component, inject, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DaysCountPipe, FormatDatePipeModule } from "@mxflow/pipe";
import { Tag } from "primeng/tag";

@Component({
  selector: "mxevolve-expiry-date-tag",
  imports: [CommonModule, FormatDatePipeModule, Tag],
  providers: [DaysCountPipe],
  templateUrl: "./expiry-date-tag.component.html",
})
export class ExpiryDateTagComponent implements OnInit {
  @Input({ required: true }) expiryDate: string;
  isExpiryReached: boolean = false;
  daysUntilExpiry: number;
  private readonly daysCount = inject(DaysCountPipe);

  ngOnInit(): void {
    this.isExpiryReached = this.reachedExpiry();
    this.daysUntilExpiry = this.getDaysUntilExpiry(this.expiryDate);
  }

  get expiryMessage(): string {
    if (this.daysUntilExpiry === 0) {
      return "Expires Today";
    } else {
      return `Expires in ${this.daysCount.transform(this.daysUntilExpiry)}`;
    }
  }

  private reachedExpiry() {
    return new Date() >= new Date(this.expiryDate);
  }

  private getDaysUntilExpiry(expiryDateString: string): number {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(expiryDateString);
    targetDate.setHours(0, 0, 0, 0);
    const timeDiff = targetDate.getTime() - currentDate.getTime();
    return Math.round(timeDiff / (1000 * 3600 * 24));
  }
}
