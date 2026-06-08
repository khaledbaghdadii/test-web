import { Pipe, PipeTransform } from "@angular/core";
import { TimeoutDuration } from "@mxevolve/domains/test/model";

@Pipe({
  name: "getTimeoutDurationInHours",
})
export class GetTimeoutDurationInHoursPipe implements PipeTransform {
  transform(timeoutDuration: TimeoutDuration): number {
    const { days, hours, minutes } = timeoutDuration;
    return (days ?? 0) * 24 + (hours ?? 0) + (minutes ?? 0) / 60;
  }
}
