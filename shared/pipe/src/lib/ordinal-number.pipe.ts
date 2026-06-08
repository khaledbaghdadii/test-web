import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "ordinal",
  standalone: true,
})
export class OrdinalNumberPipe implements PipeTransform {
  transform(value: number): string {
    const lastTwoDigits = value % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return value + "th";
    }
    switch (value % 10) {
      case 1:
        return value + "st";
      case 2:
        return value + "nd";
      case 3:
        return value + "rd";
      default:
        return value + "th";
    }
  }
}
