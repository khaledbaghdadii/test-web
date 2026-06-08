import { DatePipe } from "@angular/common";
import { Pipe, PipeTransform } from "@angular/core";

const DATE_FORMAT = "medium";
const DATE_LOCALE = "en-US";

@Pipe({
  name: "dateFormat",
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  private readonly datePipe = new DatePipe(DATE_LOCALE);

  transform(value: string | undefined | null): string {
    if (!value) {
      return "-";
    }
    return this.datePipe.transform(value, DATE_FORMAT) ?? "-";
  }
}
