import { Component, input } from "@angular/core";
import { DateFormatPipe } from "@mxevolve/shared/pipe";

export const DATE_DISPLAY_FORMAT = "medium";

@Component({
  selector: "mxevolve-date-display",
  imports: [DateFormatPipe],
  template: `{{ date() | dateFormat }}`,
})
export class DateDisplayComponent {
  date = input<string | undefined>(undefined);
}
