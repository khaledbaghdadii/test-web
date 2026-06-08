import { Component, computed, inject, input } from "@angular/core";
import { Tag } from "primeng/tag";
import { DateFormatPipe } from "@mxevolve/shared/pipe";

@Component({
  selector: "mxevolve-expiry-chip",
  imports: [Tag],
  providers: [DateFormatPipe],
  templateUrl: "./expiry-chip.component.html",
})
export class ExpiryChipComponent {
  readonly expiryDate = input.required<string>();

  private readonly dateFormatPipe = inject(DateFormatPipe);

  readonly isExpiryReached = computed(
    () => new Date() >= new Date(this.expiryDate())
  );

  readonly daysUntilExpiry = computed(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(this.expiryDate());
    targetDate.setHours(0, 0, 0, 0);
    const timeDifference = targetDate.getTime() - currentDate.getTime();
    return Math.round(timeDifference / (1000 * 3600 * 24));
  });

  readonly showExpiryWarning = computed(
    () => !this.isExpiryReached() && this.daysUntilExpiry() <= 7
  );

  readonly expiryLabel = computed(() => {
    const formattedDateTime = this.dateFormatPipe.transform(this.expiryDate());

    if (!this.showExpiryWarning()) {
      return `Expires on ${formattedDateTime}`;
    }

    const days = this.daysUntilExpiry();
    if (days === 0) {
      return `Expires Today on ${formattedDateTime}`;
    }
    if (days === 1) {
      return `Expires in 1 Day on ${formattedDateTime}`;
    }
    return `Expires in ${days} Days on ${formattedDateTime}`;
  });
}
