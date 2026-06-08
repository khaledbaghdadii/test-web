import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  standalone: true,
  name: "environmentStatusName",
})
export class EnvironmentStatusNamePipe implements PipeTransform {
  transform(environmentStatus?: string | null): string {
    if (!environmentStatus) return "";
    return environmentStatus
      .split("_")
      .map(
        (environmentStatus) =>
          environmentStatus.charAt(0).toUpperCase() +
          environmentStatus.slice(1).toLowerCase()
      )
      .join(" ");
  }
}
